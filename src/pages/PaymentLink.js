import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { Checkbox, message } from "antd";
import {
	gettingSingleReservationById,
	updateReservationDetailsClient,
	currencyConversion,
} from "../apiCore";
import PaymentDetails from "../components/checkout/PaymentDetails";
import { useCartContext } from "../cart_context";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import {
	// eslint-disable-next-line
	translations,
} from "../Assets";

/**
 * Calculate Commission & OneNight per your PaymentTrigger logic:
 *  1) totalCommission = sum((rootPrice * commissionRate + (totalPriceWithoutCommission - rootPrice)) * room.count)
 *  2) oneNightCost    = sum(firstDay.rootPrice * room.count)
 *  3) depositWithOneNight = totalCommission + oneNightCost
 */
function computeCommissionAndDeposit(pickedRoomsType = []) {
	let totalCommission = 0;
	let oneNightCost = 0;

	pickedRoomsType.forEach((room) => {
		if (room.pricingByDay && room.pricingByDay.length > 0) {
			// Commission across all days using ReceiptPDF's formula
			let commissionForRoom = room.pricingByDay.reduce((acc, day) => {
				const rootPrice = Number(day.rootPrice);
				const commissionRate = Number(day.commissionRate) / 100; // Convert percentage to decimal
				const totalPriceWithoutCommission = Number(
					day.totalPriceWithoutCommission
				);

				// Commission per day
				const commission =
					rootPrice * commissionRate +
					(totalPriceWithoutCommission - rootPrice);

				return acc + commission;
			}, 0);

			commissionForRoom *= Number(room.count);
			totalCommission += commissionForRoom;

			// One night cost: first day's rootPrice * count
			const firstDayRootPrice = Number(room.pricingByDay[0].rootPrice);
			oneNightCost += firstDayRootPrice * Number(room.count);
		} else {
			// Fallback if no pricingByDay
			oneNightCost += Number(room.chosenPrice) * Number(room.count);
		}
	});

	const depositWithOneNight = totalCommission + oneNightCost;

	return {
		totalCommission: Number(totalCommission.toFixed(2)),
		oneNightCost: Number(oneNightCost.toFixed(2)),
		depositWithOneNight: Number(depositWithOneNight.toFixed(2)),
	};
}

const PaymentLink = () => {
	const { reservationId } = useParams();
	const { chosenLanguage } = useCartContext();
	const t = translations[chosenLanguage] || translations.English;

	// Reservation + Payment logic states
	const [reservationData, setReservationData] = useState(null);
	const [commission, setCommission] = useState(0);
	// eslint-disable-next-line
	const [oneNightCost, setOneNightCost] = useState(0);
	const [depositWithOneNight, setDepositWithOneNight] = useState(0);
	const [loading, setLoading] = useState(true);

	// Payment option: either "acceptDeposit" or "fullAmount"
	const [selectedOption, setSelectedOption] = useState(null);

	// USD conversions
	const [commissionUSD, setCommissionUSD] = useState("0.00");
	const [depositUSD, setDepositUSD] = useState("0.00");
	const [totalUSD, setTotalUSD] = useState("0.00");

	// Payment details
	const [cardNumber, setCardNumber] = useState("");
	const [expiryDate, setExpiryDate] = useState("");
	const [cvv, setCvv] = useState("");
	const [cardHolderName, setCardHolderName] = useState("");
	const [postalCode, setPostalCode] = useState("");

	// Terms
	const [guestAgreedOnTermsAndConditions, setGuestAgreedOnTermsAndConditions] =
		useState(false);

	// 1) On mount, fetch reservation & compute deposit logic
	useEffect(() => {
		const fetchReservation = async () => {
			try {
				const data = await gettingSingleReservationById(reservationId);
				if (data) {
					setReservationData(data);

					if (data.pickedRoomsType && data.pickedRoomsType.length > 0) {
						const { totalCommission, oneNightCost, depositWithOneNight } =
							computeCommissionAndDeposit(data.pickedRoomsType);

						setCommission(totalCommission);
						setOneNightCost(oneNightCost);
						setDepositWithOneNight(depositWithOneNight);

						// Convert [fullAmount, totalCommission, depositWithOneNight] to USD
						const amounts = [
							data.total_amount || 0,
							totalCommission,
							depositWithOneNight,
						];
						const conversions = await currencyConversion(amounts);
						// matches array order: [fullAmt, comm, deposit]
						const fullAmtUSD = conversions[0]?.amountInUSD || 0;
						const commUSD = conversions[1]?.amountInUSD || 0;
						const depUSD = conversions[2]?.amountInUSD || 0;

						setTotalUSD(Number(fullAmtUSD).toFixed(2));
						setCommissionUSD(Number(commUSD).toFixed(2));
						setDepositUSD(Number(depUSD).toFixed(2));
					}
				}
			} catch (error) {
				console.error("Error fetching reservation:", error);
			} finally {
				setLoading(false);
			}
		};

		if (reservationId) {
			fetchReservation();
			window.scrollTo({ top: 20, behavior: "smooth" });
		}
	}, [reservationId]);

	// 2) handleOptionChange: styled approach
	const handleOptionChange = (optionValue) => {
		setSelectedOption(optionValue);

		ReactGA.event({
			category: "User Selected Payment Option From Link",
			action: `User Selected ${optionValue}`,
			label: `User Selected ${optionValue}`,
		});
		ReactPixel.track("Selected Payment Option From Link", {
			action: `User Selected ${optionValue}`,
			page: "generatedLink",
		});
	};

	// 3) Final Payment update
	const handleReservationUpdate = async () => {
		if (!reservationData) {
			return console.error("No reservation loaded");
		}
		if (!guestAgreedOnTermsAndConditions) {
			return message.error("You must accept the Terms & Conditions first.");
		}
		if (!selectedOption) {
			return message.error("Please choose a payment option.");
		}

		let paid_amount = 0;
		let payment = "Not Paid";
		let commissionPaid = false;
		let finalCommission = commission; // entire stay
		const totalAmount = reservationData.total_amount || 0;
		let amountInUSD = "0.00";

		if (selectedOption === "acceptDeposit") {
			// deposit
			paid_amount = depositWithOneNight;
			payment = "Deposit Paid";
			commissionPaid = true;
			amountInUSD = depositUSD;
		} else if (selectedOption === "acceptPayWholeAmount") {
			paid_amount = totalAmount;
			payment = "Paid Online";
			commissionPaid = true;
			amountInUSD = totalUSD;
		}

		const updatedData = {
			customer_details: {
				cardNumber,
				cardExpiryDate: expiryDate,
				cardCVV: cvv,
				cardHolderName,
			},
			payment,
			commissionPaid,
			commission: finalCommission,
			paid_amount,
			guestAgreedOnTermsAndConditions,
			paymentDetails: {
				cardNumber,
				cardExpiryDate: expiryDate,
				cardCVV: cvv,
				cardHolderName,
				amount: amountInUSD, // in USD
			},
			convertedAmounts: {
				commissionUSD,
				depositUSD,
				totalUSD,
			},
		};

		try {
			const response = await updateReservationDetailsClient(
				reservationId,
				updatedData
			);
			if (response?.success) {
				message.success("Payment triggered successfully!");
				setTimeout(() => {
					window.location.reload();
				}, 2000);
			} else {
				console.error("Failed to update reservation", response?.message);
				message.error(response?.message || "Failed to update reservation.");
				setTimeout(() => {
					window.location.reload();
				}, 2000);
			}
		} catch (error) {
			console.error("Error updating reservation:", error);
			message.error("An error occurred updating the reservation.");
			setTimeout(() => {
				window.location.reload();
			}, 2000);
		}
	};

	// 4) Render
	if (loading) return <div>Loading...</div>;
	if (!reservationData) return <div>No reservation found</div>;

	return (
		<PaymentLinkWrapper
			className='container'
			dir={chosenLanguage === "Arabic" ? "rtl" : ""}
		>
			<h2>Reservation Details</h2>
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
				<strong>Nationality:</strong>{" "}
				{reservationData.customer_details?.nationality}
			</p>
			<p>
				<strong>Total Amount:</strong>{" "}
				{Number(reservationData.total_amount).toFixed(2)} SAR
			</p>

			{/* Payment Already Done? */}
			{["deposit paid", "paid online"].includes(
				reservationData.payment?.toLowerCase()
			) ? (
				<div className='my-4 text-center'>
					<h3 dir='ltr' style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
						Thank you for your payment {reservationData.customer_details?.name}!
					</h3>
				</div>
			) : (
				<>
					{/* Payment Option Buttons (just like PaymentOptions style) */}
					<h3 style={{ marginTop: "1rem" }}>Choose Payment Option</h3>

					<StyledOption
						selected={selectedOption === "acceptDeposit"}
						onClick={() => handleOptionChange("acceptDeposit")}
					>
						<input
							type='radio'
							readOnly
							checked={selectedOption === "acceptDeposit"}
						/>
						<label>
							Deposit:{" "}
							<strong>
								{depositUSD} USD ({depositWithOneNight.toLocaleString()} SAR)
							</strong>
						</label>
					</StyledOption>

					<StyledOption
						selected={selectedOption === "acceptPayWholeAmount"}
						onClick={() => handleOptionChange("acceptPayWholeAmount")}
					>
						<input
							type='radio'
							readOnly
							checked={selectedOption === "acceptPayWholeAmount"}
						/>
						<label>
							Full Amount:{" "}
							<strong>
								{totalUSD} USD ({reservationData.total_amount.toLocaleString()}{" "}
								SAR)
							</strong>
						</label>
					</StyledOption>

					{/* Terms acceptance */}
					<TermsWrapper
						selected={guestAgreedOnTermsAndConditions}
						onClick={() =>
							setGuestAgreedOnTermsAndConditions(
								!guestAgreedOnTermsAndConditions
							)
						}
					>
						<Checkbox
							checked={guestAgreedOnTermsAndConditions}
							onChange={(e) =>
								setGuestAgreedOnTermsAndConditions(e.target.checked)
							}
						>
							{t.acceptTerms}
						</Checkbox>
					</TermsWrapper>

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
						total={reservationData.total_amount - commission} // for reference if needed
						total_price_with_commission={reservationData.total_amount}
						depositAmount={commission}
						selectedPaymentOption={selectedOption}
						setSelectedPaymentOption={setSelectedOption}
						convertedAmounts={{
							commissionUSD,
							depositUSD,
							totalUSD,
						}}
						chosenLanguage={chosenLanguage}
						guestAgreedOnTermsAndConditions={guestAgreedOnTermsAndConditions}
						depositWithOneNight={depositWithOneNight} // Updated prop name for clarity
					/>
				</>
			)}
		</PaymentLinkWrapper>
	);
};

export default PaymentLink;

/* ------------- Styled Components ------------- */
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

// eslint-disable-next-line
const AmountsWrapper = styled.div`
	margin: 20px 0;
	padding: 10px;
	border: 1px solid #ccc;
	background-color: #f7f7f7;
`;

const TermsWrapper = styled.div`
	margin: 5px auto;
	font-size: 1rem;
	display: flex;
	align-items: center;
	padding: 12px;
	border: 2px solid
		${({ selected }) => (selected ? "#c4e2ff" : "var(--border-color-light)")};
	background-color: ${({ selected }) =>
		selected ? "#c4e2ff" : "var(--accent-color-2-dark)"};
	border-radius: 8px;
	margin-bottom: 2px;
	cursor: pointer;
	transition: var(--main-transition);

	&:hover {
		background-color: ${({ selected }) =>
			selected ? "#c4e2ff" : "var(--accent-color-2-dark)"};
	}

	.ant-checkbox-wrapper {
		margin-left: 10px;
	}
`;

/**
 * This replicates the styling from "StyledOption" in PaymentOptions:
 */
const StyledOption = styled.div`
	display: flex;
	flex-direction: row;
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

	label strong {
		font-weight: 600;
		font-size: 14px;
		color: var(--secondary-color-dark);
		margin-top: 3px;
	}

	@media (max-width: 768px) {
		padding: 6px 10px;

		input[type="radio"] {
			width: 18px;
			height: 18px;
			margin-right: 10px;
		}

		label {
			font-size: 14px;
		}
		label strong {
			font-size: 12.5px;
		}
	}
`;
