export const normalizeRoomText = (value = "") =>
	String(value || "")
		.trim()
		.toLowerCase()
		.replace(/\s+/g, " ");

export const buildRoomAvailabilityKey = (roomType = "", displayName = "") =>
	`${normalizeRoomText(roomType)}|${normalizeRoomText(displayName)}`;

export const buildAvailabilityLookup = (rows = []) => {
	const lookup = new Map();
	(rows || []).forEach((row) => {
		const roomType = row?.room_type || row?.roomType || "";
		const displayName = row?.displayName || row?.display_name || "";
		const keys = [
			buildRoomAvailabilityKey(roomType, displayName),
			normalizeRoomText(displayName),
			normalizeRoomText(roomType),
		].filter(Boolean);

		keys.forEach((key) => {
			if (key && key !== "|") lookup.set(key, row);
		});
	});
	return lookup;
};

export const getRoomAvailability = (lookup, room = {}) => {
	if (!lookup || !room) return null;
	const roomType = room?.roomType || room?.room_type || "";
	const displayName = room?.displayName || room?.display_name || room?.name || "";
	const keys = [
		buildRoomAvailabilityKey(roomType, displayName),
		normalizeRoomText(displayName),
		normalizeRoomText(roomType),
	].filter(Boolean);

	for (const key of keys) {
		if (key && key !== "|" && lookup.has(key)) return lookup.get(key);
	}
	return null;
};

export const getAvailableRoomCount = (availability) => {
	if (!availability) return null;
	const count = Number(availability.available);
	return Number.isFinite(count) ? Math.max(count, 0) : null;
};

export const roomHasEnoughAvailability = (availability, requested = 1) => {
	const available = getAvailableRoomCount(availability);
	if (available === null) return true;
	return Math.max(1, Number(requested || 1)) <= available;
};
