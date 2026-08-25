import {
	bookingDateKey,
	hotelTodayDateKey,
	isInvalidHotelCheckoutDate,
	isPastHotelCheckInDate,
} from "./bookingDatePolicy";

describe("hotel booking date policy", () => {
	const beforeRiyadhMidnight = new Date("2026-08-24T20:59:59.000Z");
	const afterRiyadhMidnight = new Date("2026-08-24T21:00:00.000Z");

	test("uses the Riyadh hotel day instead of the browser day", () => {
		expect(hotelTodayDateKey(beforeRiyadhMidnight)).toBe("2026-08-24");
		expect(hotelTodayDateKey(afterRiyadhMidnight)).toBe("2026-08-25");
	});

	test("allows check-in today and later but rejects past dates", () => {
		expect(isPastHotelCheckInDate("2026-08-24", afterRiyadhMidnight)).toBe(true);
		expect(isPastHotelCheckInDate("2026-08-25", afterRiyadhMidnight)).toBe(false);
		expect(isPastHotelCheckInDate("2026-09-01", afterRiyadhMidnight)).toBe(false);
	});

	test("requires checkout after check-in", () => {
		expect(isInvalidHotelCheckoutDate("2026-08-25", "2026-08-25", afterRiyadhMidnight)).toBe(true);
		expect(isInvalidHotelCheckoutDate("2026-08-26", "2026-08-25", afterRiyadhMidnight)).toBe(false);
		expect(bookingDateKey("2026-08-25")).toBe("2026-08-25");
	});
});
