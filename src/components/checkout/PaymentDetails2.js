import React from "react";
import styled from "styled-components";
import { Input, Button } from "antd";
import { UserOutlined, HomeOutlined } from "@ant-design/icons";
import AmericanExpress from "../../GeneralImages/AmericanExpress.png";
import MasterCard from "../../GeneralImages/MasterCard.png";
import VisaCard from "../../GeneralImages/VisaImage.png";
import CreditCard from "../../GeneralImages/CreditCard.png";
import ReactGA from "react-ga4";
import { usePaymentInputs } from "react-payment-inputs";
import images from "react-payment-inputs/images";

const PaymentDetails = ({
	cardHolderName,
	setCardHolderName,
	postalCode,
	setPostalCode,
	handleReservation,
	pricePerNight,
	pay10Percent,
	convertedAmounts,
	total_price_with_commission,
	depositAmount,
}) => {
	const {
		getCardNumberProps,
		getExpiryDateProps,
		getCVCProps,
		wrapperProps,
		meta,
	} = usePaymentInputs();

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

			{/* Card Number Input */}
			<InputGroup className='mt-4'>
				<label>Card Number</label>
				<CardInputWrapper {...wrapperProps}>
					<input {...getCardNumberProps()} placeholder='1234 5678 1234 5678' />
					{images && images.visa ? (
						<img alt='Card type' src={images.visa} />
					) : null}
				</CardInputWrapper>
				{meta.erroredInputs.cardNumber && <ErrorText>{meta.error}</ErrorText>}
			</InputGroup>

			<InputRow>
				{/* Expiry Date Input */}
				<InputGroup>
					<label>Expiry Date</label>
					<input {...getExpiryDateProps()} placeholder='MM/YY' />
					{meta.erroredInputs.expiryDate && <ErrorText>{meta.error}</ErrorText>}
				</InputGroup>

				{/* CVV Input */}
				<InputGroup>
					<label>CVV</label>
					<input {...getCVCProps()} placeholder='CVC' />
					{meta.erroredInputs.cvc && <ErrorText>{meta.error}</ErrorText>}
				</InputGroup>
			</InputRow>

			{/* Name on Card Input */}
			<InputGroup className=''>
				<StyledInput
					prefix={<UserOutlined />}
					placeholder='Name on Card'
					value={cardHolderName}
					onChange={(e) => setCardHolderName(e.target.value)}
				/>
			</InputGroup>

			{/* Postal Code Input */}
			<InputGroup className='my-2'>
				<StyledInput
					prefix={<HomeOutlined />}
					placeholder='Postal Code'
					value={postalCode}
					onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))} // Allow digits only
					maxLength={6}
				/>
			</InputGroup>

			<PriceWrapper>
				{pricePerNight ? <h4>{pricePerNight} SAR per night</h4> : null}

				{pay10Percent ? (
					<>
						<h4>Total Amount: {Number(depositAmount).toFixed(2)} SAR</h4>
						<h4>
							Total Amount in USD: $
							{Number(convertedAmounts.depositUSD).toFixed(2)}
						</h4>
					</>
				) : (
					<h4>
						Total Amount: {Number(total_price_with_commission).toFixed(2)} SAR
						<h4>
							Total Amount in USD: $
							{Number(convertedAmounts.totalUSD).toFixed(2)}
						</h4>
					</h4>
				)}
			</PriceWrapper>

			<SubmitButton
				type='primary'
				onClick={() => {
					ReactGA.event({
						category: "User Checkedout and Paid",
						action: "User Checkedout and Paid",
						label: `User Checkedout and Paid`,
					});

					handleReservation();
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
			font-size: 0.95rem;
			margin-bottom: 0px;
		}

		label {
			font-size: 0.8rem;
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
	margin-bottom: 20px;
`;

const InputRow = styled.div`
	display: flex;
	gap: 10px;
`;

const CardInputWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;

	input {
		flex: 1;
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 5px;
	}
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
	font-weight: bold;
	font-size: 1.1rem;
	cursor: pointer;
`;

const ErrorText = styled.span`
	color: red;
	font-size: 0.8rem;
`;
