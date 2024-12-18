import React, { useState } from "react";
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
import ReactGA from "react-ga4";

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
	convertedAmounts,
	total_price_with_commission,
	depositAmount,
}) => {
	const [errors, setErrors] = useState({});

	// Real-time card number formatting and validation
	const handleCardNumberChange = (e) => {
		const inputValue = e.target.value.replace(/\D/g, ""); // Remove non-digits
		const formattedValue = inputValue.replace(/(\d{4})(?=\d)/g, "$1 ");
		setCardNumber(formattedValue);
		if (inputValue.length < 16) {
			setErrors({ ...errors, cardNumber: "Card number must be 16 digits" });
		} else {
			setErrors({ ...errors, cardNumber: "" });
		}
	};

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
		console.log(value, "value");
	};

	const handleCvvChange = (e) => {
		const value = e.target.value.replace(/\D/g, "").slice(0, 3);
		setCvv(value);
		if (value.length < 3) {
			setErrors({ ...errors, cvv: "CVV must be 3 digits" });
		} else {
			setErrors({ ...errors, cvv: "" });
		}
	};

	const validateForm = () => {
		const newErrors = {};

		// Card number validation (ensure 16 digits)
		if (cardNumber.replace(/\s/g, "").length < 16)
			newErrors.cardNumber = "Invalid card number";

		// Expiry date validation (MM/YYYY)
		if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(expiryDate))
			newErrors.expiryDate = "Invalid expiry date (MM/YYYY)";

		// CVV validation (ensure at least 3 digits)
		if (cvv.length < 3) newErrors.cvv = "Invalid CVV";

		// Cardholder name validation
		if (!cardHolderName) newErrors.cardHolderName = "Name is required";

		setErrors(newErrors);

		// If no errors, proceed to handle reservation

		if (Object.keys(newErrors).length === 0) handleReservation();
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

			{/* Card Number */}
			<InputGroup>
				<StyledInput
					prefix={<CreditCardOutlined />}
					placeholder='1234 5678 1234 5678'
					value={cardNumber}
					onChange={handleCardNumberChange}
					autoComplete='cc-number'
					inputMode='numeric'
					maxLength={19}
				/>
				{errors.cardNumber && <ErrorText>{errors.cardNumber}</ErrorText>}
			</InputGroup>

			{/* Expiry Date and CVV */}
			<InputRow>
				<StyledInput
					prefix={<CalendarOutlined />}
					placeholder='MM/YYYY'
					value={expiryDate}
					onChange={handleExpiryDateChange}
					autoComplete='cc-exp'
					inputMode='numeric'
					maxLength={7} // Updated to allow "MM/YYYY" (7 characters total)
				/>
				<StyledInput
					prefix={<LockOutlined />}
					placeholder='CVV'
					value={cvv}
					onChange={handleCvvChange}
					autoComplete='cc-csc'
					inputMode='numeric'
					maxLength={3}
				/>
			</InputRow>
			{errors.expiryDate && <ErrorText>{errors.expiryDate}</ErrorText>}
			{errors.cvv && <ErrorText>{errors.cvv}</ErrorText>}

			{/* Name on Card */}
			<InputGroup className='mt-3'>
				<StyledInput
					prefix={<UserOutlined />}
					placeholder='Name on Card'
					value={cardHolderName}
					onChange={(e) => setCardHolderName(e.target.value)}
					autoComplete='cc-name'
				/>
				{errors.cardHolderName && (
					<ErrorText>{errors.cardHolderName}</ErrorText>
				)}
			</InputGroup>

			{/* Postal Code */}
			<InputGroup>
				<StyledInput
					prefix={<HomeOutlined />}
					placeholder='Postal Code'
					value={postalCode}
					onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
					maxLength={6}
				/>
			</InputGroup>

			{/* Price Section */}
			<PriceWrapper>
				{pricePerNight && <h4>{pricePerNight} SAR per night</h4>}
				{pay10Percent ? (
					<>
						<h4>Total Amount: {Number(depositAmount).toFixed(2)} SAR</h4>
						<h4>
							Total Amount in USD: $
							{Number(convertedAmounts.depositUSD).toFixed(2)}
						</h4>
					</>
				) : (
					<>
						<h4>
							Total Amount: {Number(total_price_with_commission).toFixed(2)} SAR
						</h4>
						<h4>
							Total Amount in USD: $
							{Number(convertedAmounts.totalUSD).toFixed(2)}
						</h4>
					</>
				)}
			</PriceWrapper>

			{/* Submit Button */}
			<SubmitButton
				type='primary'
				onClick={() => {
					ReactGA.event({
						category: "User Checkedout and Paid",
						action: "User Checkedout and Paid",
						label: `User Checkedout and Paid`,
					});
					validateForm();
				}}
			>
				Reserve Now
			</SubmitButton>
		</PaymentWrapper>
	);
};

export default PaymentDetails;

// Styled Components
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
			font-size: 0.95rem;
			margin-bottom: 0px;
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
			height: 20px; /* Adjust size for smaller screens */
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

const ErrorText = styled.span`
	color: red;
	font-weight: bold;
	font-size: 0.8rem;
`;
