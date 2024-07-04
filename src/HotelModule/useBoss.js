import { useState, useEffect } from "react";

// Custom hook to get and set the 'boss' value in local storage
function useBoss() {
	// Initialize the state with the value from local storage
	const [isBoss, setIsBoss] = useState(() => {
		const saved = localStorage.getItem("boss");
		return saved === "true" ? true : false;
	});

	// Update local storage when the state changes
	useEffect(() => {
		localStorage.setItem("boss", isBoss);
	}, [isBoss]);

	return [isBoss, setIsBoss];
}

export default useBoss;
