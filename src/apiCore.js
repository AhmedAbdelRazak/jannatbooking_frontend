export const PropertySignup = (userData) => {
	console.log(userData, "userData");
	return fetch(`${process.env.REACT_APP_API_URL}/property-listing`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify(userData),
	})
		.then((response) => {
			if (!response.ok) {
				return response.text().then((text) => {
					throw new Error(text);
				});
			}
			return response.json();
		})
		.catch((err) => {
			console.log(err);
			throw err;
		});
};

export const triggerPaymentClient = (
	userId,
	token,
	reservationId,
	amountUSD,
	paymentOption,
	customUSD,
	amountSAR
) => {
	return fetch(`${process.env.REACT_APP_API_URL}/create-payment-client`, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({
			reservationId,
			// The final USD amount to charge via Authorize.Net
			amount: amountUSD,
			paymentOption,
			// If customAmount chosen, original custom USD typed by user
			customUSD,
			// The matching SAR amount for your own records
			amountSAR,
		}),
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			return response.json();
		})
		.catch((err) => console.error("Error triggering payment:", err));
};

export const createNewSupportCase = async (data) => {
	return fetch(`${process.env.REACT_APP_API_URL}/support-cases/new`, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error("Network response was not ok " + response.statusText);
			}
			return response.json();
		})
		.catch((err) => {
			console.error("API error: ", err);
		});
};

export const getSupportCaseById = (caseId, token) => {
	return fetch(`${process.env.REACT_APP_API_URL}/support-cases/${caseId}`, {
		method: "GET",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const updateSupportCase = (caseId, data, token) => {
	return fetch(`${process.env.REACT_APP_API_URL}/support-cases/${caseId}`, {
		method: "PUT",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(data),
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const updateReservationDetailsClient = (reservationId, data) => {
	return fetch(
		`${process.env.REACT_APP_API_URL}/update-reservation-client/${reservationId}`,
		{
			method: "PUT",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		}
	)
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

// Fetch unseen messages by Super Admin or PMS Owner
export const getUnseenMessagesByAdminOrOwner = async (hotelId) => {
	return fetch(
		`${process.env.REACT_APP_API_URL}/support-cases/${hotelId}/unseen/admin-owner`,
		{
			method: "GET",
			headers: {
				Accept: "application/json",
			},
		}
	)
		.then((response) => {
			if (!response.ok) {
				throw new Error("Network response was not ok " + response.statusText);
			}
			return response.json();
		})
		.catch((err) => {
			console.error("API error: ", err);
		});
};

// Fetch unseen messages by Hotel Owner
export const getUnseenMessagesByHotelOwner = async (hotelId) => {
	return fetch(
		`${process.env.REACT_APP_API_URL}/support-cases/${hotelId}/unseen/hotel-owner`,
		{
			method: "GET",
			headers: {
				Accept: "application/json",
			},
		}
	)
		.then((response) => {
			if (!response.ok) {
				throw new Error("Network response was not ok " + response.statusText);
			}
			return response.json();
		})
		.catch((err) => {
			console.error("API error: ", err);
		});
};

// Fetch unseen messages by Regular Client
export const getUnseenMessagesByClient = async (clientId) => {
	return fetch(
		`${process.env.REACT_APP_API_URL}/support-cases-client/${clientId}/unseen`,
		{
			method: "GET",
			headers: {
				Accept: "application/json",
			},
		}
	)
		.then((response) => {
			if (!response.ok) {
				throw new Error("Network response was not ok " + response.statusText);
			}
			return response.json();
		})
		.catch((err) => {
			console.error("API error: ", err);
		});
};

// Update seen status for Admin or Owner
export const updateSeenStatusForAdminOrOwner = async (caseId) => {
	return fetch(
		`${process.env.REACT_APP_API_URL}/support-cases/${caseId}/seen/admin-owner`,
		{
			method: "PUT",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		}
	)
		.then((response) => {
			if (!response.ok) {
				throw new Error("Network response was not ok " + response.statusText);
			}
			return response.json();
		})
		.catch((err) => {
			console.error("API error: ", err);
		});
};

// Update seen status for Regular Client
export const updateSeenStatusForClient = async (caseId) => {
	return fetch(
		`${process.env.REACT_APP_API_URL}/support-cases/${caseId}/seen/client`,
		{
			method: "PUT",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		}
	)
		.then((response) => {
			if (!response.ok) {
				throw new Error("Network response was not ok " + response.statusText);
			}
			return response.json();
		})
		.catch((err) => {
			console.error("API error: ", err);
		});
};

export const updateSeenByCustomer = async (caseId) => {
	return fetch(
		`${process.env.REACT_APP_API_URL}/support-cases/${caseId}/seen/client`, // Correct path
		{
			method: "PUT",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		}
	)
		.then((response) => response.json())
		.catch((err) => {
			console.error("API error: ", err);
		});
};

export const getUnseenMessagesDetailsByCustomer = async (token) => {
	try {
		const response = await fetch(
			`${process.env.REACT_APP_API_URL}/support-cases-customer/unseen/details`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);
		return await response.json();
	} catch (error) {
		console.error("Error fetching unseen messages count", error);
		throw error;
	}
};

export const getUnseenMessagesCountByCustomer = async (caseId) => {
	return fetch(
		`${process.env.REACT_APP_API_URL}/support-cases-customer/${caseId}/unseen-count`,
		{
			method: "GET",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		}
	)
		.then((response) => response.json())
		.catch((err) => {
			console.error("API error: ", err);
		});
};

export const gettingJannatWebsiteData = (token) => {
	return fetch(`${process.env.REACT_APP_API_URL}/janat-website-document`, {
		method: "GET",
		headers: {
			// content type?
			"Content-Type": "application/json",
			Accept: "application/json",
			Authorization: `Bearer ${token}`,
		},
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const gettingActiveHotels = (token) => {
	return fetch(`${process.env.REACT_APP_API_URL}/active-hotels`, {
		method: "GET",
		headers: {
			// content type?
			"Content-Type": "application/json",
			Accept: "application/json",
			Authorization: `Bearer ${token}`,
		},
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const gettingDistinctRoomTypes = (token) => {
	return fetch(`${process.env.REACT_APP_API_URL}/distinct-rooms`, {
		method: "GET",
		headers: {
			// content type?
			"Content-Type": "application/json",
			Accept: "application/json",
			Authorization: `Bearer ${token}`,
		},
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const gettingRoomByIds = (ids) => {
	return fetch(`${process.env.REACT_APP_API_URL}/rooms/get-by-ids`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json", // Specify that we are sending JSON
			Accept: "application/json", // Accept JSON in response
		},
		body: JSON.stringify({ roomIds: ids }), // Pass the array of room IDs in the body
	})
		.then((response) => {
			if (!response.ok) {
				// Handle errors with a meaningful message
				throw new Error(`Error: ${response.status} ${response.statusText}`);
			}
			return response.json(); // Parse the JSON response
		})
		.catch((err) => {
			console.error("Error fetching room data:", err);
		});
};

export const gettingSingleHotel = (hotelSlug) => {
	return fetch(`${process.env.REACT_APP_API_URL}/single-hotel/${hotelSlug}`, {
		method: "GET",
		headers: {
			// content type?
			"Content-Type": "application/json",
			Accept: "application/json",
		},
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const gettingSingleReservationById = (reservationId) => {
	return fetch(
		`${process.env.REACT_APP_API_URL}/reservations/single-reservation/${reservationId}`,
		{
			method: "GET",
			headers: {
				// content type?
				"Content-Type": "application/json",
				Accept: "application/json",
			},
		}
	)
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const gettingActiveHotelList = () => {
	return fetch(`${process.env.REACT_APP_API_URL}/active-hotel-list`, {
		method: "GET",
		headers: {
			// content type?
			"Content-Type": "application/json",
			Accept: "application/json",
		},
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const getRoomQuery = async (query) => {
	return fetch(`${process.env.REACT_APP_API_URL}/room-query-list/${query}`, {
		method: "GET",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
	})
		.then((response) => response.json())
		.catch((err) => {
			console.error("API error: ", err);
		});
};

export const createNewReservationClient = async (reservationData) => {
	return fetch(`${process.env.REACT_APP_API_URL}/new-reservation-client`, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(reservationData), // This line was missing the body to send the request data
	})
		.then((response) => response.json())
		.catch((err) => {
			console.error("API error: ", err);
		});
};

export const createNewUncompletedReservationClient = async (
	uncompletedReservationData
) => {
	return fetch(
		`${process.env.REACT_APP_API_URL}/create-uncomplete-reservation-document`,
		{
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(uncompletedReservationData), // This line was missing the body to send the request data
		}
	)
		.then((response) => response.json())
		.catch((err) => {
			console.error("API error: ", err);
		});
};

export const gettingUserAndReservationData = async (userId) => {
	return fetch(`${process.env.REACT_APP_API_URL}/user/reservations/${userId}`, {
		method: "GET",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
	})
		.then((response) => response.json())
		.catch((err) => {
			console.error("API error: ", err);
		});
};

export const updateUser = (user, next) => {
	if (typeof window !== "undefined") {
		if (localStorage.getItem("jwt")) {
			let auth = JSON.parse(localStorage.getItem("jwt"));
			auth.user = user;
			localStorage.setItem("jwt", JSON.stringify(auth));
			next();
		}
	}
};

export const gettingHotelDetailsById = async (hotelId) => {
	return fetch(`${process.env.REACT_APP_API_URL}/user/hotel/${hotelId}`, {
		method: "GET",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
	})
		.then((response) => response.json())
		.catch((err) => {
			console.error("API error: ", err);
		});
};

export const currencyConversion = (amounts) => {
	const saudimoney = amounts
		.map((amount) => Number(amount).toFixed(2))
		.join(",");
	return fetch(
		`${process.env.REACT_APP_API_URL}/currencyapi-amounts/${saudimoney}`,
		{
			method: "GET",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		}
	)
		.then((response) => response.json())
		.catch((err) => console.log(err));
};
