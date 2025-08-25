// src/components/checkout/PaymentDetailsPayPal.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { getPayPalClientToken } from "../../apiCore";

/** Utility: pick a valid PayPal locale */
function mapLocale(isArabic) {
	return isArabic ? "ar_EG" : "en_US";
}

/** Non-crypto visible signature for quick FE vs BE app checks */
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

/** Submit button that works with both the new + legacy Card Fields contexts */
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
			await submitFn(); // 3‑D Secure if needed → then onApprove runs
		} catch (e) {
			// eslint-disable-next-line no-console
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
			title={!ready ? "Initializing secure card fields..." : undefined}
		>
			{busy
				? labels?.processing || "Processing…"
				: labels?.pay || "Pay by Card"}
		</PayCardButton>
	);
}

export default function PaymentDetailsPayPal(props) {
	const {
		chosenLanguage,
		selectedPaymentOption,
		guestAgreedOnTermsAndConditions = true,
		depositAmount,
		total_price_with_commission,
		convertedAmounts = {},
		createUncompletedDocument,
		onPayApproved, // parent must call your backend
	} = props;

	const isArabic = chosenLanguage === "Arabic";
	const locale = mapLocale(isArabic);

	// Single source of truth: AUTHORIZE (hold now, capture later)
	const INTENT = "AUTHORIZE";
	const isAuthorize = INTENT === "AUTHORIZE";

	// Client token + env coming from backend
	const [clientToken, setClientToken] = useState(null);
	const [isLive, setIsLive] = useState(null); // ← authoritative env from backend
	const [tokenError, setTokenError] = useState(null);
	const [reloadKey, setReloadKey] = useState(0); // for “Reload payment” action

	// Wallet-only fallback: if the SDK rejects with card-fields, retry with buttons only
	const [walletOnly, setWalletOnly] = useState(false);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const tok = await getPayPalClientToken(); // should return { clientToken, env, diag? }
				const ct = typeof tok === "string" ? tok : tok?.clientToken;
				let env = (tok?.env || "").toLowerCase(); // "live" | "sandbox"
				if (!ct) throw new Error("Missing PayPal client token");

				if (env !== "live" && env !== "sandbox") {
					const node = (process.env.REACT_APP_NODE_ENV || "").toUpperCase();
					env = node === "PRODUCTION" ? "live" : "sandbox";
					console.warn(
						"[PayPal] 'env' not returned by API. Falling back to",
						env
					);
				}

				if (mounted) {
					setClientToken(ct);
					setIsLive(env === "live");
				}

				// Optional FE/BE diag: show short signature of client-ids to spot mismatches
				const feClientId =
					env === "live"
						? process.env.REACT_APP_PAYPAL_CLIENT_ID_LIVE
						: process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX;
				// eslint-disable-next-line no-console
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
				// eslint-disable-next-line no-console
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

	const usdDeposit = useMemo(
		() =>
			convertedAmounts?.depositUSD != null
				? Number(convertedAmounts.depositUSD).toFixed(2)
				: "0.00",
		[convertedAmounts]
	);
	const usdTotal = useMemo(
		() =>
			convertedAmounts?.totalUSD != null
				? Number(convertedAmounts.totalUSD).toFixed(2)
				: "0.00",
		[convertedAmounts]
	);

	const selectedUsdAmount = useMemo(() => {
		if (selectedPaymentOption === "acceptDeposit") return usdDeposit;
		if (selectedPaymentOption === "acceptPayWholeAmount") return usdTotal;
		return "0.00";
	}, [selectedPaymentOption, usdDeposit, usdTotal]);

	const selectedSarAmount = useMemo(() => {
		if (selectedPaymentOption === "acceptDeposit")
			return Number(depositAmount ?? 0);
		if (selectedPaymentOption === "acceptPayWholeAmount")
			return Number(total_price_with_commission ?? 0);
		return 0;
	}, [selectedPaymentOption, depositAmount, total_price_with_commission]);

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
	}, []);

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

		const buildPurchaseUnits = (label) => [
			{
				reference_id: "default",
				description: `${isArabic ? "حجز فندقي" : "Hotel reservation"} — ${label}`,
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
						name: isArabic ? "حجز فندقي" : "Hotel Reservation",
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

		const createOrder = async (data, actions) => {
			if (!requireSelectionAndTerms()) return;

			const label =
				selectedPaymentOption === "acceptDeposit"
					? isArabic
						? "دفعة مقدمة"
						: "Deposit"
					: isArabic
						? "المبلغ الكامل"
						: "Full Amount";

			createUncompletedDocument?.(`PayPal createOrder — ${label}`);
			const purchase_units = buildPurchaseUnits(label);

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

			// Card Fields flow — create on the server and return order id
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

		const onApprove = async (data /* , actions */) => {
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

				const payload = {
					option: optionNormalized,
					convertedAmounts,
					sarAmount: Number(selectedSarAmount).toFixed(2),
					paypal: {
						order_id: data?.orderID,
						expectedUsdAmount: String(selectedUsdAmount),
						cmid: getCMID(),
						mode: isAuthorize ? "authorize" : "capture",
					},
				};

				await onPayApproved(payload);

				ReactGA.event({
					category: "Reservation Payment",
					action: "Checkout Pay Success",
					label: optionNormalized,
					value: Number(selectedSarAmount),
				});
				ReactPixel.track("Purchase", {
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
				// eslint-disable-next-line no-console
				console.error("PayPal onApprove error:", e);
				message.error(
					e?.message ||
						(isArabic
							? "تعذر إتمام العملية"
							: "Payment could not be completed.")
				);
			}
		};

		const onError = (e) => {
			// eslint-disable-next-line no-console
			console.error("PayPal error:", e);
			message.error(
				isArabic ? "خطأ في الدفع عبر PayPal" : "PayPal payment error."
			);
		};

		// If the script failed, log the exact SDK URL and offer fallback/retry
		if (isRejected) {
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
					isResolved: false,
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
									? "سنحاول استخدام محفظة PayPal أو البطاقة المستضافة فقط. إذا استمر الخطأ، عطّل مانع الإعلانات أو جرّب شبكة مختلفة."
									: "We’ll try a wallet-only (buttons) fallback. If it persists, disable ad blockers or try another network."
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

			// When walletOnly is true, the provider is recreated outside with fallback options
			return null;
		}

		if (!isResolved) return <Spin />;

		// Card Fields eligibility (avoid runtime crash if SDK doesn't expose CardFields)
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
					{/* Wallet card (hosted card button) */}
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

				{/* Inline Card Fields section */}
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
										pay: isArabic ? "ادفع بالبطاقة" : "Pay by Card",
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

	/** Build PayPal SDK options (primary vs wallet-only fallback) */
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
					// No "buyer-country" here — let PayPal pick automatically to avoid region conflicts
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
					"enable-funding": "paypal,card", // both wallet options still available
					"disable-funding": "credit,venmo,paylater",
					locale,
				}
			: null;

	const paypalOptions = primaryOptions || fallbackOptions;

	if (!paypalOptions) {
		return (
			<Centered>
				<Spin />
			</Centered>
		);
	}

	return (
		<ScriptShell key={`${reloadKey}-${walletOnly ? "w" : "p"}`}>
			<PayPalScriptProvider options={paypalOptions}>
				<PayArea />
			</PayPalScriptProvider>
		</ScriptShell>
	);
}

/* styles */
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
		transition:
			border-color 0.15s,
			box-shadow 0.15s,
			background 0.15s;
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
