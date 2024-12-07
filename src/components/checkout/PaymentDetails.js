import React from "react";
import styled from "styled-components";
import { Input, Button } from "antd";
import {
	CreditCardOutlined,
	CalendarOutlined,
	LockOutlined,
	UserOutlined,
	HomeOutlined,
} from "@ant-design/icons";
import AmericanExpress from "../../GeneralImages/AmericanExpress.png";
import MasterCard from "../../GeneralImages/MasterCard.png";
import VisaCard from "../../GeneralImages/VisaImage.png";
import CreditCard from "../../GeneralImages/CreditCard.png";
import axios from "axios";

const PaymentDetails = ({
	cardNumber,
	setCardNumber,
	expiryDate,
	setExpiryDate,
	cvv,
	setCvv,
	cardHolderName,
	setCardHolderName,
	postalCode,
	setPostalCode,
	handleReservation,
	pricePerNight,
	total,
	pay10Percent,
	total_price_with_commission,
}) => {
	// Handle card number input with formatting
	const handleCardNumberChange = (e) => {
		const inputValue = e.target.value.replace(/\D/g, ""); // Remove non-digit characters
		const formattedValue = inputValue.replace(/(\d{4})(?=\d)/g, "$1 "); // Add space after every 4 digits
		setCardNumber(formattedValue);
	};

	// Handle expiry date input with automatic formatting
	const handleExpiryDateChange = (e) => {
		let value = e.target.value.replace(/\D/g, ""); // Remove all non-digits

		// Add leading zero for months 1-9
		if (value.length === 1 && value !== "0" && value !== "1") {
			value = "0" + value;
		}

		// Ensure slash remains at the right position
		if (value.length >= 2) {
			value = value.slice(0, 2) + "/" + value.slice(2, 6); // Add slash after month and allow 4 digits for year
		}

		setExpiryDate(value);
	};

	// Prevent auto-fill warning
	const handleFocus = (e) => {
		e.target.setAttribute("autocomplete", "off");
	};

	const handlePayment = async () => {
		try {
			// Gather payment details
			const paymentData = {
				amount: pay10Percent
					? Number(total * 0.1).toFixed(2)
					: Number(total_price_with_commission).toFixed(2),
				cardNumber: cardNumber.replace(/\s/g, ""), // Remove spaces from the card number
				expirationDate: expiryDate.replace("/", ""), // Format as MMYY
				cardCode: cvv,
				cardHolderName,
			};

			// Validate fields
			if (
				!paymentData.cardNumber ||
				!paymentData.expirationDate ||
				!paymentData.cardCode
			) {
				alert("Please fill in all required payment fields.");
				return;
			}

			// Call backend API
			const response = await axios.post(
				`${process.env.REACT_APP_API_URL}/create-payment`,
				paymentData
			);

			if (response.data.success) {
				alert(
					`Payment successful! Transaction ID: ${response.data.transactionId}`
				);
				// Proceed to finalize reservation
			} else {
				alert(`Payment failed: ${response.data.message}`);
			}
		} catch (error) {
			console.error("Payment processing error:", error);
			alert("An error occurred during payment processing.");
		}
	};

	return (
		<PaymentWrapper>
			<TitleWrapper>
				<h3>Payment Details</h3>
				<CardIcons>
					<img src={VisaCard} alt='Visa' />
					<img src={MasterCard} alt='MasterCard' />
					<img src={AmericanExpress} alt='American Express' />
					<img src={CreditCard} alt='Credit Card' />
				</CardIcons>
			</TitleWrapper>

			<InputGroup className='my-2'>
				<StyledInput
					prefix={<CreditCardOutlined />}
					placeholder='1234 5678 1234 5678'
					value={cardNumber}
					onChange={handleCardNumberChange}
					onFocus={handleFocus} // Prevent auto-fill warning
					maxLength={19} // 16 digits + 3 spaces
				/>
			</InputGroup>

			<InputRow>
				<StyledInput
					prefix={<CalendarOutlined />}
					placeholder='MM/YYYY'
					value={expiryDate}
					onChange={handleExpiryDateChange}
					maxLength={10} // Allow 10 characters (MM/YYYY format with slash and full year)
					onFocus={handleFocus} // Prevent auto-fill warning
				/>
				<StyledInput
					prefix={<LockOutlined />}
					placeholder='CVV e.g. 325'
					value={cvv}
					onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))} // Allow digits only
					maxLength={3}
					onFocus={handleFocus} // Prevent auto-fill warning
				/>
			</InputRow>

			<InputGroup className='my-2'>
				<StyledInput
					prefix={<UserOutlined />}
					placeholder='Name on Card'
					value={cardHolderName}
					onChange={(e) => setCardHolderName(e.target.value)}
					onFocus={handleFocus} // Prevent auto-fill warning
				/>
			</InputGroup>

			<InputGroup className='my-2'>
				<StyledInput
					prefix={<HomeOutlined />}
					placeholder='Postal Code'
					value={postalCode}
					onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))} // Allow digits only
					maxLength={6}
					onFocus={handleFocus} // Prevent auto-fill warning
				/>
			</InputGroup>
			<PriceWrapper>
				{pricePerNight ? <h4>{pricePerNight} SAR per night</h4> : null}

				{pay10Percent ? (
					<h4>Total Amount: SAR {Number(total * 0.1).toFixed(2)}</h4>
				) : (
					<h4>
						Total Amount: SAR {Number(total_price_with_commission).toFixed(2)}
					</h4>
				)}
			</PriceWrapper>

			<SubmitButton
				type='primary'
				// onClick={() => {
				// 	handleReservation();
				// }}
				onClick={() => {
					handlePayment();
				}}
			>
				Reserve Now
			</SubmitButton>
		</PaymentWrapper>
	);
};

export default PaymentDetails;

// Styled Components
const PaymentWrapper = styled.div`
	background: #f9f9f9;
	padding: 20px;
	border-radius: 10px;
	box-shadow: var(--box-shadow-light);
	max-width: 800px;
	margin: 0 auto;
	text-align: left;
	margin-top: 20px;

	h3 {
		font-size: 1.6rem;
		font-weight: bold;
		margin-bottom: 20px;
	}

	@media (max-width: 700px) {
		h3 {
			font-size: 1.1rem;
		}
	}
`;

const TitleWrapper = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const CardIcons = styled.div`
	display: flex;
	gap: 20px;

	img {
		height: 25px;
		width: auto;
		object-fit: contain;
	}

	@media (max-width: 768px) {
		img {
			height: 24px; /* Adjust size for smaller screens */
		}
	}
`;

const InputGroup = styled.div`
	margin-bottom: 20px; /* Consistent spacing between input fields */
`;

const InputRow = styled.div`
	display: flex;
	gap: 10px; /* Even gaps between fields */
`;

const StyledInput = styled(Input)`
	width: 100%;
	padding: 10px;
	border-radius: 5px;
`;

const PriceWrapper = styled.div`
	margin: 10px auto;

	h3 {
		font-size: 1.2rem;
	}
	h4 {
		font-size: 1.1rem;
		color: #555;
		font-weight: bold;
	}
`;

const SubmitButton = styled(Button)`
	width: 100%;
	background: var(--primary-color);
	color: white;
	padding: 12px 0;
	border-radius: 5px;
	display: flex;
	justify-content: center;
	align-items: center; /* Center the text vertically and horizontally */
	font-weight: bold;
	font-size: 1.1rem;
	cursor: pointer;
`;
