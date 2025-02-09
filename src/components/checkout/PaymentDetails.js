import React, { useState, useEffect } from "react";
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
import { useCartContext } from "../../cart_context";

const translations = {
	English: {
		cardNumberError: "Card number must be 16 digits",
		invalidCardNumber: "Invalid card number",
		expiryDateError: "Invalid expiry date (MM/YYYY)",
		cvvError: "CVV must be 3 digits",
		cardHolderNameError: "Name is required",
		postalCodeRequired: "Postal code is required for this country.",
		postalCodeLengthError: "Postal code must be at least 2 characters long.",
		mustAgreeAndSelectOption:
			"Please agree on terms and conditions and choose a payment option",
	},
	Arabic: {
		cardNumberError: "رقم البطاقة يجب أن يكون 16 رقما",
		invalidCardNumber: "رقم البطاقة غير صالح",
		expiryDateError: "تاريخ الانتهاء غير صالح (MM/YYYY)",
		cvvError: "يجب أن يتكون CVV من 3 أرقام",
		cardHolderNameError: "الاسم مطلوب",
		postalCodeRequired: "الرمز البريدي مطلوب لهذه الدولة.",
		postalCodeLengthError:
			"يجب أن يكون الرمز البريدي مكونًا من 2 أحرف على الأقل.",
		mustAgreeAndSelectOption:
			"الرجاء الموافقة على الشروط والأحكام واختيار طريقة الدفع",
	},
};

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
	nationality,
	pricePerNight,
	total,
	pay10Percent,
	convertedAmounts,
	total_price_with_commission,
	depositAmount,
	selectedPaymentOption,
	guestAgreedOnTermsAndConditions,
	setPaymentClicked,
	paymentClicked,
	createUncompletedDocument,
}) => {
	const [errors, setErrors] = useState({});
	const [requirementsError, setRequirementsError] = useState("");
	const { chosenLanguage } = useCartContext();

	// ——— Arrays of countries with postal codes ———
	const westernCountriesWithPostal = [
		"US",
		"CA",
		"UK",
		"AU",
		"DE",
		"IT",
		"FR",
		"ES",
		"NL",
		"SE",
		"NO",
		"FI",
		"CH",
		"BE",
		"AT",
		"DK",
		"IE",
		"PT",
		"GR",
		"PL",
		"CZ",
		"HU",
		"SK",
		"HR",
	];
	const nonWesternCountriesWithPostal = ["SA", "AE", "KW", "OM", "BH", "QA"];

	// 1) Should we SHOW the postal code input?
	const showPostalCodeInput =
		westernCountriesWithPostal.includes(nationality) ||
		nonWesternCountriesWithPostal.includes(nationality);

	// 2) Is postal code required? (only for Western countries)
	const postalCodeIsRequired = westernCountriesWithPostal.includes(nationality);

	// If user's country is in neither array, hide field & force "0000"
	useEffect(() => {
		if (!showPostalCodeInput) {
			setPostalCode("0000");
		}
		// eslint-disable-next-line
	}, [nationality]);

	// ---------- Handlers ----------
	const handleCardNumberChange = (e) => {
		const inputValue = e.target.value.replace(/\D/g, "");
		const formattedValue = inputValue.replace(/(\d{4})(?=\d)/g, "$1 ");
		setCardNumber(formattedValue);

		if (inputValue.length < 16) {
			setErrors((prev) => ({
				...prev,
				cardNumber: "Card number must be 16 digits",
			}));
		} else {
			setErrors((prev) => ({ ...prev, cardNumber: "" }));
		}
	};

	const handleExpiryDateChange = (e) => {
		let value = e.target.value.replace(/\D/g, "");
		if (value.length === 1 && value !== "0" && value !== "1") {
			value = "0" + value;
		}
		if (value.length >= 2) {
			value = value.slice(0, 2) + "/" + value.slice(2, 6);
		}
		setExpiryDate(value);
	};

	const handleCvvChange = (e) => {
		const val = e.target.value.replace(/\D/g, "").slice(0, 3);
		setCvv(val);
		if (val.length < 3) {
			setErrors((prev) => ({ ...prev, cvv: "CVV must be 3 digits" }));
		} else {
			setErrors((prev) => ({ ...prev, cvv: "" }));
		}
	};

	// Validate form
	const validateForm = () => {
		const newErrors = {};
		const t = translations[chosenLanguage] || translations.English;

		// Card number
		if (cardNumber.replace(/\s/g, "").length < 16) {
			newErrors.cardNumber = t.cardNumberError;
		}
		// Expiry date => MM/YYYY
		if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(expiryDate)) {
			newErrors.expiryDate = t.expiryDateError;
		}
		// CVV => exactly 3 digits
		if (cvv.length < 3) {
			newErrors.cvv = t.cvvError;
		}
		// Name => required
		if (!cardHolderName) {
			newErrors.cardHolderName = t.cardHolderNameError;
		}
		// Postal code => required if western country
		if (postalCodeIsRequired) {
			if (!postalCode) {
				newErrors.postalCode = t.postalCodeRequired;
			} else if (postalCode.length < 2) {
				newErrors.postalCode = t.postalCodeLengthError;
			}
		}

		setErrors(newErrors);

		// If no errors, proceed
		if (Object.keys(newErrors).length === 0) {
			// If user is in nonWestern list & typed nothing, default to "0000"
			if (nonWesternCountriesWithPostal.includes(nationality) && !postalCode) {
				setPostalCode("0000");
				// Wait a moment so state updates
				setTimeout(() => handleReservation(), 0);
			} else {
				handleReservation();
			}
		}
	};

	// Check if T&C + payment option
	const handleClickReserve = () => {
		const t = translations[chosenLanguage] || translations.English;
		if (!guestAgreedOnTermsAndConditions || !selectedPaymentOption) {
			createUncompletedDocument("User Didn't Accept User Terms and Conditions");
			setRequirementsError(t.mustAgreeAndSelectOption);
			setPaymentClicked(false);
		} else {
			setRequirementsError("");
			validateForm();
		}
	};

	return (
		<PaymentWrapper dir='ltr'>
			<TitleWrapper className='my-2'>
				<h3>Payment Details</h3>
				<CardIcons>
					<img src={VisaCard} alt='Visa' />
					<img src={MasterCard} alt='MasterCard' />
					<img src={AmericanExpress} alt='American Express' />
					<img src={CreditCard} alt='Credit Card' />
				</CardIcons>
			</TitleWrapper>

			<form autoComplete='on'>
				{/* Card Number */}
				<InputGroup>
					{/* Hidden input with raw (no spaces) card number */}
					<input
						type='text'
						name='ccnumber'
						autoComplete='cc-number'
						value={cardNumber.replace(/\s/g, "")}
						style={{ display: "none" }}
						readOnly
					/>
					<StyledInput
						prefix={<CreditCardOutlined />}
						placeholder='1234 5678 1234 5678'
						value={cardNumber}
						onChange={handleCardNumberChange}
						autoComplete='off'
						inputMode='numeric'
						maxLength={19}
						name='ccnumber_visible'
					/>
					{errors.cardNumber && <ErrorText>{errors.cardNumber}</ErrorText>}
				</InputGroup>

				{/* Expiry & CVV */}
				<InputRow>
					<StyledInput
						prefix={<CalendarOutlined />}
						placeholder='MM/YYYY'
						value={expiryDate}
						onChange={handleExpiryDateChange}
						autoComplete='cc-exp'
						inputMode='numeric'
						name='ccexp'
						maxLength={7}
					/>
					<StyledInput
						prefix={<LockOutlined />}
						placeholder='CVV'
						value={cvv}
						onChange={handleCvvChange}
						autoComplete='cc-csc'
						name='cvc'
						inputMode='numeric'
						maxLength={3}
					/>
				</InputRow>
				{errors.expiryDate && <ErrorText>{errors.expiryDate}</ErrorText>}
				{errors.cvv && <ErrorText>{errors.cvv}</ErrorText>}

				{/* Name on card */}
				<InputGroup className='mt-3'>
					<StyledInput
						prefix={<UserOutlined />}
						placeholder='Name on Card'
						value={cardHolderName}
						onChange={(e) => setCardHolderName(e.target.value)}
						autoComplete='cc-name'
						name='ccname'
					/>
					{errors.cardHolderName && (
						<ErrorText>{errors.cardHolderName}</ErrorText>
					)}
				</InputGroup>

				{/* Postal Code (conditionally) */}
				{showPostalCodeInput && (
					<InputGroup>
						<StyledInput
							prefix={<HomeOutlined />}
							placeholder='Postal Code'
							value={postalCode}
							onChange={(e) => setPostalCode(e.target.value)}
							maxLength={10}
							name='postal-code'
							autoComplete='postal-code'
						/>
						{errors.postalCode && <ErrorText>{errors.postalCode}</ErrorText>}
					</InputGroup>
				)}

				{/* Price Info */}
				<PriceWrapper>
					{selectedPaymentOption === "acceptDeposit" && (
						<h4>
							Total Deposit Amount: $
							{convertedAmounts.totalRoomsPricePerNightUSD
								? Number(Number(convertedAmounts.depositUSD)).toFixed(2)
								: Number(Number(convertedAmounts.depositUSD)).toFixed(2)}
						</h4>
					)}
					{selectedPaymentOption === "acceptPayWholeAmount" && (
						<h4>
							Total Amount in USD: $
							{Number(convertedAmounts.totalUSD).toFixed(2)}
						</h4>
					)}
					{selectedPaymentOption === "acceptReserveNowPayInHotel" && (
						<h4>
							Pay at Hotel: {Number(total_price_with_commission).toFixed(2)} SAR
						</h4>
					)}
				</PriceWrapper>

				{/* Reserve Button */}
				<SubmitButton
					type='primary'
					onClick={handleClickReserve}
					disabled={!guestAgreedOnTermsAndConditions || !selectedPaymentOption}
				>
					Reserve Now
				</SubmitButton>

				{/* If user didn't choose payment option or accept terms */}
				{requirementsError && <ErrorText>{requirementsError}</ErrorText>}
			</form>
		</PaymentWrapper>
	);
};

export default PaymentDetails;

// ----------------- Styled Components -----------------
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
	margin-bottom: 20px; /* spacing between inputs */
`;

const InputRow = styled.div`
	display: flex;
	gap: 10px; /* spacing between expiry + CVV */
`;

const StyledInput = styled(Input)`
	width: 100%;
	padding: 10px;
	border-radius: 5px;
`;

const PriceWrapper = styled.div`
	margin: 10px auto;

	h4 {
		font-size: 1.1rem;
		color: #555;
		font-weight: bold;
		margin-bottom: 0.7rem;
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
	align-items: center;
	font-weight: bold;
	font-size: 1.1rem;
	cursor: pointer;
`;

const ErrorText = styled.span`
	color: red;
	font-weight: bold;
	font-size: 0.85rem;
	display: block;
	margin-top: 6px;
`;
