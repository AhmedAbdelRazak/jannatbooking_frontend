import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useCartContext } from "../../cart_context";
import { Link } from "react-router-dom";
import { FaTimes, FaPlus, FaMinus } from "react-icons/fa";
// eslint-disable-next-line
import { DatePicker, Button } from "antd";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"; // Import the plugin
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import { gettingRoomByIds } from "../../apiCore";
import { toast } from "react-toastify";

// Extend Day.js with the plugin
dayjs.extend(isSameOrAfter);

// Define translations
const translations = {
	English: {
		yourReservation: "Your Reservation",
		pricePerNight: "Price per night:",
		totalAmount: "Total Amount:",
		totalRooms: "Total Rooms:",
		totalPrice: "Total Price:",
		noReservations: "No reservations yet.",
		remove: "Remove",
		proceedToCheckout: "Proceed to Checkout",
		roomDetails: "room(s) for",
		nights: "night(s)",
		from: "from",
		to: "to",
		SAR: "SAR",
		USD: "USD",
		EUR: "EUR",
	},
	Arabic: {
		yourReservation: "ملخص الحجز الخاص بك",
		pricePerNight: "سعر الليلة الواحدة:",
		totalAmount: "المبلغ الإجمالي:",
		totalRooms: "إجمالي الغرف:",
		totalPrice: "السعر الإجمالي:",
		noReservations: "لا توجد حجوزات بعد.",
		remove: "إزالة",
		proceedToCheckout: "المتابعة لتأكيد الحجز",
		roomDetails: "غرفة لمدة",
		nights: "ليلة/ليالٍ",
		from: "من",
		to: "إلى",
		SAR: "ريال",
		USD: "دولار",
		EUR: "يورو",
	},
};

const generateDateRange = (startDate, endDate) => {
	const start = dayjs(startDate);
	const end = dayjs(endDate);
	const dateArray = [];

	let currentDate = start;
	while (currentDate.isBefore(end)) {
		// Exclude end date
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
	roomCommission
) => {
	const dateRange = generateDateRange(startDate, endDate);

	return dateRange.map((date) => {
		const rateForDate = pricingRate?.find((rate) => rate.calendarDate === date);
		const selectedCommissionRate = rateForDate?.commissionRate
			? rateForDate.commissionRate / 100
			: roomCommission
				? roomCommission / 100
				: parseFloat(process.env.REACT_APP_COMMISSIONRATE) - 1;

		return {
			date,
			price: rateForDate
				? parseFloat(rateForDate.price) || 0 // Use `price` if available
				: parseFloat(basePrice || 0), // Fallback to `basePrice`
			rootPrice: rateForDate
				? parseFloat(rateForDate.rootPrice) ||
					parseFloat(defaultCost || basePrice || 0)
				: parseFloat(defaultCost || basePrice || 0),
			commissionRate: selectedCommissionRate,
		};
	});
};

const SidebarCartDrawer = () => {
	const {
		roomCart,
		removeRoomItem,
		toggleRoomAmount,
		updateRoomDates,
		total_rooms,
		closeSidebar2,
		isSidebarOpen2,
		total_price_with_commission,
		chosenLanguage,
	} = useCartContext();

	const [selectedCurrency, setSelectedCurrency] = useState("SAR");
	const [currencyRates, setCurrencyRates] = useState({});
	const [checkIn, setCheckIn] = useState(null);
	const [checkOut, setCheckOut] = useState(null);
	const [roomDetailsFromIds, setRoomDetailsFromIds] = useState([]);
	const [nightsCount, setNightsCount] = useState(0);
	const [prevCheckIn, setPrevCheckIn] = useState(null);
	const [prevCheckOut, setPrevCheckOut] = useState(null);
	const [roomErrors, setRoomErrors] = useState({});

	useEffect(() => {
		const currency = localStorage.getItem("selectedCurrency") || "SAR";
		const rates = JSON.parse(localStorage.getItem("rates")) || {
			SAR_USD: 0.27,
			SAR_EUR: 0.25,
		};

		setSelectedCurrency(currency);
		setCurrencyRates(rates);
	}, []);

	useEffect(() => {
		const fetchRoomDetails = async () => {
			try {
				const roomIds = roomCart && roomCart.map((i) => i.id);

				if (!roomIds || roomIds.length === 0) {
					console.warn("No room IDs found in the cart.");
					return;
				}

				const data = await gettingRoomByIds(roomIds);

				if (data && data.success) {
					setRoomDetailsFromIds(data.rooms);
				} else {
					console.error(
						"Failed to fetch room details:",
						data.error || "Unknown error"
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

			// Calculate and store the initial nights count
			setNightsCount(initialCheckOut.diff(initialCheckIn, "day"));
		}
	}, [roomCart]);

	useEffect(() => {
		if (!roomCart || roomCart.length === 0 || !checkIn || !checkOut) return; // Skip validation if cart is empty or dates are not set

		let isValid = true;
		const newRoomErrors = {}; // Reset room-specific errors
		let hasUnavailableRooms = false; // Flag to check if any room is unavailable

		roomDetailsFromIds.forEach((room) => {
			const selectedDates = room.pricingRate.filter(
				(rate) =>
					dayjs(rate.calendarDate).isSameOrAfter(checkIn) &&
					dayjs(rate.calendarDate).isBefore(checkOut)
			);

			if (selectedDates.some((date) => Number(date.price) === 0)) {
				isValid = false;
				hasUnavailableRooms = true; // Set the flag
				newRoomErrors[room._id] =
					chosenLanguage === "Arabic"
						? "الغرفة غير متاحة في التواريخ المحددة."
						: "This room is unavailable for the selected date range.";
			}
		});

		if (hasUnavailableRooms && isValid === false) {
			// Show toast.error only once
			// toast.error(
			// 	chosenLanguage === "Arabic"
			// 		? "بعض الغرف غير متاحة في التواريخ المعدلة."
			// 		: "Some rooms are unavailable for the modified selected dates."
			// );
		}

		setRoomErrors(newRoomErrors); // Update state with room-specific errors
	}, [checkIn, checkOut, roomDetailsFromIds, roomCart, chosenLanguage]);

	const convertCurrency = (amount) => {
		if (!amount || isNaN(amount)) return "0.00";

		if (selectedCurrency === "usd")
			return (amount * (currencyRates.SAR_USD || 1)).toFixed(2);
		if (selectedCurrency === "eur")
			return (amount * (currencyRates.SAR_EUR || 1)).toFixed(2);
		return amount.toFixed(2);
	};

	// Validate the dates before proceeding to checkout
	const validateDates = () => {
		if (!roomCart || roomCart.length === 0) return true; // Skip validation if cart is empty

		if (!checkIn || !checkOut) {
			toast.error(
				chosenLanguage === "Arabic"
					? "يرجى اختيار تواريخ تسجيل الوصول والمغادرة"
					: "Please select check-in and check-out dates"
			);
			return false;
		}

		if (!checkIn.isBefore(checkOut)) {
			return false;
		}

		return true;
	};

	const handleDateChange = (date, type) => {
		if (type === "checkIn") {
			const newCheckOut = date.add(nightsCount, "day");

			// Validate the new date range
			const isValid = validateDates(date, newCheckOut);

			if (!isValid) {
				toast.error(
					chosenLanguage === "Arabic"
						? "توجد تواريخ غير متاحة للحجز. تم إعادة التواريخ إلى الوضع السابق."
						: "Some dates are unavailable for booking. Dates have been reset to the previous values."
				);
				setCheckIn(prevCheckIn);
				setCheckOut(prevCheckOut);
				return;
			}

			setCheckIn(date);
			setCheckOut(newCheckOut);

			// Update previous dates
			setPrevCheckIn(date);
			setPrevCheckOut(newCheckOut);

			// Automatically update the cart
			roomCart.forEach((room) => {
				const roomDetails = roomDetailsFromIds.find(
					(detail) => detail._id === room.id
				);

				if (roomDetails) {
					const updatedPricingByDay = calculatePricingByDay(
						roomDetails.pricingRate || [],
						date.format("YYYY-MM-DD"),
						newCheckOut.format("YYYY-MM-DD"),
						roomDetails.price.basePrice,
						roomDetails.defaultCost,
						roomDetails.roomCommission
					);

					const updatedPricingByDayWithCommission = updatedPricingByDay.map(
						(day) => ({
							...day,
							totalPriceWithCommission: Number(
								(
									Number(day.price) +
									Number(day.rootPrice) * Number(day.commissionRate)
								).toFixed(2)
							),
						})
					);

					updateRoomDates(
						room.id,
						date.format("YYYY-MM-DD"),
						newCheckOut.format("YYYY-MM-DD"),
						updatedPricingByDay,
						updatedPricingByDayWithCommission
					);
				}
			});
		}

		if (type === "checkOut") {
			if (!checkIn) {
				toast.error(
					chosenLanguage === "Arabic"
						? "يرجى اختيار تاريخ الوصول أولاً."
						: "Please select a check-in date first."
				);
				return;
			}

			if (!checkIn.isBefore(date)) {
				toast.error(
					chosenLanguage === "Arabic"
						? "يجب أن يكون تاريخ المغادرة بعد تاريخ الوصول."
						: "Check-out date must be after check-in date."
				);
				setCheckOut(prevCheckOut);
				return;
			}

			// Validate the new date range
			const isValid = validateDates(checkIn, date);

			if (!isValid) {
				toast.error(
					chosenLanguage === "Arabic"
						? "توجد تواريخ غير متاحة للحجز. تم إعادة التواريخ إلى الوضع السابق."
						: "Some dates are unavailable for booking. Dates have been reset to the previous values."
				);
				setCheckIn(prevCheckIn);
				setCheckOut(prevCheckOut);
				return;
			}

			setCheckOut(date);

			// Update previous dates
			setPrevCheckOut(date);

			// Automatically update the cart
			roomCart.forEach((room) => {
				const roomDetails = roomDetailsFromIds.find(
					(detail) => detail._id === room.id
				);

				if (roomDetails) {
					const updatedPricingByDay = calculatePricingByDay(
						roomDetails.pricingRate || [],
						checkIn.format("YYYY-MM-DD"),
						date.format("YYYY-MM-DD"),
						roomDetails.price.basePrice,
						roomDetails.defaultCost,
						roomDetails.roomCommission
					);

					const updatedPricingByDayWithCommission = updatedPricingByDay.map(
						(day) => ({
							...day,
							totalPriceWithCommission: Number(
								(
									Number(day.price) +
									Number(day.rootPrice) * Number(day.commissionRate)
								).toFixed(2)
							),
						})
					);

					updateRoomDates(
						room.id,
						checkIn.format("YYYY-MM-DD"),
						date.format("YYYY-MM-DD"),
						updatedPricingByDay,
						updatedPricingByDayWithCommission
					);
				}
			});
		}
	};

	const disabledCheckInDate = (current) => {
		return current && current < dayjs().endOf("day");
	};

	const disabledCheckOutDate = (current) => {
		if (!checkIn) return current && current < dayjs().endOf("day");
		return current && current <= checkIn.endOf("day");
	};

	const t = translations[chosenLanguage] || translations.English;

	return (
		<div>
			<Overlay isOpen={isSidebarOpen2} onClick={closeSidebar2} />
			<DrawerWrapper
				isOpen={isSidebarOpen2}
				isArabic={chosenLanguage === "Arabic"}
			>
				<CloseIcon onClick={closeSidebar2} />
				<DrawerHeader
					dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
					style={{
						textAlign: chosenLanguage === "Arabic" ? "right" : "left",
						marginRight: chosenLanguage === "Arabic" ? "6%" : "left",
					}}
				>
					{t.yourReservation}
				</DrawerHeader>

				{roomCart.length > 0 && (
					<DatePickersWrapper dir={chosenLanguage === "Arabic" ? "rtl" : ""}>
						<div>
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
							/>
						</div>
						<div>
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
							/>
						</div>
					</DatePickersWrapper>
				)}

				<div
					style={{
						textAlign: "center",
						marginBottom: "5px",
						textTransform: "capitalize",
						fontSize: "1.4rem",
						fontWeight: "bold",
					}}
				>
					{roomCart[0] && roomCart[0].hotelName}
				</div>

				<DrawerContent>
					{roomCart.length > 0 ? (
						roomCart.map((room) => {
							// Calculate the total price with commission
							const totalPriceWithCommission = room.pricingByDay.reduce(
								(total, day) =>
									total + day.price + day.rootPrice * day.commissionRate,
								0
							);

							// Calculate the price per night with commission
							const pricePerNightWithCommission =
								totalPriceWithCommission / room.nights;

							// Convert currency
							const convertedPricePerNight = convertCurrency(
								pricePerNightWithCommission
							);
							const convertedTotalAmount = convertCurrency(
								totalPriceWithCommission
							);

							return (
								<CartItem key={room.id}>
									<ItemImage
										src={room.photos[0] && room.photos[0].url}
										alt={room.name}
									/>
									{roomErrors[room.id] && (
										<ErrorMessage>{roomErrors[room.id]}</ErrorMessage>
									)}
									<ItemDetails
										dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
									>
										<ItemName>
											{chosenLanguage === "Arabic"
												? room.nameOtherLanguage
												: room.name}
										</ItemName>
										<ItemInfo>
											{room.amount} {t.roomDetails} {room.nights} {t.nights}{" "}
											{t.from} {room.startDate} {t.to} {room.endDate}
										</ItemInfo>
										<ItemPricePerNight>
											{t.pricePerNight}{" "}
											{Number(convertedPricePerNight * room.amount).toFixed(2)}{" "}
											{t[selectedCurrency.toUpperCase()]}
										</ItemPricePerNight>
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
										<ItemPrice>
											{t.totalAmount}{" "}
											{Number(convertedTotalAmount * room.amount).toFixed(2)}{" "}
											{t[selectedCurrency.toUpperCase()]}
										</ItemPrice>
									</ItemDetails>
									<RemoveButton onClick={() => removeRoomItem(room.id)}>
										{t.remove}
									</RemoveButton>
								</CartItem>
							);
						})
					) : (
						<EmptyMessage>{t.noReservations}</EmptyMessage>
					)}
				</DrawerContent>

				<TotalsWrapper>
					<TotalRooms>
						{t.totalRooms} {total_rooms}
					</TotalRooms>
					<TotalPrice>
						{t.totalPrice} {convertCurrency(total_price_with_commission)}{" "}
						{t[selectedCurrency.toUpperCase()]}
					</TotalPrice>
					<CheckoutButton
						to='/checkout'
						onClick={(e) => {
							e.preventDefault();

							// Check if the cart is empty
							if (!roomCart || roomCart.length === 0) {
								toast.error(
									chosenLanguage === "Arabic"
										? "سلة الحجز فارغة. يرجى إضافة غرفة للحجز."
										: "Your reservation cart is empty. Please add a room to proceed."
								);
								return;
							}

							// Check if all rooms belong to the same hotel
							const uniqueHotelIds = [
								...new Set(roomCart.map((room) => room.hotelId)),
							];
							if (uniqueHotelIds.length > 1) {
								toast.error(
									chosenLanguage === "Arabic"
										? "لا يمكنك الحجز مع فنادق مختلفة في نفس الحجز."
										: "You cannot book with two different hotels in the same reservation."
								);
								return;
							}

							// Check if any room has blocked dates (price = 0)
							const blockedRooms = roomCart.filter((room) =>
								room.pricingByDay.some((day) => Number(day.price) === 0)
							);

							if (blockedRooms.length > 0) {
								const blockedRoomNames = blockedRooms
									.map((room) =>
										chosenLanguage === "Arabic"
											? room.nameOtherLanguage
											: room.name
									)
									.join(", ");

								toast.error(
									chosenLanguage === "Arabic"
										? `الغرفة/الغرف التالية غير متاحة في التواريخ المحددة: ${blockedRoomNames}. يرجى اختيار تواريخ أخرى.`
										: `The following room(s) are unavailable for the selected dates: ${blockedRoomNames}. Please choose different dates.`
								);
								return;
							}

							// If all checks pass, proceed to checkout
							ReactGA.event({
								category: "User Clicked On Checkout",
								action: "User Clicked On Checkout",
								label: `User Clicked On Checkout`,
							});

							ReactPixel.track("User Proceeded To Checkout", {
								action: "User Proceeded To Checkout",
								page: "Checkout",
							});

							closeSidebar2();
							window.scrollTo({ top: 50, behavior: "smooth" });
							window.location.href = "/checkout";
						}}
					>
						{t.proceedToCheckout}
					</CheckoutButton>
				</TotalsWrapper>
			</DrawerWrapper>
		</div>
	);
};

export default SidebarCartDrawer;

// Styled-components for styling with the theme
const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.5);
	z-index: 99;
	backdrop-filter: blur(5px);
	opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
	visibility: ${({ isOpen }) => (isOpen ? "visible" : "hidden")};
	transition:
		opacity 0.3s ease-in-out,
		visibility 0.3s ease-in-out;
`;

const DrawerWrapper = styled.div`
	position: fixed;
	top: 0px;
	right: 0;
	width: 400px;
	height: calc(110vh - 100px);
	background: var(--background-light);
	box-shadow: var(--box-shadow-dark);
	padding: 20px;
	display: flex;
	flex-direction: column;
	z-index: 1001;
	overflow-y: auto;
	transition:
		transform 0.3s ease-in-out,
		top 0.3s ease-in-out;
	transform: ${({ isOpen }) => (isOpen ? "translateX(0)" : "translateX(100%)")};
	color: var(--text-color-primary);
	text-align: ${({ isArabic }) => (isArabic ? "right" : "")};

	@media (max-width: 768px) {
		width: 90%;
		top: 0px;
		height: calc(100vh - 50px);
	}
`;

const CloseIcon = styled(FaTimes)`
	position: absolute;
	top: 15px;
	right: 15px;
	font-size: 1.5rem;
	color: darkred;
	cursor: pointer;

	&:hover {
		color: #cc0000;
	}
`;

const DrawerHeader = styled.h2`
	font-size: 1.5rem;
	color: var(--primary-color);
	border-bottom: 2px solid var(--border-color-dark);
	padding-bottom: 10px;
	margin-bottom: 15px;
`;

const DatePickersWrapper = styled.div`
	display: flex;
	justify-content: space-between;
	margin-bottom: 20px;

	div {
		flex: 1;
		margin-right: 10px;

		&:last-child {
			margin-right: 0;
		}
	}
`;

const DrawerContent = styled.div`
	flex-grow: 1;
	overflow-y: auto;
	margin-bottom: 15px;
`;

const CartItem = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 10px 0;
	border-bottom: 1px solid var(--border-color-light);
`;

const ItemImage = styled.img`
	width: 60%;
	height: 130px !important;
	height: auto;
	border-radius: 10px;
	object-fit: cover;
	margin-bottom: 10px;
`;

const ItemDetails = styled.div`
	text-align: center;
`;

const ItemName = styled.h3`
	font-size: 0.85rem;
	color: var(--primary-color-dark);
	margin-bottom: 5px;
	font-weight: bold;
	text-transform: capitalize;
`;

const ItemInfo = styled.p`
	font-size: 0.82rem;
	color: var(--text-color-secondary);
	margin-bottom: 5px;
`;

const ItemPricePerNight = styled.p`
	font-size: 0.9rem;
	font-weight: bold;
	color: var(--primary-color-darker);
	margin-bottom: 5px;
`;

const ItemPrice = styled.p`
	font-size: 1rem;
	font-weight: bold;
	color: var(--primary-color-darker);
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

const RemoveButton = styled.button`
	background: var(--secondary-color);
	color: var(--mainWhite);
	border: none;
	padding: 5px 10px;
	border-radius: 5px;
	cursor: pointer;
	font-size: 0.85rem;
	transition: var(--main-transition);

	&:hover {
		background: var(--secondary-color-darker);
	}
`;

const EmptyMessage = styled.p`
	font-size: 1rem;
	color: var(--secondary-color-dark);
	text-align: center;
	margin: 20px 0;
`;

const TotalsWrapper = styled.div`
	border-top: 2px solid var(--border-color-dark);
	padding-top: 10px;
`;

const TotalRooms = styled.p`
	font-size: 1rem;
	color: var(--primary-color-dark);
	margin-bottom: 5px;
`;

const TotalPrice = styled.p`
	font-size: 1rem;
	font-weight: bold;
	color: var(--primary-color);
	margin-bottom: 15px;
`;

const CheckoutButton = styled(Link)`
	display: block;
	width: 100%;
	padding: 10px;
	background: var(--primary-color-dark);
	color: var(--mainWhite);
	text-align: center;
	border-radius: 5px;
	text-decoration: none;
	font-weight: bold;
	transition: var(--main-transition);

	&:hover {
		background: var(--primary-color-light);
	}
`;

const Label = styled.label`
	display: block;
	margin-bottom: 5px;
	font-weight: bold;
`;

const ErrorMessage = styled.div`
	color: red;
	font-size: 12px;
	margin-top: 5px;
	text-align: center;
	margin-bottom: 10px;
	font-weight: bold;
`;
