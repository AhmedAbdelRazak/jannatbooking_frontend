/** @format */

import React, { useState, Fragment } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

const Forgot = () => {
	const [values, setValues] = useState({
		email: "",
		buttonText: "Reset Link",
	});

	const { email, buttonText } = values;

	const handleChange = (name) => (event) => {
		// console.log(event.target.value);
		setValues({ ...values, [name]: event.target.value });
	};

	const clickSubmit = (event) => {
		event.preventDefault();
		setValues({ ...values, buttonText: "Submitting" });
		axios({
			method: "PUT",
			url: `${process.env.REACT_APP_API_URL}/forgot-password`,
			data: { email },
		})
			.then((response) => {
				console.log("FORGOT PASSWORD SUCCESS", response);
				toast.success(response.data.message);
				setValues({ ...values, buttonText: "Password Reset Requested" });
			})
			.catch((error) => {
				console.log("FORGOT PASSWORD ERROR", error.response.data);
				toast.error(error.response.data.error);
				setValues({ ...values, buttonText: "Request password reset link" });
			});
	};

	const passwordForgotForm = () => (
		<form>
			<div className='form-group'>
				<label className='text-muted'>Email</label>
				<input
					onChange={handleChange("email")}
					value={email}
					type='email'
					className='form-control'
				/>
			</div>

			<div>
				<button
					className='btn btn-primary'
					onClick={clickSubmit}
					disabled={!email}>
					{buttonText}
				</button>
			</div>
		</form>
	);

	return (
		<Fragment>
			<div
				className='col-md-6 offset-md-3 my-5 p-4'
				style={{ borderRadius: "50px", border: "2px black solid" }}>
				<ToastContainer />
				<div
					className='text-center my-3 p-2'
					style={{
						fontSize: "1.6rem",
						fontWeight: "bold",
						fontStyle: "italic",
						color: "white",
						border: "2px black solid",
						marginLeft: "100px",
						marginRight: "100px",
						borderRadius: "50px",
						backgroundColor: "#00264c",
						boxShadow: "2px 2px 5px 5px rgba(0,0,0,0.5)",
					}}>
					Forgot password
				</div>
				{passwordForgotForm()}
			</div>
		</Fragment>
	);
};

export default Forgot;
