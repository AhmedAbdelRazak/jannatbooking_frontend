import { useEffect, useState } from "react";

const CARD_FIELDS_READY_ATTEMPTS = 60;
const CARD_FIELDS_READY_INTERVAL_MS = 200;

const readPayPalCardFieldsStatus = () => {
	if (typeof window === "undefined") return "checking";
	const cardFields = window?.paypal?.CardFields;
	if (!cardFields) return "checking";
	if (typeof cardFields.isEligible === "function") {
		try {
			return cardFields.isEligible() ? "ready" : "checking";
		} catch {
			return "checking";
		}
	}
	return "ready";
};

export function usePayPalCardFieldsStatus(isResolved, walletOnly, retryKey) {
	const [status, setStatus] = useState("checking");

	useEffect(() => {
		if (!isResolved) {
			setStatus("checking");
			return undefined;
		}
		if (walletOnly) {
			setStatus("unavailable");
			return undefined;
		}

		let cancelled = false;
		let attempts = 0;
		setStatus("checking");

		const check = () => {
			if (cancelled) return;
			const nextStatus = readPayPalCardFieldsStatus();
			if (nextStatus === "ready") {
				setStatus("ready");
				return;
			}
			attempts += 1;
			if (attempts >= CARD_FIELDS_READY_ATTEMPTS) {
				setStatus("unavailable");
				return;
			}
			window.setTimeout(check, CARD_FIELDS_READY_INTERVAL_MS);
		};

		check();
		return () => {
			cancelled = true;
		};
	}, [isResolved, walletOnly, retryKey]);

	return status;
}
