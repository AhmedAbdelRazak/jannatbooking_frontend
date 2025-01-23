import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { gettingSingleReservationById, triggerPaymentClient } from "../apiCore";
import { useCartContext } from "../cart_context";
import { toast } from "react-toastify"; // Ensure you've installed react-toastify

const ClientPaymentTriggering = () => {
	const { reservationId, amountInSAR } = useParams();
	const { chosenLanguage } = useCartContext(); // Ensure user and token are provided in context

	// Reservation + Payment logic states
	const [reservationData, setReservationData] = useState(null);
	const [loading, setLoading] = useState(true);

	// Extract exchange rates from localStorage
	const [exchangeRateUSD, setExchangeRateUSD] = useState(0.26666667);
	const [exchangeRateEUR, setExchangeRateEUR] = useState(0.25597836);

	// Additional state variables for payment validation
	const [isCaptured, setIsCaptured] = useState(false);
	const [remainingAmount, setRemainingAmount] = useState(0);

	// New State to Track Payment Status
	const [paymentCompleted, setPaymentCompleted] = useState(false);

	// Extract exchange rates on mount
	useEffect(() => {
		const rates = JSON.parse(localStorage.getItem("rate"));
		if (rates) {
			setExchangeRateUSD(rates.SAR_USD || 0.26666667);
			setExchangeRateEUR(rates.SAR_EUR || 0.25597836);
		}
	}, []);

	// Check Payment Status on Mount
	useEffect(() => {
		const clientPaid = localStorage.getItem("clientPaid") === "true";
		const storedAmountInSAR = localStorage.getItem("paymentAmountInSAR");

		if (clientPaid && storedAmountInSAR === amountInSAR) {
			setPaymentCompleted(true);
		}
	}, [amountInSAR]);

	// Fetch reservation on mount
	useEffect(() => {
		const fetchReservation = async () => {
			try {
				const data = await gettingSingleReservationById(reservationId);
				if (data) {
					setReservationData(data);
					// Determine if payment is captured and calculate remaining amount
					setIsCaptured(data.paymentStatus === "captured"); // Adjust based on your data structure
					setRemainingAmount(
						Number(data.total_amount) - Number(data.paid_amount)
					);
				}
			} catch (error) {
				console.error("Error fetching reservation:", error);
				toast.error("Failed to fetch reservation details.");
			} finally {
				setLoading(false);
			}
		};

		if (reservationId) {
			fetchReservation();
			window.scrollTo({ top: 20, behavior: "smooth" });
		}
	}, [reservationId]);

	// Handle Payment Trigger
	const handlePayment = async () => {
		// 1. Compute final amounts in USD & SAR based on exchange rates
		const { finalUSD, finalSAR } = getDerivedAmounts();

		// 2. Define default payment option since user does not select any
		const selectedOption = "fullAmount"; // Assuming 'fullAmount' as the default option
		const customAmountUSD = null; // No custom amount since there's no selection

		// 3. Prevent Overcharging if payment is already captured
		if (isCaptured && Number(finalSAR) > remainingAmount) {
			toast.error("You can't overcharge the guest. Please try another amount.");
			return;
		}

		try {
			setLoading(true);
			const response = await triggerPaymentClient(
				"", // User ID
				"", // Authentication token
				reservationId, // Reservation ID
				finalUSD, // Amount in USD
				selectedOption, // Payment option
				customAmountUSD, // Custom amount (null in this case)
				finalSAR // Amount in SAR
			);
			if (response.message === "Payment captured successfully.") {
				toast.success("Payment processed successfully!");

				// **Store Payment Status in LocalStorage**
				localStorage.setItem("clientPaid", "true");
				localStorage.setItem("paymentAmountInSAR", amountInSAR); // Store exact value

				setTimeout(() => {
					window.location.reload(false);
				}, 1500);
			} else {
				toast.error(response.message || "Payment failed. Please try again.");

				setTimeout(() => {
					window.location.reload(false);
				}, 1500);
			}
		} catch (error) {
			console.error("Error processing payment:", error);
			toast.error("An error occurred while processing the payment.");
		} finally {
			setLoading(false);
		}
	};

	// Compute derived amounts
	const getDerivedAmounts = () => {
		return {
			finalUSD: Number(amountInSAR * exchangeRateUSD).toFixed(2),
			finalEUR: Number(amountInSAR * exchangeRateEUR).toFixed(2),
			finalSAR: Number(amountInSAR).toFixed(2),
		};
	};

	const { finalUSD, finalEUR, finalSAR } = getDerivedAmounts();

	// Render Loading or No Reservation Found
	if (loading) return <Loader>Loading...</Loader>;
	if (!reservationData)
		return <NoReservation>No reservation found.</NoReservation>;

	return (
		<ClientPaymentTriggeringWrapper
			className='container'
			dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
		>
			<h2>Reservation Details</h2>
			<DetailSection>
				<p>
					<strong>Hotel Name:</strong> {reservationData.hotelId?.hotelName}
				</p>
				<p>
					<strong>Confirmation Number:</strong>{" "}
					{reservationData.confirmation_number}
				</p>
				<p>
					<strong>Guest Name:</strong> {reservationData.customer_details?.name}
				</p>
				<p>
					<strong>Email:</strong> {reservationData.customer_details?.email}
				</p>
				<p>
					<strong>Phone:</strong> {reservationData.customer_details?.phone}
				</p>
				<p>
					<strong>Nationality:</strong>{" "}
					{reservationData.customer_details?.nationality}
				</p>
				<p>
					<strong>Total Amount:</strong> {reservationData.total_amount} SAR
				</p>
				<p>
					<strong>Paid Amount:</strong> {reservationData.paid_amount} SAR
				</p>
				<p>
					<strong>Remaining Amount:</strong>{" "}
					{(reservationData.total_amount - reservationData.paid_amount).toFixed(
						2
					)}{" "}
					SAR
				</p>
			</DetailSection>

			<h3>Room Details</h3>
			{reservationData.pickedRoomsType &&
			reservationData.pickedRoomsType.length > 0 ? (
				<RoomDetails>
					<table>
						<thead>
							<tr>
								<th>Hotel</th>
								<th>Room</th>
								<th>Qty</th>
								<th>Extras</th>
								<th>Nights</th>
								<th>Rate (SAR)</th>
								<th>Total (SAR)</th>
							</tr>
						</thead>
						<tbody>
							{reservationData.pickedRoomsType.map((room, index) => (
								<tr key={index}>
									<td>{reservationData.hotelId?.hotelName}</td>
									<td>{room.displayName}</td>
									<td>{room.count}</td>
									<td>N/A</td>
									<td>{reservationData.days_of_residence}</td>
									<td>{Number(room.chosenPrice).toFixed(2)}</td>
									<td>
										{(
											Number(room.chosenPrice) *
											Number(room.count) *
											Number(reservationData.days_of_residence)
										).toFixed(2)}{" "}
										SAR
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</RoomDetails>
			) : (
				<p>No room details available.</p>
			)}

			<h3>Payment Details</h3>
			<PaymentDetails>
				<p>
					<strong>Amount Due:</strong> {finalSAR} SAR
				</p>
				<p>
					<strong>Converted Amount:</strong> {finalUSD} USD / {finalEUR} EUR
				</p>
				<p>
					<strong>Card:</strong> {reservationData.customer_details?.cardNumber}
				</p>
				<p>
					<strong>Expiry:</strong>{" "}
					{reservationData.customer_details?.cardExpiryDate}
				</p>
			</PaymentDetails>

			{/* **Conditional Rendering Based on Payment Status** */}
			{paymentCompleted ? (
				<ThankYouMessage>
					<h3>Thank You!</h3>
					<p>Thank you for your payment and choosing Jannat Booking.</p>
				</ThankYouMessage>
			) : (
				<Button onClick={handlePayment} disabled={loading}>
					{loading ? "Processing Payment..." : "Proceed to Payment"}
				</Button>
			)}
		</ClientPaymentTriggeringWrapper>
	);
};

export default ClientPaymentTriggering;

/* ------------- Styled Components ------------- */
const ClientPaymentTriggeringWrapper = styled.div`
	min-height: 700px;
	padding: 20px;
	font-family: Arial, sans-serif;
	background-color: #f9f9f9;

	h2,
	h3 {
		color: #333;
		margin-bottom: 20px;
		font-weight: bold;
	}

	p {
		margin: 5px 0;
		line-height: 1.6;
		text-transform: capitalize;
	}

	strong {
		color: #555;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 20px;
	}

	table th,
	table td {
		border: 1px solid #ddd;
		padding: 8px;
		text-align: center;
	}

	table th {
		background-color: #f2f2f2;
		color: #333;
	}

	table tr:nth-child(even) {
		background-color: #f9f9f9;
	}

	table tr:hover {
		background-color: #ddd;
	}

	@media (max-width: 768px) {
		padding: 10px;
		margin-top: 120px;

		table,
		th,
		td {
			font-size: 12px;
		}

		h2,
		h3 {
			font-size: 1.5em;
		}

		p {
			font-size: 0.9em;
		}
	}
`;

const DetailSection = styled.div`
	background-color: #fff;
	padding: 15px;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	margin-bottom: 20px;

	p {
		margin: 8px 0;
	}
`;

const RoomDetails = styled.div`
	background-color: #fff;
	padding: 15px;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	margin-bottom: 20px;

	table {
		margin-top: 10px;
	}
`;

const PaymentDetails = styled.div`
	background-color: #fff;
	padding: 15px;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	margin-bottom: 20px;

	p {
		margin: 8px 0;
	}
`;

const Button = styled.button`
	width: 100%;
	background-color: #28a745;
	color: white;
	padding: 15px 0;
	border: none;
	border-radius: 5px;
	cursor: pointer;
	font-size: 1.1em;
	font-weight: bold;
	transition: background-color 0.3s ease;

	&:hover {
		background-color: #218838;
	}

	&:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}
`;

/* **New Styled Component: ThankYouMessage** */
const ThankYouMessage = styled.div`
	text-align: center;
	padding: 20px;
	border: 1px solid #28a745;
	border-radius: 10px;
	background-color: #e6ffe6;
	color: #155724;
	box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);

	h3 {
		margin-bottom: 10px;
		font-size: 1.5em;
	}

	p {
		font-size: 1.2em;
	}
`;

const Loader = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
	font-size: 1.5em;
	color: #555;
`;

const NoReservation = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
	font-size: 1.5em;
	color: #555;
`;
