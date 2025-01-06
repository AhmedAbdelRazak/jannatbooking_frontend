import dayjs from "dayjs";

import {
	LANGUAGE_TOGGLE,
	ADD_ROOM_TO_CART,
	REMOVE_ROOM_ITEM,
	TOGGLE_ROOM_AMOUNT,
	CLEAR_ROOM_CART,
	COUNT_ROOM_TOTALS,
	SIDEBAR_OPEN2,
	SIDEBAR_CLOSE2,
	UPDATE_ROOM_DATES,
} from "./actions";

// Helper function to calculate pricing by day
const calculatePricingByDay = (
	pricingRate,
	startDate,
	endDate,
	basePrice,
	defaultCost,
	commissionRate
) => {
	const start = dayjs(startDate).startOf("day");
	const end = dayjs(endDate).subtract(1, "day").startOf("day"); // Exclude the checkout day

	const dateArray = [];
	let currentDate = start;

	while (currentDate.isBefore(end) || currentDate.isSame(end, "day")) {
		const formattedDate = currentDate.format("YYYY-MM-DD");

		// Find rate for the current date
		const rateForDate = pricingRate.find(
			(rate) => dayjs(rate.date).format("YYYY-MM-DD") === formattedDate
		);

		dateArray.push({
			date: formattedDate,
			price: rateForDate ? rateForDate.price : basePrice,
			rootPrice: rateForDate ? rateForDate.rootPrice : defaultCost,
			commissionRate: rateForDate ? rateForDate.commissionRate : commissionRate,
		});

		currentDate = currentDate.add(1, "day");
	}

	return dateArray;
};

const calculatePricingByDay2 = (
	pricingRate,
	startDate,
	endDate,
	basePrice,
	defaultCost,
	commissionRate // Passed directly from the component
) => {
	const start = dayjs(startDate).startOf("day");
	const end = dayjs(endDate).subtract(1, "day").startOf("day"); // Exclude the checkout day

	// Default commission rate: process.env.REACT_APP_COMMISSIONRATE - 1
	const defaultCommissionRate =
		Number(process.env.REACT_APP_COMMISSIONRATE || 1.1) - 1;

	// Use the passed commissionRate if available, otherwise use the default
	const finalCommissionRate =
		typeof commissionRate !== "undefined"
			? Number(commissionRate)
			: defaultCommissionRate;

	const dateArray = [];
	let currentDate = start;

	while (currentDate.isBefore(end) || currentDate.isSame(end, "day")) {
		const formattedDate = currentDate.format("YYYY-MM-DD");

		// Find rate for the current date in pricingRate
		const rateForDate =
			pricingRate && Array.isArray(pricingRate)
				? pricingRate.find(
						(rate) =>
							dayjs(rate.calendarDate).format("YYYY-MM-DD") === formattedDate
					)
				: null;

		dateArray.push({
			date: formattedDate,
			price: rateForDate ? Number(rateForDate.price) : Number(basePrice),
			rootPrice: rateForDate
				? Number(rateForDate.rootPrice)
				: Number(defaultCost),
			commissionRate: rateForDate
				? Number(rateForDate.commissionRate || finalCommissionRate)
				: finalCommissionRate, // Use finalCommissionRate
		});

		currentDate = currentDate.add(1, "day");
	}

	return dateArray;
};

// Helper function to calculate pricing by day with commission
const calculatePricingByDayWithCommission = (
	pricingRate,
	startDate,
	endDate,
	basePrice,
	defaultCost,
	commissionRate
) => {
	const pricingByDay = calculatePricingByDay(
		pricingRate,
		startDate,
		endDate,
		basePrice,
		defaultCost,
		commissionRate
	);

	return pricingByDay.map((day) => ({
		...day,
		totalPriceWithCommission: Number(
			(
				Number(day.price) +
				Number(day.rootPrice) * Number(day.commissionRate)
			).toFixed(2)
		),
	}));
};

const calculatePricingByDayWithCommission2 = (
	pricingRate,
	startDate,
	endDate,
	basePrice,
	defaultCost,
	commissionRate
) => {
	// Calculate pricing by day
	const pricingByDay = calculatePricingByDay2(
		pricingRate,
		startDate,
		endDate,
		basePrice,
		defaultCost,
		commissionRate
	);

	return pricingByDay.map((day) => ({
		...day,
		totalPriceWithCommission: Number(
			(
				Number(day.price) +
				Number(day.rootPrice) * Number(day.commissionRate)
			).toFixed(2)
		),
	}));
};

const cart_reducer = (state, action) => {
	if (action.type === LANGUAGE_TOGGLE) {
		return { ...state, chosenLanguage: action.payload };
	}

	if (action.type === ADD_ROOM_TO_CART) {
		const {
			id,
			roomDetails,
			startDate,
			endDate,
			hotelId,
			belongsTo,
			priceRating,
			roomColor,
			adults,
			children,
			commissionRate,
		} = action.payload;

		const start = dayjs(startDate);
		const end = dayjs(endDate);
		const nights = end.diff(start, "day");

		// Calculate pricing by day
		const pricingByDay = calculatePricingByDay(
			priceRating,
			startDate,
			endDate,
			roomDetails.price,
			roomDetails.defaultCost,
			commissionRate
		);

		const pricingByDayWithCommission = calculatePricingByDayWithCommission(
			priceRating,
			startDate,
			endDate,
			roomDetails.price,
			roomDetails.defaultCost,
			commissionRate
		);

		// Check if room exists in cart
		const existingRoom = state.roomCart.find((item) => item.id === id);

		if (existingRoom) {
			const updatedCart = state.roomCart.map((item) => {
				if (item.id === id) {
					return {
						...item,
						amount: item.amount + 1,
						pricingByDay,
						pricingByDayWithCommission,
						startDate,
						endDate,
						adults,
						children,
					};
				}
				return item;
			});
			return { ...state, roomCart: updatedCart };
		} else {
			const newRoom = {
				...roomDetails,
				id,
				amount: 1,
				startDate,
				endDate,
				nights,
				pricingByDay,
				pricingByDayWithCommission,
				hotelId,
				belongsTo,
				roomColor,
				adults,
				children,
			};

			return { ...state, roomCart: [...state.roomCart, newRoom] };
		}
	}

	if (action.type === UPDATE_ROOM_DATES) {
		const { id, startDate, endDate, pricingByDay } = action.payload;

		const updatedCart = state.roomCart.map((room) => {
			if (room.id === id) {
				// Recalculate nights dynamically
				const nights = dayjs(endDate).diff(dayjs(startDate), "day");

				// Ensure commission rate fallback is applied correctly
				const defaultCommissionRate =
					Number(process.env.REACT_APP_COMMISSIONRATE || 1.1) - 1;

				// Calculate pricing by day and pricing by day with commission
				const newPricingByDay =
					pricingByDay ||
					calculatePricingByDay2(
						room.priceRating,
						startDate,
						endDate,
						Number(room.price),
						Number(room.defaultCost),
						Number(room.commissionRate || defaultCommissionRate)
					);

				const newPricingByDayWithCommission =
					pricingByDay ||
					calculatePricingByDayWithCommission2(
						room.priceRating,
						startDate,
						endDate,
						Number(room.price),
						Number(room.defaultCost),
						Number(room.commissionRate || defaultCommissionRate)
					);

				return {
					...room,
					startDate,
					endDate,
					nights, // Update nights dynamically
					pricingByDay: newPricingByDay,
					pricingByDayWithCommission: newPricingByDayWithCommission,
				};
			}
			return room;
		});

		return { ...state, roomCart: updatedCart };
	}

	if (action.type === REMOVE_ROOM_ITEM) {
		const updatedCart = state.roomCart.filter(
			(item) => item.id !== action.payload
		);
		return { ...state, roomCart: updatedCart };
	}

	if (action.type === TOGGLE_ROOM_AMOUNT) {
		const { id, value } = action.payload;

		const updatedCart = state.roomCart.map((item) => {
			if (item.id === id) {
				let newAmount = value === "inc" ? item.amount + 1 : item.amount - 1;
				if (newAmount < 1) newAmount = 1;
				return { ...item, amount: newAmount };
			}
			return item;
		});

		return { ...state, roomCart: updatedCart };
	}

	if (action.type === CLEAR_ROOM_CART) {
		return { ...state, roomCart: [] };
	}

	if (action.type === COUNT_ROOM_TOTALS) {
		const totals = state.roomCart.reduce(
			(accum, item) => {
				// Total room price (sum of daily prices for the room)
				const totalRoomPrice = item.pricingByDay.reduce(
					(sum, day) => sum + Number(day.price), // Sum up all daily prices
					0
				);

				// Total room commission (calculated per day)
				const totalRoomCommission = item.pricingByDayWithCommission.reduce(
					(sum, day) =>
						sum + Number(day.rootPrice) * Number(day.commissionRate), // Add daily commissions
					0
				);

				// Room total price including commission
				const roomTotalWithCommission = totalRoomPrice + totalRoomCommission;

				// Update overall totals
				accum.total_rooms += item.amount; // Total number of rooms
				accum.total_price += totalRoomPrice * item.amount; // Total price for all rooms
				accum.total_commission += totalRoomCommission * item.amount; // Total commission
				accum.total_price_with_commission +=
					roomTotalWithCommission * item.amount; // Total price with commission
				accum.total_guests += item.amount * (item.adults + item.children); // Total guests
				accum.total_adults += item.adults * item.amount; // Total adults
				accum.total_children += item.children * item.amount; // Total children

				return accum;
			},
			// Initialize totals
			{
				total_rooms: 0,
				total_price: 0,
				total_commission: 0,
				total_price_with_commission: 0,
				total_guests: 0,
				total_adults: 0,
				total_children: 0,
			}
		);

		// Return updated state with new totals
		return {
			...state,
			...totals,
		};
	}

	if (action.type === SIDEBAR_OPEN2) {
		return { ...state, isSidebarOpen2: true };
	}

	if (action.type === SIDEBAR_CLOSE2) {
		return { ...state, isSidebarOpen2: false };
	}

	throw new Error(`No Matching "${action.type}" - action type`);
};

export default cart_reducer;
