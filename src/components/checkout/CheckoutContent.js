import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useCartContext } from "../../cart_context";
import dayjs from "dayjs";
import { DatePicker, Button, Collapse, Select, message, Checkbox } from "antd";
import PaymentDetails from "./PaymentDetails";
import {
	// eslint-disable-next-line
	countryList,
	countryListWithAbbreviations,
	translations,
} from "../../Assets"; // Ensure this file contains an array of countries
import { CaretRightOutlined, InfoCircleOutlined } from "@ant-design/icons";
import {
	createNewReservationClient,
	currencyConversion,
	gettingSingleHotel,
} from "../../apiCore";
import { FaMinus, FaPlus } from "react-icons/fa";
import { authenticate, isAuthenticated, signin } from "../../auth";
import { useHistory } from "react-router-dom";
import DesktopCheckout from "./DesktopCheckout";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import PaymentOptions from "./PaymentOptions";

// eslint-disable-next-line
const { RangePicker } = DatePicker;
const { Panel } = Collapse;
const { Option } = Select;

const safeParseFloat = (value, fallback = 0) => {
	const parsed = parseFloat(value);
	return isNaN(parsed) ? fallback : parsed;
};

const calculateDepositDetails = (roomCart) => {
	if (!roomCart || roomCart.length === 0) {
		return {
			averageCommissionRate: "0.00",
			depositAmount: "0.00",
			totalRoomsPricePerNight: "0.00",
			overallAverageCommissionRate: "0.00",
		};
	}

	let depositSum = 0; // Sum of differences (commission).
	let totalOneNightAllRooms = 0; // Sum of each room's one-night cost (rootPrice).
	let overallTotalWithCommission = 0; // Sum of all final daily prices for all rooms.

	roomCart.forEach((room) => {
		const count = safeParseFloat(room.amount, 1);

		// 1) DEPOSIT (difference approach):
		//    Sum (day.totalPriceWithCommission - day.rootPrice) for all days,
		//    multiplied by room.count.
		if (
			room.pricingByDayWithCommission &&
			room.pricingByDayWithCommission.length > 0
		) {
			let roomDiffSum = 0;
			let roomTotalWithComm = 0;
			room.pricingByDayWithCommission.forEach((day) => {
				const wc = safeParseFloat(day.totalPriceWithCommission, 0);
				const rp = safeParseFloat(day.rootPrice, 0);
				roomDiffSum += wc - rp;
				roomTotalWithComm += wc;
			});
			depositSum += roomDiffSum * count;
			overallTotalWithCommission += roomTotalWithComm * count;
		} else {
			// If missing pricingByDayWithCommission, fallback to 0 difference
			//  but also fallback for overall total
			// (meaning we only have a "chosenPrice"?)
			depositSum += 0;
			const fallback = safeParseFloat(room.chosenPrice, 0);
			overallTotalWithCommission += fallback * count;
		}

		// 2) One‐Night cost: average rootPrice or just rootPrice of first day
		if (
			room.pricingByDayWithCommission &&
			room.pricingByDayWithCommission.length > 0
		) {
			// average rootPrice
			const sumRootPrices = room.pricingByDayWithCommission.reduce(
				(acc, d) => acc + safeParseFloat(d.rootPrice, 0),
				0
			);
			const avgRoot = sumRootPrices / room.pricingByDayWithCommission.length;
			totalOneNightAllRooms += avgRoot * count;
		} else {
			// fallback to chosenPrice if missing
			const fallbackPrice = safeParseFloat(room.chosenPrice, 0);
			totalOneNightAllRooms += fallbackPrice * count;
		}
	});

	// Convert numeric to string w/ 2 decimals
	const depositAmount = depositSum.toFixed(2);
	const totalRoomsPricePerNight = totalOneNightAllRooms.toFixed(2);

	// Compute an “overall average rate” =
	//  ( deposit + oneNightCost ) / ( sum of all final daily w/comm ) × 100
	let overallAvgRate = 0;
	if (overallTotalWithCommission > 0) {
		const numerator =
			safeParseFloat(depositAmount, 0) +
			safeParseFloat(totalRoomsPricePerNight, 0);
		overallAvgRate = (numerator / overallTotalWithCommission) * 100;
	}
	const overallAverageCommissionRate = overallAvgRate.toFixed(0);

	// If you wish, set averageCommissionRate to something else, or keep “0.00”
	const averageCommissionRate = "0.00";

	return {
		averageCommissionRate,
		depositAmount, // e.g. "240.00"
		totalRoomsPricePerNight, // e.g. "280.00"
		overallAverageCommissionRate, // e.g. "48.00"
	};
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
	const [mobileExpanded, setMobileExpanded] = useState(false); // Mobile collapse
	const [guestAgreedOnTermsAndConditions, setGuestAgreedOnTermsAndConditions] =
		useState(false);
	const [cardNumber, setCardNumber] = useState("");
	const [pay10Percent, setPay10Percent] = useState(false);
	const [payWholeAmount, setPayWholeAmount] = useState(false);
	const [hotelDetails, setHotelDetails] = useState(null);
	const [expiryDate, setExpiryDate] = useState("");
	const [cvv, setCvv] = useState("");
	const [cardHolderName, setCardHolderName] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [nationality, setNationality] = useState("");
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

	const {
		averageCommissionRate,
		depositAmount,
		totalRoomsPricePerNight,
		overallAverageCommissionRate,
	} = useMemo(() => calculateDepositDetails(roomCart), [roomCart]);

	useEffect(() => {
		const fetchHotel = async () => {
			try {
				// Ensure roomCart exists and has at least one room
				if (roomCart && roomCart.length > 0) {
					const hotelName = roomCart[0]?.hotelName; // Extract hotelName from roomCart

					if (hotelName) {
						// Generate slug by replacing spaces with "-"
						const hotelNameSlug = hotelName.toLowerCase().replace(/\s+/g, "-");
						// console.log("Generated hotelNameSlug:", hotelNameSlug);

						const hotelData = await gettingSingleHotel(hotelNameSlug); // Fetch hotel by slug
						setHotelDetails(hotelData); // Set the response to hotelDetails state
					} else {
						console.error("No hotelName found in roomCart");
					}
				} else {
					console.error("roomCart is empty or not available");
				}
			} catch (error) {
				console.error("Error fetching hotel:", error);
			}
		};

		fetchHotel(); // Call the fetchHotel function
	}, [roomCart]); // Depend on roomCart to re-fetch if it changes

	useEffect(() => {
		// Fetch currency and rates from localStorage
		const currency = localStorage.getItem("selectedCurrency") || "SAR";
		const rates = JSON.parse(localStorage.getItem("rates")) || {
			SAR_USD: 0.27,
			SAR_EUR: 0.25,
		};

		setSelectedCurrency(currency);
		setCurrencyRates(rates);
	}, []);

	useEffect(() => {
		// Fetch conversion for both deposit and total amounts
		const fetchConversion = async () => {
			const deposit = depositAmount;
			const total = total_price_with_commission;
			const totalRoomsPricePerNight_SAR = totalRoomsPricePerNight;
			const amounts = [deposit, total, totalRoomsPricePerNight_SAR];

			try {
				const conversions = await currencyConversion(amounts);
				setConvertedAmounts({
					depositUSD: conversions[0]?.amountInUSD.toFixed(2),
					totalUSD: conversions[1]?.amountInUSD.toFixed(2),
					totalRoomsPricePerNightUSD: conversions[2]?.amountInUSD.toFixed(2),
				});
			} catch (error) {
				console.error("Currency conversion failed", error);
			}
		};

		fetchConversion();
		// eslint-disable-next-line
	}, [total_price, total_price_with_commission]);

	// Function to transform roomCart into pickedRoomsType format
	const transformRoomCartToPickedRoomsType = (roomCart, isPayInHotel) => {
		return roomCart.flatMap((room) => {
			return Array.from({ length: safeParseFloat(room.amount, 1) }, () => {
				// Transform each day in pricingByDayWithCommission
				const pricingDetails =
					room.pricingByDayWithCommission?.map((day) => ({
						date: day.date,
						price: isPayInHotel
							? safeParseFloat(day.totalPriceWithCommission, 0) * 1.1 // Increase by 10%
							: safeParseFloat(day.totalPriceWithCommission, 0), // Keep as is
						rootPrice: safeParseFloat(day.rootPrice, 0), // Keep root price unchanged
						commissionRate: safeParseFloat(day.commissionRate, 0), // Keep commission rate
						totalPriceWithCommission: isPayInHotel
							? safeParseFloat(day.totalPriceWithCommission, 0) * 1.1 // Increase by 10%
							: safeParseFloat(day.totalPriceWithCommission, 0), // Keep as is
						totalPriceWithoutCommission: safeParseFloat(day.price, 0), // Keep as is
					})) || [];

				// Calculate the average price with commission safely
				const totalPriceWithCommissionSum = pricingDetails.reduce(
					(sum, day) => sum + safeParseFloat(day.totalPriceWithCommission, 0),
					0
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
					totalPriceWithCommission: totalPriceWithCommissionSum, // Total price with commission
					hotelShouldGet: pricingDetails.reduce(
						(sum, day) => sum + safeParseFloat(day.rootPrice, 0),
						0
					), // Total price without commission
				};
			});
		});
	};

	// Handle Date Range change
	const handleDateChange = (dates) => {
		if (dates && dates[0] && dates[1]) {
			const startDate = dates[0].format("YYYY-MM-DD");
			const endDate = dates[1].format("YYYY-MM-DD");

			// Ensure that roomCart is properly updated before re-rendering
			roomCart.forEach((room) => {
				updateRoomDates(room.id, startDate, endDate);
			});
		}
	};

	// Disable past dates
	const disabledDate = (current) => current && current < dayjs().endOf("day");

	const createNewReservation = async () => {
		const {
			name,
			phone,
			email,
			passport,
			passportExpiry,
			password,
			confirmPassword,
		} = customerDetails;

		// Check if terms and conditions are agreed
		if (!guestAgreedOnTermsAndConditions) {
			message.error(
				"You must accept the Terms & Conditions before proceeding."
			);
			return;
		}

		// Full name validation
		if (!name || name.trim().split(" ").length < 2) {
			message.error("Please provide your full name (first and last name).");
			return;
		}

		// Phone number validation
		const phoneRegex = /^\+?[0-9\s-]{6,}$/;
		if (!phone || !phoneRegex.test(phone)) {
			message.error("Please provide a valid phone number.");
			return;
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email || !emailRegex.test(email)) {
			message.error("Please provide a valid email address.");
			return;
		}

		// Password validation (only for non-authenticated users)
		if (!user) {
			if (!password || !confirmPassword) {
				message.error("Please enter your password and confirm it.");
				return;
			}

			if (password !== confirmPassword) {
				message.error("Passwords do not match.");
				return;
			}

			const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
			if (!passwordRegex.test(password)) {
				message.error(
					"Password must be at least 6 characters long and include both letters and numbers."
				);
				return;
			}
		}

		// Passport validation
		if (!passport) {
			message.error("Please provide your passport number.");
			return;
		}

		// Passport Expiry validation (less than 6 months check)
		if (passportExpiry) {
			const expiryDate = dayjs(passportExpiry);
			const sixMonthsFromNow = dayjs().add(6, "month");

			if (expiryDate.isBefore(sixMonthsFromNow)) {
				message.error(
					"Passport expiry date should be at least 6 months from today's date."
				);
				return;
			}
		} else {
			message.error("Please provide your passport expiry date.");
			return;
		}

		// Hotel name consistency validation
		const hotelNames = roomCart.map((room) => room.hotelName);
		const uniqueHotelNames = [...new Set(hotelNames)];

		if (uniqueHotelNames.length > 1) {
			message.error(
				"You cannot make a reservation with rooms from multiple hotels. Please ensure all rooms are from the same hotel."
			);
			return;
		}

		// Dynamically set payment-related fields based on selectedPaymentOption
		let payment = "Not Paid";
		let commissionPaid = false;
		let commission = safeParseFloat(depositAmount, 0);
		let paid_amount = 0;
		let totalAmount = safeParseFloat(total_price_with_commission, 0); // Default total amount

		if (selectedPaymentOption === "acceptDeposit") {
			payment = "Deposit Paid";
			commissionPaid = true;
			commission = safeParseFloat(depositAmount, 0);
			paid_amount =
				safeParseFloat(depositAmount, 0) +
				safeParseFloat(totalRoomsPricePerNight, 0);
		} else if (selectedPaymentOption === "acceptPayWholeAmount") {
			payment = "Paid Online";
			commissionPaid = true;
			commission = safeParseFloat(depositAmount, 0);
			paid_amount = safeParseFloat(total_price_with_commission, 0);
		} else if (selectedPaymentOption === "acceptReserveNowPayInHotel") {
			payment = "Not Paid";
			commissionPaid = false;
			commission = safeParseFloat(depositAmount, 0); // Same calculation as in PaymentOptions
			totalAmount = safeParseFloat(total_price_with_commission, 0) * 1.1; // Increase total by 10%
			paid_amount = 0; // No payment made upfront
		}

		// Prepare reservation data
		const paymentDetails = {
			cardNumber,
			cardExpiryDate: expiryDate,
			cardCVV: cvv,
			cardHolderName,
		};

		// Adjust pickedRoomsType to reflect changes for "Pay in Hotel"
		const pickedRoomsType = transformRoomCartToPickedRoomsType(
			roomCart,
			selectedPaymentOption === "acceptReserveNowPayInHotel" // Pass a flag
		);

		// Validate pickedRoomsType to ensure data integrity
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
						typeof day.totalPriceWithoutCommission === "number"
				)
			);
		});

		if (!isValidPickedRoomsType) {
			message.error(
				"Invalid room pricing details. Please review your selection."
			);
			return;
		}

		const reservationData = {
			guestAgreedOnTermsAndConditions: guestAgreedOnTermsAndConditions,
			userId: user ? user._id : null,
			hotelId: roomCart[0].hotelId, // Assuming hotelId is a string
			hotelName: roomCart[0].hotelName || "",
			belongsTo: roomCart[0].belongsTo || "",
			customerDetails: {
				...customerDetails,
				nationality,
				postalCode,
				// Remove password fields if not needed or handle securely
			},
			paymentDetails,
			total_rooms: safeParseFloat(total_rooms, 0),
			total_guests:
				safeParseFloat(roomCart[0].adults, 0) +
				safeParseFloat(roomCart[0].children, 0),
			adults: safeParseFloat(roomCart[0].adults, 0),
			children: safeParseFloat(roomCart[0].children, 0),
			total_amount: safeParseFloat(totalAmount, 0), // Adjusted if "Pay in Hotel"
			payment,
			paid_amount: safeParseFloat(paid_amount, 0),
			commission: commission ? safeParseFloat(commission, 0) : depositAmount,
			commissionPaid,
			checkin_date: roomCart[0].startDate || "",
			checkout_date: roomCart[0].endDate || "",
			days_of_residence: dayjs(roomCart[0].endDate).diff(
				dayjs(roomCart[0].startDate),
				"days"
			),
			booking_source: "Online Jannat Booking",
			pickedRoomsType,
			convertedAmounts,
			usePassword: password || "",
		};

		try {
			const response = await createNewReservationClient(reservationData);
			if (response) {
				if (
					payment === "Not Paid" &&
					response.message ===
						"Verification email sent successfully. Please check your inbox."
				) {
					message.success(response.message);
					onNotPaidReservation();
					return;
				}

				if (payment !== "Not Paid") {
					message.success("Reservation created successfully");
					ReactGA.event({
						category: "User Checked Out and Paid Successfully",
						action: "Reservation Created",
						label: "Reservation Paid",
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

					if (!user) {
						const signInResponse = await signin({
							emailOrPhone: email,
							password: password,
						});

						if (signInResponse.error) {
							message.error(
								"Failed to sign in automatically after account creation."
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
				} else {
					message.error(response.message || "Error creating reservation.");
				}
			}
		} catch (error) {
			console.error("Error creating reservation:", error);
			message.error("An error occurred while creating the reservation");
		}
	};

	const convertCurrency = (amount) => {
		if (!amount || isNaN(amount)) return "0.00"; // Default to "0.00" if amount is invalid

		if (selectedCurrency === "usd")
			return (amount * (currencyRates.SAR_USD || 1)).toFixed(2);
		if (selectedCurrency === "eur")
			return (amount * (currencyRates.SAR_EUR || 1)).toFixed(2);
		return amount.toFixed(2); // Default to SAR
	};

	const redirectToSignin = () => {
		const currentUrl = window.location.pathname + window.location.search;
		history.push(`/signin?returnUrl=${encodeURIComponent(currentUrl)}`);
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

						{/* Ant Design Date Range Picker */}
						{/* <DateRangePickerWrapper>
							<RangePicker
								format='YYYY-MM-DD'
								disabledDate={disabledDate}
								onChange={handleDateChange}
								defaultValue={[
									dayjs(roomCart[0]?.startDate),
									dayjs(roomCart[0]?.endDate),
								]}
								style={{ width: "100%" }}
								disabled
								dropdownClassName='mobile-friendly-picker'
							/>
						</DateRangePickerWrapper> */}
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

								// Calculate the price per night and total price
								const totalCommissionPrice =
									room.pricingByDayWithCommission?.reduce(
										(total, day) => total + (day.totalPriceWithCommission || 0),
										0
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

											{/* Room Quantity Controls */}
											<QuantityControls>
												<MinusIcon
													onClick={() => toggleRoomAmount(room.id, "dec")}
												/>
												<Quantity>{room.amount}</Quantity>
												<PlusIcon
													onClick={() => toggleRoomAmount(room.id, "inc")}
												/>
											</QuantityControls>

											{/* Updated Accordion for Price Breakdown */}
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
																({ date, totalPriceWithCommission }, index) => {
																	return (
																		<li key={index}>
																			{date}:{" "}
																			{Number(totalPriceWithCommission).toFixed(
																				2
																			)}{" "}
																			{t[selectedCurrency.toUpperCase()]}
																		</li>
																	);
																}
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

						{/* Totals Section */}
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

			{/* Mobile form for user details */}
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
							pattern='[0-9\s+-]*'
							inputMode='numeric'
							value={customerDetails.phone}
							onChange={(e) => {
								const inputValue = e.target.value.replace(/[^\d\s+-]/g, ""); // Removes invalid characters
								setCustomerDetails({
									...customerDetails,
									phone: inputValue,
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

					{!user ? (
						<div className='row'>
							{/* <div className='col-md-12 mt-1'>
								<p style={{ fontWeight: "bold", fontSize: "13px" }}>
									Already Have An Account?{" "}
									<span
										onClick={redirectToSignin}
										style={{
											color: "blue",
											cursor: "pointer",
											textDecoration: "underline",
										}}
									>
										Please Click Here To Signin
									</span>
								</p>
							</div> */}
							<div className='col-md-6'>
								<InputGroup>
									<label>{t.password}</label>
									<input
										type='password'
										name='password'
										placeholder={t.enterPassword}
										value={customerDetails.password}
										onChange={(e) =>
											setCustomerDetails({
												...customerDetails,
												password: e.target.value,
											})
										}
									/>
								</InputGroup>
							</div>

							<div className='col-md-6'>
								<InputGroup>
									<label>{t.confirmPassword}</label>
									<input
										type='password'
										name='confirmPassword'
										placeholder={t.confirmPassword}
										value={customerDetails.confirmPassword}
										onChange={(e) =>
											setCustomerDetails({
												...customerDetails,
												confirmPassword: e.target.value,
											})
										}
									/>
								</InputGroup>
							</div>
						</div>
					) : null}

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
							<PaymentOptions
								hotelDetails={hotelDetails}
								chosenLanguage={chosenLanguage}
								t={t}
								depositAmount={depositAmount}
								averageCommissionRate={averageCommissionRate}
								total_price_with_commission={total_price_with_commission}
								convertedAmounts={convertedAmounts}
								selectedPaymentOption={selectedPaymentOption}
								setSelectedPaymentOption={setSelectedPaymentOption}
								overallAverageCommissionRate={overallAverageCommissionRate}
								totalRoomsPricePerNight={totalRoomsPricePerNight}
							/>
						) : null}

						<small onClick={() => window.open("/terms-conditions", "_blank")}>
							{t.checkTerms}
						</small>

						<TermsWrapper
							selected={guestAgreedOnTermsAndConditions}
							onClick={() => {
								setGuestAgreedOnTermsAndConditions(
									!guestAgreedOnTermsAndConditions
								);
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
							<PaymentDetails
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
								handleReservation={createNewReservation}
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
							/>
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
			/>
		</CheckoutContentWrapper>
	);
};

export default CheckoutContent;

// Styled components
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
		/* color: var(--primaryBlue); */
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

// eslint-disable-next-line
const TotalSection = styled.div`
	margin-top: 20px;
	padding-top: 10px;
	border-top: 1px solid #ddd;
	text-align: center;
	.total-price {
		font-size: 1.4rem;
		font-weight: bold;
		color: var(--text-color-dark);
	}
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

// eslint-disable-next-line
const DateRangePickerWrapper = styled.div`
	margin: 10px 0;

	.ant-picker {
		width: 100%;
	}

	@media (max-width: 768px) {
		.ant-picker-dropdown {
			width: 100vw;
			left: 0;
			right: 0;
			top: 50px;
			transform: none;
		}
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
