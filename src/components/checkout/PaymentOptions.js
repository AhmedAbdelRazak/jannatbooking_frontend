import React from "react";
import { Checkbox } from "antd";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import styled from "styled-components";

const PaymentOptions = ({
	hotelDetails,
	chosenLanguage,
	t,
	depositAmount,
	averageCommissionRate,
	total_price_with_commission,
	convertedAmounts,
	selectedPaymentOption,
	setSelectedPaymentOption,
	fromPage,
}) => {
	const handlePaymentOptionChange = (option) => {
		setSelectedPaymentOption(option);

		// Google Analytics Event Tracking
		ReactGA.event({
			category: "User Selected Payment Option",
			action: `User Selected ${option}`,
			label: `User Selected ${option}`,
		});

		// Facebook Pixel Tracking
		ReactPixel.track(`Selected Payment Option`, {
			action: `User Selected ${option}`,
			page: "checkout",
		});
	};

	return (
		<div>
			{/* Accept Deposit Option */}
			{hotelDetails.guestPaymentAcceptance.acceptDeposit && (
				<TermsWrapper>
					<Checkbox
						checked={selectedPaymentOption === "acceptDeposit"}
						onChange={() => handlePaymentOptionChange("acceptDeposit")}
					>
						{chosenLanguage === "Arabic"
							? "قبول دفع العربون"
							: "Accept Deposit Online"}{" "}
						({averageCommissionRate}%)
						<span style={{ fontWeight: "bold", fontSize: "12.5px" }}>
							<s style={{ color: "red" }}>
								SAR{" "}
								{(Number(depositAmount) + Number(depositAmount) * 0.1).toFixed(
									2
								)}
							</s>{" "}
							SAR {depositAmount}
						</span>{" "}
					</Checkbox>
					{/* Note about the amount due */}
					<NoteWrapper>
						{chosenLanguage === "Arabic"
							? `المبلغ المستحق هو ${(
									Number(total_price_with_commission) - Number(depositAmount)
								).toFixed(2)} SAR بدلاً من ${(
									Number(total_price_with_commission * 1.1) -
									Number(depositAmount)
								).toFixed(2)}`
							: `Amount due is SAR ${(
									Number(total_price_with_commission) - Number(depositAmount)
								).toFixed(2)} instead of ${(
									Number(total_price_with_commission * 1.1) -
									Number(depositAmount)
								).toFixed(2)}`}
					</NoteWrapper>
				</TermsWrapper>
			)}

			{/* Pay Whole Amount Option */}
			{hotelDetails.guestPaymentAcceptance.acceptPayWholeAmount && (
				<TermsWrapper>
					<Checkbox
						checked={selectedPaymentOption === "acceptPayWholeAmount"}
						onChange={() => handlePaymentOptionChange("acceptPayWholeAmount")}
					>
						{chosenLanguage === "Arabic"
							? "دفع المبلغ الإجمالي"
							: "Pay Whole Amount Online"}{" "}
						<span style={{ fontWeight: "bold", fontSize: "12.5px" }}>
							<s style={{ color: "red" }}>
								SAR{" "}
								{(
									Number(total_price_with_commission) +
									Number(total_price_with_commission) * 0.1
								).toFixed(2)}
							</s>{" "}
							SAR {Number(total_price_with_commission).toFixed(2)}
						</span>{" "}
					</Checkbox>
				</TermsWrapper>
			)}

			{/* Reserve Now, Pay in Hotel Option */}
			{hotelDetails.guestPaymentAcceptance.acceptReserveNowPayInHotel && (
				<TermsWrapper>
					<Checkbox
						checked={selectedPaymentOption === "acceptReserveNowPayInHotel"}
						onChange={() =>
							handlePaymentOptionChange("acceptReserveNowPayInHotel")
						}
					>
						{chosenLanguage === "Arabic"
							? "احجز الآن والدفع عند الوصول"
							: "Reserve Now, Pay in Hotel"}{" "}
						<span style={{ fontWeight: "bold", fontSize: "12.5px" }}>
							SAR{" "}
							{(
								Number(total_price_with_commission) +
								Number(total_price_with_commission) * 0.1
							).toFixed(2)}
						</span>{" "}
					</Checkbox>
				</TermsWrapper>
			)}
		</div>
	);
};

export default PaymentOptions;

const TermsWrapper = styled.div`
	margin: 5px auto;
	font-size: 1rem;
	display: flex;
	flex-direction: column;
	align-items: flex-start;

	.ant-checkbox-wrapper {
		margin-left: 10px;
	}
`;

const NoteWrapper = styled.div`
	margin-top: 5px;
	font-size: 0.9rem;
	color: #007bff; /* Custom blue hex color */
	font-weight: bold;
`;
