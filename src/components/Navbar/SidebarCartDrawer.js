import React from "react";
import styled from "styled-components";
import { useCartContext } from "../../cart_context";
import { Link } from "react-router-dom";
import { FaTimes, FaPlus, FaMinus } from "react-icons/fa";
import { DatePicker, ConfigProvider } from "antd"; // Import Ant Design's RangePicker
import dayjs from "dayjs";
import locale from "antd/es/date-picker/locale/en_US"; // Optional locale for DatePicker

const { RangePicker } = DatePicker;

const SidebarCartDrawer = () => {
	const {
		roomCart,
		removeRoomItem,
		toggleRoomAmount,
		updateRoomDates, // Add updateRoomDates function
		total_rooms,
		total_price,
		closeSidebar2,
		isSidebarOpen2,
	} = useCartContext();

	// Handle when the user changes the date range
	const handleDateChange = (dates) => {
		if (dates && dates[0] && dates[1]) {
			const startDate = dates[0].format("YYYY-MM-DD");
			const endDate = dates[1].format("YYYY-MM-DD");

			// Update the room dates in the context for the entire reservation
			roomCart.forEach((room) => updateRoomDates(room.id, startDate, endDate));
		}
	};

	// Disable past dates
	const disabledDate = (current) => current && current < dayjs().endOf("day");

	return (
		<>
			<Overlay isOpen={isSidebarOpen2} onClick={closeSidebar2} />
			<DrawerWrapper isOpen={isSidebarOpen2}>
				<CloseIcon onClick={closeSidebar2} />
				<DrawerHeader>Your Reservations</DrawerHeader>

				{/* Ant Design Date Range Picker - Displayed only once */}
				<DateRangePickerWrapper>
					<ConfigProvider locale={locale}>
						<RangePicker
							format='YYYY-MM-DD'
							disabledDate={disabledDate}
							onChange={(dates) => handleDateChange(dates)}
							defaultValue={[
								dayjs(roomCart[0]?.startDate), // Use first room's start date
								dayjs(roomCart[0]?.endDate), // Use first room's end date
							]}
							style={{ width: "100%" }} // Full-width on small screens
							dropdownClassName='mobile-friendly-picker' // Custom styling
						/>
					</ConfigProvider>
				</DateRangePickerWrapper>

				<DrawerContent>
					{roomCart.length > 0 ? (
						roomCart.map((room) => (
							<CartItem key={room.id}>
								<ItemImage
									src={room.photos[0] && room.photos[0].url}
									alt={room.name}
								/>
								<ItemDetails>
									<ItemName>{room.name}</ItemName>
									<ItemInfo>
										{room.amount} room(s) for{" "}
										{dayjs(roomCart[0]?.endDate).diff(
											dayjs(roomCart[0]?.startDate),
											"day"
										)}{" "}
										night(s) from {roomCart[0]?.startDate} to{" "}
										{roomCart[0]?.endDate}
									</ItemInfo>
									<ItemPricePerNight>
										Price per night: {room.price} SAR
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
										Total Amount: {room.amount * room.nights * room.price} SAR
									</ItemPrice>
								</ItemDetails>
								<RemoveButton onClick={() => removeRoomItem(room.id)}>
									Remove
								</RemoveButton>
							</CartItem>
						))
					) : (
						<EmptyMessage>No reservations yet.</EmptyMessage>
					)}
				</DrawerContent>
				<TotalsWrapper>
					<TotalRooms>Total Rooms: {total_rooms}</TotalRooms>
					<TotalPrice>Total Price: {total_price} SAR</TotalPrice>
					<CheckoutButton
						to='/checkout'
						onClick={() => {
							closeSidebar2();
							window.scrollTo({ top: 50, behavior: "smooth" });
						}}
					>
						Proceed to Checkout
					</CheckoutButton>
				</TotalsWrapper>
			</DrawerWrapper>
		</>
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
	z-index: 200;
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

// Date Range Picker Wrapper Styling
const DateRangePickerWrapper = styled.div`
	margin: 10px auto;
	width: 85%;

	@media (max-width: 768px) {
		/* Ensure the date picker input takes the full width on mobile */
		.ant-picker {
			width: 100% !important;
		}

		/* Target the dropdown and ensure it takes the full screen width */
		.ant-picker-dropdown {
			width: 100vw !important; /* Full screen width */
			left: 0 !important; /* Align to the left */
			right: 0 !important; /* Align to the right */
			top: 50px !important; /* Adjust top for proper placement */
			transform: none !important; /* Remove any transform offsets */
		}

		/* Ensure the picker container takes the full width */
		.ant-picker-range-wrapper {
			width: 100% !important;
			margin: 0 auto; /* Center the content */
		}

		/* Make the date panel fill the screen height on mobile */
		.ant-picker-date-panel-container {
			height: 100vh !important; /* Full height of the screen */
			overflow-y: scroll !important; /* Allow scrolling for better UX */
		}

		/* Optional: Customize the calendar for smaller screens */
		.ant-picker-calendar {
			font-size: 0.85rem !important; /* Slightly reduce the font size */
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
