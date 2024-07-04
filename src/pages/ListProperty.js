import React, { useState } from "react";
import styled from "styled-components";
import ListYourProperty from "../components/Signup/ListYourProperty";
import { defaultUserValues } from "../Assets";
import { PropertySignup } from "../apiCore";
import { toast } from "react-toastify";
import ListPropertyHero from "../components/Signup/ListPropertyHero";
import LoadingSpinner from "../components/Signup/LoadingSpinner";

const ListProperty = () => {
	const [values, setValues] = useState(defaultUserValues);
	const [loading, setLoading] = useState(false); // State for loading spinner

	const handleChange = (name) => (event) => {
		const value = event.target ? event.target.value : event;
		setValues({
			...values,
			error: false,
			misMatch: false,
			[name]: value,
		});
	};

	const validateForm = () => {
		const requiredFields = [
			"name",
			"email",
			"password",
			"password2",
			"phone",
			"hotelName",
			"hotelAddress",
			"hotelCountry",
			"hotelState",
			"hotelCity",
			"propertyType",
		];
		for (let field of requiredFields) {
			if (!values[field]) {
				toast.error(`Please fill in your ${field}`);
				return false;
			}
		}
		if (values.password !== values.password2) {
			toast.error("Error! Passwords are not matching");
			return false;
		}
		return true;
	};

	const clickSubmit = async (event) => {
		// Validate the form
		if (!validateForm()) return;

		const {
			name,
			email,
			password,
			password2,
			phone,
			hotelName,
			hotelAddress,
			hotelCountry,
			hotelState,
			hotelCity,
			propertyType,
		} = values;

		// Check for two words in name
		const nameParts = name.trim().split(" ");
		if (nameParts.length < 2) {
			toast.error("Please enter your full name (first and last name).");
			return;
		}

		// Check for valid email
		const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (!emailPattern.test(email)) {
			toast.error("Please enter a valid email address.");
			return;
		}

		// Check for password match
		if (password !== password2) {
			toast.error("Error! Passwords are not matching.");
			return;
		}

		// Check for password length
		if (password.length < 6) {
			toast.error("Password should be at least 6 characters long.");
			return;
		}

		// Check for password containing at least one letter and one digit
		const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
		if (!passwordPattern.test(password)) {
			toast.error("Password should contain at least one letter and one digit.");
			return;
		}

		setValues({ ...values, error: false, misMatch: false });
		setLoading(true); // Show loading spinner

		try {
			const data = await PropertySignup({
				name,
				email,
				password,
				phone,
				hotelName,
				hotelAddress,
				hotelCountry,
				hotelState,
				hotelCity,
				propertyType,
			});

			setLoading(false); // Hide loading spinner

			if (data.error) {
				setValues({ ...values, error: data.error, success: false });
				toast.error(data.error);
			} else {
				toast.success("Hotel Account Was Successfully Created!");
				setTimeout(() => {
					window.location.href = `${process.env.REACT_APP_XHOTEL}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
				}, 2000); // Redirect after 2 seconds
			}
		} catch (error) {
			setLoading(false);
			toast.error(error.message || "An error occurred during signup.");
		}
	};

	return (
		<ListPropertyWrapper>
			{loading ? (
				<LoadingSpinner /> // Show spinner if loading is true
			) : (
				<>
					<ListPropertyHero />
					<CenteredContainer>
						<StyledCard>
							<ListYourProperty
								handleChange={handleChange}
								clickSubmit={clickSubmit}
								values={values}
							/>
						</StyledCard>
					</CenteredContainer>
				</>
			)}
		</ListPropertyWrapper>
	);
};

export default ListProperty;

const ListPropertyWrapper = styled.div`
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-bottom: 50px;
`;

const CenteredContainer = styled.div`
	width: 100%;
	padding: 20px;
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
`;

const StyledCard = styled.div`
	width: 100%;
	padding: 20px;
	border-radius: 10px;
`;
