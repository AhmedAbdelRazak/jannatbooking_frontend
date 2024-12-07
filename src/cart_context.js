import React, { useContext, useReducer, useEffect } from "react";
import reducer from "./cart_reducer";
import {
	LANGUAGE_TOGGLE,
	ADD_ROOM_TO_CART,
	REMOVE_ROOM_ITEM,
	TOGGLE_ROOM_AMOUNT,
	CLEAR_ROOM_CART,
	COUNT_ROOM_TOTALS,
	SIDEBAR_CLOSE2,
	SIDEBAR_OPEN2,
	UPDATE_ROOM_DATES,
} from "./actions";

const getLanguageLocalStorage = () => {
	let language = localStorage.getItem("lang");
	if (language) {
		return JSON.parse(language);
	} else {
		return "English";
	}
};

const getRoomCartLocalStorage = () => {
	let cart = localStorage.getItem("roomCart");
	if (cart) {
		return JSON.parse(cart);
	} else {
		return [];
	}
};

const initialState = {
	isSidebarOpen: false,
	chosenLanguage: getLanguageLocalStorage(),
	roomCart: getRoomCartLocalStorage(),
	total_rooms: 0,
	total_price: 0,
};

const CartContext = React.createContext();

export const CartProvider = ({ children }) => {
	const [state, dispatch] = useReducer(reducer, initialState);

	const languageToggle = (passedLanguage) => {
		dispatch({ type: LANGUAGE_TOGGLE, payload: passedLanguage });
	};

	const addRoomToCart = (
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
		commissionRate // Add dynamic commission rate
	) => {
		dispatch({
			type: ADD_ROOM_TO_CART,
			payload: {
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
				commissionRate, // Pass dynamic commission rate to reducer
			},
		});
	};

	const removeRoomItem = (id) => {
		dispatch({ type: REMOVE_ROOM_ITEM, payload: id });
	};

	const toggleRoomAmount = (id, value) => {
		dispatch({ type: TOGGLE_ROOM_AMOUNT, payload: { id, value } });
	};

	const clearRoomCart = () => {
		dispatch({ type: CLEAR_ROOM_CART });
	};

	const openSidebar2 = () => {
		dispatch({ type: SIDEBAR_OPEN2 });
	};

	const closeSidebar2 = () => {
		dispatch({ type: SIDEBAR_CLOSE2 });
	};

	const updateRoomDates = (id, startDate, endDate) => {
		dispatch({
			type: UPDATE_ROOM_DATES,
			payload: { id, startDate, endDate },
		});
	};

	useEffect(() => {
		dispatch({ type: COUNT_ROOM_TOTALS });
		localStorage.setItem("roomCart", JSON.stringify(state.roomCart));
	}, [state.roomCart]);

	return (
		<CartContext.Provider
			value={{
				...state,
				languageToggle,
				addRoomToCart,
				removeRoomItem,
				toggleRoomAmount,
				clearRoomCart,
				openSidebar2,
				closeSidebar2,
				updateRoomDates,
			}}
		>
			{children}
		</CartContext.Provider>
	);
};

export const useCartContext = () => {
	return useContext(CartContext);
};
