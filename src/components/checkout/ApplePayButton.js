import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { message } from "antd";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";

const APPLE_PAY_SDK_SRC =
	"https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js";

const ensureApplePaySdk = () => {
	if (typeof window === "undefined") return Promise.resolve(false);
	if (window.ApplePaySession) return Promise.resolve(true);

	return new Promise((resolve) => {
		const existing = document.querySelector(
			`script[src="${APPLE_PAY_SDK_SRC}"]`,
		);
		if (existing) {
			let settled = false;
			const finish = (value) => {
				if (settled) return;
				settled = true;
				resolve(value);
			};
			if (window.ApplePaySession) {
				finish(true);
				return;
			}
			existing.addEventListener(
				"load",
				() => finish(!!window.ApplePaySession),
				{ once: true },
			);
			existing.addEventListener("error", () => finish(false), { once: true });
			setTimeout(() => finish(!!window.ApplePaySession), 3000);
			return;
		}

		const script = document.createElement("script");
		script.src = APPLE_PAY_SDK_SRC;
		script.async = true;
		script.setAttribute("data-apple-pay-sdk", "true");
		script.onload = () => resolve(!!window.ApplePaySession);
		script.onerror = () => resolve(false);
		document.head.appendChild(script);
	});
};

const ApplePayButton = ({
	labels = {},
	allowInteract,
	selectedOption,
	guestAgreed,
	selectedUsdAmount,
	selectedSarAmount,
	effectiveDepositUSD,
	remainingUSD,
	totalUSD,
	PAY_MODE,
	reservationData,
	reservationId,
	getCMID,
	payReservationViaPayPalLink,
}) => {
	const [{ isResolved }] = usePayPalScriptReducer();
	const [isEligible, setIsEligible] = useState(false);
	const [applepayConfig, setApplepayConfig] = useState(null);
	const [loading, setLoading] = useState(false);

	const amountUsd = useMemo(() => {
		const n = Number(selectedUsdAmount);
		return Number.isFinite(n) ? n.toFixed(2) : "0.00";
	}, [selectedUsdAmount]);

	useEffect(() => {
		let cancelled = false;

		const boot = async () => {
			if (!isResolved) return;
			await ensureApplePaySdk();

			if (!window.ApplePaySession || !window.paypal?.Applepay) {
				if (!cancelled) {
					setIsEligible(false);
					setApplepayConfig(null);
				}
				return;
			}

			try {
				const applepay = window.paypal.Applepay();
				const config = await applepay.config();
				if (!cancelled) {
					setApplepayConfig(config);
					setIsEligible(!!config?.isEligible);
				}
			} catch (err) {
				if (!cancelled) {
					setIsEligible(false);
					setApplepayConfig(null);
				}
			}
		};

		boot();
		return () => {
			cancelled = true;
		};
	}, [isResolved]);

	const createApplePayOrder = useCallback(async () => {
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
				description: `Hotel reservation - ${hotelName} - ${checkin} -> ${checkout} - Guest ${guestName} (Phone: ${guestPhone}, Email: ${guestEmail || "n/a"}, Nat: ${guestNationality || "n/a"}, By: ${reservedBy || "n/a"})`,
				amount: {
					currency_code: "USD",
					value: String(amountUsd),
					breakdown: {
						item_total: {
							currency_code: "USD",
							value: String(amountUsd),
						},
					},
				},
				items: [
					{
						name: `Hotel Reservation - ${hotelName}`,
						description: `Guest: ${guestName}, Phone: ${guestPhone}, Email: ${guestEmail || "n/a"}, Nat: ${guestNationality || "n/a"}, By: ${reservedBy || "n/a"}, ${checkin} -> ${checkout}, Conf: ${conf}`,
						quantity: "1",
						unit_amount: {
							currency_code: "USD",
							value: String(amountUsd),
						},
						category: "DIGITAL_GOODS",
					},
				],
			},
		];

		const res = await fetch(
			`${process.env.REACT_APP_API_URL}/paypal/order/create`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					intent: String(PAY_MODE || "CAPTURE").toUpperCase(),
					purchase_units,
					application_context: {
						brand_name: "Jannat Booking",
						user_action: "PAY_NOW",
						shipping_preference: "NO_SHIPPING",
					},
				}),
			},
		);

		const json = await res.json();
		if (!res.ok || !json?.id) {
			throw new Error(json?.message || "Server failed to create PayPal order");
		}
		return json.id;
	}, [
		amountUsd,
		PAY_MODE,
		reservationData,
		reservationId,
	]);

	const startApplePay = useCallback(async () => {
		if (!selectedOption) {
			message.error(labels.selectOption || "Please choose a payment option.");
			return;
		}
		if (!guestAgreed) {
			message.error(
				labels.acceptTerms || "Please accept the Terms & Conditions.",
			);
			return;
		}
		if (!(Number(amountUsd) > 0)) {
			message.error(labels.amountInvalid || "Payment amount is not valid.");
			return;
		}
		if (!window.ApplePaySession || !window.paypal?.Applepay) {
			message.error(labels.notAvailable || "Apple Pay is not available.");
			return;
		}
		if (!applepayConfig?.isEligible) {
			message.error(labels.notAvailable || "Apple Pay is not available.");
			return;
		}

		const applepay = window.paypal.Applepay();
		const paymentRequest = {
			countryCode: applepayConfig.countryCode || "US",
			currencyCode: "USD",
			merchantCapabilities: applepayConfig.merchantCapabilities,
			supportedNetworks: applepayConfig.supportedNetworks,
			total: {
				label: "Jannat Booking",
				type: "final",
				amount: String(amountUsd),
			},
		};

		const session = new window.ApplePaySession(4, paymentRequest);

		session.onvalidatemerchant = async (event) => {
			try {
				const validateResult = await applepay.validateMerchant({
					validationUrl: event.validationURL,
					displayName: "Jannat Booking",
				});
				session.completeMerchantValidation(validateResult.merchantSession);
			} catch (err) {
				session.abort();
				message.error(labels.paymentFailed || "Apple Pay validation failed.");
			}
		};

		session.onpaymentauthorized = async (event) => {
			setLoading(true);
			try {
				const orderId = await createApplePayOrder();
				await applepay.confirmOrder({
					orderId,
					token: event.payment.token,
					billingContact: event.payment.billingContact,
				});

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
						depositUSD: isRemainingPayment ? remainingUSD : effectiveDepositUSD,
						totalUSD,
					},
					sarAmount: Number(selectedSarAmount).toFixed(2),
					paypal: {
						order_id: orderId,
						expectedUsdAmount: amountUsd,
						cmid: typeof getCMID === "function" ? getCMID() : null,
						mode: PAY_MODE,
					},
				};

				const resp = await payReservationViaPayPalLink(payload);
				if (resp?.reservation) {
					session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
					message.success(labels.paymentSuccess || "Payment successful!");
					ReactGA.event({
						category: "Reservation Payment",
						action: "Apple Pay Success",
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
					session.completePayment(window.ApplePaySession.STATUS_FAILURE);
					message.error(
						resp?.message || labels.paymentFailed || "Payment failed.",
					);
				}
			} catch (err) {
				session.completePayment(window.ApplePaySession.STATUS_FAILURE);
				message.error(labels.paymentFailed || "Payment failed.");
			} finally {
				setLoading(false);
			}
		};

		session.oncancel = () => {
			if (labels.cancelled) {
				message.info(labels.cancelled);
			}
		};

		session.begin();
	}, [
		selectedOption,
		guestAgreed,
		amountUsd,
		applepayConfig,
		createApplePayOrder,
		reservationData,
		reservationId,
		remainingUSD,
		effectiveDepositUSD,
		totalUSD,
		selectedSarAmount,
		PAY_MODE,
		getCMID,
		payReservationViaPayPalLink,
		labels,
	]);

	if (!isResolved || !isEligible) return null;

	return (
		<ApplePaySection>
			<ApplePayShell
				aria-disabled={loading}
				data-muted={!allowInteract}
				dir='ltr'
				lang='en'
			>
				<apple-pay-button
					buttonstyle='black'
					type='buy'
					locale='en'
					dir='ltr'
					lang='en'
					onClick={startApplePay}
				/>
			</ApplePayShell>
		</ApplePaySection>
	);
};

export default ApplePayButton;

const ApplePaySection = styled.div`
	margin-top: 14px;
	display: flex;
	justify-content: center;
	direction: ltr;
`;

const ApplePayShell = styled.div`
	width: 100%;
	max-width: 420px;
	opacity: ${(props) => (props["data-muted"] ? 0.7 : 1)};
	pointer-events: ${(props) => (props["aria-disabled"] ? "none" : "auto")};
	direction: ltr;
	text-align: left;
	unicode-bidi: isolate;

	apple-pay-button {
		--apple-pay-button-width: 100%;
		--apple-pay-button-height: 44px;
		--apple-pay-button-border-radius: 10px;
		--apple-pay-button-padding: 0;
		box-sizing: border-box;
		display: block;
		width: 100%;
		height: 44px;
		direction: ltr;
	}
`;
