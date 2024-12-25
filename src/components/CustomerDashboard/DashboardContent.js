import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Tabs, Collapse } from "antd";
import { CaretRightOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { gettingUserAndReservationData } from "../../apiCore";
import { isAuthenticated } from "../../auth";
import UpdateAccount from "./UpdateAccount";

const { TabPane } = Tabs;
const { Panel } = Collapse;

const DashboardContent = () => {
	const { user } = isAuthenticated();
	const userId = user ? user._id : null; // Extract userId to use as a stable dependency
	const [reservations, setReservations] = useState([]);

	useEffect(() => {
		if (!userId) return; // Prevent fetching if userId is not available

		window.scrollTo({ top: 8, behavior: "smooth" });
		const fetchData = async () => {
			try {
				const data = await gettingUserAndReservationData(userId);
				if (data && data.reservations) {
					setReservations(data.reservations);
				}
			} catch (error) {
				console.error("Error fetching reservation data:", error);
			}
		};

		fetchData();
	}, [userId]); // Use `userId` instead of `user`

	return (
		<DashboardWrapper>
			<Tabs defaultActiveKey='reservations' centered>
				<TabPane tab='Reservations' key='reservations'>
					<ReservationSummary reservations={reservations} />
				</TabPane>
				<TabPane tab='Update Account' key='update-account'>
					<UpdateAccount />
				</TabPane>
			</Tabs>
		</DashboardWrapper>
	);
};

const ReservationSummary = ({ reservations }) => {
	console.log(reservations, "reservations");

	return (
		<ReservationSummaryWrapper>
			<h2>Your Reservations</h2>
			{reservations.length > 0 ? (
				reservations.map((reservation, index) => (
					<ReservationCard key={reservation._id || index}>
						<h3>Confirmation Number: {reservation.confirmation_number}</h3>
						<p>
							<strong>Hotel Name:</strong> {reservation.hotelId.hotelName}
						</p>
						<p>
							<strong>Customer Name:</strong>{" "}
							{reservation.customer_details.name}
						</p>
						<p>
							<strong>Check-in Date:</strong>{" "}
							{new Date(reservation.checkin_date).toDateString()}
						</p>
						<p>
							<strong>Check-out Date:</strong>{" "}
							{new Date(reservation.checkout_date).toDateString()}
						</p>
						<p>
							<strong>Number of Nights:</strong> {reservation.days_of_residence}
						</p>
						<p>
							<strong>Total Amount:</strong> {reservation.total_amount}{" "}
							{reservation.currency.toUpperCase()}
						</p>
						<p>
							<strong>Paid Amount:</strong> {reservation.paid_amount}{" "}
							{reservation.currency.toUpperCase()}
						</p>
						<p>
							<strong>Amount Due:</strong>{" "}
							{Number(
								Number(reservation.total_amount) -
									Number(reservation.paid_amount)
							).toFixed(2)}{" "}
							{reservation.currency.toUpperCase()}
						</p>

						{reservation.pickedRoomsType.map((room, roomIndex) => (
							<RoomDetailsWrapper key={roomIndex}>
								<RoomImage
									src={room.image || "/default-room.jpg"}
									alt={room.displayName}
								/>
								<h4>{room.displayName}</h4>
								<p>
									<strong>Room Type:</strong> {room.room_type}
								</p>
								<p>
									<strong>Price per Night:</strong> {room.chosenPrice} SAR
								</p>
								<p>
									<strong>Number of Rooms:</strong> {room.count}
								</p>

								<Collapse
									accordion
									expandIcon={({ isActive }) => (
										<CaretRightOutlined rotate={isActive ? 90 : 0} />
									)}
								>
									<Panel
										header={
											<PriceDetailsHeader>
												<InfoCircleOutlined /> Price Breakdown by Day
											</PriceDetailsHeader>
										}
										key='1'
									>
										<PricingList>
											{room.pricingByDay && room.pricingByDay.length > 0 ? (
												room.pricingByDay.map(
													({ date, totalPriceWithCommission }, dayIndex) => (
														<li key={dayIndex}>
															{date}: {totalPriceWithCommission} SAR
														</li>
													)
												)
											) : (
												<li>No price breakdown available</li>
											)}
										</PricingList>
									</Panel>
								</Collapse>
							</RoomDetailsWrapper>
						))}
					</ReservationCard>
				))
			) : (
				<NoReservationsMessage>No reservations found.</NoReservationsMessage>
			)}
		</ReservationSummaryWrapper>
	);
};

export default DashboardContent;

// Styled Components
const DashboardWrapper = styled.div`
	padding: 20px;
	background-color: var(--neutral-light);
	border-radius: 10px;
	box-shadow: var(--box-shadow-dark);
	max-width: 1200px;
	margin: 20px auto;
	text-align: center;

	.ant-tabs-tab-btn {
		font-size: 1.5rem !important;
		font-weight: bolder;
	}

	h2 {
		margin-bottom: 20px;
		color: var(--darkGrey);
	}

	@media (max-width: 768px) {
		padding: 15px;
		margin-top: 120px;
		h2 {
			font-size: 1.5rem;
		}

		.ant-tabs-tab-btn {
			font-size: 1rem !important;
			font-weight: bolder;
		}
	}
`;

const ReservationSummaryWrapper = styled.div`
	padding: 20px;
	background-color: var(--neutral-light);
	border-radius: 10px;
	box-shadow: var(--box-shadow-dark);
	margin: 20px auto;
	max-width: 1200px;
	text-align: center;
	text-transform: capitalize;

	h2 {
		margin-bottom: 20px;
		color: var(--darkGrey);
	}

	@media (max-width: 768px) {
		padding: 15px;
		margin-top: 20px;
		h2 {
			font-size: 1.5rem;
		}
	}
`;

const ReservationCard = styled.div`
	background-color: var(--mainWhite);
	padding: 15px;
	margin-bottom: 20px;
	border-radius: 8px;
	box-shadow: var(--box-shadow-light);
	text-align: left;

	h3 {
		font-size: 1.2rem;
		margin-bottom: 10px;
		color: var(--primary-color-light);
	}

	p {
		margin: 5px 0;
		font-size: 1rem;
		color: var(--text-color-dark);
	}

	@media (max-width: 768px) {
		padding: 10px;
		p {
			font-size: 0.9rem;
		}
	}
`;

const RoomDetailsWrapper = styled.div`
	margin-top: 15px;
	padding: 10px;
	border-top: 1px solid #ddd;

	h4 {
		font-size: 1.1rem;
		color: var(--primary-color-light);
		margin-bottom: 10px;
	}

	p {
		font-size: 0.95rem;
		margin: 3px 0;
	}

	@media (max-width: 768px) {
		p {
			font-size: 0.85rem;
		}
	}
`;

const RoomImage = styled.img`
	width: 100%;
	max-width: 300px;
	height: 200px;
	border-radius: 8px;
	margin-bottom: 10px;
	object-fit: cover;
`;

const PriceDetailsHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	color: var(--primary-color);
`;

const PricingList = styled.ul`
	list-style-type: none;
	padding: 0;
	margin-top: 10px;
	li {
		margin: 5px 0;
	}
`;

const NoReservationsMessage = styled.p`
	color: var(--secondary-color-dark);
	font-size: 1.2rem;
	font-weight: bold;
`;
