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
