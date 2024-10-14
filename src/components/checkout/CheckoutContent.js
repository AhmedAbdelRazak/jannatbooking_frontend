import React, { useState } from "react";
import styled from "styled-components";
import { useCartContext } from "../../cart_context";
import dayjs from "dayjs";
import { DatePicker, Button, Collapse, Select, message } from "antd";
import PaymentDetails from "./PaymentDetails";
import { countryList } from "../../Assets"; // Ensure this file contains an array of countries
import { CaretRightOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { createNewReservationClient } from "../../apiCore";

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

	console.log(roomCart, "roomCart");

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

	const toggleExpanded = (id) => {
		setExpanded((prev) => ({
			...prev,
			[id]: !prev[id],
		}));
	};

	const handleDateChange = (id, dates) => {
		if (dates && dates.length === 2) {
			updateRoomDates(
				id,
				dates[0].format("YYYY-MM-DD"),
				dates[1].format("YYYY-MM-DD")
			);
		}
	};

	const createNewReservation = async () => {
		const { name, phone, email, passport, passportExpiry } = customerDetails;

		if (
			!name ||
			!phone ||
			!email ||
			!passport ||
			!passportExpiry ||
			!nationality
		) {
			// Ensure all customer details are filled before proceeding
			console.error("All customer details must be provided");
			return;
		}

		// Payment details
		const paymentDetails = {
			cardNumber,
			cardExpiryDate: expiryDate,
			cardCVV: cvv,
			cardHolderName,
		};

		// Transform roomCart into the pickedRoomsType schema
		const pickedRoomsType = transformRoomCartToPickedRoomsType(roomCart);

		// Reservation data object
		const reservationData = {
			hotelId: roomCart[0].hotelId, // Assuming all rooms are for the same hotel
			belongsTo: roomCart[0].belongsTo, // User ID associated with the reservation
			customerDetails: {
				...customerDetails,
				nationality, // Ensure nationality is included
			},
			paymentDetails, // Pass payment details
			payment: "Paid", // Set payment status as Paid
			total_rooms, // The total number of rooms reserved
			total_guests: Number(roomCart[0].adults) + Number(roomCart[0].children), // Parsed total guests
			adults: Number(roomCart[0].adults), // Parsed total adults
			children: 0, // Parsed total children
			total_amount: total_price, // Total price for the reservation
			checkin_date: roomCart[0].startDate,
			checkout_date: roomCart[0].endDate,
			days_of_residence: dayjs(roomCart[0].endDate).diff(
				dayjs(roomCart[0].startDate),
				"days"
			),
			booking_source: "Jannat Booking", // Booking source
			pickedRoomsType, // Transformed rooms
		};

		try {
			const response = await createNewReservationClient(reservationData);
			if (response && response.message === "Reservation created successfully") {
				// Success handling
				message.success("Reservation created successfully");

				// Clear the cart context (cart and other states)
				clearRoomCart();

				// Redirect to home page
				window.location.href = "/";
			} else {
				// Error handling
				message.error(response.message || "Error creating reservation");
			}
		} catch (error) {
			console.error("Error creating reservation", error);
			// Display error message
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
						{roomCart.length > 0 ? (
							roomCart.map((room) => (
								<RoomItem key={room.id}>
									<RoomImage src={room.firstImage} alt={room.name} />
									<RoomDetails>
										<h3>{room.name}</h3>
										<p>{room.amount} room(s)</p>
										<DateRangeWrapper>
											<label>Dates:</label>
											<RangePicker
												format='YYYY-MM-DD'
												value={[
													dayjs(room.startDate, "YYYY-MM-DD"),
													dayjs(room.endDate, "YYYY-MM-DD"),
												]}
												onChange={(dates) => handleDateChange(room.id, dates)}
												disabledDate={(current) =>
													current && current < dayjs().endOf("day")
												}
											/>
										</DateRangeWrapper>
										<p className='total'>
											Price from {room.startDate} to {room.endDate}:{" "}
											{room.amount * room.price} SAR | {room.nights} nights
										</p>

										<h4>{room.price} SAR per night</h4>

										{/* New Accordion for Price Rating */}
										<Collapse
											accordion
											expandIcon={({ isActive }) => (
												<CaretRightOutlined
													rotate={isActive ? 90 : 0}
													style={{ color: "var(--primary-color)" }}
												/>
											)}
											onChange={() => toggleExpanded(room.id)}
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
													{room.priceRating && room.priceRating.length > 0 ? (
														room.priceRating.map(({ date, price }, index) => {
															return (
																<li key={index}>
																	{new Date(date).toLocaleDateString()}: {price}{" "}
																	SAR
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
						<TotalSection>
							<p>Total Rooms: {total_rooms}</p>
							<p className='total-price'>Total Price: {total_price} SAR</p>
						</TotalSection>
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

				<RightSection className='desktop-right'>
					<h2>Your Reservation</h2>
					{roomCart.length > 0 ? (
						roomCart.map((room) => (
							<RoomItem key={room.id}>
								<RoomImage src={room.firstImage} alt={room.name} />

								<RoomDetails>
									<h3>{room.name}</h3>
									<p>{room.amount} room(s)</p>
									<DateRangeWrapper>
										<label>Dates:</label>
										<RangePicker
											format='YYYY-MM-DD'
											value={[
												dayjs(room.startDate, "YYYY-MM-DD"),
												dayjs(room.endDate, "YYYY-MM-DD"),
											]}
											onChange={(dates) => handleDateChange(room.id, dates)}
											disabledDate={(current) =>
												current && current < dayjs().endOf("day")
											}
										/>
									</DateRangeWrapper>
									<p className='total'>
										Price from {room.startDate} to {room.endDate}:{" "}
										{room.amount * room.price} SAR | {room.nights} nights
									</p>
									<h4>{room.price} SAR per night</h4>

									{/* New Accordion for Price Rating */}
									<Collapse
										accordion
										expandIcon={({ isActive }) => (
											<CaretRightOutlined
												rotate={isActive ? 90 : 0}
												style={{ color: "var(--primary-color)" }}
											/>
										)}
										onChange={() => toggleExpanded(room.id)}
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
												{room.priceRating && room.priceRating.length > 0 ? (
													room.priceRating.map(({ date, price }, index) => {
														return (
															<li key={index}>
																{new Date(date).toLocaleDateString()}: {price}{" "}
																SAR
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
					<TotalSection>
						<p>Total Rooms: {total_rooms}</p>
						<p className='total-price'>Total Price: {total_price} SAR</p>
					</TotalSection>
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
	height: 200px;
	object-fit: cover;
	border-radius: 8px;
`;

const RoomDetails = styled.div`
	text-align: center;
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
