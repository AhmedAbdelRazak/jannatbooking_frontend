import React, { useState } from "react";
import styled from "styled-components";
import { useCartContext } from "../../cart_context";
import dayjs from "dayjs";
import { DatePicker, Button, Collapse } from "antd";
import { CaretRightOutlined, InfoCircleOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const CheckoutContent = () => {
	const {
		roomCart,
		updateRoomDates,
		removeRoomItem,
		total_rooms,
		total_price,
	} = useCartContext();

	const [expanded, setExpanded] = useState({});
	const [mobileExpanded, setMobileExpanded] = useState(false); // Mobile collapse

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

	console.log(roomCart, "cart");

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
						<input type='text' name='name' placeholder='First & Last Name' />
					</InputGroup>
					<InputGroup>
						<label>Phone</label>
						<input type='text' name='phone' placeholder='Phone Number' />
					</InputGroup>
					<InputGroup>
						<label>Email</label>
						<input type='email' name='email' placeholder='Email Address' />
					</InputGroup>
					<InputGroup>
						<label>Passport</label>
						<input type='text' name='passport' placeholder='Passport Number' />
					</InputGroup>
					<InputGroup>
						<label>Passport Expiry</label>
						<input type='date' name='passportExpiry' />
					</InputGroup>
					<InputGroup>
						<label>Nationality</label>
						<input type='text' name='nationality' placeholder='Nationality' />
					</InputGroup>
				</form>
			</MobileFormWrapper>

			<DesktopWrapper>
				<LeftSection>
					<h2>Customer Details</h2>
					<form>
						<InputGroup>
							<label>Name</label>
							<input type='text' name='name' placeholder='First & Last Name' />
						</InputGroup>
						<InputGroup>
							<label>Phone</label>
							<input type='text' name='phone' placeholder='Phone Number' />
						</InputGroup>
						<InputGroup>
							<label>Email</label>
							<input type='email' name='email' placeholder='Email Address' />
						</InputGroup>
						<InputGroup>
							<label>Passport</label>
							<input
								type='text'
								name='passport'
								placeholder='Passport Number'
							/>
						</InputGroup>
						<InputGroup>
							<label>Passport Expiry</label>
							<input type='date' name='passportExpiry' />
						</InputGroup>
						<InputGroup>
							<label>Nationality</label>
							<input type='text' name='nationality' placeholder='Nationality' />
						</InputGroup>
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
