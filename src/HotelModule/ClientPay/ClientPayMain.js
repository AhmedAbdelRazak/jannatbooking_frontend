import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useCartContext } from "../../cart_context";
import {
	currecyConversion,
	getBraintreeClientToken,
	processPayment,
	singlePreReservationById,
} from "../apiAdmin";
import { isAuthenticated } from "../../auth";
import { toast } from "react-toastify";
import PaymentForm from "./PaymentForm";

const ClientPayMain = () => {
	const [reservation, setReservation] = useState("");
	const [currency, setCurrency] = useState("");
	const [paymentStatus, setPaymentStatus] = useState(false);
	const [data, setData] = useState({
		loading: true,
		success: false,
		clientToken: null,
		error: "",
		instance: {},
	});

	// Use useParams hook to get the route parameters
	const params = useParams();
	// eslint-disable-next-line
	const { chosenLanguage } = useCartContext();
	// Destructure the parameters for easier access
	const { reservationId } = params;

	const { token } = isAuthenticated();

	const gettingSingleReservation = () => {
		setData({ ...data, loading: true });

		singlePreReservationById(reservationId).then((data) => {
			if (data && data.error) {
				console.log(data.error, "getting single reservation");
			} else {
				setReservation(data);
				console.log(
					Number(
						Number(data.total_amount) * 0.02 + Number(data.total_amount)
					).toFixed(2),
					"The currency"
				);
				currecyConversion(
					Number(
						Number(data.total_amount) * 0.02 + Number(data.total_amount)
					).toFixed(2)
				).then((data2) => {
					if (data2 && data2.error) {
						console.log("Error converting money");
					} else {
						setCurrency(data2);

						getBraintreeClientToken(token).then((data3) => {
							if (data3.error) {
								setData({ ...data3, error: data3.error });
							} else {
								setData({ ...data3, clientToken: data3.clientToken });
								setData({ ...data3, loading: false });
							}
						});
					}
				});
			}
		});
	};

	useEffect(() => {
		gettingSingleReservation();
		// eslint-disable-next-line
	}, [paymentStatus]);

	console.log(currency, "cu");

	const buy = () => {
		data.instance
			.requestPaymentMethod()
			.then((data) => {
				const nonce = data.nonce;
				const paymentData = {
					paymentMethodNonce: nonce,
					amount: currency.amountInUSD,
					email: reservation?.customer_details.email,
					customerId: reservation?._id,
					planId: "One Time Payment",
					country: reservation?.customer_details.nationality,
					hotelName: reservation?.hotelId.hotelName,
				};

				return processPayment(reservation._id, paymentData);
			})
			.then((response) => {
				// Directly check for a successful transaction indicator from your backend response
				if (
					response.message ===
					"Payment processed and reservation updated successfully."
				) {
					toast.success(
						"You have successfully subscribed to our platform share"
					);
					setPaymentStatus(true); // Update state to reflect payment status
				} else {
					// If response does not indicate success, handle as a failed payment
					toast.error(
						"Not Paid, Maybe insufficient credit, Please try another card"
					);
				}
			})
			.catch((error) => {
				// Handle errors from both requestPaymentMethod and processPayment
				console.error("Payment processing error: ", error);
				setData({ loading: false, error: error.message });
				toast.error(
					"An error occurred during payment processing. Please try again."
				);
			});
	};

	// Render the component with the data
	return (
		<ClientPayMainWrapper className='container my-4'>
			<h2>
				Checkout Details For{" "}
				{reservation &&
					reservation.hotelId &&
					reservation.hotelId.hotelName.toUpperCase()}
			</h2>
			<h3>
				Confirmation Number: {reservation && reservation.confirmation_number}
			</h3>
			<div className='grid-container mt-3'>
				<div>
					<strong>Guest Name:</strong>{" "}
					{reservation && reservation.customer_details.name}
				</div>
				<div>
					<strong>Guest Phone:</strong>{" "}
					{reservation && reservation.customer_details.phone}
				</div>
				<div>
					<strong>Hotel Name:</strong>{" "}
					{reservation && reservation.hotelId && reservation.hotelId.hotelName}
				</div>

				<div>
					<strong>Booking Date:</strong>{" "}
					{reservation && new Date(reservation.booked_at).toDateString()}
				</div>
				<div>
					<strong>Check-in Date:</strong>{" "}
					{reservation && new Date(reservation.checkin_date).toDateString()}
				</div>
				<div>
					<strong>Check-out Date:</strong>{" "}
					{reservation && new Date(reservation.checkout_date).toDateString()}
				</div>
				<div>
					<strong>Room Type:</strong>{" "}
					{reservation &&
						reservation.pickedRoomsType &&
						reservation.pickedRoomsType.map((i) => i.room_type + ",")}
				</div>
				<div>
					<strong>Nights of Residence:</strong>{" "}
					{reservation && reservation.days_of_residence} Nights
				</div>
				<div>
					<strong>Total Guests:</strong>{" "}
					{reservation && reservation.total_guests}
				</div>
				<div className='total-amount'>
					<strong>Reservation Total Amount:</strong>{" "}
					{reservation && reservation.total_amount.toLocaleString()} SAR
				</div>
				<div className='total-amount'>
					<strong>Transaction Fee & Taxes (2%):</strong>{" "}
					{reservation &&
						Number(reservation.total_amount * 0.02).toLocaleString()}{" "}
					SAR
				</div>
				<div
					className='total-amount'
					style={{ color: "darkgreen", fontWeight: "bold" }}
				>
					<strong>Your Payment Total Amount:</strong>{" "}
					{reservation &&
						(
							reservation.total_amount * 0.02 +
							reservation.total_amount
						).toLocaleString()}{" "}
					SAR
				</div>
			</div>
			{paymentStatus ||
			(reservation &&
				reservation.payment_details &&
				reservation.payment_details.transactionId) ? (
				<div className='my-4'>
					<h2 style={{ fontSize: "1.6rem" }}>Thank you for your payment</h2>
					<h4 style={{ fontSize: "1.3rem" }}>
						You should receive a confirmation email of your payment shortly
					</h4>
					<h4
						style={{
							fontSize: "1.6rem",
							color: "goldenrod",
							fontWeight: "bold",
						}}
					>
						Looking Forward to seeing you on{" "}
						{new Date(reservation.checkin_date).toDateString()}!
					</h4>
				</div>
			) : (
				<div>
					<PaymentForm
						setData={setData}
						data={data}
						buy={buy}
						user={reservation}
						token={token}
						language={chosenLanguage}
					/>
				</div>
			)}
		</ClientPayMainWrapper>
	);
};

export default ClientPayMain;

const ClientPayMainWrapper = styled.div`
	min-height: 780px;

	h2 {
		font-weight: bold;
		font-size: 1.4rem;
		text-transform: capitalize;
		text-align: center;
	}

	h3 {
		font-weight: bold;
		font-size: 1.2rem;
		text-transform: capitalize;
		color: darkred;
	}

	.grid-container {
		display: grid;
		grid-template-columns: repeat(3, 1fr); /* Aligns 3 items per row */
		grid-gap: 20px; /* Adjusts the gap between grid items */
		max-width: 100%;
	}

	.grid-container > div {
		max-width: 400px; /* Ensures each item does not exceed 75px width */
		word-wrap: break-word; /* Ensures text wraps within the confined width */
		border: 2px solid lightgray;
		padding: 10px;
		text-transform: capitalize;
	}

	.total-amount {
		grid-column: 1 / -1; /* Makes the total amount take up the full width */
		text-align: center;
		margin: auto;
		min-width: 500px !important; /* Ensures each item does not exceed 75px width */
		font-size: 1.5rem;
	}

	@media (max-width: 700px) {
		.grid-container {
			display: grid;
			grid-template-columns: repeat(2, 1fr); /* Aligns 3 items per row */
			grid-gap: 20px; /* Adjusts the gap between grid items */
			max-width: 100%;
		}
	}
`;
