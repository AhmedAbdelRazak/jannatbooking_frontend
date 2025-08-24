import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Spin, message } from "antd";
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
	const locale = isArabic ? "ar" : "en_US";

	// Single source of truth: AUTHORIZE (hold now, capture later)
	const INTENT = "AUTHORIZE";
	const isAuthorize = INTENT === "AUTHORIZE";

	const [clientToken, setClientToken] = useState(null);
	const [tokenError, setTokenError] = useState(null);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const token = await getPayPalClientToken();
				const raw = typeof token === "string" ? token : token?.clientToken;
				if (!raw) throw new Error("Missing PayPal client token");
				if (mounted) setClientToken(raw);
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
	}, [isArabic]);

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

	const paypalOptions = useMemo(
		() => ({
			"client-id":
				(process.env.REACT_APP_NODE_ENV || "").toUpperCase() === "PRODUCTION"
					? process.env.REACT_APP_PAYPAL_CLIENT_ID_LIVE
					: process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX,
			"data-client-token": clientToken,
			components: "buttons,card-fields",
			currency: "USD",
			intent: INTENT.toLowerCase(), // "authorize"
			commit: true,
			"enable-funding": "paypal,card,venmo,paylater",
			"disable-funding": "credit",
			locale,
		}),
		[clientToken, locale]
	);

	const getCMID = () => {
		try {
			return window?.paypal?.getClientMetadataID?.();
		} catch {
			return null;
		}
	};

	const PayArea = () => {
		const [{ isResolved }] = usePayPalScriptReducer();

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

		// Create order for both Buttons and Card Fields
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

			// Buttons flow — PayPal passes actions
			if (actions?.order) {
				return actions.order.create({
					intent: INTENT, // "AUTHORIZE"
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
						// Vault on success (lets you MIT/capture later)
						payment_source: {
							card: {
								attributes: { vault: { store_in_vault: "ON_SUCCESS" } },
							},
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
					convertedAmounts, // backend uses for checks and receipts
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

	if (tokenError)
		return (
			<Centered>
				<div>PayPal initialization failed.</div>
			</Centered>
		);
	if (!clientToken)
		return (
			<Centered>
				<Spin />
			</Centered>
		);

	return (
		<ScriptShell>
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
			if ((!hasSubmit || !eligible) && attempts < 120) {
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
			await cardFieldsForm.submit(); // triggers 3DS if needed → then onApprove runs
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
