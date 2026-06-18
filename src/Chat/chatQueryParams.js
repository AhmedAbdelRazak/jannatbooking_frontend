export const CHAT_OPEN_PARAM = "chat";
export const CHAT_OPEN_VALUE = "open";

export const CHAT_QUERY_KEYS = {
	name: "chatName",
	contact: "chatContact",
	hotelId: "chatHotelId",
	hotelName: "chatHotelName",
	inquiry: "chatInquiry",
	inquiryDetails: "chatDetails",
	reservationNumber: "chatReservationNumber",
	language: "chatLanguage",
};

const FIELD_TO_QUERY_KEY = {
	name: CHAT_QUERY_KEYS.name,
	contact: CHAT_QUERY_KEYS.contact,
	hotelId: CHAT_QUERY_KEYS.hotelId,
	hotelName: CHAT_QUERY_KEYS.hotelName,
	inquiry: CHAT_QUERY_KEYS.inquiry,
	inquiryDetails: CHAT_QUERY_KEYS.inquiryDetails,
	reservationNumber: CHAT_QUERY_KEYS.reservationNumber,
	language: CHAT_QUERY_KEYS.language,
};

export const CHAT_FIELD_QUERY_KEYS = Object.values(CHAT_QUERY_KEYS);

export const readChatQueryParams = (search = "") => {
	const params = new URLSearchParams(search || "");
	return {
		isOpen: params.get(CHAT_OPEN_PARAM) === CHAT_OPEN_VALUE,
		name: params.get(CHAT_QUERY_KEYS.name) || "",
		contact: params.get(CHAT_QUERY_KEYS.contact) || "",
		hotelId: params.get(CHAT_QUERY_KEYS.hotelId) || "",
		hotelName: params.get(CHAT_QUERY_KEYS.hotelName) || "",
		inquiry: params.get(CHAT_QUERY_KEYS.inquiry) || "",
		inquiryDetails: params.get(CHAT_QUERY_KEYS.inquiryDetails) || "",
		reservationNumber: params.get(CHAT_QUERY_KEYS.reservationNumber) || "",
		language: params.get(CHAT_QUERY_KEYS.language) || "",
	};
};

export const mergeChatQueryParams = (
	search = "",
	fields = {},
	{ open = true, close = false, clearFields = false } = {}
) => {
	const params = new URLSearchParams(search || "");

	if (clearFields) {
		CHAT_FIELD_QUERY_KEYS.forEach((key) => params.delete(key));
	}

	if (close) {
		params.delete(CHAT_OPEN_PARAM);
		return params.toString();
	}

	if (open) {
		params.set(CHAT_OPEN_PARAM, CHAT_OPEN_VALUE);
	}

	Object.entries(fields).forEach(([field, value]) => {
		const queryKey = FIELD_TO_QUERY_KEY[field];
		if (!queryKey) return;

		const normalizedValue = String(value || "").trim();
		if (normalizedValue) {
			params.set(queryKey, normalizedValue);
		} else {
			params.delete(queryKey);
		}
	});

	return params.toString();
};

export const replaceSearchWithoutReload = (history, nextSearch = "") => {
	if (!history || typeof window === "undefined") return;

	const cleanSearch = String(nextSearch || "").replace(/^\?/, "");
	const currentSearch = window.location.search.replace(/^\?/, "");
	if (cleanSearch === currentSearch) return;

	const nextUrl = `${window.location.pathname}${
		cleanSearch ? `?${cleanSearch}` : ""
	}${window.location.hash || ""}`;
	history.replace(nextUrl);
};
