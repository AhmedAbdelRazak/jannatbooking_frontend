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
	const start = dayjs(startDate).startOf("day");
	const end = dayjs(endDate).subtract(1, "day").startOf("day"); // Exclude the checkout day
	const dateArray = [];
	let currentDate = start;

	// Run the loop while currentDate is before or same as the day before the checkout date
	while (currentDate.isBefore(end) || currentDate.isSame(end, "day")) {
		const formattedDate = currentDate.format("YYYY-MM-DD");

		// Find rate for the current date
		const rateForDate = pricingRate.find(
			(rate) => dayjs(rate.date).format("YYYY-MM-DD") === formattedDate
		);

		// Add the current date with price to the array
		dateArray.push({
			date: formattedDate,
			price: rateForDate ? rateForDate.price : basePrice,
		});

		// Increment the current date by one day
		currentDate = currentDate.add(1, "day");
	}

	return dateArray;
};

const calculatePricingByDay2 = (pricingRate, startDate, endDate, basePrice) => {
	const start = dayjs(startDate).startOf("day");
	const end = dayjs(endDate).subtract(1, "day").startOf("day"); // Exclude the checkout day

	const dateArray = [];
	let currentDate = start;

	// Run the loop while currentDate is before or same as the day before endDate (checkout day)
	while (currentDate.isBefore(end) || currentDate.isSame(end, "day")) {
		const formattedDate = currentDate.format("YYYY-MM-DD");

		// Find rate for the current date
		const rateForDate = pricingRate.find(
			(rate) => dayjs(rate.date).format("YYYY-MM-DD") === formattedDate
		);

		// Add the current date with price to the array
		dateArray.push({
			date: formattedDate,
			price: rateForDate ? rateForDate.price : basePrice,
		});

		// Increment the current date by one day
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
			adults, // New adult field
			children, // New children field
		} = action.payload;

		const start = dayjs(startDate);
		const end = dayjs(endDate);
		const nights = end.diff(start, "day");

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
					return { ...item, amount: newAmount, adults, children };
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
				hotelId,
				belongsTo,
				priceRating,
				roomColor,
				adults, // Set adults count
				children, // Set children count
			};
			return { ...state, roomCart: [...state.roomCart, newRoom] };
		}
	}

	if (action.type === UPDATE_ROOM_DATES) {
		const { id, startDate, endDate } = action.payload;

		const start = dayjs(startDate);
		const end = dayjs(endDate);
		const nights = end.diff(start, "day");

		// Update the cart with the new dates and recalculated pricing breakdown
		const updatedCart = state.roomCart.map((room) => {
			if (room.id === id) {
				// console.log("Recalculating pricing for room:", room.id); // Debugging line
				const newPricingByDay = calculatePricingByDay2(
					room.priceRating,
					startDate,
					endDate,
					room.price
				);
				return {
					...room,
					startDate,
					endDate,
					nights,
					pricingByDay: newPricingByDay, // Update the pricing breakdown here
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
		const {
			total_rooms,
			total_price,
			total_guests,
			total_adults,
			total_children,
		} = state.roomCart.reduce(
			(totals, item) => {
				const roomRate = item.price; // Assuming this is the base price
				const totalRoomPrice = item.nights * roomRate * item.amount;

				totals.total_rooms += item.amount;
				totals.total_price += totalRoomPrice;
				totals.total_guests += item.amount * (item.adults + item.children); // Calculate total guests
				totals.total_adults += item.adults * item.amount; // Calculate total adults
				totals.total_children += item.children * item.amount; // Calculate total children

				return totals;
			},
			{
				total_rooms: 0,
				total_price: 0,
				total_guests: 0, // Initialize total guests
				total_adults: 0, // Initialize total adults
				total_children: 0, // Initialize total children
			}
		);

		return {
			...state,
			total_rooms,
			total_price,
			total_guests, // Update total guests
			total_adults, // Update total adults
			total_children, // Update total children
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
