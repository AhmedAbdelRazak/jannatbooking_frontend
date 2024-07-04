/** @format */

import { LANGUAGE_TOGGLE } from "./actions";

const cart_reducer = (state, action) => {
	if (action.type === LANGUAGE_TOGGLE) {
		return { ...state, chosenLanguage: action.payload };
	}

	throw new Error(`No Matching "${action.type}" - action type`);
};

export default cart_reducer;
