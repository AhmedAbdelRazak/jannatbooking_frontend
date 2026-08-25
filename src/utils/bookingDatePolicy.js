export const HOTEL_BOOKING_TIME_ZONE = "Asia/Riyadh";

const dateKeyFromParts = (parts = []) => {
	const value = (type) => parts.find((part) => part.type === type)?.value || "";
	const year = value("year");
	const month = value("month");
	const day = value("day");
	return year && month && day ? `${year}-${month}-${day}` : "";
};

export const hotelTodayDateKey = (
	now = new Date(),
	timeZone = HOTEL_BOOKING_TIME_ZONE,
) => {
	try {
		return dateKeyFromParts(
			new Intl.DateTimeFormat("en-CA", {
				timeZone,
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			}).formatToParts(now),
		);
	} catch {
		return new Date(now).toISOString().slice(0, 10);
	}
};

export const bookingDateKey = (value) => {
	if (!value) return "";
	if (typeof value.format === "function") return value.format("YYYY-MM-DD");
	const text = String(value);
	if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
};

export const isPastHotelCheckInDate = (value, now = new Date()) => {
	const dateKey = bookingDateKey(value);
	return Boolean(dateKey && dateKey < hotelTodayDateKey(now));
};

export const isInvalidHotelCheckoutDate = (
	value,
	checkIn,
	now = new Date(),
) => {
	const dateKey = bookingDateKey(value);
	if (!dateKey) return false;
	const minimumExclusive = bookingDateKey(checkIn) || hotelTodayDateKey(now);
	return dateKey <= minimumExclusive;
};
