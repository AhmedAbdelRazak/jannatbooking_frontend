import React, { useEffect } from "react";
import styled from "styled-components";
import { useLocation } from "react-router-dom";

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
	const name = searchParams.get("name");
	const totalPrice = searchParams.get("total_price");
	const totalRooms = searchParams.get("total_rooms");
	const hotelName = searchParams.get("hotel_name_0"); // Hotel name for the first room
	const checkinDate = searchParams.get("checkin_date_0"); // Check-in date for the first room
	const checkoutDate = searchParams.get("checkout_date_0"); // Check-out date for the first room
	const nights = searchParams.get("nights_0"); // Nights for the first room

	// Extract room details for multiple rooms
	const rooms = [];
	for (let i = 0; i < totalRooms; i++) {
		const room = {
			roomType: searchParams.get(`room_type_${i}`),
			roomDisplayName: searchParams.get(`room_display_name_${i}`),
		};
		rooms.push(room);
	}

	return (
		<ConfirmationPageWrapper>
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
								<strong>Total Price:</strong> {totalPrice} SAR
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
