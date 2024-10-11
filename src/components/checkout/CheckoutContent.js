import React, { useState } from "react";
import styled from "styled-components";
import { useCartContext } from "../../cart_context";
import dayjs from "dayjs";
import { DatePicker, Button } from "antd";

const { RangePicker } = DatePicker;

const CheckoutContent = () => {
	const {
		roomCart,
		updateRoomDates,
		removeRoomItem,
		total_rooms,
		total_price,
	} = useCartContext();

	const [expanded, setExpanded] = useState({});

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

	return (
		<CheckoutContentWrapper>
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
			</LeftSection>

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
								<p className='total'>Total: {room.amount * room.price} SAR</p>

								<h4>Itemized Pricing: {room.price} SAR per night</h4>
								<AccordionToggle onClick={() => toggleExpanded(room.id)}>
									{expanded[room.id] ? "Hide Details" : "Show Details"}
								</AccordionToggle>
								{expanded[room.id] && (
									<PricingList>
										{room.pricingRate && room.pricingRate.length > 0 ? (
											room.pricingRate.map(({ calendarDate, price }, index) => (
												<li key={index}>
													{calendarDate}: {price} SAR
												</li>
											))
										) : (
											<li>
												{room.startDate} to {room.endDate}: {room.price} SAR per
												night
											</li>
										)}
									</PricingList>
								)}
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
		</CheckoutContentWrapper>
	);
};

export default CheckoutContent;

// Styled components for layout
const CheckoutContentWrapper = styled.div`
	display: flex;
	gap: 20px;
	padding: 20px;

	h2 {
		font-size: 1.5rem;
		font-weight: bold;
	}
`;

const LeftSection = styled.div`
	flex: 2;
	background: #fff;
	padding: 20px;
	border-radius: 10px;
	box-shadow: var(--box-shadow-light);
`;

const RightSection = styled.div`
	flex: 1;
	position: sticky;
	top: 20px;
	background: #f9f9f9;
	padding: 20px;
	border-radius: 10px;
	box-shadow: var(--box-shadow-light);
	height: max-content;
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
	width: 60%;
	height: 200px !important;
	border-radius: 8px;
	margin: auto !important;
	object-fit: cover;
`;

const RoomDetails = styled.div`
	text-align: center;

	.total {
		font-size: 1.2rem;
		font-weight: bold;
		color: #444;
		margin: 10px 0;
	}

	h3 {
		font-size: 1.2rem;
		font-weight: bold;
		text-transform: capitalize;
	}
`;

const DateRangeWrapper = styled.div`
	display: flex;
	align-items: center;
	margin: 10px 0;

	label {
		width: 100px;
		margin-right: 10px;
		text-align: left;
	}

	.ant-picker {
		flex: 1;
	}
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

	li {
		font-size: 0.85rem;
		color: #666;
		text-align: left;
	}
`;

const AccordionToggle = styled.button`
	background: none;
	color: var(--primary-color);
	border: none;
	font-weight: bold;
	cursor: pointer;
	margin-top: 10px;

	&:hover {
		text-decoration: underline;
	}
`;

const TotalSection = styled.div`
	margin-top: 20px;
	padding-top: 10px;
	border-top: 1px solid #ddd;
	text-align: center;

	.total-price {
		font-size: 1.4rem;
		font-weight: bold;
		color: #222;
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
