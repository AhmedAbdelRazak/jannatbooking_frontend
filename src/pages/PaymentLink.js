import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { Checkbox, message } from "antd";
import {
	gettingSingleReservationById,
	updateReservationDetailsClient,
} from "../apiCore";
import PaymentDetails from "../components/checkout/PaymentDetails";
import { useCartContext } from "../cart_context";
import { currencyConversion } from "../apiCore"; // Import the currency conversion function
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import {
	// eslint-disable-next-line
	translations,
} from "../Assets";

const PaymentLink = () => {
	const { reservationId } = useParams(); // Get reservationId from the route
	const [reservationData, setReservationData] = useState(null);
	const [convertedAmounts, setConvertedAmounts] = useState({
		depositUSD: null,
		totalUSD: null,
	}); // Added for currency conversion // State for converted amounts
	const [loading, setLoading] = useState(true);
	const [cardNumber, setCardNumber] = useState("");
	const [expiryDate, setExpiryDate] = useState("");
	const [cvv, setCvv] = useState("");
	const [cardHolderName, setCardHolderName] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [guestAgreedOnTermsAndConditions, setGuestAgreedOnTermsAndConditions] =
		useState(false);
	const [selectedPaymentOption, setSelectedPaymentOption] =
		useState("acceptDeposit");
	const { chosenLanguage } = useCartContext();

	const t = translations[chosenLanguage] || translations.English;
	// Fetch the reservation data when the component mounts
	useEffect(() => {
		window.scrollTo({ top: 20, behavior: "smooth" });
		const fetchReservation = async () => {
			try {
				const data = await gettingSingleReservationById(reservationId);
				if (data) {
					setReservationData(data);

					// Dynamically calculate converted amounts
					const { total_amount, commission } = data;
					const amounts = [commission, total_amount];
					const conversions = await currencyConversion(amounts);
					setConvertedAmounts({
						depositUSD: Number(conversions[0]?.amountInUSD.toFixed(2)) || 0,
						totalUSD: Number(conversions[1]?.amountInUSD.toFixed(2)) || 0,
					});
				} else {
					console.error("Failed to fetch reservation data");
				}
			} catch (error) {
				console.error("Error fetching reservation:", error);
			} finally {
				setLoading(false);
			}
		};

		if (reservationId) {
			fetchReservation();
		}
	}, [reservationId]);

	const handleReservationUpdate = async () => {
		if (!reservationData || !convertedAmounts) {
			console.error("Reservation data or converted amounts are missing");
			return;
		}

		if (!guestAgreedOnTermsAndConditions) {
			message.error(
				"You must accept the Terms & Conditions before proceeding."
			);
			return;
		}

		let payment = "Not Paid";
		let commissionPaid = false;
		let commission = 0;
		let depositAmount = reservationData.commission || 0;
		let paid_amount = 0;
		let adjustedTotalAmount = reservationData.total_amount; // Default total amount

		if (selectedPaymentOption === "acceptDeposit") {
			payment = "Deposit Paid";
			commissionPaid = true;
			commission = depositAmount;
			paid_amount = depositAmount;
		} else if (selectedPaymentOption === "acceptPayWholeAmount") {
			payment = "Paid Online";
			commissionPaid = true;
			commission = depositAmount;
			paid_amount = adjustedTotalAmount;
		} else if (selectedPaymentOption === "acceptReserveNowPayInHotel") {
			payment = "Not Paid";
			commissionPaid = false;
			commission = depositAmount;
			adjustedTotalAmount *= 1.1; // Increase total by 10%
			paid_amount = 0; // No payment made upfront
		}

		const paymentDetails = {
			cardNumber,
			cardExpiryDate: expiryDate,
			cardCVV: cvv,
			cardHolderName,
			amount:
				selectedPaymentOption === "acceptDeposit"
					? convertedAmounts.depositUSD // Use deposit amount in USD
					: selectedPaymentOption === "acceptPayWholeAmount"
						? convertedAmounts.totalUSD // Use total amount in USD
						: 0, // No upfront payment for "acceptReserveNowPayInHotel"
		};

		// Prepare the updated data
		const updatedData = {
			customer_details: {
				cardNumber,
				cardExpiryDate: expiryDate,
				cardCVV: cvv,
				cardHolderName,
			},
			payment,
			convertedAmounts,
			paid_amount,
			commissionPaid,
			commission,
			paymentDetails,
			guestAgreedOnTermsAndConditions: guestAgreedOnTermsAndConditions,
		};

		try {
			const response = await updateReservationDetailsClient(
				reservationId,
				updatedData
			);
			if (response?.success) {
				message.success("Successful Payment");
				setTimeout(() => {
					window.location.reload(false);
				}, 2000);
				console.log("Reservation updated successfully");
				// Add success handling (e.g., redirect or show a message)
			} else {
				console.error("Failed to update reservation", response?.message);
			}
		} catch (error) {
			console.error("Error updating reservation:", error);
		}
	};

	const handlePaymentOptionChange = (option) => {
		setSelectedPaymentOption(option);

		// Google Analytics Event Tracking
		ReactGA.event({
			category: "User Selected Payment Option From Link",
			action: `User Selected ${option} From Link`,
			label: `User Selected ${option} From Link`,
		});

		// Facebook Pixel Tracking
		ReactPixel.track(`Selected Payment Option From Link`, {
			action: `User Selected ${option} From Link`,
			page: "generatedLink",
		});
	};

	return (
		<PaymentLinkWrapper
			className='container'
			dir={chosenLanguage === "Arabic" ? "rtl" : ""}
		>
			{loading ? (
				<div>Loading...</div>
			) : reservationData && convertedAmounts ? (
				<div>
					<h2>Reservation Details</h2>
					<p>
						<strong>Hotel Name:</strong> {reservationData.hotelId?.hotelName}
					</p>
					<p>
						<strong>Confirmation Number:</strong>{" "}
						{reservationData.confirmation_number}
					</p>
					<p>
						<strong>Guest Name:</strong>{" "}
						{reservationData.customer_details?.name}
					</p>
					<p>
						<strong>Email:</strong> {reservationData.customer_details?.email}
					</p>
					<p>
						<strong>Nationality:</strong>{" "}
						{reservationData.customer_details?.nationality}
					</p>
					<p>
						<strong>Total Amount:</strong> {reservationData.total_amount} SAR
					</p>
					<p>
						<strong>Check-in Date:</strong>{" "}
						{new Date(reservationData.checkin_date).toLocaleDateString()}
					</p>
					<p>
						<strong>Check-out Date:</strong>{" "}
						{new Date(reservationData.checkout_date).toLocaleDateString()}
					</p>

					<TermsWrapper
						selected={guestAgreedOnTermsAndConditions}
						onClick={() => {
							setGuestAgreedOnTermsAndConditions(
								!guestAgreedOnTermsAndConditions
							);
							ReactGA.event({
								category: "User Accepted Terms And Cond From Email Link",
								action: "User Accepted Terms And Cond From Email Link",
								label: `User Accepted Terms And Cond From Email Link`,
							});

							ReactPixel.track("Terms And Conditions Accepted From Link", {
								action: "User Accepted Terms And Conditions Accepted From Link",
								page: "Email Link",
							});
						}}
					>
						<Checkbox
							isChecked={guestAgreedOnTermsAndConditions}
							checked={guestAgreedOnTermsAndConditions}
							onChange={(e) => {
								setGuestAgreedOnTermsAndConditions(e.target.checked);
								ReactGA.event({
									category: "User Accepted Terms And Cond",
									action: "User Accepted Terms And Cond",
									label: `User Accepted Terms And Cond`,
								});

								ReactPixel.track("Terms And Conditions Accepted", {
									action: "User Accepted Terms And Conditions Accepted",
									page: "checkout",
								});
							}}
						>
							{t.acceptTerms}
						</Checkbox>
					</TermsWrapper>

					{reservationData &&
						reservationData.hotelId &&
						reservationData.hotelId.guestPaymentAcceptance.acceptDeposit && (
							<TermsWrapper>
								<Checkbox
									checked={selectedPaymentOption === "acceptDeposit"}
									onChange={() => handlePaymentOptionChange("acceptDeposit")}
								>
									{chosenLanguage === "Arabic"
										? "قبول دفع العربون"
										: "Accept Deposit Online"}{" "}
									<span style={{ fontWeight: "bold", fontSize: "12.5px" }}>
										SAR {reservationData.commission}
									</span>{" "}
								</Checkbox>
								{/* Note about the amount due */}
							</TermsWrapper>
						)}

					{/* Pay Whole Amount Option */}
					{reservationData &&
						reservationData.hotelId &&
						reservationData.hotelId.guestPaymentAcceptance
							.acceptPayWholeAmount && (
							<TermsWrapper>
								<Checkbox
									checked={selectedPaymentOption === "acceptPayWholeAmount"}
									onChange={() =>
										handlePaymentOptionChange("acceptPayWholeAmount")
									}
								>
									{chosenLanguage === "Arabic"
										? "دفع المبلغ الإجمالي"
										: "Pay Whole Amount Online"}{" "}
									<span style={{ fontWeight: "bold", fontSize: "12.5px" }}>
										SAR {Number(reservationData.total_amount).toFixed(2)}
									</span>{" "}
								</Checkbox>
							</TermsWrapper>
						)}

					{reservationData.payment === "deposit paid" ||
					reservationData.payment === "paid online" ? (
						<div className='my-4 text-center'>
							<h3 dir='ltr' style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
								Thank you for your payment{" "}
								{reservationData.customer_details.name}!
							</h3>
						</div>
					) : (
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
							handleReservation={handleReservationUpdate}
							nationality={reservationData.customer_details?.nationality || ""}
							total={reservationData.total_amount - reservationData.commission}
							total_price_with_commission={reservationData.total_amount}
							depositAmount={reservationData.commission || 0}
							selectedPaymentOption={selectedPaymentOption}
							setSelectedPaymentOption={setSelectedPaymentOption}
							convertedAmounts={convertedAmounts}
							chosenLanguage={chosenLanguage}
							guestAgreedOnTermsAndConditions={guestAgreedOnTermsAndConditions}
						/>
					)}
				</div>
			) : (
				<div>No reservation found</div>
			)}
		</PaymentLinkWrapper>
	);
};

export default PaymentLink;

const PaymentLinkWrapper = styled.div`
	min-height: 700px;
	padding: 20px;
	font-family: Arial, sans-serif;

	h2 {
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

	@media (max-width: 1000px) {
		margin-top: 100px;
	}
`;

const TermsWrapper = styled.div`
	margin: 5px auto;
	font-size: 1rem;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	background-color: #363636;
	padding: 10px;
	width: 50%;

	.ant-checkbox-wrapper {
		margin-left: 10px;
		color: white !important;
		font-weight: bold;
	}

	@media (max-width: 1000px) {
		width: 100%;
	}
`;
