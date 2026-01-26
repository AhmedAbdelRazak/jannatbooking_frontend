// src/pages/PaymentLink.js
import React, { useEffect, useState, useMemo, useCallback } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { Checkbox, message, Spin, Alert } from "antd";
import {
	gettingSingleReservationById,
	currencyConversion,
	getPayPalClientToken, // { clientToken, env, diag? }
	payReservationViaPayPalLink,
} from "../apiCore";
import { useCartContext } from "../cart_context";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import { translations } from "../Assets";
import ApplePayButton from "../components/checkout/ApplePayButton";
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
	const safeNumber = (value) => {
		const num = Number(value);
		return Number.isFinite(num) ? num : 0;
	};
	let totalCommission = 0;
	let oneNightCost = 0;
	pickedRoomsType.forEach((room) => {
		if (room.pricingByDay && room.pricingByDay.length > 0) {
			const commissionForRoom =
				room.pricingByDay.reduce(
					(acc, day) =>
						acc + (safeNumber(day.price) - safeNumber(day.rootPrice)),
					0,
				) * safeNumber(room.count);
			totalCommission += commissionForRoom;
			const firstDayRootPrice = safeNumber(room.pricingByDay[0].rootPrice);
			oneNightCost += firstDayRootPrice * safeNumber(room.count);
		} else {
			oneNightCost += safeNumber(room.chosenPrice) * safeNumber(room.count);
		}
	});
	const defaultDeposit = totalCommission + oneNightCost;
	const normalized = Number.isFinite(defaultDeposit) ? defaultDeposit : 0;
	return { defaultDeposit: Number(normalized.toFixed(2)) };
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

/* A tiny rate helper so USD never shows 0.00 when conversion API is down */
const FALLBACK_SAR_PER_USD = 3.8;
const FALLBACK_SAR_TO_USD = 1 / FALLBACK_SAR_PER_USD;
function getSarToUsdRate() {
	try {
		const rs = JSON.parse(localStorage.getItem("rates") || "{}");
		const r = Number(rs?.SAR_USD);
		if (Number.isFinite(r) && r > 0 && r < 1) return r; // use app’s remembered rate
	} catch (_) {}
	return FALLBACK_SAR_TO_USD; // fallback to 3.8 SAR per USD
}
const toUSD = (sar) => {
	const sarNum = Number(sar || 0);
	if (!Number.isFinite(sarNum) || sarNum <= 0) return 0;
	const rate = getSarToUsdRate();
	const usd = sarNum * rate;
	if (Number.isFinite(usd) && usd > 0) return usd;
	return sarNum / FALLBACK_SAR_PER_USD;
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

	// Pay mode: "capture" by default; supports ?mode=authorize
	const queryMode =
		new URLSearchParams(window.location.search).get("mode") || "";
	const envMode = (process.env.REACT_APP_PAYPAL_PAY_MODE || "").toLowerCase();
	const PAY_MODE =
		(queryMode || envMode).toLowerCase() === "authorize"
			? "authorize"
			: "capture"; // default capture

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
	const [remainingUSD, setRemainingUSD] = useState("0.00");

	// PayPal client token + env (from backend) + diag
	const [clientToken, setClientToken] = useState(null);
	const [isLive, setIsLive] = useState(null);
	const [tokenError, setTokenError] = useState(null);
	const [reloadKey, setReloadKey] = useState(0);

	// Wallet-only fallback (retry without card-fields & without client-token)
	const [walletOnly, setWalletOnly] = useState(false);

	const isArabic = chosenLanguage === "Arabic";
	const locale = isArabic ? "ar_EG" : "en_US";
	const numberLocale = "en-US";
	const dateLocale = isArabic ? "ar-EG-u-nu-latn" : "en-US";
	const formatNumber = (value, options = {}) => {
		const num = Number(value);
		if (!Number.isFinite(num)) return "0";
		return new Intl.NumberFormat(numberLocale, options).format(num);
	};
	const formatMoney = (value) =>
		formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const formatDate = (value) => {
		if (!value) return isArabic ? "غير متوفر" : "Not available";
		const dt = new Date(value);
		if (Number.isNaN(dt.getTime())) {
			return isArabic ? "غير متوفر" : "Not available";
		}
		const formatter = new Intl.DateTimeFormat(dateLocale, {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
		if (!isArabic) return formatter.format(dt);
		return formatter.formatToParts(dt).map((part, index) => {
			if (part.type === "day" || part.type === "year") {
				return (
					<span key={`${part.type}-${index}`} className='latin-digits'>
						{part.value}
					</span>
				);
			}
			return part.value;
		});
	};

	const totalSar = Number(reservationData?.total_amount || 0);
	const paidSar = Number(reservationData?.paid_amount || 0);
	const remainingSar = Math.max(totalSar - paidSar, 0);
	const hasPaidAmount = paidSar > 0;
	const hasPartialBalance = hasPaidAmount && remainingSar > 0;
	const isFullyPaid = totalSar > 0 && paidSar >= totalSar;

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
							data.pickedRoomsType,
						);
						setDefaultDeposit(defaultDeposit);
					}
				}
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error("Error fetching reservation:", e);
				message.error(
					isArabic
						? "حدث خطأ أثناء تحميل الحجز"
						: "Failed to load reservation.",
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

			if (Number.isFinite(totalAmount) && pct > 0) {
				depositToUse = totalAmount * (pct / 100);
			} else if (Number.isFinite(adv) && adv > 0) {
				depositToUse = adv;
			}
		}
		const normalized = Number.isFinite(depositToUse) ? depositToUse : 0;
		setEffectiveDeposit(Number(normalized.toFixed(2)));
	}, [reservationData, defaultDeposit]);

	/* 3) SAR → USD conversions with robust fallback (never 0.00) */
	useEffect(() => {
		const doConversion = async () => {
			if (!reservationData) return;

			const fullTotalSAR = Number(reservationData.total_amount || 0);
			const depositSAR = Number(effectiveDeposit || 0);
			const paidSAR = Number(reservationData.paid_amount || 0);
			const remainingSAR = Math.max(fullTotalSAR - paidSAR, 0);
			const includeRemaining = remainingSAR > 0;

			// Start with safe fallbacks so UI never blanks out
			let totalU = toUSD(fullTotalSAR);
			let effU = toUSD(depositSAR);
			let remainingU = includeRemaining ? toUSD(remainingSAR) : 0;

			try {
				const amounts = [fullTotalSAR, depositSAR];
				if (includeRemaining) amounts.push(remainingSAR);
				const conversions = await currencyConversion(amounts);
				const fromApiTotal = Number(conversions?.[0]?.amountInUSD);
				const fromApiDeposit = Number(conversions?.[1]?.amountInUSD);
				const fromApiRemaining = includeRemaining
					? Number(conversions?.[2]?.amountInUSD)
					: 0;

				// Prefer API values when they’re valid & positive
				if (Number.isFinite(fromApiTotal) && fromApiTotal > 0) {
					totalU = fromApiTotal;
				}
				if (Number.isFinite(fromApiDeposit) && fromApiDeposit > 0) {
					effU = fromApiDeposit;
				}
				if (
					includeRemaining &&
					Number.isFinite(fromApiRemaining) &&
					fromApiRemaining > 0
				) {
					remainingU = fromApiRemaining;
				}
			} catch (err) {
				// eslint-disable-next-line no-console
				console.warn("Currency conversion failed; using fallback rate.", err);
			}

			const fallbackTotal = toUSD(fullTotalSAR);
			const fallbackDeposit = toUSD(depositSAR);
			const fallbackRemaining = includeRemaining ? toUSD(remainingSAR) : 0;

			if (fullTotalSAR > 0 && !(Number(totalU) > 0)) {
				totalU = fallbackTotal;
			}
			if (depositSAR > 0 && !(Number(effU) > 0)) {
				effU = fallbackDeposit;
			}
			if (includeRemaining && remainingSAR > 0 && !(Number(remainingU) > 0)) {
				remainingU = fallbackRemaining;
			}

			setTotalUSD((Number(totalU) || 0).toFixed(2));
			setEffectiveDepositUSD((Number(effU) || 0).toFixed(2));
			setRemainingUSD(
				includeRemaining ? (Number(remainingU) || 0).toFixed(2) : "0.00",
			);
		};
		doConversion();
	}, [reservationData, effectiveDeposit]);

	useEffect(() => {
		if (!reservationData) return;
		if (hasPartialBalance) {
			if (selectedOption !== "acceptRemaining") {
				setSelectedOption("acceptRemaining");
			}
			return;
		}
		if (isFullyPaid) {
			setSelectedOption(null);
			return;
		}
		if (selectedOption === "acceptRemaining") {
			setSelectedOption(null);
		}
	}, [hasPartialBalance, isFullyPaid, reservationData, selectedOption]);

	/* 4) PayPal client token + env (with diagnostics) */
	useEffect(() => {
		const init = async () => {
			try {
				const tokenResp = await getPayPalClientToken();
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
						env,
					);
				}

				setClientToken(token);
				setIsLive(env === "live");

				const feClientId =
					env === "live"
						? process.env.REACT_APP_PAYPAL_CLIENT_ID_LIVE
						: process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX;
				// eslint-disable-next-line no-console
				console.log(
					"[PP][diag] FE clientIdSig:",
					idSig(feClientId || "na"),
					"env:",
					env,
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

	const computedDepositUSD = useMemo(() => {
		const usd = Number(effectiveDepositUSD);
		if (Number.isFinite(usd) && usd > 0) return usd.toFixed(2);
		const fallback = toUSD(effectiveDeposit);
		return Number.isFinite(fallback) && fallback > 0
			? fallback.toFixed(2)
			: "0.00";
	}, [effectiveDepositUSD, effectiveDeposit]);

	const selectedUsdAmount = useMemo(() => {
		const val =
			selectedOption === "acceptRemaining"
				? remainingUSD
				: selectedOption === "acceptDeposit"
					? computedDepositUSD
					: totalUSD;
		const n = Number(val);
		return Number.isFinite(n) ? n.toFixed(2) : "0.00";
	}, [selectedOption, computedDepositUSD, remainingUSD, totalUSD]);

	const selectedSarAmount = useMemo(() => {
		if (selectedOption === "acceptRemaining") return remainingSar;
		return selectedOption === "acceptDeposit" ? effectiveDeposit : totalSar;
	}, [selectedOption, effectiveDeposit, remainingSar, totalSar]);

	const allowInteract =
		!!selectedOption && !!guestAgreed && Number(selectedUsdAmount) > 0;

	/* Inner PayPal area */
	const PayArea = () => {
		const [{ isResolved, isRejected, options }] = usePayPalScriptReducer();

		const requireSelectionAndTerms = () => {
			if (!selectedOption) {
				message.error(
					isArabic ? "اختر خيار الدفع" : "Please choose a payment option.",
				);
				return false;
			}
			if (!guestAgreed) {
				message.error(
					t.acceptTerms ||
						(isArabic
							? "يرجى الموافقة على الشروط والأحكام"
							: "Please accept the Terms & Conditions"),
				);
				return false;
			}
			if (!(Number(selectedUsdAmount) > 0)) {
				message.error(
					isArabic
						? "قيمة الدفع غير صالحة"
						: "Payment amount is not valid yet.",
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
			const guestEmail = reservationData?.customer_details?.email || "";
			const guestNationality =
				reservationData?.customer_details?.nationality || "";
			const reservedBy = reservationData?.customer_details?.reservedBy || "";
			const checkin = reservationData?.checkin_date;
			const checkout = reservationData?.checkout_date;

			const purchase_units = [
				{
					reference_id: "default",
					invoice_id: `RSV-${conf}`,
					custom_id: conf,
					description: `Hotel reservation — ${hotelName} — ${checkin} → ${checkout} — Guest ${guestName} (Phone: ${guestPhone}, Email: ${guestEmail || "n/a"}, Nat: ${guestNationality || "n/a"}, By: ${reservedBy || "n/a"})`,
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
							description: `Guest: ${guestName}, Phone: ${guestPhone}, Email: ${guestEmail || "n/a"}, Nat: ${guestNationality || "n/a"}, By: ${reservedBy || "n/a"}, ${checkin} → ${checkout}, Conf: ${conf}`,
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

			const intent = PAY_MODE.toUpperCase(); // "CAPTURE" or "AUTHORIZE"

			// For wallet buttons, let the SDK create the order
			if (actions?.order) {
				return actions.order.create({
					intent,
					purchase_units,
					application_context: {
						brand_name: "Jannat Booking",
						user_action: "PAY_NOW",
						shipping_preference: "NO_SHIPPING",
					},
				});
			}

			// For Hosted Card Fields, create order server-side and return id
			const res = await fetch(
				`${process.env.REACT_APP_API_URL}/paypal/order/create`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						intent,
						purchase_units,
						application_context: {
							brand_name: "Jannat Booking",
							user_action: "PAY_NOW",
							shipping_preference: "NO_SHIPPING",
						},
						payment_source: {
							card: {
								attributes: { vault: { store_in_vault: "ON_SUCCESS" } },
							},
						},
					}),
				},
			);
			const json = await res.json();
			if (!res.ok || !json?.id) {
				throw new Error(
					json?.message || "Server failed to create PayPal order",
				);
			}
			return json.id;
		};

		const onApprove = async ({ orderID }) => {
			try {
				const isRemainingPayment = selectedOption === "acceptRemaining";
				const option =
					selectedOption === "acceptDeposit" || isRemainingPayment
						? "deposit"
						: "full";
				const payload = {
					reservationKey:
						reservationData?._id ||
						reservationData?.confirmation_number ||
						reservationId,
					option,
					convertedAmounts: {
						depositUSD: isRemainingPayment ? remainingUSD : computedDepositUSD,
						totalUSD,
					},
					sarAmount: Number(selectedSarAmount).toFixed(2),
					paypal: {
						order_id: orderID,
						expectedUsdAmount: selectedUsdAmount,
						cmid: getCMID(),
						mode: PAY_MODE, // 👈 capture or authorize (switchable)
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
					setTimeout(() => window.location.reload(), 900);
				} else {
					message.error(
						resp?.message ||
							(isArabic ? "تعذر إتمام الدفع" : "Payment failed."),
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
				isArabic ? "خطأ في الدفع عبر PayPal" : "PayPal payment error.",
			);
		};

		if (isRejected) {
			try {
				const p = new URL("https://www.paypal.com/sdk/js");
				Object.entries(options || {}).forEach(([k, v]) => {
					if (v == null || v === "") return;
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
			return null;
		}

		if (!isResolved) return <Spin />;

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
	const merchantId =
		(isLive
			? process.env.REACT_APP_PAYPAL_MERCHANT_ID_LIVE
			: process.env.REACT_APP_PAYPAL_MERCHANT_ID_SANDBOX) || "";
	const merchantIdOption = merchantId ? { "merchant-id": merchantId } : {};

	const primaryOptions =
		clientToken && isLive != null && !walletOnly
			? {
					"client-id": feClientId,
					"data-client-token": clientToken,
					components: "buttons,card-fields,applepay",
					currency: "USD",
					intent: PAY_MODE, // 👈 capture or authorize
					commit: true,
					"enable-funding": "paypal,card",
					"disable-funding": "credit,venmo,paylater",
					locale,
					...merchantIdOption,
				}
			: null;

	const fallbackOptions =
		isLive != null && walletOnly
			? {
					"client-id": feClientId,
					components: "buttons,applepay",
					currency: "USD",
					intent: PAY_MODE, // 👈 capture or authorize
					commit: true,
					"enable-funding": "paypal,card",
					"disable-funding": "credit,venmo,paylater",
					locale,
					...merchantIdOption,
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
							<span className='latin-digits' dir='ltr'>
								<bdi>{reservationData.confirmation_number}</bdi>
							</span>
						</InfoRow>
						<InfoRow>
							<strong>{isArabic ? "اسم الضيف:" : "Guest Name:"}</strong>
							<span>{reservationData.customer_details?.name}</span>
						</InfoRow>
						<InfoRow>
							<strong>{isArabic ? "تاريخ الوصول:" : "Check-in Date:"}</strong>
							<span>{formatDate(reservationData.checkin_date)}</span>
						</InfoRow>
						<InfoRow>
							<strong>
								{isArabic ? "تاريخ المغادرة:" : "Check-out Date:"}
							</strong>
							<span>{formatDate(reservationData.checkout_date)}</span>
						</InfoRow>
						<InfoRow>
							<strong>{isArabic ? "الجنسية:" : "Nationality:"}</strong>
							<span>{reservationData.customer_details?.nationality}</span>
						</InfoRow>
						<InfoRow>
							<strong>{isArabic ? "إجمالي المبلغ:" : "Total Amount:"}</strong>
							<span className='latin-digits' dir='ltr'>
								<bdi>{formatMoney(reservationData.total_amount)}</bdi> SAR
							</span>
						</InfoRow>
						{hasPaidAmount && (
							<InfoRow>
								<strong>{isArabic ? "المبلغ المدفوع:" : "Paid Amount:"}</strong>
								<span className='latin-digits' dir='ltr'>
									<bdi>{formatMoney(paidSar)}</bdi> SAR
								</span>
							</InfoRow>
						)}

						{isFullyPaid ? (
							<ThankYou>
								{isArabic
									? `شكرًا على الدفع ${reservationData.customer_details?.name}!`
									: `Thank you for your payment ${reservationData.customer_details?.name}!`}
							</ThankYou>
						) : (
							<>
								<SubHeader>
									{hasPartialBalance
										? isArabic
											? "ادفع المبلغ المتبقي"
											: "Pay Remaining Amount"
										: isArabic
											? "اختر خيار الدفع"
											: "Choose Payment Option"}
								</SubHeader>

								{hasPartialBalance ? (
									<Option
										onClick={() => setSelectedOption("acceptRemaining")}
										selected={selectedOption === "acceptRemaining"}
									>
										<input
											type='radio'
											readOnly
											checked={selectedOption === "acceptRemaining"}
										/>
										<label>
											<span className='option-title'>
												{isArabic ? "المبلغ المتبقي" : "Remaining Amount"}
											</span>
											<span className='option-amounts' dir='ltr'>
												<bdi className='latin-digits'>{remainingUSD}</bdi> USD{" "}
												<span className='sar'>
													(
													<bdi className='latin-digits'>
														{formatNumber(remainingSar, {
															maximumFractionDigits: 2,
														})}
													</bdi>{" "}
													SAR)
												</span>
											</span>
										</label>
									</Option>
								) : (
									<>
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
												<span className='option-title'>
													{isArabic ? "دفعة مقدمة" : "Deposit"}
												</span>
											<span className='option-amounts' dir='ltr'>
												<bdi className='latin-digits'>
													{computedDepositUSD}
												</bdi>{" "}
													USD{" "}
													<span className='sar'>
														(
														<bdi className='latin-digits'>
															{formatNumber(effectiveDeposit, {
																maximumFractionDigits: 2,
															})}
														</bdi>{" "}
														SAR)
													</span>
												</span>
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
												<span className='option-title'>
													{isArabic ? "المبلغ الكامل" : "Full Amount"}
												</span>
												<span className='option-amounts' dir='ltr'>
													<bdi className='latin-digits'>{totalUSD}</bdi> USD{" "}
													<span className='sar'>
														(
														<bdi className='latin-digits'>
															{formatNumber(reservationData.total_amount, {
																maximumFractionDigits: 2,
															})}
														</bdi>{" "}
														SAR)
													</span>
												</span>
											</label>
										</Option>
									</>
								)}

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
									<ScriptShell
										key={`${reloadKey}-${walletOnly ? "w" : "p"}-${PAY_MODE}`}
									>
										<PayPalScriptProvider options={scriptOptions}>
											<PayArea />
											<ApplePayButton
												labels={{
													selectOption: isArabic
														? "يرجى اختيار خيار الدفع أولاً."
														: "Please choose a payment option first.",
													acceptTerms:
														t.acceptTerms ||
														(isArabic
															? "يرجى الموافقة على الشروط والأحكام."
															: "Please accept the Terms & Conditions."),
													amountInvalid: isArabic
														? "قيمة الدفع غير صالحة."
														: "Payment amount is not valid.",
													notAvailable: isArabic
														? "Apple Pay غير متاح على هذا الجهاز."
														: "Apple Pay is not available on this device.",
													paymentFailed: isArabic
														? "تعذر إتمام الدفع."
														: "Payment failed.",
													paymentSuccess: isArabic
														? "تم الدفع بنجاح!"
														: "Payment successful!",
												}}
												allowInteract={allowInteract}
												selectedOption={selectedOption}
												guestAgreed={guestAgreed}
												selectedUsdAmount={selectedUsdAmount}
												selectedSarAmount={selectedSarAmount}
												effectiveDepositUSD={computedDepositUSD}
												remainingUSD={remainingUSD}
												totalUSD={totalUSD}
												PAY_MODE={PAY_MODE}
												reservationData={reservationData}
												reservationId={reservationId}
												getCMID={getCMID}
												payReservationViaPayPalLink={
													payReservationViaPayPalLink
												}
											/>
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
	direction: ${(props) => (props.dir === "rtl" ? "rtl" : "ltr")};
	text-align: ${(props) => (props.dir === "rtl" ? "right" : "left")};
	.latin-digits {
		font-family: "Montserrat", "Poppins", sans-serif;
		font-variant-numeric: lining-nums;
		direction: ltr;
		unicode-bidi: isolate;
	}
	&[dir="rtl"] {
		.ant-alert,
		.ant-alert-message,
		.ant-alert-description,
		.ant-checkbox-wrapper {
			direction: rtl;
			text-align: right;
		}
		.option-amounts {
			text-align: right;
		}
		.ant-checkbox + span {
			padding-right: 8px;
			padding-left: 0;
		}
	}
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
	span {
		text-transform: capitalize;
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
		gap: 3px;
		text-align: start;
	}
	label .option-title {
		font-weight: 600;
	}
	label .option-amounts {
		font-weight: 700;
		color: #0f172a;
		display: block;
	}
	label .option-amounts .sar {
		color: #334155;
		font-weight: 600;
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
