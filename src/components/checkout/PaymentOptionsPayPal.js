// src/components/checkout/PaymentOptionsPayPal.jsx
import React from "react";
import styled from "styled-components";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";

/**
 * Drop-in replacement for your existing PaymentOptions component.
 * Props kept identical to your current usage in CheckoutContent/DesktopCheckout.
 */
export default function PaymentOptionsPayPal({
	hotelDetails,
	chosenLanguage,
	t,
	depositAmount, // kept for compatibility; not used for 15% math
	total_price_with_commission,
	selectedPaymentOption,
	setSelectedPaymentOption,
	overallAverageCommissionRate,
	totalRoomsPricePerNight,
	fromPage,
	createUncompletedDocument,
	convertedAmounts = {}, // NEW: show USD alongside SAR
}) {
	const isArabic = chosenLanguage === "Arabic";

	// NEW: Deposit is 15% of total
	const DEPOSIT_PERCENT = 0.15;
	const totalSar = Number(total_price_with_commission || 0);
	const totalUsd = Number(convertedAmounts?.totalUSD || 0);
	const depositSar15 = (totalSar * DEPOSIT_PERCENT).toFixed(2);
	const depositUsd15 = (totalUsd * DEPOSIT_PERCENT).toFixed(2);
	const fullSar = totalSar.toFixed(2);
	const fullUsd = totalUsd.toFixed(2);
	const hotelSar = (totalSar * 1.1).toFixed(2);
	const hotelUsd = (totalUsd * 1.1).toFixed(2);

	const handlePaymentOptionChange = (option) => {
		setSelectedPaymentOption(option);
		createUncompletedDocument?.(`User Selected ${option}`);
		ReactGA.event({
			category: "User Selected Payment Option",
			action: `User Selected ${option}`,
			label: `User Selected ${option}`,
		});
		ReactPixel.track("Selected Payment Option", {
			action: `User Selected ${option}`,
			page: fromPage || "checkout",
		});
	};

	return (
		<Wrapper>
			<h2>{isArabic ? "طريقة الدفع" : "Payment Option"}</h2>

			{/* Accept Deposit (15%) */}
			{hotelDetails?.guestPaymentAcceptance?.acceptDeposit && (
				<StyledOption
					selected={selectedPaymentOption === "acceptDeposit"}
					onClick={() => handlePaymentOptionChange("acceptDeposit")}
				>
					<input
						type='radio'
						readOnly
						checked={selectedPaymentOption === "acceptDeposit"}
					/>
					<label>
						{isArabic
							? "قبول دفع العربون (15%)"
							: "Accept Deposit Online (15%)"}
						<span>
							SAR {depositSar15} • USD {depositUsd15}
						</span>
						{/* {overallAverageCommissionRate ? (
							<small style={{ opacity: 0.85 }}>
								{isArabic ? "متوسط العمولة" : "Avg. commission"}:{" "}
								{overallAverageCommissionRate}%
							</small>
						) : null} */}
					</label>
				</StyledOption>
			)}

			{/* Pay Whole Amount */}
			{hotelDetails?.guestPaymentAcceptance?.acceptPayWholeAmount && (
				<StyledOption
					selected={selectedPaymentOption === "acceptPayWholeAmount"}
					onClick={() => handlePaymentOptionChange("acceptPayWholeAmount")}
				>
					<input
						type='radio'
						readOnly
						checked={selectedPaymentOption === "acceptPayWholeAmount"}
					/>
					<label>
						{isArabic ? "دفع مبلغ الحجز بالكامل" : "Pay Whole Amount Online"}
						<span>
							<s>
								SAR {(totalSar * 1.1).toFixed(2)} • USD{" "}
								{(totalUsd * 1.1).toFixed(2)}
							</s>{" "}
							SAR {fullSar} • USD {fullUsd}
						</span>
					</label>
				</StyledOption>
			)}

			{/* Reserve Now, Pay in Hotel (+10%) */}
			{hotelDetails?.guestPaymentAcceptance?.acceptReserveNowPayInHotel && (
				<StyledOption
					selected={selectedPaymentOption === "acceptReserveNowPayInHotel"}
					onClick={() =>
						handlePaymentOptionChange("acceptReserveNowPayInHotel")
					}
				>
					<input
						type='radio'
						readOnly
						checked={selectedPaymentOption === "acceptReserveNowPayInHotel"}
					/>
					<label>
						{isArabic
							? "الدفع عند الوصول بالفندق"
							: "Reserve Now, Pay in Hotel"}
						<span>
							SAR {hotelSar} • USD {hotelUsd}
						</span>
					</label>
				</StyledOption>
			)}
		</Wrapper>
	);
}

const Wrapper = styled.div`
	@media (max-width: 768px) {
		h2 {
			font-size: 1.4rem !important;
			font-weight: bold !important;
		}
	}
`;

const StyledOption = styled.div`
	display: flex;
	align-items: center;
	padding: 12px;
	border: 2px solid
		${({ selected }) => (selected ? "#9dffce" : "var(--border-color-light)")};
	background-color: ${({ selected }) =>
		selected ? "#d8ffeb" : "var(--accent-color-2)"};
	border-radius: 8px;
	margin-bottom: 8px;
	cursor: pointer;
	transition: var(--main-transition);

	input[type="radio"] {
		appearance: none;
		width: 20px;
		height: 20px;
		border: 2px solid var(--border-color-light);
		border-radius: 50%;
		margin-right: 15px;
		position: relative;
		cursor: pointer;
		outline: none;
		background-color: var(--accent-color-2);
		transition:
			background-color 0.3s ease,
			border-color 0.3s ease;
	}
	input[type="radio"]:checked {
		background-color: var(--text-color-dark);
		border-color: var(--text-color-dark);
	}

	label {
		font-size: 16px;
		font-weight: 500;
		color: var(--text-color-primary);
		display: flex;
		flex-direction: column;
	}

	span {
		font-weight: 700;
		font-size: 12.5px;
		color: var(--secondary-color-dark);
		margin-top: 5px;
	}

	@media (max-width: 768px) {
		padding: 10px 10px;
		input[type="radio"] {
			width: 18px;
			height: 18px;
			margin-right: 10px;
		}
	}
`;
