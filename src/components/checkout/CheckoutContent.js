import React, { useState } from "react";
import styled from "styled-components";
import { useCartContext } from "../../cart_context";
import dayjs from "dayjs";
import { DatePicker, Button, Collapse, Select, message } from "antd";
import PaymentDetails from "./PaymentDetails";
import { countryList } from "../../Assets"; // Ensure this file contains an array of countries
import { CaretRightOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { createNewReservationClient } from "../../apiCore";
import { FaMinus, FaPlus } from "react-icons/fa";

const { RangePicker } = DatePicker;
const { Panel } = Collapse;
const { Option } = Select;

const CheckoutContent = () => {
	const {
		roomCart,
		updateRoomDates,
		removeRoomItem,
		total_rooms,
		total_price,
		clearRoomCart,
		toggleRoomAmount,
	} = useCartContext();

	const [expanded, setExpanded] = useState({});
	const [mobileExpanded, setMobileExpanded] = useState(false); // Mobile collapse
	const [cardNumber, setCardNumber] = useState("");
	const [expiryDate, setExpiryDate] = useState("");
	const [cvv, setCvv] = useState("");
	const [cardHolderName, setCardHolderName] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [nationality, setNationality] = useState("");
	const [customerDetails, setCustomerDetails] = useState({
		name: "",
		phone: "",
		email: "",
		passport: "",
		passportExpiry: "",
		nationality: "",
	});

	// Function to transform roomCart into pickedRoomsType format
	const transformRoomCartToPickedRoomsType = (roomCart) => {
		return roomCart.flatMap((room) => {
			// For each room, create an array of objects where each room's "amount" becomes multiple objects
			return Array.from({ length: room.amount }, () => ({
				room_type: room.roomType, // Using "name" as room_type
				displayName: room.name, // To store the display name
				chosenPrice: room.price, // Assuming price is already the total per room
				count: 1, // Each room is counted individually in pickedRoomsType
				pricingByDay: room.pricingByDay || [], // Pricing breakdown by day
				roomColor: room.roomColor, // Room color
			}));
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
		const { name, phone, email, passport, passportExpiry } = customerDetails;

		// Full name validation
		if (!name || name.trim().split(" ").length < 2) {
			message.error("Please provide your full name (first and last name).");
			return;
		}

		// Phone number validation
		const phoneRegex = /^[0-9]{6,}$/;
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

		// Passport validation
		if (!passport) {
			message.error("Please provide your passport number.");
			return;
		}

		// Passport Expiry validation
		if (!passportExpiry) {
			message.error("Please provide your passport expiry date.");
			return;
		}

		// Nationality validation
		if (!nationality) {
			message.error("Please select your nationality.");
			return;
		}

		// Hotel name consistency validation
		const hotelNames = roomCart.map((room) => room.hotelName);
		const uniqueHotelNames = [...new Set(hotelNames)];

		// Check if there are multiple unique hotel names
		if (uniqueHotelNames.length > 1) {
			message.error(
				"You cannot make a reservation with rooms from multiple hotels. Please ensure all rooms are from the same hotel."
			);
			return;
		}

		// Proceed with the reservation creation if all validations pass
		const paymentDetails = {
			cardNumber,
			cardExpiryDate: expiryDate,
			cardCVV: cvv,
			cardHolderName,
		};

		const pickedRoomsType = transformRoomCartToPickedRoomsType(roomCart);

		const reservationData = {
			hotelId: roomCart[0].hotelId,
			belongsTo: roomCart[0].belongsTo,
			customerDetails: {
				...customerDetails,
				nationality,
			},
			paymentDetails,
			payment: "Paid",
			total_rooms,
			total_guests: Number(roomCart[0].adults) + Number(roomCart[0].children),
			adults: Number(roomCart[0].adults),
			children: 0,
			total_amount: total_price,
			checkin_date: roomCart[0].startDate,
			checkout_date: roomCart[0].endDate,
			days_of_residence: dayjs(roomCart[0].endDate).diff(
				dayjs(roomCart[0].startDate),
				"days"
			),
			booking_source: "Jannat Booking",
			pickedRoomsType,
		};

		try {
			const response = await createNewReservationClient(reservationData);
			if (response && response.message === "Reservation created successfully") {
				message.success("Reservation created successfully");

				clearRoomCart();

				// Construct query params
				const queryParams = new URLSearchParams();
				queryParams.append("name", customerDetails.name);
				queryParams.append("total_price", total_price);
				queryParams.append("total_rooms", total_rooms);

				// Add each room's details to the query
				roomCart.forEach((room, index) => {
					queryParams.append(`hotel_name_${index}`, room.hotelName);
					queryParams.append(`room_type_${index}`, room.roomType);
					queryParams.append(`room_display_name_${index}`, room.name);
					queryParams.append(`nights_${index}`, room.nights);
					queryParams.append(`checkin_date_${index}`, room.startDate);
					queryParams.append(`checkout_date_${index}`, room.endDate);
				});

				// Redirect with all room details in query
				window.location.href = `/reservation-confirmed?${queryParams.toString()}`;
			} else {
				message.error(response.message || "Error creating reservation");
			}
		} catch (error) {
			console.error("Error creating reservation", error);
			message.error("An error occurred while creating the reservation");
		}
	};

	return (
		<CheckoutContentWrapper>
			{/* Mobile Accordion for Reservation Summary */}
			<MobileAccordion
				onChange={() => setMobileExpanded(!mobileExpanded)}
				activeKey={mobileExpanded ? "1" : null}
			>
				<Panel header='Your Reservation Summary' key='1'>
					<RightSection>
						<h2>Your Reservation</h2>

						{/* Ant Design Date Range Picker */}
						<DateRangePickerWrapper>
							<RangePicker
								format='YYYY-MM-DD'
								disabledDate={disabledDate}
								onChange={handleDateChange}
								defaultValue={[
									dayjs(roomCart[0]?.startDate),
									dayjs(roomCart[0]?.endDate),
								]}
								style={{ width: "100%" }}
								dropdownClassName='mobile-friendly-picker'
							/>
						</DateRangePickerWrapper>

						{roomCart.length > 0 ? (
							roomCart.map((room) => (
								<RoomItem key={room.id}>
									<RoomImage src={room.photos[0]?.url} alt={room.name} />

									<RoomDetails>
										<h3>{room.name}</h3>
										<p>{room.amount} room(s)</p>
										<DateRangeWrapper>
											<label>Dates:</label>
											<p>
												{room.startDate} to {room.endDate}
											</p>
										</DateRangeWrapper>
										<p className='total'>
											Price for {room.nights} night(s):{" "}
											{room.amount * room.price} SAR
										</p>
										<h4>{room.price} SAR per night</h4>

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
														<InfoCircleOutlined /> Price Breakdown
													</PriceDetailsHeader>
												}
												key='1'
											>
												<PricingList>
													{/* Ensure pricingByDay is mapped correctly */}
													{room.pricingByDay && room.pricingByDay.length > 0 ? (
														room.pricingByDay.map(({ date, price }, index) => {
															return (
																<li key={index}>
																	{date}: {price} SAR
																</li>
															);
														})
													) : (
														<li>No price breakdown available</li>
													)}
												</PricingList>
											</Panel>
										</Collapse>

										<RemoveButton onClick={() => removeRoomItem(room.id)}>
											Remove
										</RemoveButton>
									</RoomDetails>
								</RoomItem>
							))
						) : (
							<p>No rooms selected.</p>
						)}

						{/* Totals Section */}
						<TotalsWrapper>
							<p>Total Rooms: {total_rooms}</p>
							<p className='total-price'>Total Price: {total_price} SAR</p>
						</TotalsWrapper>
					</RightSection>
				</Panel>
			</MobileAccordion>

			{/* Mobile form for user details */}
			<MobileFormWrapper>
				<h2>Customer Details</h2>
				<form>
					<InputGroup>
						<label>Name</label>
						<input
							type='text'
							name='name'
							placeholder='First & Last Name'
							value={customerDetails.name}
							onChange={(e) =>
								setCustomerDetails({ ...customerDetails, name: e.target.value })
							}
						/>
					</InputGroup>
					<InputGroup>
						<label>Phone</label>
						<input
							type='text'
							name='phone'
							placeholder='Phone Number'
							value={customerDetails.phone}
							onChange={(e) =>
								setCustomerDetails({
									...customerDetails,
									phone: e.target.value,
								})
							}
						/>
					</InputGroup>
					<InputGroup>
						<label>Email</label>
						<input
							type='email'
							name='email'
							placeholder='Email Address'
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
						<label>Passport</label>
						<input
							type='text'
							name='passport'
							placeholder='Passport Number'
							value={customerDetails.passport}
							onChange={(e) =>
								setCustomerDetails({
									...customerDetails,
									passport: e.target.value,
								})
							}
						/>
					</InputGroup>
					<InputGroup>
						<label>Passport Expiry</label>
						<input
							type='date'
							name='passportExpiry'
							value={customerDetails.passportExpiry}
							onChange={(e) =>
								setCustomerDetails({
									...customerDetails,
									passportExpiry: e.target.value,
								})
							}
						/>
					</InputGroup>
					<InputGroup>
						<label>Nationality</label>
						<Select
							showSearch
							placeholder='Select a country'
							optionFilterProp='children'
							filterOption={(input, option) =>
								option.children.toLowerCase().includes(input.toLowerCase())
							}
							value={nationality}
							onChange={(value) => setNationality(value)}
							style={{ width: "100%" }}
						>
							{countryList.map((country) => (
								<Option key={country} value={country}>
									{country}
								</Option>
							))}
						</Select>
					</InputGroup>
					<div>
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
						/>
					</div>
				</form>
			</MobileFormWrapper>

			<DesktopWrapper>
				<LeftSection>
					<h2>Customer Details</h2>
					<form>
						<InputGroup>
							<label>Name</label>
							<input
								type='text'
								name='name'
								placeholder='First & Last Name'
								value={customerDetails.name}
								onChange={(e) =>
									setCustomerDetails({
										...customerDetails,
										name: e.target.value,
									})
								}
							/>
						</InputGroup>
						<InputGroup>
							<label>Phone</label>
							<input
								type='text'
								name='phone'
								placeholder='Phone Number'
								value={customerDetails.phone}
								onChange={(e) =>
									setCustomerDetails({
										...customerDetails,
										phone: e.target.value,
									})
								}
							/>
						</InputGroup>
						<InputGroup>
							<label>Email</label>
							<input
								type='email'
								name='email'
								placeholder='Email Address'
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
							<label>Passport</label>
							<input
								type='text'
								name='passport'
								placeholder='Passport Number'
								value={customerDetails.passport}
								onChange={(e) =>
									setCustomerDetails({
										...customerDetails,
										passport: e.target.value,
									})
								}
							/>
						</InputGroup>
						<InputGroup>
							<label>Passport Expiry</label>
							<input
								type='date'
								name='passportExpiry'
								value={customerDetails.passportExpiry}
								onChange={(e) =>
									setCustomerDetails({
										...customerDetails,
										passportExpiry: e.target.value,
									})
								}
							/>
						</InputGroup>
						<InputGroup>
							<label>Nationality</label>
							<Select
								showSearch
								placeholder='Select a country'
								optionFilterProp='children'
								filterOption={(input, option) =>
									option.children.toLowerCase().includes(input.toLowerCase())
								}
								value={nationality}
								onChange={(value) => setNationality(value)}
								style={{ width: "100%" }}
							>
								{countryList.map((country) => (
									<Option key={country} value={country}>
										{country}
									</Option>
								))}
							</Select>
						</InputGroup>

						<div>
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
							/>
						</div>
					</form>
				</LeftSection>

				<RightSection>
					<h2>Your Reservation</h2>

					{/* Ant Design Date Range Picker */}
					<DateRangePickerWrapper>
						<RangePicker
							format='YYYY-MM-DD'
							disabledDate={disabledDate}
							onChange={handleDateChange}
							defaultValue={[
								dayjs(roomCart[0]?.startDate),
								dayjs(roomCart[0]?.endDate),
							]}
							style={{ width: "100%" }}
							dropdownClassName='mobile-friendly-picker'
						/>
					</DateRangePickerWrapper>

					{roomCart.length > 0 ? (
						roomCart.map((room) => (
							<RoomItem key={room.id}>
								<RoomImage src={room.photos[0]?.url} alt={room.name} />

								<RoomDetails>
									<h3>{room.name}</h3>
									<p>{room.amount} room(s)</p>
									<DateRangeWrapper>
										<label>Dates:</label>
										<p>
											{room.startDate} to {room.endDate}
										</p>
									</DateRangeWrapper>
									<p className='total'>
										Price for {room.nights} night(s): {room.amount * room.price}{" "}
										SAR
									</p>
									<h4>{room.price} SAR per night</h4>

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
													<InfoCircleOutlined /> Price Breakdown
												</PriceDetailsHeader>
											}
											key='1'
										>
											<PricingList>
												{/* Ensure pricingByDay is mapped correctly */}
												{room.pricingByDay && room.pricingByDay.length > 0 ? (
													room.pricingByDay.map(({ date, price }, index) => {
														return (
															<li key={index}>
																{date}: {price} SAR
															</li>
														);
													})
												) : (
													<li>No price breakdown available</li>
												)}
											</PricingList>
										</Panel>
									</Collapse>

									<RemoveButton onClick={() => removeRoomItem(room.id)}>
										Remove
									</RemoveButton>
								</RoomDetails>
							</RoomItem>
						))
					) : (
						<p>No rooms selected.</p>
					)}

					{/* Totals Section */}
					<TotalsWrapper>
						<p>Total Rooms: {total_rooms}</p>
						<p className='total-price'>Total Price: {total_price} SAR</p>
					</TotalsWrapper>
				</RightSection>
			</DesktopWrapper>
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
`;

const MobileAccordion = styled(Collapse)`
	display: none;
	@media (max-width: 768px) {
		display: block;
		margin-top: 50px;
	}
`;

const MobileFormWrapper = styled.div`
	display: block;
	margin: 20px 0;

	@media (min-width: 768px) {
		display: none;
	}
`;

const DesktopWrapper = styled.div`
	display: flex;
	gap: 20px;
	@media (max-width: 768px) {
		display: none;
	}
`;

const LeftSection = styled.div`
	flex: 2;
	background: var(--background-light);
	padding: 20px;
	border-radius: 10px;
	box-shadow: var(--box-shadow-light);
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
