// src/pages/PaymentLink.js
import React, { useEffect, useState, useMemo, useCallback } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { Checkbox, message, Spin, Alert } from "antd";
import {
	gettingSingleReservationById,
	currencyConversion,
	getPayPalClientToken, // returns { clientToken, env } + diag (when dbg=1)
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

/* ───────── Helpers ───────── */
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
const idSig = (s) => {
	try {
		const t = String(s || "");
		let h = 0;
		for (let i = 0; i < t.length; i++) h = (h * 33 + t.charCodeAt(i)) >>> 0;
		return h.toString(16).slice(0, 8);
	} catch {
		return "na";
	}
};

/* Hosted Card Fields submit button */
function CardFieldsSubmitButton({ disabled, label }) {
	const ctx = usePayPalCardFields();
	const cardFieldsForm = ctx?.cardFieldsForm;
	const cardFields = ctx?.cardFields;
	const [busy, setBusy] = useState(false);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let cancelled = false;
		let tries = 0;
		const tick = () => {
			if (cancelled) return;
			const submitFn =
				(cardFieldsForm && cardFieldsForm.submit) ||
				(cardFields && cardFields.submit) ||
				null;
			const eligible =
				(cardFieldsForm?.isEligible?.() ?? true) &&
				(cardFields?.isEligible?.() ?? true);
			setReady(typeof submitFn === "function" && eligible);
			if ((!submitFn || !eligible) && tries < 60) {
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
		const submitFn =
			(cardFieldsForm && cardFieldsForm.submit) ||
			(cardFields && cardFields.submit) ||
			null;
		if (disabled || typeof submitFn !== "function") return;
		setBusy(true);
		try {
			if (cardFieldsForm?.getState) {
				const state = await cardFieldsForm.getState();
				if (state && !state.isFormValid) {
					message.error(label?.error || "Card details are incomplete.");
					setBusy(false);
					return;
				}
			}
			await submitFn(); // 3‑D Secure if needed → then onApprove runs
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
	const [selectedOption, setSelectedOption] = useState(null);
	const [guestAgreed, setGuestAgreed] = useState(false);

	// USD conversions
	const [effectiveDepositUSD, setEffectiveDepositUSD] = useState("0.00");
	const [totalUSD, setTotalUSD] = useState("0.00");

	// PayPal client token + env (from backend) + diag
	const [clientToken, setClientToken] = useState(null);
	const [isLive, setIsLive] = useState(null);
	const [tokenError, setTokenError] = useState(null);
	const [reloadKey, setReloadKey] = useState(0);

	// Wallet-only fallback (retry without card-fields & without client-token)
	const [walletOnly, setWalletOnly] = useState(false);

	const isArabic = chosenLanguage === "Arabic";
	const locale = isArabic ? "ar_EG" : "en_US";

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

	const reloadPayment = useCallback(() => {
		setReloadKey((k) => k + 1);
		setClientToken(null);
		setIsLive(null);
		setTokenError(null);
		setWalletOnly(false);
	}, []);

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

	/* 3) SAR → USD conversions (robust defaults so UI always shows USD) */
	useEffect(() => {
		const doConversion = async () => {
			if (!reservationData) return;

			// Full total SAR & advance/deposit SAR
			const fullTotalSAR = Number(reservationData.total_amount || 0);
			const depositSAR = Number(effectiveDeposit || 0);

			// Reset to safe defaults first
			setTotalUSD("0.00");
			setEffectiveDepositUSD("0.00");

			try {
				const conversions = await currencyConversion([
					fullTotalSAR,
					depositSAR,
				]);
				const totalU = Number(conversions?.[0]?.amountInUSD ?? 0);
				const effU = Number(conversions?.[1]?.amountInUSD ?? 0);

				// Always coerce to 2dp strings, never NaN/undefined
				setTotalUSD(Number.isFinite(totalU) ? totalU.toFixed(2) : "0.00");
				setEffectiveDepositUSD(
					Number.isFinite(effU) ? effU.toFixed(2) : "0.00"
				);
			} catch (err) {
				// eslint-disable-next-line no-console
				console.error("Error converting currency:", err);
				// Hard default is already set (0.00) so the UI won't show blanks
			}
		};
		doConversion();
	}, [reservationData, effectiveDeposit]);

	/* 4) PayPal client token + env (with diagnostics) */
	useEffect(() => {
		const init = async () => {
			try {
				const tokenResp = await getPayPalClientToken(); // { clientToken, env, diag? }
				const token =
					typeof tokenResp === "string"
						? tokenResp
						: tokenResp?.clientToken || null;
				if (!token) throw new Error("Missing PayPal client token");

				let env = (tokenResp?.env || "").toLowerCase();
				if (env !== "live" && env !== "sandbox") {
					const node = (process.env.REACT_APP_NODE_ENV || "").toUpperCase();
					env = node === "PRODUCTION" ? "live" : "sandbox";
					// eslint-disable-next-line no-console
					console.warn(
						"[PayPal] 'env' not returned by API. Falling back to",
						env
					);
				}

				setClientToken(token);
				setIsLive(env === "live");

				// FE vs BE app signature (helps spot mismatched app config)
				const feClientId =
					env === "live"
						? process.env.REACT_APP_PAYPAL_CLIENT_ID_LIVE
						: process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX;
				// eslint-disable-next-line no-console
				console.log(
					"[PP][diag] FE clientIdSig:",
					idSig(feClientId || "na"),
					"BE clientIdSig:",
					tokenResp?.diag?.clientIdSig || "(n/a)",
					"env:",
					env,
					"cached:",
					!!tokenResp?.cached
				);
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error("PayPal init failed:", e);
				setTokenError(e);
				message.error(isArabic ? "فشل تهيئة PayPal" : "PayPal init failed.");
			}
		};
		init();
	}, [isArabic, reloadKey]);

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

	/* Inner PayPal area */
	const PayArea = () => {
		const [{ isResolved, isRejected, options }] = usePayPalScriptReducer();

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

			// Prefer AUTHORIZE; backend persists AUTH (and vault if present)
			if (actions?.order) {
				return actions.order.create({
					intent: "AUTHORIZE",
					purchase_units,
					application_context: {
						brand_name: "Jannat Booking",
						user_action: "PAY_NOW",
						shipping_preference: "NO_SHIPPING",
					},
				});
			}

			// Card Fields path — create order on server and return id
			const res = await fetch(
				`${process.env.REACT_APP_API_URL}/paypal/order/create`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						intent: "AUTHORIZE",
						purchase_units,
						application_context: {
							brand_name: "Jannat Booking",
							user_action: "PAY_NOW",
							shipping_preference: "NO_SHIPPING",
						},
						payment_source: {
							card: { attributes: { vault: { store_in_vault: "ON_SUCCESS" } } },
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
						mode: "authorize",
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

		if (isRejected) {
			// Log exact SDK URL for remote debugging (copy/paste to see HTTP response)
			try {
				const p = new URL("https://www.paypal.com/sdk/js");
				Object.entries(options || {}).forEach(([k, v]) => {
					if (v === undefined || v === null || v === "") return;
					p.searchParams.set(k, String(v));
				});
				// eslint-disable-next-line no-console
				console.log("[PP][script] url:", p.toString(), {
					options,
					isRejected,
					isResolved,
				});
			} catch {
				/* noop */
			}

			// Offer a wallet-only fallback (no card-fields, no data-client-token)
			if (!walletOnly) {
				return (
					<div>
						<Alert
							type='error'
							showIcon
							message={
								isArabic
									? "تعذر تحميل بوابة الدفع"
									: "Payment module failed to load"
							}
							description={
								isArabic
									? "سنحاول استخدام محفظة PayPal فقط. إذا استمر الخطأ، عطّل مانع الإعلانات أو جرّب شبكة مختلفة."
									: "We’ll try a PayPal wallet–only fallback. If it persists, disable ad blockers or try another network."
							}
						/>
						<div style={{ textAlign: "center", marginTop: 10 }}>
							<ReloadBtn onClick={() => setWalletOnly(true)}>
								{isArabic ? "متابعة بالمحفظة فقط" : "Continue with wallet only"}
							</ReloadBtn>
							<div style={{ marginTop: 8 }}>
								<ReloadBtn onClick={reloadPayment}>
									{isArabic ? "إعادة تحميل الدفع" : "Reload payment"}
								</ReloadBtn>
							</div>
						</div>
					</div>
				);
			}

			// If user chose fallback, render buttons-only below (handled outside via options)
			return null;
		}

		if (!isResolved) return <Spin />;

		// Only render Card Fields if the SDK exposes them (avoid runtime crash)
		let supportsCardFields = false;
		try {
			supportsCardFields = !!window?.paypal?.CardFields;
			if (
				supportsCardFields &&
				typeof window.paypal.CardFields.isEligible === "function"
			) {
				supportsCardFields = !!window.paypal.CardFields.isEligible();
			}
		} catch {
			supportsCardFields = false;
		}

		return (
			<>
				<ButtonsBox>
					{/* Wallet (PayPal) */}
					<PayPalButtons
						fundingSource='paypal'
						style={{ layout: "vertical", label: "paypal" }}
						createOrder={createOrder}
						onApprove={onApprove}
						onError={onError}
						disabled={!allowInteract}
					/>
					{/* Wallet card button (Pay with credit/debit card) */}
					<PayPalButtons
						fundingSource='card'
						style={{ layout: "vertical", label: "pay" }}
						createOrder={createOrder}
						onApprove={onApprove}
						onError={onError}
						disabled={!allowInteract}
					/>
				</ButtonsBox>

				{!walletOnly && (
					<>
						<BrandFootnote>
							Powered by <b>PayPal</b>
						</BrandFootnote>
						<Divider />
						{/* Inline Card Fields — shown only if supported */}
						{supportsCardFields ? (
							<CardBox
								dir={isArabic ? "rtl" : "ltr"}
								aria-disabled={!allowInteract}
							>
								<CardTitle>
									{isArabic
										? "أو ادفع مباشرة بالبطاقة"
										: "Or pay directly by card"}
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
												<label>
													{isArabic ? "تاريخ الانتهاء" : "Expiry date"}
												</label>
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
												processing: isArabic
													? "جار المعالجة..."
													: "Processing…",
												error: isArabic
													? "فشل الدفع بالبطاقة"
													: "Card payment failed.",
											}}
										/>
									</div>
								</PayPalCardFieldsProvider>
							</CardBox>
						) : (
							<div style={{ marginTop: 10 }}>
								<Alert
									type='info'
									showIcon
									message={
										isArabic
											? "الدفع بالبطاقة داخل الصفحة غير متاح"
											: "Inline card fields are not available"
									}
									description={
										isArabic
											? 'يرجى استخدام زري "PayPal" أو "Pay" بالأعلى لإتمام الدفع.'
											: 'Please use the "PayPal" or "Pay" (card) buttons above to complete payment.'
									}
								/>
							</div>
						)}
					</>
				)}
			</>
		);
	};

	/* Build PayPal SDK options (primary vs wallet-only fallback) */
	const feClientId =
		(isLive
			? process.env.REACT_APP_PAYPAL_CLIENT_ID_LIVE
			: process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX) || "";

	const primaryOptions =
		clientToken && isLive != null && !walletOnly
			? {
					"client-id": feClientId,
					"data-client-token": clientToken,
					components: "buttons,card-fields",
					currency: "USD",
					intent: "authorize",
					commit: true,
					"enable-funding": "paypal,card",
					"disable-funding": "credit,venmo,paylater",
					locale,
					// Let PayPal auto-detect buyer country; avoids regional conflicts
				}
			: null;

	const fallbackOptions =
		isLive != null && walletOnly
			? {
					"client-id": feClientId,
					components: "buttons",
					currency: "USD",
					intent: "authorize",
					commit: true,
					"enable-funding": "paypal,card", // keep both wallet options
					"disable-funding": "credit,venmo,paylater",
					locale,
				}
			: null;

	const scriptOptions = primaryOptions || fallbackOptions;

	return (
		<PageWrapper dir={isArabic ? "rtl" : "ltr"}>
			<Card>
				{loading || !reservationData ? (
					<Centered>{loading ? "Loading…" : "No reservation found"}</Centered>
				) : (
					<>
						<Header style={{ textAlign: isArabic ? "right" : undefined }}>
							{isArabic ? "تفاصيل الحجز" : "Reservation Details"}
						</Header>

						<InfoRow>
							<strong>{isArabic ? "اسم الفندق:" : "Hotel Name:"}</strong>
							<span>{reservationData.hotelId?.hotelName}</span>
						</InfoRow>
						<InfoRow>
							<strong>
								{isArabic ? "رقم التأكيد:" : "Confirmation Number:"}
							</strong>
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
									onClick={() => setSelectedOption("acceptDeposit")}
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
									onClick={() => setSelectedOption("acceptPayWholeAmount")}
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
											{Number(reservationData.total_amount).toLocaleString()}{" "}
											SAR)
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
								{tokenError ? (
									<div style={{ textAlign: "center" }}>
										<Alert
											type='error'
											showIcon
											message={
												isArabic
													? "فشل تهيئة PayPal"
													: "PayPal initialization failed"
											}
										/>
										<div style={{ marginTop: 10 }}>
											<ReloadBtn onClick={reloadPayment}>
												{isArabic ? "إعادة المحاولة" : "Try again"}
											</ReloadBtn>
										</div>
									</div>
								) : !scriptOptions ? (
									<Centered>
										<Spin />
									</Centered>
								) : (
									<ScriptShell key={`${reloadKey}-${walletOnly ? "w" : "p"}`}>
										<PayPalScriptProvider options={scriptOptions}>
											<PayArea />
										</PayPalScriptProvider>
									</ScriptShell>
								)}
							</>
						)}
					</>
				)}
			</Card>
		</PageWrapper>
	);
};

export default PaymentLink;

/* ───────── Styled (unchanged) ───────── */
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
const ReloadBtn = styled.button`
	background: #0f172a;
	color: #fff;
	border: none;
	border-radius: 8px;
	padding: 8px 14px;
	font-weight: 700;
	cursor: pointer;
`;
