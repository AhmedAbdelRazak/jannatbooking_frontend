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
const calculatePricingByDay = (pricingRate, startDate, endDate, basePrice) => {
	const start = dayjs(startDate);
	const end = dayjs(endDate);
	const dateArray = [];
	let currentDate = start;

	while (currentDate <= end) {
		// Create a new variable in each iteration
		const dateForLoop = currentDate;

		const rateForDate = pricingRate.find(
			(rate) =>
				dayjs(rate.date).format("YYYY-MM-DD") ===
				dateForLoop.format("YYYY-MM-DD")
		);

		dateArray.push({
			date: dateForLoop.format("YYYY-MM-DD"),
			price: rateForDate ? rateForDate.price : basePrice, // Default to basePrice if no specific rate
		});

		currentDate = currentDate.add(1, "day");
	}

	return dateArray;
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
		} = action.payload;

		// Calculate the number of nights between startDate and endDate
		const start = dayjs(startDate);
		const end = dayjs(endDate);
		const nights = end.diff(start, "day");

		// Calculate pricing breakdown by day
		const pricingByDay = calculatePricingByDay(
			priceRating,
			startDate,
			endDate,
			roomDetails.price
		);

		const existingRoom = state.roomCart.find((item) => item.id === id);

		if (existingRoom) {
			const updatedCart = state.roomCart.map((item) => {
				if (item.id === id) {
					let newAmount = item.amount + 1;
					return { ...item, amount: newAmount };
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
				nights, // Store the number of nights
				pricingByDay, // Store detailed pricing information for each day
				hotelId,
				belongsTo,
				priceRating, // Keep the original priceRating if needed
				roomColor,
			};
			return { ...state, roomCart: [...state.roomCart, newRoom] };
		}
	}

	if (action.type === UPDATE_ROOM_DATES) {
		const { id, startDate, endDate } = action.payload;

		// Calculate new nights and pricingByDay based on the updated dates
		const start = dayjs(startDate);
		const end = dayjs(endDate);
		const nights = end.diff(start, "day");

		const updatedCart = state.roomCart.map((room) => {
			if (room.id === id) {
				const newPricingByDay = calculatePricingByDay(
					room.priceRating,
					startDate,
					endDate,
					room.price
				);
				return {
					...room,
					startDate,
					endDate,
					nights, // Update the number of nights
					pricingByDay: newPricingByDay, // Update the pricing breakdown
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
		const { total_rooms, total_price } = state.roomCart.reduce(
			(total, item) => {
				const roomRate = item.price; // Assuming this is the base price
				const totalRoomPrice = item.nights * roomRate * item.amount;

				total.total_rooms += item.amount;
				total.total_price += totalRoomPrice;
				return total;
			},
			{
				total_rooms: 0,
				total_price: 0,
			}
		);

		return { ...state, total_rooms, total_price };
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
