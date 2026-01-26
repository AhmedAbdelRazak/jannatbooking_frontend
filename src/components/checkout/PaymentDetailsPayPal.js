// src/components/checkout/PaymentDetailsPayPal.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import styled from "styled-components";
import { Spin, message, Alert } from "antd";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
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
import {
	getPayPalClientToken,
	preparePayPalPendingReservation,
	cancelPayPalPendingReservation,
} from "../../apiCore";

// --- helpers ---
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
const mapLocale = (isArabic) => (isArabic ? "ar_EG" : "en_US");

// --- Card submit button (compatible with old+new CardFields contexts) ---
function CardSubmit({ allowInteract, labels }) {
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
		if (!allowInteract || typeof submitFn !== "function") return;
		setBusy(true);
		try {
			if (cardFieldsForm?.getState) {
				const state = await cardFieldsForm.getState();
				if (state && !state.isFormValid) {
					message.error(
						labels?.incomplete || "Please complete your card details."
					);
					setBusy(false);
					return;
				}
			}
			await submitFn();
		} catch (e) {
			console.error("CardFields submit error:", e);
			message.error(labels?.failed || "Card payment failed.");
		} finally {
			setBusy(false);
		}
	};

	const disabled = !allowInteract || !ready || busy;
	return (
		<PayCardButton
			type='button'
			onClick={submit}
			disabled={disabled}
			aria-disabled={disabled}
		>
			{busy
				? labels?.processing || "Processing…"
				: labels?.pay || "Pay by Card"}
		</PayCardButton>
	);
}

/**
 * Drop-in PayPal checkout that supports:
 *  - payMode="capture" | "authorize" (default "capture")
 *  - Deposit=15% logic preserved
 *  - Clear amount-bar above the buttons
 */
export default function PaymentDetailsPayPal({
	chosenLanguage,
	selectedPaymentOption,
	guestAgreedOnTermsAndConditions = true,
	depositAmount, // kept for compatibility (not used for deposit math)
	total_price_with_commission,
	convertedAmounts = {},
	createUncompletedDocument,
	getPendingReservationPayload,
	onPayApproved, // parent handler will call the right backend endpoint
	payMode = "capture", // <<< NEW: default capture
}) {
	const isArabic = chosenLanguage === "Arabic";
	const locale = mapLocale(isArabic);

	// Deposit = 15% of total
	const DEPOSIT_PERCENT = 0.15;
	const totalSar = useMemo(
		() => Number(total_price_with_commission ?? 0),
		[total_price_with_commission]
	);
	const totalUsd = useMemo(
		() => Number(convertedAmounts?.totalUSD ?? 0),
		[convertedAmounts]
	);
	const sarDeposit15 = useMemo(
		() => Number((totalSar * DEPOSIT_PERCENT).toFixed(2)),
		[totalSar]
	);
	const usdDeposit15 = useMemo(
		() => Number((totalUsd * DEPOSIT_PERCENT).toFixed(2)),
		[totalUsd]
	);
	const pretty = (n) => Number(n || 0).toFixed(2);
	const truncateText = (value, max = 127) => {
		if (value == null) return "";
		const str = String(value);
		if (str.length <= max) return str;
		const suffix = "...";
		return `${str.slice(0, Math.max(0, max - suffix.length))}${suffix}`;
	};
	const buildInvoiceId = (confirmation) => {
		const tail = Date.now().toString(36).slice(-6).toUpperCase();
		return `RSV-${confirmation}-${tail}`.slice(0, 127);
	};

	// Intent based on payMode (CAPTURE by default)
	const INTENT =
		payMode?.toUpperCase() === "AUTHORIZE" ? "AUTHORIZE" : "CAPTURE";
	const isAuthorize = INTENT === "AUTHORIZE";

	// Client token & env from backend
	const [clientToken, setClientToken] = useState(null);
	const [isLive, setIsLive] = useState(null);
	const [tokenError, setTokenError] = useState(null);
	const [reloadKey, setReloadKey] = useState(0);
	const [walletOnly, setWalletOnly] = useState(false);
	const pendingRef = useRef({
		pendingReservationId: null,
		confirmation_number: null,
		invoice_id: null,
		payload: null,
	});

	const ensurePendingReservation = useCallback(async () => {
		if (
			pendingRef.current?.pendingReservationId &&
			pendingRef.current?.confirmation_number
		) {
			return pendingRef.current;
		}
		if (typeof getPendingReservationPayload !== "function") {
			throw new Error("Missing reservation payload builder.");
		}
		const payload = getPendingReservationPayload();
		if (!payload) {
			throw new Error("Missing reservation details.");
		}
		const resp = await preparePayPalPendingReservation(payload);
		const pendingReservationId =
			resp?.pendingReservationId || resp?.tempReservationId || resp?.id || null;
		const confirmation_number = resp?.confirmation_number || null;
		if (!pendingReservationId || !confirmation_number) {
			throw new Error("Failed to prepare pending reservation.");
		}
		pendingRef.current = {
			pendingReservationId,
			confirmation_number,
			invoice_id: null,
			payload,
		};
		return pendingRef.current;
	}, [getPendingReservationPayload, preparePayPalPendingReservation]);

	const cancelPendingReservation = useCallback(async () => {
		const pendingReservationId = pendingRef.current?.pendingReservationId;
		const confirmation_number = pendingRef.current?.confirmation_number;
		if (!pendingReservationId && !confirmation_number) return;
		try {
			await cancelPayPalPendingReservation({
				pendingReservationId,
				confirmation_number,
			});
		} catch (e) {
			console.warn("Pending reservation cancel failed:", e?.message || e);
		} finally {
			pendingRef.current = {
				pendingReservationId: null,
				confirmation_number: null,
				invoice_id: null,
				payload: null,
			};
		}
	}, [cancelPayPalPendingReservation]);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const tok = await getPayPalClientToken();
				const ct = typeof tok === "string" ? tok : tok?.clientToken;
				let env = (tok?.env || "").toLowerCase();
				if (!ct) throw new Error("Missing PayPal client token");

				if (env !== "live" && env !== "sandbox") {
					const node = (process.env.REACT_APP_NODE_ENV || "").toUpperCase();
					env = node === "PRODUCTION" ? "live" : "sandbox";
				}
				if (mounted) {
					setClientToken(ct);
					setIsLive(env === "live");
				}
				const feClientId =
					env === "live"
						? process.env.REACT_APP_PAYPAL_CLIENT_ID_LIVE
						: process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX;
				console.log(
					"[PP][diag] FE clientIdSig:",
					idSig(feClientId || "na"),
					"BE clientIdSig:",
					tok?.diag?.clientIdSig || "(n/a)",
					"env:",
					env,
					"cached:",
					!!tok?.cached
				);
			} catch (e) {
				console.error("PayPal init failed:", e);
				setTokenError(e);
				if (mounted) {
					message.error(isArabic ? "فشل تهيئة PayPal" : "PayPal init failed.");
				}
			}
		})();
		return () => {
			mounted = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isArabic, reloadKey]);

	useEffect(() => {
		return () => {
			cancelPendingReservation();
		};
	}, [cancelPendingReservation]);

	// Amounts to pay now
	const selectedUsdAmount = useMemo(() => {
		if (selectedPaymentOption === "acceptDeposit") return pretty(usdDeposit15);
		if (selectedPaymentOption === "acceptPayWholeAmount")
			return pretty(totalUsd);
		return "0.00";
	}, [selectedPaymentOption, usdDeposit15, totalUsd]);

	const selectedSarAmount = useMemo(() => {
		if (selectedPaymentOption === "acceptDeposit")
			return Number(pretty(sarDeposit15));
		if (selectedPaymentOption === "acceptPayWholeAmount")
			return Number(pretty(totalSar));
		return 0;
	}, [selectedPaymentOption, sarDeposit15, totalSar]);

	const allowInteract =
		(selectedPaymentOption === "acceptDeposit" ||
			selectedPaymentOption === "acceptPayWholeAmount") &&
		guestAgreedOnTermsAndConditions &&
		Number(selectedUsdAmount) > 0;

	const reloadPayment = useCallback(() => {
		setReloadKey((k) => k + 1);
		setClientToken(null);
		setIsLive(null);
		setTokenError(null);
		setWalletOnly(false);
		cancelPendingReservation();
	}, [cancelPendingReservation]);

	const getCMID = () => {
		try {
			return window?.paypal?.getClientMetadataID?.();
		} catch {
			return null;
		}
	};

	const PayArea = () => {
		const [{ isResolved, isRejected, options }] = usePayPalScriptReducer();

		const requireSelectionAndTerms = () => {
			const optionOK =
				selectedPaymentOption === "acceptDeposit" ||
				selectedPaymentOption === "acceptPayWholeAmount";
			if (!optionOK) {
				message.error(
					isArabic ? "اختر خيار الدفع" : "Please choose a payment option."
				);
				return false;
			}
			if (!guestAgreedOnTermsAndConditions) {
				message.error(
					isArabic
						? "يرجى الموافقة على الشروط والأحكام"
						: "Please accept the Terms & Conditions."
				);
				return false;
			}
			if (!onPayApproved) {
				message.error("Missing onPayApproved handler.");
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

		const buildPurchaseUnits = (label, pendingMeta) => {
			const payload = pendingMeta?.payload || {};
			const guest = payload.customerDetails || payload.customer_details || {};
			const conf = pendingMeta?.confirmation_number || "";
			const hotelName =
				payload.hotelName || payload.hotel_name || "Hotel Reservation";
			const checkin = payload.checkin_date || "";
			const checkout = payload.checkout_date || "";
			const guestName = guest.name || "Guest";
			const guestPhone = guest.phone || "";
			const guestEmail = guest.email || "";
			const guestNationality = guest.nationality || "";
			const reservedBy = guest.reservedBy || "";

			const description = truncateText(
				`Hotel reservation - ${hotelName} (${label}) - ${checkin} -> ${checkout} - Guest ${guestName} (Phone: ${guestPhone}, Email: ${
					guestEmail || "n/a"
				}, Nat: ${guestNationality || "n/a"}, By: ${
					reservedBy || "n/a"
				})`
			);
			const itemDescription = truncateText(
				`Guest: ${guestName}, Phone: ${guestPhone}, Email: ${
					guestEmail || "n/a"
				}, Nat: ${guestNationality || "n/a"}, By: ${
					reservedBy || "n/a"
				}, ${checkin} -> ${checkout}, Conf: ${conf}`
			);

			return [
				{
					reference_id: "default",
					invoice_id: pendingMeta?.invoice_id || `RSV-${conf}`,
					custom_id: conf,
					description,
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
							name: `${hotelName} - ${label}`,
							description: itemDescription,
							quantity: "1",
							unit_amount: {
								currency_code: "USD",
								value: String(selectedUsdAmount),
							},
							category: "DIGITAL_GOODS",
							sku: conf ? `CNF-${conf}` : undefined,
						},
					],
				},
			];
		};

		const createOrder = async (_data, actions) => {
			if (!requireSelectionAndTerms()) return;

			const label =
				selectedPaymentOption === "acceptDeposit"
					? isArabic
						? "دفعة مقدمة (15%)"
						: "Deposit (15%)"
					: isArabic
						? "المبلغ الكامل"
						: "Full Amount";

			createUncompletedDocument?.(`PayPal createOrder — ${label}`);
			let pendingMeta;
			try {
				pendingMeta = await ensurePendingReservation();
			} catch (err) {
				message.error(err?.message || "Failed to prepare reservation.");
				return;
			}
			const invoice_id = buildInvoiceId(pendingMeta.confirmation_number);
			pendingRef.current.invoice_id = invoice_id;
			const purchase_units = buildPurchaseUnits(label, {
				...pendingMeta,
				invoice_id,
			});

			if (actions?.order) {
				// Buttons flow
				return actions.order.create({
					intent: INTENT,
					purchase_units,
					application_context: {
						user_action: "PAY_NOW",
						shipping_preference: "NO_SHIPPING",
						brand_name: "Jannat Booking",
					},
				});
			}

			// Card fields flow: create on server
			const res = await fetch(
				`${process.env.REACT_APP_API_URL}/paypal/order/create`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						intent: INTENT,
						purchase_units,
						application_context: {
							user_action: "PAY_NOW",
							shipping_preference: "NO_SHIPPING",
							brand_name: "Jannat Booking",
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

		const onApprove = async (data) => {
			try {
				if (!onPayApproved) {
					message.error("Missing onPayApproved handler.");
					return;
				}
				const optionNormalized =
					selectedPaymentOption === "acceptDeposit"
						? "deposit"
						: selectedPaymentOption === "acceptPayWholeAmount"
							? "full"
							: null;

				const pendingReservationId =
					pendingRef.current?.pendingReservationId || null;
				const confirmation_number =
					pendingRef.current?.confirmation_number || null;
				const invoice_id = pendingRef.current?.invoice_id || null;

				const payload = {
					option: optionNormalized,
					convertedAmounts,
					sarAmount: Number(selectedSarAmount).toFixed(2),
					pendingReservationId,
					confirmation_number,
					paypal: {
						order_id: data?.orderID,
						expectedUsdAmount: String(selectedUsdAmount),
						cmid: getCMID(),
						mode: isAuthorize ? "authorize" : "capture", // <<< tell the handler which backend endpoint to call
						invoice_id,
					},
				};

				await onPayApproved(payload);

				pendingRef.current = {
					pendingReservationId: null,
					confirmation_number: null,
					invoice_id: null,
					payload: null,
				};

				ReactGA.event({
					category: "Reservation Payment",
					action: isAuthorize
						? "Checkout Authorize Success"
						: "Checkout Capture Success",
					label: optionNormalized,
					value: Number(selectedSarAmount),
				});
				ReactPixel.track(isAuthorize ? "Authorize" : "Purchase", {
					value: Number(selectedSarAmount),
					currency: "SAR",
				});

				message.success(
					isAuthorize
						? isArabic
							? "تم تفويض البطاقة بنجاح!"
							: "Card authorized successfully!"
						: isArabic
							? "تم الدفع بنجاح!"
							: "Payment successful!"
				);
			} catch (e) {
				console.error("PayPal onApprove error:", e);
				await cancelPendingReservation();
				message.error(
					e?.message ||
						(isArabic
							? "تعذر إتمام العملية"
							: "Payment could not be completed.")
				);
			}
		};

		const onError = async (e) => {
			console.error("PayPal error:", e);
			await cancelPendingReservation();
			message.error(
				isArabic ? "خطأ في الدفع عبر PayPal" : "PayPal payment error."
			);
		};

		if (isRejected) {
			try {
				const p = new URL("https://www.paypal.com/sdk/js");
				Object.entries(options || {}).forEach(([k, v]) => {
					if (v == null || v === "") return;
					p.searchParams.set(k, String(v));
				});
				console.log("[PP][script] url:", p.toString(), {
					options,
					isRejected,
					isResolved: false,
				});
			} catch {}
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
									: "We’ll try a wallet-only fallback. If it persists, disable ad blockers or try another network."
							}
						/>
						<div style={{ textAlign: "center", marginTop: 10 }}>
							<ReloadBtn onClick={() => setWalletOnly(true)}>
								{isArabic
									? "متابعة بالأزرار فقط"
									: "Continue with buttons only"}
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

		// Inline card fields eligibility
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
				{/* amount bar */}
				{allowInteract ? (
					<AmountBar>
						<AmountLine>
							{selectedPaymentOption === "acceptDeposit"
								? isArabic
									? "ستدفع الآن (عربون 15%): "
									: "You will pay now (Deposit 15%): "
								: isArabic
									? "ستدفع الآن (المبلغ الكامل): "
									: "You will pay now (Full amount): "}
							<strong>
								SAR {pretty(selectedSarAmount)} • USD{" "}
								{pretty(selectedUsdAmount)}
							</strong>
						</AmountLine>
					</AmountBar>
				) : null}

				<ButtonsBox>
					{/* PayPal wallet */}
					<PayPalButtons
						fundingSource='paypal'
						style={{ layout: "vertical", label: "paypal" }}
						createOrder={createOrder}
						onApprove={onApprove}
						onError={onError}
						onCancel={cancelPendingReservation}
						disabled={!allowInteract}
					/>
					{/* Pay with card (hosted button) */}
					<PayPalButtons
						fundingSource='card'
						style={{ layout: "vertical", label: "pay" }}
						createOrder={createOrder}
						onApprove={onApprove}
						onError={onError}
						onCancel={cancelPendingReservation}
						disabled={!allowInteract}
					/>
				</ButtonsBox>

				<BrandFootnote>
					Powered by <b>PayPal</b>
				</BrandFootnote>
				<Divider />

				{/* Inline card fields (if available) */}
				{supportsCardFields && !walletOnly ? (
					<CardBox
						dir={isArabic ? "rtl" : "ltr"}
						aria-disabled={!allowInteract}
					>
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
								<CardSubmit
									allowInteract={allowInteract}
									labels={{
										pay: isArabic
											? `ادفع ${pretty(selectedSarAmount)} SAR (${pretty(selectedUsdAmount)} USD) بالبطاقة`
											: `Pay SAR ${pretty(selectedSarAmount)} (USD ${pretty(selectedUsdAmount)}) by Card`,
										processing: isArabic ? "جار المعالجة..." : "Processing…",
										incomplete: isArabic
											? "يرجى إكمال بيانات البطاقة."
											: "Please complete your card details.",
										failed: isArabic
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
									? 'يرجى استخدام أزرار "PayPal" أو "Pay" بالأعلى لإتمام الدفع.'
									: 'Please use the "PayPal" or "Pay" (card) buttons above to complete payment.'
							}
						/>
					</div>
				)}
			</>
		);
	};

	if (tokenError) {
		return (
			<Centered>
				<Alert
					type='error'
					showIcon
					message={
						isArabic ? "فشل تهيئة PayPal" : "PayPal initialization failed"
					}
					description={
						isArabic ? "يرجى المحاولة مرة أخرى." : "Please try again."
					}
				/>
				<div style={{ marginTop: 10 }}>
					<ReloadBtn onClick={reloadPayment}>
						{isArabic ? "إعادة المحاولة" : "Try again"}
					</ReloadBtn>
				</div>
			</Centered>
		);
	}

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
					intent: INTENT.toLowerCase(),
					commit: true,
					"enable-funding": "paypal,card",
					"disable-funding": "credit,venmo,paylater",
					locale,
				}
			: null;

	const fallbackOptions =
		isLive != null && walletOnly
			? {
					"client-id": feClientId,
					components: "buttons",
					currency: "USD",
					intent: INTENT.toLowerCase(),
					commit: true,
					"enable-funding": "paypal,card",
					"disable-funding": "credit,venmo,paylater",
					locale,
				}
			: null;

	const paypalOptions = primaryOptions || fallbackOptions;
	if (!paypalOptions)
		return (
			<Centered>
				<Spin />
			</Centered>
		);

	return (
		<ScriptShell key={`${reloadKey}-${walletOnly ? "w" : "p"}-${INTENT}`}>
			<PayPalScriptProvider options={paypalOptions}>
				<PayArea />
			</PayPalScriptProvider>
		</ScriptShell>
	);
}

/* styles (same as before) */
const ScriptShell = styled.div`
	width: 100%;
	margin-top: 30px;
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
	border: 1.25px solid #e9eef3;
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
	}
	.hosted:focus-within {
		border-color: #1677ff;
		box-shadow: 0 0 0 4px rgba(22, 119, 255, 0.12);
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
	padding: 10px 0;
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
const AmountBar = styled.div`
	width: 100%;
	max-width: 520px;
	margin: 0 auto 10px auto;
	padding: 10px 12px;
	border: 1px solid #e6f0ff;
	background: #f6faff;
	border-radius: 10px;
	text-align: center;
`;
const AmountLine = styled.div`
	font-size: 14px;
	color: #0f172a;
`;
