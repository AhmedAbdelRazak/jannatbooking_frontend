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
	// Use a valid full locale code; ar_EG works well for MENA Arabic
	return isArabic ? "ar_EG" : "en_US";
}

/** Utility: best-effort country code, improves funding selection */
function guessBuyerCountry(fallback = "US") {
	try {
		const lang = navigator?.language || navigator?.languages?.[0] || "";
		const match = String(lang).replace("_", "-").split("-")[1];
		if (match && match.length === 2) return match.toUpperCase();
	} catch {}
	return fallback;
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
	const buyerCountry = guessBuyerCountry(isArabic ? "EG" : "US");

	// Single source of truth: AUTHORIZE (hold now, capture later)
	const INTENT = "AUTHORIZE";
	const isAuthorize = INTENT === "AUTHORIZE";

	const [clientToken, setClientToken] = useState(null);
	const [isLive, setIsLive] = useState(null); // ← authoritative env from backend
	const [tokenError, setTokenError] = useState(null);
	const [reloadKey, setReloadKey] = useState(0); // for “Reload payment” action

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const tok = await getPayPalClientToken(); // must return { clientToken, env }
				const ct = typeof tok === "string" ? tok : tok?.clientToken;
				const env = (tok?.env || "").toLowerCase(); // "live" | "sandbox"
				if (!ct) throw new Error("Missing PayPal client token");
				if (!env) throw new Error("Missing PayPal environment");
				if (mounted) {
					setClientToken(ct);
					setIsLive(env === "live");
				}
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

	/** Always pair the client token env with the matching client-id */
	const paypalOptions = useMemo(() => {
		if (!clientToken || isLive == null) return null;

		const clientId = isLive
			? process.env.REACT_APP_PAYPAL_CLIENT_ID_LIVE
			: process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX;

		if (!clientId) {
			console.error("Missing PayPal client-id for selected environment");
		}

		return {
			"client-id": clientId,
			"data-client-token": clientToken,
			components: "buttons,card-fields",
			currency: "USD",
			intent: INTENT.toLowerCase(), // "authorize"
			commit: true,
			// Keep globally-safe funding to reduce eligibility issues
			"enable-funding": "paypal,card",
			"disable-funding": "credit",
			locale,
			"buyer-country": buyerCountry,
		};
	}, [clientToken, isLive, locale, buyerCountry]);

	const reloadPayment = useCallback(() => {
		// Let the admin/buyer retry if the SDK failed to load (adblock, flaky network, etc.)
		setReloadKey((k) => k + 1);
		setClientToken(null);
		setIsLive(null);
		setTokenError(null);
	}, []);

	const getCMID = () => {
		try {
			return window?.paypal?.getClientMetadataID?.();
		} catch {
			return null;
		}
	};

	const PayArea = () => {
		const [{ isResolved, isRejected }] = usePayPalScriptReducer();

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
			console.error("PayPal error:", e);
			message.error(
				isArabic ? "خطأ في الدفع عبر PayPal" : "PayPal payment error."
			);
		};

		// If the script failed (bad client-id/env, adblock, network), tell the user and offer retry
		if (isRejected) {
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
								? "يرجى تعطيل مانع الإعلانات أو التأكد من اتصال الإنترنت ثم إعادة المحاولة."
								: "Please disable ad blockers or check your connection, then try again."
						}
					/>
					<div style={{ textAlign: "center", marginTop: 10 }}>
						<ReloadBtn onClick={reloadPayment}>
							{isArabic ? "إعادة تحميل الدفع" : "Reload payment"}
						</ReloadBtn>
					</div>
				</div>
			);
		}

		if (!isResolved) return <Spin />;

		return (
			<>
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
							<CardSubmit allowInteract={allowInteract} />
						</div>
					</PayPalCardFieldsProvider>
				</CardBox>
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

	if (!clientToken || isLive == null || !paypalOptions) {
		return (
			<Centered>
				<Spin />
			</Centered>
		);
	}

	return (
		<ScriptShell key={reloadKey}>
			<PayPalScriptProvider options={paypalOptions}>
				<PayArea />
			</PayPalScriptProvider>
		</ScriptShell>
	);
}

function CardSubmit({ allowInteract }) {
	const { cardFieldsForm } = usePayPalCardFields();
	const [busy, setBusy] = useState(false);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let cancelled = false;
		let attempts = 0;
		const tick = () => {
			if (cancelled) return;
			const hasSubmit = typeof cardFieldsForm?.submit === "function";
			const eligible = cardFieldsForm?.isEligible?.() ?? true;
			setReady(hasSubmit && eligible);
			// Keep trying a bit; if not eligible, the button stays disabled
			if ((!hasSubmit || !eligible) && attempts < 60) {
				attempts += 1;
				setTimeout(tick, 250);
			}
		};
		tick();
		return () => {
			cancelled = true;
		};
	}, [cardFieldsForm]);

	const submit = async () => {
		if (!allowInteract) return;
		if (typeof cardFieldsForm?.submit !== "function") return;
		setBusy(true);
		try {
			const state = await cardFieldsForm.getState?.();
			if (state && !state.isFormValid) {
				message.error("Please complete your card details.");
				setBusy(false);
				return;
			}
			await cardFieldsForm.submit(); // 3DS if needed → then onApprove runs
		} catch (e) {
			console.error("Card submit error:", e);
			message.error("Card payment failed.");
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
			{busy ? "Processing…" : "Pay by Card"}
		</PayCardButton>
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
