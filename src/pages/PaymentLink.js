import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { Checkbox, message, Spin } from "antd";
import {
	gettingSingleReservationById,
	currencyConversion,
	getPayPalClientToken,
	payReservationViaPayPalLink,
} from "../apiCore";
import { useCartContext } from "../cart_context";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import { translations } from "../Assets";
import {
	PayPalScriptProvider,
	PayPalButtons,
	usePayPalScriptReducer,
	PayPalCardFieldsProvider,
	PayPalCardFieldsForm,
	PayPalNameField,
	PayPalNumberField,
	PayPalExpiryField,
	PayPalCVVField,
	usePayPalCardFields,
} from "@paypal/react-paypal-js";

/* ───────── Commission + Deposit (your logic) ───────── */
function computeCommissionAndDeposit(pickedRoomsType = []) {
	let totalCommission = 0;
	let oneNightCost = 0;
	pickedRoomsType.forEach((room) => {
		if (room.pricingByDay && room.pricingByDay.length > 0) {
			const commissionForRoom =
				room.pricingByDay.reduce(
					(acc, day) => acc + (Number(day.price) - Number(day.rootPrice)),
					0
				) * room.count;
			totalCommission += commissionForRoom;
			const firstDayRootPrice = Number(room.pricingByDay[0].rootPrice);
			oneNightCost += firstDayRootPrice * room.count;
		} else {
			oneNightCost += Number(room.chosenPrice) * room.count;
		}
	});
	const defaultDeposit = totalCommission + oneNightCost;
	return { defaultDeposit: Number(defaultDeposit.toFixed(2)) };
}

/* ───────── Hosted Card Fields submit button (supports both APIs) ───────── */
function CardFieldsSubmitButton({ disabled, label }) {
	const ctx = usePayPalCardFields();
	// Some versions expose { cardFieldsForm }, others { cardFields }
	const cardFieldsForm = ctx?.cardFieldsForm;
	const cardFields = ctx?.cardFields;
	const submitFn =
		(cardFieldsForm && cardFieldsForm.submit) ||
		(cardFields && cardFields.submit) ||
		null;

	const [busy, setBusy] = useState(false);
	const [ready, setReady] = useState(!!submitFn);

	useEffect(() => {
		let cancelled = false;
		let tries = 0;
		const tick = () => {
			if (cancelled) return;
			const fn =
				(cardFieldsForm && cardFieldsForm.submit) ||
				(cardFields && cardFields.submit) ||
				null;
			setReady(typeof fn === "function");
			if (!fn && tries < 120) {
				tries += 1;
				setTimeout(tick, 250);
			}
		};
		tick();
		return () => {
			cancelled = true;
		};
	}, [cardFieldsForm, cardFields]);

	const submit = async () => {
		if (disabled || typeof submitFn !== "function") return;
		setBusy(true);
		try {
			// Optional UX: validate before submit when form API is present
			if (cardFieldsForm?.getState) {
				const state = await cardFieldsForm.getState();
				if (state && !state.isFormValid) {
					message.error(label?.error || "Card details are incomplete.");
					setBusy(false);
					return;
				}
			}
			await submitFn(); // Triggers 3‑D Secure if needed and then calls onApprove
		} catch (e) {
			// eslint-disable-next-line no-console
			console.error("CardFields submit error:", e);
			message.error(label?.error || "Card payment failed.");
		} finally {
			setBusy(false);
		}
	};

	const isDisabled = disabled || !ready || busy;

	return (
		<PayCardButton
			type='button'
			onClick={submit}
			disabled={isDisabled}
			aria-disabled={isDisabled}
			title={!ready ? "Initializing secure card fields..." : undefined}
		>
			{busy ? label?.processing || "Processing…" : label?.pay || "Pay by Card"}
		</PayCardButton>
	);
}

/* ───────── Main page component ───────── */
const PaymentLink = () => {
	const { reservationId } = useParams();
	const { chosenLanguage } = useCartContext();
	const t = translations[chosenLanguage] || translations.English;

	const [reservationData, setReservationData] = useState(null);
	const [defaultDeposit, setDefaultDeposit] = useState(0);
	const [effectiveDeposit, setEffectiveDeposit] = useState(0);
	const [loading, setLoading] = useState(true);

	// Pay options
	const [selectedOption, setSelectedOption] = useState(null); // "acceptDeposit" | "acceptPayWholeAmount"
	const [guestAgreed, setGuestAgreed] = useState(false);

	// USD conversions
	const [effectiveDepositUSD, setEffectiveDepositUSD] = useState("0.00");
	const [totalUSD, setTotalUSD] = useState("0.00");

	// PayPal client token
	const [clientToken, setClientToken] = useState(null);

	const isArabic = chosenLanguage === "Arabic";
	const locale = isArabic ? "ar" : "en_US";

	const allowInteract =
		!!selectedOption &&
		!!guestAgreed &&
		(selectedOption === "acceptDeposit"
			? Number(effectiveDepositUSD) > 0
			: Number(totalUSD) > 0);

	const getCMID = () => {
		try {
			return window?.paypal?.getClientMetadataID?.();
		} catch {
			return null;
		}
	};

	/* 1) Fetch reservation */
	useEffect(() => {
		const fetchReservation = async () => {
			try {
				const data = await gettingSingleReservationById(reservationId);
				if (data) {
					setReservationData(data);
					if (data.pickedRoomsType?.length) {
						const { defaultDeposit } = computeCommissionAndDeposit(
							data.pickedRoomsType
						);
						setDefaultDeposit(defaultDeposit);
					}
				}
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error("Error fetching reservation:", e);
				message.error(
					isArabic ? "حدث خطأ أثناء تحميل الحجز" : "Failed to load reservation."
				);
			} finally {
				setLoading(false);
			}
		};
		if (reservationId) fetchReservation();
	}, [reservationId, isArabic]);

	/* 2) Compute effective deposit (advance overrides) */
	useEffect(() => {
		if (!reservationData) return;
		let depositToUse = defaultDeposit;

		if (reservationData.advancePayment) {
			const { paymentPercentage, finalAdvancePayment } =
				reservationData.advancePayment;
			const pct = parseFloat(paymentPercentage) || 0;
			const adv = parseFloat(finalAdvancePayment) || 0;
			const totalAmount = parseFloat(reservationData.total_amount || 0);

			if (pct > 0) {
				depositToUse = totalAmount * (pct / 100);
			} else if (adv > 0) {
				depositToUse = adv;
			}
		}

		setEffectiveDeposit(Number(depositToUse.toFixed(2)));
	}, [reservationData, defaultDeposit]);

	/* 3) SAR → USD conversions */
	useEffect(() => {
		const doConversion = async () => {
			if (!reservationData) return;
			const fullTotal = parseFloat(reservationData.total_amount || 0);
			const amounts = [fullTotal, effectiveDeposit];
			try {
				const conversions = await currencyConversion(amounts);
				const totalU = conversions?.[0]?.amountInUSD || 0;
				const effU = conversions?.[1]?.amountInUSD || 0;
				setTotalUSD(Number(totalU).toFixed(2));
				setEffectiveDepositUSD(Number(effU).toFixed(2));
			} catch (err) {
				// eslint-disable-next-line no-console
				console.error("Error converting currency:", err);
			}
		};
		doConversion();
	}, [reservationData, effectiveDeposit]);

	/* 4) PayPal client token (for Card Fields + Buttons) */
	useEffect(() => {
		const init = async () => {
			try {
				const token = await getPayPalClientToken();
				const raw = typeof token === "string" ? token : token?.clientToken;
				setClientToken(raw || null);
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error(e);
				message.error(isArabic ? "فشل تهيئة PayPal" : "PayPal init failed.");
			}
		};
		init();
	}, [isArabic]);

	const selectedUsdAmount = useMemo(() => {
		const val =
			selectedOption === "acceptDeposit" ? effectiveDepositUSD : totalUSD;
		const n = Number(val);
		return Number.isFinite(n) ? n.toFixed(2) : "0.00";
	}, [selectedOption, effectiveDepositUSD, totalUSD]);

	const selectedSarAmount = useMemo(() => {
		return selectedOption === "acceptDeposit"
			? effectiveDeposit
			: Number(reservationData?.total_amount || 0);
	}, [selectedOption, effectiveDeposit, reservationData]);

	const handleOptionChange = (opt) => {
		setSelectedOption(opt);
		ReactGA.event({
			category: "User Selected Payment Option From Link",
			action: `User Selected ${opt}`,
			label: `User Selected ${opt}`,
		});
		ReactPixel.track("Selected Payment Option From Link", {
			action: `User Selected ${opt}`,
			page: "generatedLink",
		});
	};

	/* ───────── PayPal area: explicit funding sources + Card Fields ───────── */
	const PayArea = () => {
		const [{ isResolved }] = usePayPalScriptReducer();

		const requireSelectionAndTerms = () => {
			if (!selectedOption) {
				message.error(
					isArabic ? "اختر خيار الدفع" : "Please choose a payment option."
				);
				return false;
			}
			if (!guestAgreed) {
				message.error(
					t.acceptTerms ||
						(isArabic
							? "يرجى الموافقة على الشروط والأحكام"
							: "Please accept the Terms & Conditions")
				);
				return false;
			}
			if (!(Number(selectedUsdAmount) > 0)) {
				message.error(
					isArabic ? "قيمة الدفع غير صالحة" : "Payment amount is not valid yet."
				);
				return false;
			}
			return true;
		};

		// Dual-mode createOrder: Buttons (actions) vs Card Fields (server)
		const createOrder = async (data, actions) => {
			if (!requireSelectionAndTerms()) return;

			const conf = reservationData?.confirmation_number || reservationId;
			const hotelName = reservationData?.hotelId?.hotelName || "Hotel";
			const guestName = reservationData?.customer_details?.name || "Guest";
			const guestPhone = reservationData?.customer_details?.phone || "";
			const checkin = reservationData?.checkin_date;
			const checkout = reservationData?.checkout_date;

			const purchase_units = [
				{
					reference_id: "default",
					invoice_id: `RSV-${conf}`,
					custom_id: conf,
					description: `Hotel reservation — ${hotelName} — ${checkin} → ${checkout} — Guest ${guestName} (${guestPhone})`,
					amount: {
						currency_code: "USD",
						value: String(selectedUsdAmount),
						breakdown: {
							item_total: {
								currency_code: "USD",
								value: String(selectedUsdAmount),
							},
						},
					},
					items: [
						{
							name: `Hotel Reservation — ${hotelName}`,
							description: `Guest: ${guestName}, Phone: ${guestPhone}, ${checkin} → ${checkout}, Conf: ${conf}`,
							quantity: "1",
							unit_amount: {
								currency_code: "USD",
								value: String(selectedUsdAmount),
							},
							category: "DIGITAL_GOODS",
						},
					],
				},
			];

			if (actions?.order) {
				// Buttons path
				return actions.order.create({
					intent: "CAPTURE",
					purchase_units,
					application_context: {
						brand_name: "Jannat Booking",
						user_action: "PAY_NOW",
						shipping_preference: "NO_SHIPPING",
					},
				});
			}

			// Card Fields path → create order on the server, return its id
			const res = await fetch(
				`${process.env.REACT_APP_API_URL}/paypal/order/create`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						intent: "CAPTURE",
						purchase_units,
						application_context: {
							brand_name: "Jannat Booking",
							user_action: "PAY_NOW",
							shipping_preference: "NO_SHIPPING",
						},
					}),
				}
			);
			const json = await res.json();
			if (!res.ok || !json?.id) {
				throw new Error(
					json?.message || "Server failed to create PayPal order"
				);
			}
			return json.id;
		};

		const onApprove = async ({ orderID }) => {
			try {
				const payload = {
					reservationKey:
						reservationData?._id ||
						reservationData?.confirmation_number ||
						reservationId,
					option: selectedOption === "acceptDeposit" ? "deposit" : "full",
					convertedAmounts: { depositUSD: effectiveDepositUSD, totalUSD },
					sarAmount: Number(selectedSarAmount).toFixed(2),
					paypal: {
						order_id: orderID,
						expectedUsdAmount: selectedUsdAmount,
						cmid: getCMID(),
					},
				};

				const resp = await payReservationViaPayPalLink(payload);
				if (resp?.reservation) {
					message.success(isArabic ? "تم الدفع بنجاح!" : "Payment successful!");
					ReactGA.event({
						category: "Reservation Payment",
						action: "Link-Pay Success",
						label: payload.option,
						value: Number(selectedSarAmount),
					});
					ReactPixel.track("Purchase", {
						value: Number(selectedSarAmount),
						currency: "SAR",
						confirmation_number: resp.reservation?.confirmation_number,
					});
					setTimeout(() => window.location.reload(), 1200);
				} else {
					message.error(
						resp?.message || (isArabic ? "تعذر إتمام الدفع" : "Payment failed.")
					);
				}
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error(e);
				message.error(isArabic ? "تعذر إتمام الدفع" : "Payment failed.");
			}
		};

		const onError = (e) => {
			// eslint-disable-next-line no-console
			console.error("PayPal error:", e);
			message.error(
				isArabic ? "خطأ في الدفع عبر PayPal" : "PayPal payment error."
			);
		};

		if (!isResolved) return <Spin />;

		return (
			<>
				{/* Explicit funding sources → avoids duplicates */}
				<ButtonsBox>
					<PayPalButtons
						fundingSource='paypal'
						style={{ layout: "vertical", label: "paypal" }}
						createOrder={createOrder}
						onApprove={onApprove}
						onError={onError}
						disabled={!allowInteract}
					/>
					<PayPalButtons
						fundingSource='venmo'
						style={{ layout: "vertical" }}
						createOrder={createOrder}
						onApprove={onApprove}
						onError={onError}
						disabled={!allowInteract}
					/>
					<PayPalButtons
						fundingSource='card'
						style={{ layout: "vertical", label: "pay" }}
						createOrder={createOrder}
						onApprove={onApprove}
						onError={onError}
						disabled={!allowInteract}
					/>
				</ButtonsBox>

				<BrandFootnote>
					Powered by <b>PayPal</b>
				</BrandFootnote>

				<Divider />

				{/* Hosted Card Fields */}
				<CardBox dir={isArabic ? "rtl" : "ltr"} aria-disabled={!allowInteract}>
					<CardTitle>
						{isArabic ? "أو ادفع مباشرة بالبطاقة" : "Or pay directly by card"}
					</CardTitle>

					<PayPalCardFieldsProvider
						createOrder={createOrder}
						onApprove={onApprove}
						onError={onError}
					>
						<PayPalCardFieldsForm>
							<div className='field'>
								<label>
									{isArabic ? "اسم حامل البطاقة" : "Cardholder name"}
								</label>
								<div className='hosted'>
									<PayPalNameField />
								</div>
							</div>

							<div className='field'>
								<label>{isArabic ? "رقم البطاقة" : "Card number"}</label>
								<div className='hosted'>
									<PayPalNumberField />
								</div>
							</div>

							<Row>
								<div className='field half'>
									<label>{isArabic ? "تاريخ الانتهاء" : "Expiry date"}</label>
									<div className='hosted'>
										<PayPalExpiryField />
									</div>
								</div>
								<div className='field half'>
									<label>{isArabic ? "الرمز السري (CVV)" : "CVV"}</label>
									<div className='hosted'>
										<PayPalCVVField />
									</div>
								</div>
							</Row>
						</PayPalCardFieldsForm>

						<div style={{ marginTop: 8 }}>
							<CardFieldsSubmitButton
								disabled={!allowInteract}
								label={{
									pay: isArabic ? "ادفع بالبطاقة" : "Pay by Card",
									processing: isArabic ? "جار المعالجة..." : "Processing…",
									error: isArabic
										? "فشل الدفع بالبطاقة"
										: "Card payment failed.",
								}}
							/>
						</div>
					</PayPalCardFieldsProvider>
				</CardBox>
			</>
		);
	};

	if (loading) return <Centered>Loading…</Centered>;
	if (!reservationData) return <Centered>No reservation found</Centered>;

	return (
		<PageWrapper dir={isArabic ? "rtl" : "ltr"}>
			<Card>
				<Header style={{ textAlign: isArabic ? "right" : "" }}>
					{isArabic ? "تفاصيل الحجز" : "Reservation Details"}
				</Header>
				<InfoRow>
					<strong>{isArabic ? "اسم الفندق:" : "Hotel Name:"}</strong>
					<span>{reservationData.hotelId?.hotelName}</span>
				</InfoRow>
				<InfoRow>
					<strong>{isArabic ? "رقم التأكيد:" : "Confirmation Number:"}</strong>
					<span>{reservationData.confirmation_number}</span>
				</InfoRow>
				<InfoRow>
					<strong>{isArabic ? "اسم الضيف:" : "Guest Name:"}</strong>
					<span>{reservationData.customer_details?.name}</span>
				</InfoRow>
				<InfoRow>
					<strong>{isArabic ? "البريد الإلكتروني:" : "Email:"}</strong>
					<span>{reservationData.customer_details?.email}</span>
				</InfoRow>
				<InfoRow>
					<strong>{isArabic ? "الجنسية:" : "Nationality:"}</strong>
					<span>{reservationData.customer_details?.nationality}</span>
				</InfoRow>
				<InfoRow>
					<strong>{isArabic ? "إجمالي المبلغ:" : "Total Amount:"}</strong>
					<span>{Number(reservationData.total_amount).toFixed(2)} SAR</span>
				</InfoRow>

				{["deposit paid", "paid online"].includes(
					(reservationData.payment || "").toLowerCase()
				) ? (
					<ThankYou>
						{isArabic
							? `شكرًا على الدفع ${reservationData.customer_details?.name}!`
							: `Thank you for your payment ${reservationData.customer_details?.name}!`}
					</ThankYou>
				) : (
					<>
						<SubHeader>
							{isArabic ? "اختر خيار الدفع" : "Choose Payment Option"}
						</SubHeader>

						{/* Deposit */}
						<Option
							onClick={() => handleOptionChange("acceptDeposit")}
							selected={selectedOption === "acceptDeposit"}
						>
							<input
								type='radio'
								readOnly
								checked={selectedOption === "acceptDeposit"}
							/>
							<label>
								{isArabic ? "دفعة مقدمة" : "Deposit"}{" "}
								<strong>
									{effectiveDepositUSD} USD (
									{Number(effectiveDeposit).toLocaleString()} SAR)
								</strong>
							</label>
						</Option>

						{/* Full amount */}
						<Option
							onClick={() => handleOptionChange("acceptPayWholeAmount")}
							selected={selectedOption === "acceptPayWholeAmount"}
						>
							<input
								type='radio'
								readOnly
								checked={selectedOption === "acceptPayWholeAmount"}
							/>
							<label>
								{isArabic ? "المبلغ الكامل" : "Full Amount"}{" "}
								<strong>
									{totalUSD} USD (
									{Number(reservationData.total_amount).toLocaleString()} SAR)
								</strong>
							</label>
						</Option>

						{/* Terms */}
						<Terms
							selected={guestAgreed}
							onClick={() => setGuestAgreed(!guestAgreed)}
						>
							<Checkbox
								checked={guestAgreed}
								onChange={(e) => setGuestAgreed(e.target.checked)}
							>
								{t.acceptTerms ||
									(isArabic
										? "أوافق على الشروط والأحكام"
										: "I accept the Terms & Conditions")}
							</Checkbox>
						</Terms>

						{/* PayPal Area */}
						{clientToken ? (
							<ScriptShell>
								<PayPalScriptProvider
									options={{
										"client-id":
											(process.env.REACT_APP_NODE_ENV || "").toUpperCase() ===
											"PRODUCTION"
												? process.env.REACT_APP_PAYPAL_CLIENT_ID_LIVE
												: process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX,
										"data-client-token": clientToken,
										components: "buttons,card-fields",
										currency: "USD",
										intent: "capture",
										commit: true,
										"enable-funding": "paypal,venmo,card,paylater",
										"disable-funding": "credit",
										locale,
									}}
								>
									<PayArea />
								</PayPalScriptProvider>
							</ScriptShell>
						) : (
							<Centered>
								<Spin />
							</Centered>
						)}
					</>
				)}
			</Card>
		</PageWrapper>
	);
};

export default PaymentLink;

/* ───────── Styled (clean, centered, responsive, RTL-aware) ───────── */

const PageWrapper = styled.div`
	min-height: 720px;
	background: #f6f8fb;
	display: flex;
	align-items: flex-start;
	justify-content: center;
	padding: 24px 12px;

	@media (max-width: 480px) {
		padding: 16px 8px;
	}
`;

const Card = styled.div`
	width: 100%;
	max-width: 720px;
	background: #fff;
	border: 1px solid #e9eef3;
	border-radius: 14px;
	box-shadow: 0 8px 24px rgba(16, 24, 40, 0.06);
	padding: 22px;
`;

const Header = styled.h2`
	margin: 0 0 14px 0;
	font-size: 22px;
	color: #101828;
	font-weight: 700;
`;

const SubHeader = styled.h3`
	margin-top: 16px;
	margin-bottom: 10px;
	font-size: 18px;
	font-weight: 700;
	color: #101828;
`;

const InfoRow = styled.p`
	display: flex;
	gap: 8px;
	margin: 6px 0;
	color: #344054;
	strong {
		color: #1d2939;
		min-width: 180px;
	}
	@media (max-width: 520px) {
		flex-direction: column;
		strong {
			min-width: unset;
		}
	}
`;

const ThankYou = styled.h3`
	margin: 18px 0;
	font-size: 1.3rem;
	font-weight: 800;
	text-align: center;
	color: #12b76a;
`;

const Option = styled.div`
	display: flex;
	align-items: center;
	padding: 12px 14px;
	border: 1.5px solid ${({ selected }) => (selected ? "#12b76a" : "#e5e7eb")};
	background: ${({ selected }) => (selected ? "#f0fdf4" : "#fff")};
	border-radius: 10px;
	margin-bottom: 10px;
	cursor: pointer;
	transition: all 0.2s ease;

	input[type="radio"] {
		appearance: none;
		width: 18px;
		height: 18px;
		border: 2px solid #cbd5e1;
		border-radius: 50%;
		margin-inline-end: 12px;
		background: #fff;
		position: relative;
	}
	input[type="radio"]:checked {
		border-color: #12b76a;
		background: #12b76a;
	}
	label {
		font-size: 15px;
		color: #111827;
		display: flex;
		flex-direction: column;
	}
	label strong {
		font-weight: 700;
		margin-top: 3px;
		color: #0f172a;
	}
`;

const Terms = styled.div`
	margin: 8px 0 14px;
	padding: 10px 12px;
	border: 1.5px solid ${({ selected }) => (selected ? "#c7e0ff" : "#e5e7eb")};
	background: ${({ selected }) => (selected ? "#eef5ff" : "#fafafa")};
	border-radius: 10px;
	cursor: pointer;
`;

const ScriptShell = styled.div`
	width: 100%;
`;

const ButtonsBox = styled.div`
	width: 100%;
	max-width: 420px;
	margin: 0 auto;
	display: grid;
	gap: 10px;
`;

const BrandFootnote = styled.div`
	text-align: center;
	font-size: 12px;
	color: #6b7280;
	margin-top: 6px;
	b {
		color: #1f2937;
	}
`;

const Divider = styled.hr`
	max-width: 520px;
	margin: 18px auto;
	border: none;
	border-top: 1px solid #eef2f6;
`;

const CardBox = styled.div`
	width: 100%;
	max-width: 520px;
	margin: 0 auto 6px auto;
	padding: 14px 14px 16px;
	background: #fff;
	border: 1px solid #e9eef3;
	border-radius: 12px;
	box-shadow: 0 4px 14px rgba(16, 24, 40, 0.05);
	.field {
		margin-bottom: 10px;
	}
	label {
		display: block;
		font-size: 0.92rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 6px;
	}
	.hosted {
		position: relative;
		display: block;
		background: #fff;
		border: 1.25px solid #d0d5dd;
		border-radius: 10px;
		padding: 0 10px;
		min-height: 42px;
		line-height: 42px;
		transition:
			border-color 0.15s,
			box-shadow 0.15s,
			background 0.15s;
		z-index: 0;
	}
	.hosted:focus-within {
		border-color: #1677ff;
		box-shadow: 0 0 0 4px rgba(22, 119, 255, 0.12);
		background: #fff;
	}
	&[aria-disabled="true"] {
		opacity: 0.6;
		pointer-events: none;
	}
	@media (max-width: 520px) {
		padding: 12px;
		.hosted {
			min-height: 40px;
			line-height: 40px;
		}
	}
`;

const CardTitle = styled.h4`
	margin: 2px 0 10px 0;
	font-size: 16px;
	font-weight: 800;
	color: #0f172a;
	text-align: center;
`;

const Row = styled.div`
	display: flex;
	gap: 10px;
	.half {
		flex: 1;
	}
	@media (max-width: 520px) {
		flex-direction: column;
	}
`;

const PayCardButton = styled.button`
	width: 100%;
	margin-top: 8px;
	height: 42px;
	border: none;
	border-radius: 10px;
	background: #0f172a;
	color: #fff;
	font-weight: 700;
	letter-spacing: 0.2px;
	cursor: pointer;
	transition:
		opacity 0.15s,
		transform 0.02s;
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	&:active {
		transform: translateY(0.5px);
	}
`;

const Centered = styled.div`
	width: 100%;
	text-align: center;
	padding: 18px 0;
`;
