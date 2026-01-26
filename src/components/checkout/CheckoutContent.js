// src/components/checkout/CheckoutContent.jsx
import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useCartContext } from "../../cart_context";
import dayjs from "dayjs";
import { DatePicker, Button, Collapse, Select, message, Checkbox } from "antd";
import { countryListWithAbbreviations, translations } from "../../Assets";
import { CaretRightOutlined, InfoCircleOutlined } from "@ant-design/icons";
import {
	currencyConversion,
	gettingSingleHotel,
	gettingRoomByIds,
	createReservationViaPayPal, // ✅ PayPal server create (AUTHORIZE)
} from "../../apiCore";
import { FaMinus, FaPlus } from "react-icons/fa";
import { authenticate, isAuthenticated, signin } from "../../auth";
import { useHistory } from "react-router-dom";
import DesktopCheckout from "./DesktopCheckout";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import { toast } from "react-toastify";
import PaymentDetailsPayPal from "./PaymentDetailsPayPal";
import PaymentOptionsPayPal from "./PaymentOptionsPayPal";

const { Panel } = Collapse;
const { Option } = Select;

const safeParseFloat = (value, fallback = 0) => {
	const parsed = parseFloat(value);
	return isNaN(parsed) ? fallback : parsed;
};

// ────────────────────────────────────────────────────────────────────
// Deposit math helpers (legacy deposit kept for non-deposit branches)
// ────────────────────────────────────────────────────────────────────
const calculateDepositDetails = (roomCart) => {
	if (!roomCart || roomCart.length === 0) {
		return {
			averageCommissionRate: "0.00",
			depositAmount: "0.00",
			totalRoomsPricePerNight: "0.00",
			overallAverageCommissionRate: "0.00",
		};
	}

	let totalCommission = 0;
	let rootPriceFirstDaySum = 0;
	let overallTotalWithCommission = 0;

	roomCart.forEach((room) => {
		const count = safeParseFloat(room.amount, 1);

		if (
			room.pricingByDayWithCommission &&
			room.pricingByDayWithCommission.length > 0
		) {
			room.pricingByDayWithCommission.forEach((day, index) => {
				const rootPrice = safeParseFloat(day.rootPrice, 0);
				const commissionRate = safeParseFloat(day.commissionRate, 0);
				const totalPriceWithoutCommission = safeParseFloat(day.price, 0);

				const commission =
					rootPrice * commissionRate +
					(totalPriceWithoutCommission - rootPrice);
				totalCommission += commission * count;

				if (index === 0) {
					rootPriceFirstDaySum += rootPrice * count;
				}

				const totalPriceWithCommission = safeParseFloat(
					day.totalPriceWithCommission,
					0,
				);
				overallTotalWithCommission += totalPriceWithCommission * count;
			});
		} else {
			const fallbackPrice = safeParseFloat(room.chosenPrice, 0);
			rootPriceFirstDaySum += fallbackPrice * count;
			overallTotalWithCommission += fallbackPrice * count;
		}
	});

	const finalDeposit = totalCommission + rootPriceFirstDaySum;
	const depositAmount = finalDeposit.toFixed(2);
	const totalRoomsPricePerNight = rootPriceFirstDaySum.toFixed(2);

	let overallAvgRate = 0;
	if (overallTotalWithCommission > 0) {
		overallAvgRate = (finalDeposit / overallTotalWithCommission) * 100;
	}
	const overallAverageCommissionRate = overallAvgRate.toFixed(0);

	const averageCommissionRate = "0.00";

	return {
		averageCommissionRate,
		depositAmount,
		totalRoomsPricePerNight,
		overallAverageCommissionRate,
	};
};

const generateDateRange = (startDate, endDate) => {
	const start = dayjs(startDate);
	const end = dayjs(endDate);
	const dateArray = [];

	let currentDate = start;
	while (currentDate.isBefore(end)) {
		dateArray.push(currentDate.format("YYYY-MM-DD"));
		currentDate = currentDate.add(1, "day");
	}

	return dateArray;
};

const calculatePricingByDay = (
	pricingRate,
	startDate,
	endDate,
	basePrice,
	defaultCost,
	roomCommission,
) => {
	const dateRange = generateDateRange(startDate, endDate);

	return dateRange.map((date) => {
		const rateForDate = pricingRate?.find((rate) => rate.calendarDate === date);
		const selectedCommissionRate = rateForDate?.commissionRate
			? rateForDate.commissionRate / 100
			: roomCommission
				? roomCommission / 100
				: parseFloat(process.env.REACT_APP_COMMISSIONRATE || "0.10");

		return {
			date,
			price: rateForDate
				? parseFloat(rateForDate.price) || 0
				: parseFloat(basePrice || 0),
			rootPrice: rateForDate
				? parseFloat(rateForDate.rootPrice) ||
					parseFloat(defaultCost || basePrice || 0)
				: parseFloat(defaultCost || basePrice || 0),
			commissionRate: selectedCommissionRate,
		};
	});
};

const CheckoutContent = ({
	verificationEmailSent,
	setVerificationEmailSent,
	onNotPaidReservation,
}) => {
	const {
		roomCart,
		updateRoomDates,
		removeRoomItem,
		total_rooms,
		total_price,
		clearRoomCart,
		toggleRoomAmount,
		total_price_with_commission,
		chosenLanguage,
	} = useCartContext();
	const { user } = isAuthenticated();
	const history = useHistory();
	const t = translations[chosenLanguage] || translations.English;

	const [expanded, setExpanded] = useState({});
	const [mobileExpanded, setMobileExpanded] = useState(false);
	const [guestAgreedOnTermsAndConditions, setGuestAgreedOnTermsAndConditions] =
		useState(false);

	// Card inputs kept for parity with your UI (not sent to backend in PayPal flows)
	const [cardNumber, setCardNumber] = useState("");
	const [pay10Percent, setPay10Percent] = useState(false);
	const [payWholeAmount, setPayWholeAmount] = useState(false);
	const [hotelDetails, setHotelDetails] = useState(null);
	const [expiryDate, setExpiryDate] = useState("");
	const [cvv, setCvv] = useState("");
	const [cardHolderName, setCardHolderName] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [nationality, setNationality] = useState("");
	const [roomDetailsFromIds, setRoomDetailsFromIds] = useState([]);
	const [customerDetails, setCustomerDetails] = useState({
		name: user ? user.name : "",
		phone: user ? user.phone : "",
		email: user ? user.email : "",
		passport: "Not Provided",
		passportExpiry: "2029-12-20",
		nationality: "",
		postalCode: "",
		state: "",
	});
	const [selectedCurrency, setSelectedCurrency] = useState("SAR");
	const [currencyRates, setCurrencyRates] = useState({});
	const [selectedPaymentOption, setSelectedPaymentOption] = useState("");
	const [paymentClicked, setPaymentClicked] = useState("Not Clicked");
	const [convertedAmounts, setConvertedAmounts] = useState({
		depositUSD: null,
		totalUSD: null,
		totalRoomsPricePerNightUSD: null,
	});

	const [checkIn, setCheckIn] = useState(null);
	const [checkOut, setCheckOut] = useState(null);
	const [prevCheckIn, setPrevCheckIn] = useState(null);
	const [prevCheckOut, setPrevCheckOut] = useState(null);

	const nightsCount = useMemo(() => {
		if (checkIn && checkOut) {
			return checkOut.diff(checkIn, "day");
		}
		return 0;
	}, [checkIn, checkOut]);

	const {
		averageCommissionRate,
		depositAmount, // legacy deposit, still used in non-deposit flows
		totalRoomsPricePerNight,
		overallAverageCommissionRate,
	} = useMemo(() => calculateDepositDetails(roomCart), [roomCart]);

	// NEW: helper to get 15% of total (SAR)
	const depositSar15 = useMemo(
		() =>
			Number(
				(safeParseFloat(total_price_with_commission, 0) * 0.15).toFixed(2),
			),
		[total_price_with_commission],
	);

	useEffect(() => {
		if (roomCart && roomCart.length > 0) {
			const firstRoom = roomCart[0];
			if (firstRoom.startDate && firstRoom.endDate) {
				setCheckIn(dayjs(firstRoom.startDate));
				setCheckOut(dayjs(firstRoom.endDate));
				setPrevCheckIn(dayjs(firstRoom.startDate));
				setPrevCheckOut(dayjs(firstRoom.endDate));
			}
		}
	}, [roomCart]);

	useEffect(() => {
		const fetchHotel = async () => {
			try {
				if (roomCart && roomCart.length > 0) {
					const hotelName = roomCart[0]?.hotelName;
					if (hotelName) {
						const hotelNameSlug = hotelName.toLowerCase().replace(/\s+/g, "-");
						const hotelData = await gettingSingleHotel(hotelNameSlug);
						setHotelDetails(hotelData);
					}
				}
			} catch (error) {
				console.error("Error fetching hotel:", error);
			}
		};
		fetchHotel();
	}, [roomCart]);

	useEffect(() => {
		const currency = localStorage.getItem("selectedCurrency") || "SAR";
		const rates = JSON.parse(localStorage.getItem("rates")) || {
			SAR_USD: 0.27,
			SAR_EUR: 0.25,
		};

		setSelectedCurrency(currency);
		setCurrencyRates(rates);
	}, []);

	// ────────────────────────────────────────────────────────────────
	// USD conversion — normalize depositUSD to 15% of totalUSD
	// ────────────────────────────────────────────────────────────────
	useEffect(() => {
		const fetchConversion = async () => {
			const depositLegacy = depositAmount; // legacy deposit (not used for USD deposit anymore)
			const total = total_price_with_commission;
			const totalRoomsPricePerNight_SAR = totalRoomsPricePerNight;
			const amounts = [depositLegacy, total, totalRoomsPricePerNight_SAR];

			try {
				const conversions = await currencyConversion(amounts);

				const totalUsdNum =
					conversions?.[1]?.amountInUSD != null
						? Number(conversions[1].amountInUSD)
						: 0;

				const trppUsdNum =
					conversions?.[2]?.amountInUSD != null
						? Number(conversions[2].amountInUSD)
						: 0;

				const depositUsd15 = Number((totalUsdNum * 0.15).toFixed(2));

				setConvertedAmounts({
					// ✅ critical: this is what we actually charge for deposit
					depositUSD: depositUsd15.toFixed(2),
					// keep total as the single source-of-truth for 15% math
					totalUSD: totalUsdNum.toFixed(2),
					totalRoomsPricePerNightUSD: trppUsdNum.toFixed(2),
				});
			} catch (error) {
				console.error("Currency conversion failed", error);
			}
		};

		fetchConversion();
		// eslint-disable-next-line
	}, [total_price, total_price_with_commission]);

	// Transform cart → pickedRoomsType. If isPayInHotel === true, bump nightly totals by 10%.
	const transformRoomCartToPickedRoomsType = (roomCart, isPayInHotel) => {
		return roomCart.flatMap((room) =>
			Array.from({ length: safeParseFloat(room.amount, 1) }, () => {
				const pricingDetails =
					room.pricingByDayWithCommission?.map((day) => {
						const base = safeParseFloat(day.totalPriceWithCommission, 0);
						const bumped = isPayInHotel ? base * 1.1 : base;
						return {
							date: day.date,
							price: safeParseFloat(day.price, 0),
							rootPrice: safeParseFloat(day.rootPrice, 0),
							commissionRate: safeParseFloat(day.commissionRate, 0),
							totalPriceWithCommission: Number(bumped.toFixed(2)),
							totalPriceWithoutCommission: safeParseFloat(day.price, 0),
						};
					}) || [];

				const totalPriceWithCommissionSum = pricingDetails.reduce(
					(sum, d) => sum + safeParseFloat(d.totalPriceWithCommission, 0),
					0,
				);
				const averagePriceWithCommission =
					pricingDetails.length > 0
						? totalPriceWithCommissionSum / pricingDetails.length
						: 0;

				return {
					room_type: room.roomType,
					displayName: room.name,
					chosenPrice: averagePriceWithCommission.toFixed(2),
					count: 1,
					pricingByDay: pricingDetails,
					roomColor: room.roomColor,
					totalPriceWithCommission: totalPriceWithCommissionSum,
					hotelShouldGet: pricingDetails.reduce(
						(sum, d) => sum + safeParseFloat(d.rootPrice, 0),
						0,
					),
				};
			}),
		);
	};

	useEffect(() => {
		const fetchRoomDetails = async () => {
			try {
				const roomIds = roomCart && roomCart.map((i) => i.id);
				if (!roomIds || roomIds.length === 0) return;

				const data = await gettingRoomByIds(roomIds);
				if (data && data.success) {
					setRoomDetailsFromIds(data.rooms);
				} else {
					console.error(
						"Failed to fetch room details:",
						data.error || "Unknown error",
					);
				}
			} catch (error) {
				console.error("An error occurred while fetching room details:", error);
			}
		};

		fetchRoomDetails();

		if (roomCart.length > 0) {
			const initialCheckIn = dayjs(roomCart[0].startDate);
			const initialCheckOut = dayjs(roomCart[0].endDate);
			setCheckIn(initialCheckIn);
			setCheckOut(initialCheckOut);
			setPrevCheckIn(initialCheckIn);
			setPrevCheckOut(initialCheckOut);
		}
	}, [roomCart]);

	const validateDates = (startDate, endDate) => {
		if (!startDate || !endDate) {
			toast.error(
				chosenLanguage === "Arabic"
					? "يرجى اختيار تواريخ تسجيل الوصول والمغادرة"
					: "Please select check-in and check-out dates",
			);
			return false;
		}

		if (!startDate.isBefore(endDate)) {
			toast.error(
				chosenLanguage === "Arabic"
					? "يجب أن يكون تاريخ المغادرة بعد تاريخ الوصول."
					: "Check-out date must be after check-in date.",
			);
			return false;
		}
		return true;
	};

	const handleDateChange = (date, type) => {
		if (!date) return;
		if (type === "checkIn") {
			const newCheckOut = date.add(nightsCount, "day");
			const isValid = validateDates(date, newCheckOut);
			if (!isValid) {
				if (prevCheckIn && prevCheckOut) {
					setCheckIn(prevCheckIn);
					setCheckOut(prevCheckOut);
				}
				return;
			}
			setCheckIn(date);
			setCheckOut(newCheckOut);
			setPrevCheckIn(date);
			setPrevCheckOut(newCheckOut);

			roomCart.forEach((room) => {
				const roomDetails = roomDetailsFromIds.find(
					(detail) => detail._id === room.id,
				);
				if (roomDetails) {
					const updatedPricingByDay = calculatePricingByDay(
						roomDetails.pricingRate || [],
						date.format("YYYY-MM-DD"),
						newCheckOut.format("YYYY-MM-DD"),
						roomDetails.price.basePrice,
						roomDetails.defaultCost,
						roomDetails.roomCommission,
					);

					const updatedPricingByDayWithCommission = updatedPricingByDay.map(
						(day) => ({
							...day,
							totalPriceWithCommission: Number(
								(
									Number(day.price) +
									Number(day.rootPrice) * Number(day.commissionRate)
								).toFixed(2),
							),
						}),
					);

					updateRoomDates(
						room.id,
						date.format("YYYY-MM-DD"),
						newCheckOut.format("YYYY-MM-DD"),
						updatedPricingByDay,
						updatedPricingByDayWithCommission,
					);
				}
			});
		}

		if (type === "checkOut") {
			if (!checkIn) {
				toast.error(
					chosenLanguage === "Arabic"
						? "يرجى اختيار تاريخ الوصول أولاً."
						: "Please select a check-in date first.",
				);
				return;
			}
			if (!checkIn.isBefore(date)) {
				toast.error(
					chosenLanguage === "Arabic"
						? "يجب أن يكون تاريخ المغادرة بعد تاريخ الوصول."
						: "Check-out date must be after check-in date.",
				);
				return;
			}

			const isValid = validateDates(checkIn, date);
			if (!isValid) {
				if (prevCheckIn && prevCheckOut) {
					setCheckIn(prevCheckIn);
					setCheckOut(prevCheckOut);
				}
				return;
			}

			setCheckOut(date);
			setPrevCheckOut(date);

			roomCart.forEach((room) => {
				const roomDetails = roomDetailsFromIds.find(
					(detail) => detail._id === room.id,
				);
				if (roomDetails) {
					const updatedPricingByDay = calculatePricingByDay(
						roomDetails.pricingRate || [],
						checkIn.format("YYYY-MM-DD"),
						date.format("YYYY-MM-DD"),
						roomDetails.price.basePrice,
						roomDetails.defaultCost,
						roomDetails.roomCommission,
					);

					const updatedPricingByDayWithCommission = updatedPricingByDay.map(
						(day) => ({
							...day,
							totalPriceWithCommission: Number(
								(
									Number(day.price) +
									Number(day.rootPrice) * Number(day.commissionRate)
								).toFixed(2),
							),
						}),
					);

					updateRoomDates(
						room.id,
						checkIn.format("YYYY-MM-DD"),
						date.format("YYYY-MM-DD"),
						updatedPricingByDay,
						updatedPricingByDayWithCommission,
					);
				}
			});
		}
	};

	const disabledCheckInDate = (current) =>
		current && current < dayjs().endOf("day");
	const disabledCheckOutDate = (current) => {
		if (!checkIn) return current && current < dayjs().endOf("day");
		return current && current <= checkIn.endOf("day");
	};
	const disabledDate = (current) => current && current < dayjs().endOf("day");

	const createUncompletedDocument = async (from) => {
		try {
			const { phone, email } = customerDetails;
			if (!(phone || email)) return;

			const hotelNames = roomCart.map((room) => room.hotelName);
			const uniqueHotelNames = [...new Set(hotelNames)];

			// Defaults
			let payment = "Not Paid";
			let commissionPaid = false;
			let commission = safeParseFloat(depositAmount, 0);
			let paid_amount = 0;
			let totalAmount = safeParseFloat(total_price_with_commission, 0);

			// ===== NEW (15%): When user selected deposit, only 15% is paid/commission
			if (selectedPaymentOption === "acceptDeposit") {
				payment = "Deposit Paid";
				commissionPaid = true;
				commission = depositSar15; // 15% of total
				paid_amount = depositSar15; // 15% paid now
			} else if (selectedPaymentOption === "acceptPayWholeAmount") {
				payment = "Paid Online";
				commissionPaid = true;
				commission = safeParseFloat(depositAmount, 0);
				paid_amount = safeParseFloat(total_price_with_commission, 0);
			} else if (selectedPaymentOption === "acceptReserveNowPayInHotel") {
				payment = "Not Paid";
				commissionPaid = false;
				commission = safeParseFloat(depositAmount, 0);
				totalAmount = safeParseFloat(total_price_with_commission, 0) * 1.1;
				paid_amount = 0;
			}

			const pickedRoomsType = transformRoomCartToPickedRoomsType(
				roomCart,
				selectedPaymentOption === "acceptReserveNowPayInHotel",
			);

			const isValidPickedRoomsType = pickedRoomsType.every((room) => {
				return (
					room.room_type &&
					room.displayName &&
					!isNaN(parseFloat(room.chosenPrice)) &&
					typeof room.count === "number" &&
					Array.isArray(room.pricingByDay) &&
					room.pricingByDay.every(
						(day) =>
							day.date &&
							typeof day.price === "number" &&
							typeof day.rootPrice === "number" &&
							typeof day.commissionRate === "number" &&
							typeof day.totalPriceWithCommission === "number" &&
							typeof day.totalPriceWithoutCommission === "number",
					)
				);
			});

			if (!isValidPickedRoomsType) return;

			const reservationDataUncompleted = {
				guestAgreedOnTermsAndConditions,
				userId: user ? user._id : null,
				hotelId: roomCart[0].hotelId,
				hotelName: roomCart[0].hotelName || "",
				belongsTo: roomCart[0].belongsTo || "",
				customerDetails: {
					...customerDetails,
					nationality,
					postalCode,
				},
				total_rooms: safeParseFloat(total_rooms, 0),
				total_guests:
					safeParseFloat(roomCart[0].adults, 0) +
					safeParseFloat(roomCart[0].children, 0),
				adults: safeParseFloat(roomCart[0].adults, 0),
				children: safeParseFloat(roomCart[0].children, 0),
				total_amount: safeParseFloat(totalAmount, 0),
				payment,
				paid_amount: safeParseFloat(paid_amount, 0),
				commission: commission,
				commissionPaid,
				checkin_date: roomCart[0].startDate || "",
				checkout_date: roomCart[0].endDate || "",
				days_of_residence: dayjs(roomCart[0].endDate).diff(
					dayjs(roomCart[0].startDate),
					"days",
				),
				booking_source: "Online Jannat Booking",
				pickedRoomsType,
				convertedAmounts,
				rootCause:
					uniqueHotelNames.length > 1
						? "User added more than one hotel to the cart"
						: from,
			};

			await fetch(
				`${process.env.REACT_APP_API_URL}/create-uncomplete-reservation-document`,
				{
					method: "POST",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					body: JSON.stringify(reservationDataUncompleted),
				},
			);
		} catch (error) {
			console.error("Error creating uncomplete reservation:", error);
		}
	};

	// Reserve‑Now (Not Paid) flow — unchanged
	const createNewReservation = async () => {
		const { name, phone, email, passport, passportExpiry, password } =
			customerDetails;

		if (!guestAgreedOnTermsAndConditions) {
			message.error(
				"You must accept the Terms & Conditions before proceeding.",
			);
			return;
		}

		if (!name || name.trim().split(" ").length < 2) {
			message.error("Please provide your full name (first and last name).");
			return;
		}

		const phoneRegex = /^\+?[0-9\s-]{5,}$/;
		if (!phone || !phoneRegex.test(phone)) {
			message.error("Please provide a valid phone number.");
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email || !emailRegex.test(email)) {
			message.error("Please provide a valid email address.");
			return;
		}

		if (!passport) {
			message.error("Please provide your passport number.");
			return;
		}

		if (passportExpiry) {
			const expiryDateD = dayjs(passportExpiry);
			const sixMonthsFromNow = dayjs().add(6, "month");
			if (expiryDateD.isBefore(sixMonthsFromNow)) {
				message.error(
					"Passport expiry date should be at least 6 months from today's date.",
				);
				return;
			}
		} else {
			message.error("Please provide your passport expiry date.");
			return;
		}

		const hotelNames = roomCart.map((room) => room.hotelName);
		const uniqueHotelNames = [...new Set(hotelNames)];
		if (uniqueHotelNames.length > 1) {
			message.error(
				"You cannot make a reservation with rooms from multiple hotels.",
			);
			return;
		}

		const payment = "Not Paid";
		const commissionPaid = false;
		const commission = safeParseFloat(depositAmount, 0);
		const paid_amount = 0;

		// Apply 10% hotel markup for pay-in-hotel
		const totalAmount = safeParseFloat(total_price_with_commission, 0) * 1.1;

		const pickedRoomsType = transformRoomCartToPickedRoomsType(
			roomCart,
			true /* isPayInHotel */,
		);

		const isValidPickedRoomsType = pickedRoomsType.every((room) => {
			return (
				room.room_type &&
				room.displayName &&
				!isNaN(parseFloat(room.chosenPrice)) &&
				typeof room.count === "number" &&
				room.pricingByDay.every(
					(day) =>
						day.date &&
						typeof day.price === "number" &&
						typeof day.rootPrice === "number" &&
						typeof day.commissionRate === "number" &&
						typeof day.totalPriceWithCommission === "number" &&
						typeof day.totalPriceWithoutCommission === "number",
				)
			);
		});
		if (!isValidPickedRoomsType) {
			message.error(
				"Invalid room pricing details. Please review your selection.",
			);
			return;
		}

		const body = {
			sentFrom: "client",
			payment, // "Not Paid"
			hotelId: roomCart[0].hotelId,
			hotelName: roomCart[0].hotelName || "",
			belongsTo: roomCart[0].belongsTo || "",
			customerDetails: {
				...customerDetails,
				nationality,
				postalCode,
			},
			total_rooms: safeParseFloat(total_rooms, 0),
			total_guests:
				safeParseFloat(roomCart[0].adults, 0) +
				safeParseFloat(roomCart[0].children, 0),
			adults: safeParseFloat(roomCart[0].adults, 0),
			children: safeParseFloat(roomCart[0].children, 0),
			total_amount: safeParseFloat(totalAmount, 0), // SAR with 10% bump
			paymentClicked,
			payment_method: "Unpaid",
			paid_amount: safeParseFloat(paid_amount, 0),
			commission: commission ? safeParseFloat(commission, 0) : depositAmount,
			commissionPaid,
			checkin_date: roomCart[0].startDate || "",
			checkout_date: roomCart[0].endDate || "",
			days_of_residence: dayjs(roomCart[0].endDate).diff(
				dayjs(roomCart[0].startDate),
				"days",
			),
			booking_source: "Online Jannat Booking",
			pickedRoomsType,
			convertedAmounts,
			usePassword: password || "",
		};

		try {
			const resp = await createReservationViaPayPal(body);
			if (resp?.message) {
				message.success(resp.message);
				onNotPaidReservation?.();
				return;
			}
			message.success("Reservation created successfully.");
			onNotPaidReservation?.();
		} catch (error) {
			console.error("Error creating Not Paid reservation:", error);
			message.error(
				error?.message || "An error occurred while creating the reservation",
			);
		}
	};

	const convertCurrency = (amount) => {
		if (!amount || isNaN(amount)) return "0.00";
		if (selectedCurrency === "usd")
			return (amount * (currencyRates.SAR_USD || 1)).toFixed(2);
		if (selectedCurrency === "eur")
			return (amount * (currencyRates.SAR_EUR || 1)).toFixed(2);
		return amount.toFixed(2);
	};

	const redirectToSignin = () => {
		const currentUrl = window.location.pathname + window.location.search;
		history.push(`/signin?returnUrl=${encodeURIComponent(currentUrl)}`);
	};

	const paymentLabelFor = (opt) => {
		if (opt === "deposit") return "Deposit Paid";
		if (opt === "full") return "Paid Online";
		return "Not Paid";
	};

	// ────────────────────────────────────────────────────────────────
	// Approval handler for PayPal (Deposit / Full) — with 15% for deposit
	// ────────────────────────────────────────────────────────────────
	const handlePayPalApproved = async (payload) => {
		try {
			// payload shape from PaymentDetailsPayPal:
			// {
			//   option: "deposit" | "full",
			//   convertedAmounts,
			//   sarAmount: "###.##",
			//   paypal: { order_id, expectedUsdAmount, cmid, mode: "authorize"|"capture" }
			// }
			const option = payload?.option; // "deposit" | "full"
			const paypal = payload?.paypal || {};
			const sarAmount = payload?.sarAmount;
			const conv = payload?.convertedAmounts || {};

			const order_id = paypal?.order_id;
			if (!order_id) {
				message.error("Missing PayPal order id.");
				return;
			}

			const expectedUsdAmount =
				paypal?.expectedUsdAmount != null
					? String(paypal.expectedUsdAmount)
					: "";

			if (!expectedUsdAmount) {
				message.error("Missing expected USD amount.");
				return;
			}

			const mode = paypal?.mode || "authorize"; // defaults to AUTHORIZE
			const cmid = paypal?.cmid || null;

			const {
				name,
				phone,
				email,
				passport,
				passportExpiry,
				nationality: natFromState,
				password,
			} = customerDetails || {};
			if (
				!name ||
				!phone ||
				!email ||
				!passport ||
				!passportExpiry ||
				!natFromState
			) {
				message.error("Missing required customer details.");
				return;
			}

			// IMPORTANT: do NOT 10% bump in paid/authorized flows
			const pickedRoomsType = transformRoomCartToPickedRoomsType(
				roomCart,
				false,
			);

			// NEW (15%): commission for deposit branch is 15% of total, otherwise keep your original commission
			const commissionForPayload =
				option === "deposit" ? depositSar15 : safeParseFloat(depositAmount, 0);

			const totalAmount = safeParseFloat(total_price_with_commission, 0);
			const paid_amount = safeParseFloat(sarAmount, 0);

			const body = {
				sentFrom: "client",
				payment: paymentLabelFor(option),
				option, // <-- crucial for backend amounts/branch
				hotelId: roomCart[0].hotelId,
				hotelName: roomCart[0].hotelName || "",
				belongsTo: roomCart[0].belongsTo || "",
				customerDetails: {
					...customerDetails,
					nationality,
					postalCode,
				},
				total_rooms: safeParseFloat(total_rooms, 0),
				total_guests:
					safeParseFloat(roomCart[0].adults, 0) +
					safeParseFloat(roomCart[0].children, 0),
				adults: safeParseFloat(roomCart[0].adults, 0),
				children: safeParseFloat(roomCart[0].children, 0),
				total_amount: totalAmount, // SAR
				paymentClicked,
				payment_method: "PayPal",
				paid_amount, // SAR paid/authorized now
				commission: commissionForPayload,
				commissionPaid: true, // backend may overwrite on authorize-only
				checkin_date: roomCart[0].startDate || "",
				checkout_date: roomCart[0].endDate || "",
				days_of_residence: dayjs(roomCart[0].endDate).diff(
					dayjs(roomCart[0].startDate),
					"days",
				),
				booking_source: "Online Jannat Booking",
				pickedRoomsType,
				convertedAmounts: conv,
				usePassword: password || "",
				paypal: {
					order_id,
					expectedUsdAmount, // ✅ now always set
					cmid,
					mode, // ✅ "authorize" for pay-later
				},
			};

			const resp = await createReservationViaPayPal(body);

			message.success(resp?.message || "Reservation created successfully");
			ReactGA.event({
				category: "User Checked Out and Paid Successfully",
				action: "Reservation Created",
				label: paymentLabelFor(option),
			});
			ReactPixel.track("Reservation Paid", {
				action: "Checkout Completed",
				page: "checkout",
			});

			const queryParams = new URLSearchParams();
			queryParams.append("name", customerDetails.name);
			queryParams.append("total_price", total_price_with_commission);
			queryParams.append("total_rooms", total_rooms);
			roomCart.forEach((room, index) => {
				queryParams.append(`hotel_name_${index}`, room.hotelName);
				queryParams.append(`room_type_${index}`, room.roomType);
				queryParams.append(`room_display_name_${index}`, room.name);
				queryParams.append(`nights_${index}`, room.nights);
				queryParams.append(`checkin_date_${index}`, room.startDate);
				queryParams.append(`checkout_date_${index}`, room.endDate);
			});

			// Auto sign-in if needed (unchanged behavior)
			if (!user) {
				const signInResponse = await signin({
					emailOrPhone: email,
					password: password, // you set this from phone input
				});
				if (signInResponse.error) {
					message.error(
						"Failed to sign in automatically after account creation.",
					);
				} else {
					authenticate(signInResponse, () => {
						clearRoomCart();
						window.location.href = `/reservation-confirmed?${queryParams.toString()}`;
					});
				}
			} else {
				clearRoomCart();
				window.location.href = `/reservation-confirmed?${queryParams.toString()}`;
			}
		} catch (err) {
			console.error("PayPal reservation create error:", err);
			message.error(err?.message || "Failed to create reservation.");
		}
	};

	return (
		<CheckoutContentWrapper
			dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
			style={{ textAlign: chosenLanguage === "Arabic" ? "right" : "" }}
		>
			{/* Mobile Accordion for Reservation Summary */}
			<MobileAccordion
				onChange={() => setMobileExpanded(!mobileExpanded)}
				activeKey={mobileExpanded ? "1" : null}
			>
				<Panel
					header={
						chosenLanguage === "Arabic"
							? "ملخص الحجز الخاص بك"
							: "Your Reservation Summary"
					}
					key='1'
				>
					<RightSection>
						<h2>{t.yourReservation}</h2>

						{/* Date pickers */}
						<InputGroup>
							<Label>{chosenLanguage === "Arabic" ? "من" : "Check-In"}</Label>
							<DatePicker
								value={checkIn}
								onChange={(date) => handleDateChange(date, "checkIn")}
								disabledDate={disabledCheckInDate}
								inputReadOnly
								placeholder={
									chosenLanguage === "Arabic"
										? "اختر تاريخ الوصول"
										: "Select check-in"
								}
								style={{ width: "100%" }}
							/>
						</InputGroup>
						<InputGroup>
							<Label>{chosenLanguage === "Arabic" ? "إلى" : "Check-Out"}</Label>
							<DatePicker
								value={checkOut}
								onChange={(date) => handleDateChange(date, "checkOut")}
								disabledDate={disabledCheckOutDate}
								inputReadOnly
								placeholder={
									chosenLanguage === "Arabic"
										? "اختر تاريخ المغادرة"
										: "Select check-out"
								}
								style={{ width: "100%" }}
							/>
						</InputGroup>

						<div
							style={{
								textAlign: "center",
								marginBottom: "5px",
								textTransform: "capitalize",
								fontSize: "1.4rem",
							}}
						>
							{roomCart[0] && roomCart[0].hotelName}
						</div>

						{roomCart.length > 0 ? (
							roomCart.map((room) => {
								const totalNights =
									room.pricingByDayWithCommission?.length || 0;
								const totalCommissionPrice =
									room.pricingByDayWithCommission?.reduce(
										(total, day) => total + (day.totalPriceWithCommission || 0),
										0,
									) || 0;
								const pricePerNight =
									totalNights > 0 ? totalCommissionPrice / totalNights : 0;

								return (
									<RoomItem key={room.id}>
										<RoomImage src={room.photos[0]?.url} alt={room.name} />
										<RoomDetails>
											<h3>
												{chosenLanguage === "Arabic"
													? room.nameOtherLanguage
													: room.name}
											</h3>
											<p>
												{room.amount}{" "}
												{chosenLanguage === "Arabic" ? "غرفة" : "room(s)"}
											</p>
											<DateRangeWrapper>
												<label>
													{chosenLanguage === "Arabic"
														? "تواريخ الدخول والخروج"
														: "Dates:"}
												</label>
												<p>
													{chosenLanguage === "Arabic" ? "من" : "from"}{" "}
													{room.startDate}{" "}
													{chosenLanguage === "Arabic" ? "الى" : "to"}{" "}
													{room.endDate}
												</p>
											</DateRangeWrapper>
											<h4>
												{Number(pricePerNight * room.amount).toFixed(2)}{" "}
												{t[selectedCurrency.toUpperCase()]} {t.perNight}
											</h4>

											<QuantityControls>
												<MinusIcon
													onClick={() => toggleRoomAmount(room.id, "dec")}
												/>
												<Quantity>{room.amount}</Quantity>
												<PlusIcon
													onClick={() => toggleRoomAmount(room.id, "inc")}
												/>
											</QuantityControls>

											<Collapse
												accordion
												expandIcon={({ isActive }) => (
													<CaretRightOutlined
														rotate={isActive ? 90 : 0}
														style={{ color: "var(--primary-color)" }}
													/>
												)}
												onChange={() =>
													setExpanded((prev) => ({
														...prev,
														[room.id]: !prev[room.id],
													}))
												}
												activeKey={expanded[room.id] ? "1" : null}
											>
												<Panel
													header={
														<PriceDetailsHeader>
															<InfoCircleOutlined />{" "}
															{chosenLanguage === "Arabic"
																? "تفاصيل السعر"
																: "Price Breakdown"}
														</PriceDetailsHeader>
													}
													key='1'
												>
													<PricingList>
														{room.pricingByDayWithCommission &&
														room.pricingByDayWithCommission.length > 0 ? (
															room.pricingByDayWithCommission.map(
																({ date, totalPriceWithCommission }, index) => (
																	<li key={index}>
																		{date}:{" "}
																		{Number(totalPriceWithCommission).toFixed(
																			2,
																		)}{" "}
																		{t[selectedCurrency.toUpperCase()]}
																	</li>
																),
															)
														) : (
															<li>{t.noPriceBreakdown}</li>
														)}
													</PricingList>
												</Panel>
											</Collapse>

											<RemoveButton onClick={() => removeRoomItem(room.id)}>
												{t.remove}
											</RemoveButton>
										</RoomDetails>
									</RoomItem>
								);
							})
						) : (
							<p>{t.noReservations}</p>
						)}

						<TotalsWrapper>
							<p>
								{t.totalRooms}: {total_rooms}
							</p>
							<p className='total-price'>
								{t.totalPrice}: {convertCurrency(total_price_with_commission)}{" "}
								{t[selectedCurrency.toUpperCase()]}
							</p>
						</TotalsWrapper>
					</RightSection>
				</Panel>
			</MobileAccordion>

			{/* Mobile form */}
			<MobileFormWrapper>
				<h2>{t.customerDetails}</h2>
				<form>
					<InputGroup>
						<label>{t.name}</label>
						<input
							type='text'
							name='name'
							placeholder={t.firstAndLastName}
							value={customerDetails.name}
							onChange={(e) =>
								setCustomerDetails({ ...customerDetails, name: e.target.value })
							}
						/>
					</InputGroup>
					<InputGroup>
						<label>{t.phone}</label>
						<input
							type='tel'
							name='phone'
							placeholder={t.phoneNumber}
							pattern='[0-9\\s+-]*'
							inputMode='numeric'
							value={customerDetails.phone}
							onChange={(e) => {
								const inputValue = e.target.value.replace(/[^\\d\\s+-]/g, "");
								setCustomerDetails({
									...customerDetails,
									phone: inputValue,
									password: inputValue,
									confirmPassword: inputValue,
								});
							}}
						/>
					</InputGroup>
					<InputGroup>
						<label>{t.email}</label>
						<input
							type='email'
							name='email'
							placeholder={t.emailAddress}
							value={customerDetails.email}
							onChange={(e) =>
								setCustomerDetails({
									...customerDetails,
									email: e.target.value,
								})
							}
						/>
					</InputGroup>

					<InputGroup>
						<label>{t.nationality}</label>
						<Select
							showSearch
							placeholder={t.selectCountry}
							optionFilterProp='children'
							filterOption={(input, option) =>
								option.children.toLowerCase().includes(input.toLowerCase())
							}
							value={nationality}
							onChange={(value) => {
								setNationality(value);
								setCustomerDetails({ ...customerDetails, nationality: value });
							}}
							style={{ width: "100%" }}
						>
							{countryListWithAbbreviations.map((country) => (
								<Option key={country.code} value={country.code}>
									{country.name}
								</Option>
							))}
						</Select>
					</InputGroup>

					<div className='my-4'>
						{hotelDetails && hotelDetails.hotelName ? (
							<>
								<PaymentOptionsPayPal
									hotelDetails={hotelDetails}
									chosenLanguage={chosenLanguage}
									t={t}
									depositAmount={depositAmount}
									averageCommissionRate={averageCommissionRate}
									total_price_with_commission={total_price_with_commission}
									convertedAmounts={convertedAmounts} // NEW: pass through
									selectedPaymentOption={selectedPaymentOption}
									setSelectedPaymentOption={setSelectedPaymentOption}
									overallAverageCommissionRate={overallAverageCommissionRate}
									totalRoomsPricePerNight={totalRoomsPricePerNight}
									createUncompletedDocument={createUncompletedDocument}
								/>
							</>
						) : null}

						<small onClick={() => window.open("/terms-conditions", "_blank")}>
							{t.checkTerms}
						</small>

						<TermsWrapper
							selected={guestAgreedOnTermsAndConditions}
							onClick={() => {
								setGuestAgreedOnTermsAndConditions(
									!guestAgreedOnTermsAndConditions,
								);
								createUncompletedDocument("User Accepted Terms And Conditions");
								ReactGA.event({
									category: "User Accepted Terms And Cond",
									action: "User Accepted Terms And Cond",
									label: `User Accepted Terms And Cond`,
								});
								ReactPixel.track("Terms And Conditions Accepted", {
									action: "User Accepted Terms And Conditions Accepted",
									page: "checkout",
								});
							}}
						>
							<Checkbox
								isChecked={guestAgreedOnTermsAndConditions}
								checked={guestAgreedOnTermsAndConditions}
								onChange={(e) => {
									setGuestAgreedOnTermsAndConditions(e.target.checked);
									ReactGA.event({
										category: "User Accepted Terms And Cond",
										action: "User Accepted Terms And Cond",
										label: `User Accepted Terms And Cond`,
									});
									ReactPixel.track("Terms And Conditions Accepted", {
										action: "User Accepted Terms And Conditions Accepted",
										page: "checkout",
									});
								}}
							>
								{t.acceptTerms}
							</Checkbox>
						</TermsWrapper>

						{selectedPaymentOption === "acceptReserveNowPayInHotel" ? (
							<Button
								type='primary'
								onClick={createNewReservation}
								style={{ marginTop: "20px", width: "100%" }}
							>
								{chosenLanguage === "Arabic" ? "احجز الآن" : "Reserve Now"}
							</Button>
						) : (
							<>
								<PaymentDetailsPayPal
									chosenLanguage={chosenLanguage}
									cardNumber={cardNumber}
									setCardNumber={setCardNumber}
									expiryDate={expiryDate}
									setExpiryDate={setExpiryDate}
									cvv={cvv}
									setCvv={setCvv}
									cardHolderName={cardHolderName}
									setCardHolderName={setCardHolderName}
									postalCode={postalCode}
									setPostalCode={setPostalCode}
									handleReservation={createNewReservation} // legacy fallback, not used for paid flows
									total={total_price}
									total_price_with_commission={total_price_with_commission}
									convertedAmounts={convertedAmounts}
									depositAmount={depositAmount}
									setCustomerDetails={setCustomerDetails}
									nationality={nationality}
									customerDetails={customerDetails}
									selectedPaymentOption={selectedPaymentOption}
									guestAgreedOnTermsAndConditions={
										guestAgreedOnTermsAndConditions
									}
									setPaymentClicked={setPaymentClicked}
									paymentClicked={paymentClicked}
									overallAverageCommissionRate={overallAverageCommissionRate}
									totalRoomsPricePerNight={totalRoomsPricePerNight}
									createUncompletedDocument={createUncompletedDocument}
									onPayApproved={handlePayPalApproved}
									payMode='capture' // ✅ use capute or authorize
								/>
							</>
						)}
					</div>
				</form>
			</MobileFormWrapper>

			<DesktopCheckout
				customerDetails={customerDetails}
				setCustomerDetails={setCustomerDetails}
				redirectToSignin={redirectToSignin}
				cardNumber={cardNumber}
				setCardNumber={setCardNumber}
				expiryDate={expiryDate}
				setExpiryDate={setExpiryDate}
				cvv={cvv}
				setCvv={setCvv}
				cardHolderName={cardHolderName}
				setCardHolderName={setCardHolderName}
				postalCode={postalCode}
				setPostalCode={setPostalCode}
				createNewReservation={createNewReservation}
				guestAgreedOnTermsAndConditions={guestAgreedOnTermsAndConditions}
				setGuestAgreedOnTermsAndConditions={setGuestAgreedOnTermsAndConditions}
				user={user}
				nationality={nationality}
				setNationality={setNationality}
				countryList={countryListWithAbbreviations}
				total_price={total_price}
				handleDateChange={handleDateChange}
				disabledDate={disabledDate}
				roomCart={roomCart}
				toggleRoomAmount={toggleRoomAmount}
				removeRoomItem={removeRoomItem}
				expanded={expanded}
				setExpanded={setExpanded}
				total_rooms={total_rooms}
				pay10Percent={pay10Percent}
				setPay10Percent={setPay10Percent}
				payWholeAmount={payWholeAmount}
				setPayWholeAmount={setPayWholeAmount}
				total_price_with_commission={total_price_with_commission}
				convertedAmounts={convertedAmounts}
				depositAmount={depositAmount}
				averageCommissionRate={averageCommissionRate}
				t={t}
				chosenLanguage={chosenLanguage}
				selectedCurrency={selectedCurrency}
				convertCurrency={convertCurrency}
				hotelDetails={hotelDetails}
				selectedPaymentOption={selectedPaymentOption}
				setSelectedPaymentOption={setSelectedPaymentOption}
				setPaymentClicked={setPaymentClicked}
				paymentClicked={paymentClicked}
				overallAverageCommissionRate={overallAverageCommissionRate}
				totalRoomsPricePerNight={totalRoomsPricePerNight}
				createUncompletedDocument={createUncompletedDocument}
				checkIn={checkIn}
				disabledCheckInDate={disabledCheckInDate}
				checkOut={checkOut}
				disabledCheckOutDate={disabledCheckOutDate}
				handlePayPalApproved={handlePayPalApproved}
				payMode='capture' // ✅ use capture
			/>
		</CheckoutContentWrapper>
	);
};

export default CheckoutContent;

/* styles unchanged from your version */

const CheckoutContentWrapper = styled.div`
	display: flex;
	flex-direction: column;
	padding: 20px 150px;

	@media (max-width: 800px) {
		padding: 25px 0px;
	}

	@media (max-width: 768px) {
		h2 {
			font-size: 1.4rem !important;
			font-weight: bold !important;
		}
	}

	small {
		font-weight: bold;
		font-size: 11px;
		cursor: pointer;
		color: blue;
		text-decoration: underline;
	}

	.ant-collapse-header-text {
		color: blue !important;
		text-decoration: underline;
	}
`;

const MobileAccordion = styled(Collapse)`
	display: none;
	@media (max-width: 768px) {
		display: block;
		margin-top: 50px;
		background-color: white;
		font-weight: bolder;
	}
`;

const MobileFormWrapper = styled.div`
	display: block;
	margin: 20px 0;
	@media (min-width: 768px) {
		display: none;
	}
	@media (max-width: 768px) {
		h2 {
			font-size: 1.6rem;
		}
	}
`;

const RightSection = styled.div`
	flex: 1;
	padding: 20px;
	border-radius: 10px;
	box-shadow: var(--box-shadow-light);
	position: sticky;
	top: 20px;
`;

const RoomItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-bottom: 20px;
	border-bottom: 1px solid #ddd;
	padding-bottom: 10px;
`;

const RoomImage = styled.img`
	width: 100%;
	height: 220px;
	object-fit: cover;
	border-radius: 8px;
`;

const RoomDetails = styled.div`
	text-align: center;
	h3 {
		font-size: 1.2rem;
		text-transform: capitalize;
	}
	h4 {
		font-size: 1.1rem;
	}
`;

const DateRangeWrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	margin: 10px 0;
`;

const PriceDetailsHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	color: var(--primary-color);
`;

const RemoveButton = styled(Button)`
	background: var(--secondary-color);
	color: var(--mainWhite);
	margin-top: 10px;
	width: 100%;
`;

const PricingList = styled.ul`
	list-style-type: none;
	padding: 0;
	margin-top: 10px;
`;

const InputGroup = styled.div`
	margin-bottom: 10px;
	label {
		display: block;
		font-size: 0.9rem;
		margin-bottom: 5px;
	}
	input {
		width: 100%;
		padding: 8px;
		border-radius: 5px;
		border: 1px solid #ddd;
	}
`;

const QuantityControls = styled.div`
	display: flex;
	align-items: center;
	text-align: center;
	margin: auto;
	width: 25%;
	margin-bottom: 10px;
`;

const PlusIcon = styled(FaPlus)`
	color: var(--accent-color-3-light);
	font-size: 1rem;
	cursor: pointer;
	text-align: center;
	margin: auto;
	border: 1px solid var(--border-color-light);
	padding: 4px;
	width: 44%;
	height: 27px;
	&:hover {
		color: var(--primary-color);
	}
`;

const MinusIcon = styled(FaMinus)`
	color: var(--accent-color-3-light);
	font-size: 1rem;
	cursor: pointer;
	text-align: center;
	margin: auto;
	border: 1px solid var(--border-color-light);
	padding: 4px;
	width: 44%;
	height: 27px;
	&:hover {
		color: var(--primary-color);
	}
`;

const Quantity = styled.span`
	font-size: 1rem;
	color: var(--accent-color-3-light);
	margin: 0 10px;
	font-weight: bold;
	text-align: center;
	margin: auto;
	border: 1px solid var(--border-color-light);
	width: 100%;
	height: 27px;
`;

const TotalsWrapper = styled.div`
	margin-top: 20px;
	padding-top: 10px;
	border-top: 1px solid #ddd;
	text-align: center;
	.total-price {
		font-size: 1.4rem;
		font-weight: bold;
	}
`;

const TermsWrapper = styled.div`
	margin: 5px auto;
	font-size: 1rem;
	display: flex;
	align-items: center;
	padding: 12px;
	border: 2px solid
		${({ selected }) => (selected ? "#c4e2ff" : "var(--border-color-light)")};
	background-color: ${({ selected }) =>
		selected ? "#c4e2ff" : "var(--accent-color-2-dark)"};
	border-radius: 8px;
	margin-bottom: 2px;
	cursor: pointer;
	transition: var(--main-transition);
	&:hover {
		background-color: ${({ selected }) =>
			selected ? "#c4e2ff" : "var(--accent-color-2-dark)"};
	}
	.ant-checkbox-wrapper {
		margin-left: 10px;
	}
`;

const Label = styled.label`
	font-size: 0.7rem;
	font-weight: 500;
	margin-bottom: 4px;
	color: #000;
`;
