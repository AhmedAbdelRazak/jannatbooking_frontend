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
		const { id, startDate, endDate } = action.payload;

		const updatedCart = state.roomCart.map((room) => {
			if (room.id === id) {
				const newPricingByDay = calculatePricingByDay2(
					room.priceRating,
					startDate,
					endDate,
					Number(room.price)
				);
				const newPricingByDayWithCommission =
					calculatePricingByDayWithCommission(
						room.priceRating,
						startDate,
						endDate,
						Number(room.defaultCost),
						Number(room.commissionRate) || 0
					);

				return {
					...room,
					startDate,
					endDate,
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
		const {
			total_rooms,
			total_price_with_commission,
			total_price,
			total_commission,
			total_guests,
			total_adults,
			total_children,
		} = state.roomCart.reduce(
			(totals, item) => {
				const totalRoomPrice = item.pricingByDay.reduce(
					(sum, day) => sum + Number(day.price),
					0
				);

				const totalRoomCommission = item.pricingByDayWithCommission.reduce(
					(sum, day) =>
						sum + Number(day.rootPrice) * Number(day.commissionRate),
					0
				);

				const roomTotalWithCommission = totalRoomPrice + totalRoomCommission;

				totals.total_rooms += item.amount;
				totals.total_price += totalRoomPrice * item.amount;
				totals.total_commission += totalRoomCommission * item.amount;
				totals.total_price_with_commission +=
					roomTotalWithCommission * item.amount;
				totals.total_guests += item.amount * (item.adults + item.children);
				totals.total_adults += item.adults * item.amount;
				totals.total_children += item.children * item.amount;

				return totals;
			},
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

		return {
			...state,
			total_rooms,
			total_price,
			total_price_with_commission,
			total_commission,
			total_guests,
			total_adults,
			total_children,
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
