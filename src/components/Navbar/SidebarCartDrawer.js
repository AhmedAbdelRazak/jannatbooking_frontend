import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useCartContext } from "../../cart_context";
import { Link } from "react-router-dom";
import { FaTimes, FaPlus, FaMinus } from "react-icons/fa";
// eslint-disable-next-line
import { DatePicker, ConfigProvider } from "antd"; // Import Ant Design's RangePicker
import dayjs from "dayjs";
// eslint-disable-next-line
import locale from "antd/es/date-picker/locale/en_US"; // Optional locale for DatePicker
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";

const { RangePicker } = DatePicker;

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

const SidebarCartDrawer = () => {
	const {
		roomCart,
		removeRoomItem,
		toggleRoomAmount,
		updateRoomDates, // Add updateRoomDates function
		total_rooms,
		closeSidebar2,
		isSidebarOpen2,
		total_price_with_commission,
		chosenLanguage,
	} = useCartContext();

	const [selectedCurrency, setSelectedCurrency] = useState("SAR");
	const [currencyRates, setCurrencyRates] = useState({});

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

	// Helper to convert currency
	const convertCurrency = (amount) => {
		if (!amount || isNaN(amount)) return "0.00"; // Default to "0.00" if amount is invalid

		if (selectedCurrency === "usd")
			return (amount * (currencyRates.SAR_USD || 1)).toFixed(2);
		if (selectedCurrency === "eur")
			return (amount * (currencyRates.SAR_EUR || 1)).toFixed(2);
		return amount.toFixed(2); // Default to SAR
	};

	// Handle when the user changes the date range
	// eslint-disable-next-line
	const handleDateChange = (dates) => {
		if (dates && dates[0] && dates[1]) {
			const startDate = dates[0].format("YYYY-MM-DD");
			const endDate = dates[1].format("YYYY-MM-DD");

			// Update the room dates in the context for the entire reservation
			roomCart.forEach((room) => updateRoomDates(room.id, startDate, endDate));
		}
	};

	// Disable past dates
	// eslint-disable-next-line
	const disabledDate = (current) => current && current < dayjs().endOf("day");

	// eslint-disable-next-line
	const panelRender = (panelNode) => (
		<StyledRangePickerContainer>{panelNode}</StyledRangePickerContainer>
	);

	// Get translations for the chosen language
	const t = translations[chosenLanguage] || translations.English;

	return (
		<div>
			<Overlay isOpen={isSidebarOpen2} onClick={closeSidebar2} />
			<DrawerWrapper isOpen={isSidebarOpen2}>
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

				{/* Ant Design Date Range Picker - Displayed only once */}
				{/* <DateRangePickerWrapper>
					<ConfigProvider locale={locale}>
						<RangeDatePicker
							format='YYYY-MM-DD'
							onChange={handleDateChange}
							value={
								roomCart.length > 0
									? [dayjs(roomCart[0]?.startDate), dayjs(roomCart[0]?.endDate)]
									: null
							}
							disabledDate={disabledDate}
							panelRender={panelRender}
							inputReadOnly
						/>
					</ConfigProvider>
				</DateRangePickerWrapper> */}

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
						onClick={() => {
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

const StyledRangePickerContainer = styled.div`
	@media (max-width: 576px) {
		.ant-picker-panels {
			flex-direction: column !important;
		}
	}
`;

// eslint-disable-next-line
const DateRangePickerWrapper = styled.div`
	margin: 10px auto;
	width: 85%;
`;

// eslint-disable-next-line
const RangeDatePicker = styled(RangePicker)`
	width: 100%;
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
