import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useLocation, useHistory } from "react-router-dom";
import axios from "axios";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import { authenticate, isAuthenticated, signin } from "../auth";
import { message } from "antd";
import { useCartContext } from "../cart_context";

const VerificationPage = () => {
	// States
	const [loading, setLoading] = useState(true);
	const [reservationData, setReservationData] = useState(null);
	const [error, setError] = useState(null);
	const { user } = isAuthenticated();
	const { clearRoomCart } = useCartContext();

	// Hooks
	const location = useLocation();
	const history = useHistory();

	// Get token from the URL
	const searchParams = new URLSearchParams(location.search);
	const token = searchParams.get("token");

	useEffect(() => {
		if (window.innerWidth > 768) {
			window.scrollTo({ top: 50, behavior: "smooth" });
		} else {
			window.scrollTo({ top: 5, behavior: "smooth" });
		}
	}, []);

	// Simulate a minimum 3-second loading time
	const MINIMUM_LOADING_TIME = 4000;

	useEffect(() => {
		if (token) {
			// Start the minimum loading timer
			const timer = setTimeout(() => setLoading(false), MINIMUM_LOADING_TIME);

			// Fetch reservation data
			const fetchReservationData = async () => {
				try {
					const response = await axios.post(
						`${process.env.REACT_APP_API_URL}/paypal/reservation-verification`,
						{ token }
					);

					if (response.data) {
						setReservationData(response.data.data2); // Populate reservation data
					} else {
						setError("Failed to fetch reservation details.");
					}

					clearTimeout(timer); // Ensure timer is cleared
					setLoading(false); // Stop loading
				} catch (err) {
					console.error("Error verifying reservation:", err);
					setError(
						err.response?.data?.message ||
							"Failed to verify reservation. Please try again."
					);
					clearTimeout(timer);
					setLoading(false);
				}
			};

			fetchReservationData();
		} else {
			setError("Invalid or missing token.");
			setLoading(false);
		}
	}, [token]);

	// Handle redirect to confirmation page
	useEffect(() => {
		let signedIn = user && user.name; // Prevent infinite loop

		if (!loading && reservationData) {
			(async () => {
				try {
					// Step 1: Sign in the user

					if (!signedIn) {
						const signInResponse = await signin({
							emailOrPhone: reservationData.customerDetails.phone,
							password: reservationData.customerDetails.password,
						});

						if (signInResponse.error) {
							console.error("Failed to sign in the user automatically.");
							message.error(
								"Failed to sign in automatically after reservation confirmation."
							);
							return;
						}

						// Authenticate the user
						authenticate(signInResponse, () => {
							console.log("User signed in successfully.");
						});
					}

					// Step 2: Add ReactGA and ReactPixel events
					message.success("Reservation created successfully");
					ReactGA.event({
						category: "User Reservation Confirmed",
						action: "User Confirmed Reservation Without Payment",
						label: `Reservation Confirmed Without Payment`,
					});

					ReactPixel.track("Reservation Confirmed Without Payment", {
						action: "Reservation Confirmed",
						page: "verification",
					});

					// Step 3: Clear the room cart
					clearRoomCart();

					// Step 4: Construct query params
					const queryParams = new URLSearchParams();
					queryParams.append(
						"name",
						reservationData.customerDetails.name || "Guest"
					);
					queryParams.append("total_price", reservationData.total_amount || 0);
					queryParams.append("total_rooms", reservationData.total_rooms || 0);
					queryParams.append("hotel_name", reservationData.hotelName || "N/A");

					// Add each room's details to the query
					reservationData?.pickedRoomsType?.forEach((room, index) => {
						queryParams.append(
							`room_display_name_${index}`,
							room.displayName || "N/A"
						);
						queryParams.append(`room_type_${index}`, room.room_type || "N/A");
						queryParams.append(
							`nights_${index}`,
							reservationData.days_of_residence || 0
						);
						queryParams.append(
							`checkin_date_${index}`,
							reservationData.checkin_date || ""
						);
						queryParams.append(
							`checkout_date_${index}`,
							reservationData.checkout_date || ""
						);
					});

					// Step 5: Redirect after 2 seconds
					setTimeout(() => {
						history.push(`/reservation-confirmed?${queryParams.toString()}`);
					}, 2000);

					signedIn = true; // Mark as completed
				} catch (error) {
					console.error(
						"An error occurred during the verification process:",
						error
					);
					message.error(
						"An error occurred during the verification process. Please try again."
					);
				}
			})();
		}
		// eslint-disable-next-line
	}, [loading, reservationData, history]);

	// Render the loader while loading
	if (loading) {
		return (
			<VerificationPageWrapper>
				<LoaderWrapper>
					<Spinner />
					<p>Verifying your reservation, please wait...</p>
				</LoaderWrapper>
			</VerificationPageWrapper>
		);
	}

	// Render error message if any
	if (error) {
		return (
			<VerificationPageWrapper>
				<ErrorWrapper>{error}</ErrorWrapper>
			</VerificationPageWrapper>
		);
	}

	// Buffering page (shown before redirect)
	return (
		<VerificationPageWrapper>
			<LoaderWrapper>
				<Spinner />
				<p>Your reservation is verified! Redirecting to confirmation page...</p>
			</LoaderWrapper>
		</VerificationPageWrapper>
	);
};

export default VerificationPage;

// Styled Components

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const VerificationPageWrapper = styled.div`
	min-height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: #f9f9f9;
	padding: 20px;
`;

const LoaderWrapper = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;

	p {
		margin-top: 20px;
		font-size: 1.2rem;
		color: #555;
		text-align: center;
		max-width: 90%;
	}
`;

const Spinner = styled.div`
	width: 60px;
	height: 60px;
	border: 6px solid #f3f3f3;
	border-top: 6px solid #3498db; /* Blue color */
	border-radius: 50%;
	animation: ${spin} 1s linear infinite;
`;

const ErrorWrapper = styled.div`
	color: red;
	font-size: 1.5rem;
	text-align: center;
	padding: 20px;

	@media (max-width: 768px) {
		font-size: 1.2rem;
	}
`;
