import React, { useEffect } from "react";
import styled from "styled-components";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";

const ConfirmationPage = () => {
	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);

	useEffect(() => {
		if (window.innerWidth > 768) {
			// Only scroll to top if the screen width is larger than 768px (tablet or larger)
			window.scrollTo({ top: 50, behavior: "smooth" });
		} else {
			window.scrollTo({ top: 5, behavior: "smooth" });
		}
	}, []); // Empty dependency array to run on mount

	// Extracting general reservation details
	const name = searchParams.get("name") || "Guest";
	const totalPrice = parseFloat(searchParams.get("total_price")) || 0.0;
	const totalRooms = parseInt(searchParams.get("total_rooms"), 10) || 0;
	const hotelName =
		searchParams.get("hotel_name") ||
		searchParams.get("hotel_name_0") ||
		"Unknown Hotel";
	const checkinDate =
		searchParams.get("checkin_date") ||
		searchParams.get("checkin_date_0") ||
		"Unknown Date";
	const checkoutDate =
		searchParams.get("checkout_date") ||
		searchParams.get("checkout_date_0") ||
		"Unknown Date";
	const nights =
		parseInt(searchParams.get("nights"), 10) ||
		parseInt(searchParams.get("nights_0"), 10) ||
		1;

	// Extract room details for multiple rooms (supporting both parameter formats)
	const rooms = [];
	for (let i = 1; i <= totalRooms; i++) {
		const room = {
			roomType:
				searchParams.get(`room_type${i}`) ||
				searchParams.get(`room_type_${i - 1}`) ||
				"Unknown Type",
			roomDisplayName:
				searchParams.get(`room_display_name${i}`) ||
				searchParams.get(`room_display_name_${i - 1}`) ||
				"No Name Specified",
			pricePerNight:
				parseFloat(
					searchParams.get(`price_per_night${i}`) ||
						searchParams.get(`price_per_night_${i - 1}`)
				) ||
				parseFloat((totalPrice / nights / totalRooms).toFixed(2)) || // Fallback calculation
				0.0,
			roomCount:
				parseInt(searchParams.get(`room_count${i}`), 10) ||
				parseInt(searchParams.get(`room_count_${i - 1}`), 10) ||
				1,
		};
		rooms.push(room);
	}

	// Handle cases where total_rooms might be 1 but no incremented room details are present
	if (totalRooms === 1 && rooms.length === 0) {
		const singleRoom = {
			roomType:
				searchParams.get("room_type") ||
				searchParams.get("room_type_0") ||
				"Unknown Type",
			roomDisplayName:
				searchParams.get("room_display_name") ||
				searchParams.get("room_display_name_0") ||
				"No Name Specified",
			pricePerNight:
				parseFloat(searchParams.get("price_per_night")) ||
				parseFloat((totalPrice / nights).toFixed(2)) || // Fallback calculation
				0.0,
			roomCount: parseInt(searchParams.get("room_count"), 10) || 1,
		};
		rooms.push(singleRoom);
	}

	return (
		<ConfirmationPageWrapper>
			<Helmet>
				<title>Booking Confirmation | Jannat Booking</title>
				<meta
					name='description'
					content={`Thank you, ${name}! Your booking at ${hotelName} is confirmed. Check-in: ${checkinDate}, Check-out: ${checkoutDate}. Total price: ${totalPrice} SAR.`}
				/>
				<meta
					name='keywords'
					content='Jannat Booking, booking confirmation, Haj hotel booking, Omrah hotel reservations, pilgrimage hotels, confirmed booking, check-in, check-out'
				/>
				<meta
					property='og:title'
					content='Booking Confirmation | Jannat Booking'
				/>
				<meta
					property='og:description'
					content={`Your stay at ${hotelName} is confirmed! Check-in: ${checkinDate}, Check-out: ${checkoutDate}, for ${nights} nights. Total price: ${totalPrice} SAR.`}
				/>
				<meta
					property='og:url'
					content='https://jannatbooking.com/reservation-confirmed'
				/>
				<meta property='og:type' content='website' />
				<link
					rel='canonical'
					href='https://jannatbooking.com/reservation-confirmed'
				/>
			</Helmet>
			<MessageWrapper>
				<h2>Reservation Confirmed!</h2>
				<p style={{ color: "darkgreen" }}>
					Thank you, <strong>{name}</strong>! Your reservation has been
					confirmed.
				</p>

				{/* Display hotel name and check-in/check-out/nights once */}
				<ReservationDetails>
					<div className='grid-container'>
						<div className='grid-item'>
							<p>
								<strong>Hotel:</strong> {hotelName}
							</p>
						</div>
					</div>
					<div className='grid-container checkin-checkout'>
						<div className='grid-item'>
							<p>
								<strong>Check-in:</strong> {checkinDate}
							</p>
						</div>
						<div className='grid-item'>
							<p>
								<strong>Check-out:</strong> {checkoutDate}
							</p>
						</div>
						<div className='grid-item'>
							<p>
								<strong>Nights:</strong> {nights}
							</p>
						</div>
					</div>

					{/* Loop through each room and display its details */}
					{rooms.map((room, index) => (
						<RoomDetails key={index}>
							<div className='grid-container'>
								<div className='grid-item'>
									<p>
										<strong>Room Type:</strong> {room.roomType}
									</p>
								</div>
								<div className='grid-item'>
									<p>
										<strong>Room Name:</strong> {room.roomDisplayName}
									</p>
								</div>
								<div className='grid-item'>
									<p>
										<strong>Price per Night:</strong> {room.pricePerNight} SAR
									</p>
								</div>
								<div className='grid-item'>
									<p>
										<strong>Room Count:</strong> {room.roomCount}
									</p>
								</div>
							</div>
						</RoomDetails>
					))}

					<div className='grid-container'>
						<div className='grid-item'>
							<p>
								<strong>Total Rooms:</strong> {totalRooms}
							</p>
						</div>
						<div className='grid-item total-price'>
							<p>
								<strong>Total Price:</strong> {totalPrice.toFixed(2)} SAR
							</p>
						</div>
					</div>
				</ReservationDetails>

				<ButtonWrapper>
					<button onClick={() => (window.location.href = "/dashboard")}>
						Go to Dashboard
					</button>
				</ButtonWrapper>
			</MessageWrapper>
		</ConfirmationPageWrapper>
	);
};

export default ConfirmationPage;

const ConfirmationPageWrapper = styled.div`
	min-height: 75vh;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: var(--neutral-light);
	padding: 20px;

	p {
		font-size: 0.95rem !important;
	}

	@media (max-width: 768px) {
		padding: 10px;
		margin-top: 100px;
	}
`;

const MessageWrapper = styled.div`
	padding: 40px;
	background-color: var(--mainWhite);
	color: var(--text-color-dark);
	border-radius: 12px;
	box-shadow: var(--box-shadow-dark);
	text-align: center;
	max-width: 1200px; /* Increase the max width for larger screens */
	width: 100%;

	h2 {
		margin-bottom: 20px;
		color: var(--darkGrey);
		font-size: 2rem;
		text-transform: capitalize !important;
	}

	p {
		margin: 10px 0;
		font-size: 1.2rem;
		color: var(--text-color-dark);
		text-transform: capitalize !important;
	}

	@media (max-width: 768px) {
		padding: 20px;
		h2 {
			font-size: 1.6rem;
			margin-bottom: 5px !important;
		}
		p {
			font-size: 1rem;
			margin: 5px 0;
		}
	}
`;

const ReservationDetails = styled.div`
	margin-top: 20px;

	.grid-container {
		display: flex;
		justify-content: space-between;
		margin-bottom: 10px;

		.grid-item {
			flex: 1;
			text-align: left;
			margin: 0 10px;
			font-size: 1.1rem;
			color: var(--primary-color-light);
		}

		@media (max-width: 768px) {
			flex-direction: column;
			align-items: center;

			.grid-item {
				margin-bottom: 5px;
				text-align: center;
			}
		}
	}

	.checkin-checkout {
		@media (min-width: 769px) {
			display: flex;
			justify-content: space-between;
			width: 100%;
		}
	}

	@media (max-width: 768px) {
		p {
			font-size: 1rem;
		}
	}

	.total-price {
		color: var(--secondary-color-dark); /* Highlight the total price */
		font-size: 1.3rem;
		font-weight: bold;
	}
`;

const RoomDetails = styled.div`
	margin-bottom: 5px; /* Reduced space between rooms */
	p {
		font-size: 16px;
	}
`;

const ButtonWrapper = styled.div`
	margin-top: 30px;

	button {
		background-color: var(--accent-color-3-dark); /* Darker greenish tone */
		color: var(--mainWhite);
		padding: 12px 25px;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1.1rem;
		transition: var(--main-transition);

		&:hover {
			background-color: var(
				--accent-color-3-light
			); /* Slightly lighter green */
		}

		@media (max-width: 768px) {
			padding: 10px 20px;
			font-size: 1rem;
		}
	}
`;
