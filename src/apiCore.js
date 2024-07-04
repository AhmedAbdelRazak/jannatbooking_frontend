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
