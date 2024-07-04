/** @format */

import React, { useState, useEffect, Fragment } from "react";
import jwt from "jsonwebtoken";
import axios from "axios";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

const Reset = ({ match, history }) => {
	// props.match from react router dom
	const [values, setValues] = useState({
		name: "",
		token: "",
		newPassword: "",
		buttonText: "Reset password",
	});

	useEffect(() => {
		let token = match.params.token;
		let { name } = jwt.decode(token);
		// console.log(name);
		if (token) {
			setValues({ ...values, name, token });
		}
		// eslint-disable-next-line
	}, []);

	const { name, token, newPassword, buttonText } = values;

	const handleChange = (event) => {
		setValues({ ...values, newPassword: event.target.value });
	};

	const clickSubmit = (event) => {
		event.preventDefault();
		setValues({ ...values, buttonText: "Submitting" });
		axios({
			method: "PUT",
			url: `${process.env.REACT_APP_API_URL}/reset-password`,
			data: { newPassword, resetPasswordLink: token },
		})
			.then((response) => {
				console.log("RESET PASSWORD SUCCESS", response);
				toast.success(response.data.message);
				setValues({ ...values, buttonText: "Done" });
				setTimeout(function () {
					history.push("/signin");
				}, 3000);
			})
			.catch((error) => {
				console.log("RESET PASSWORD ERROR", error.response.data);
				toast.error(error.response.data.error);
				setValues({ ...values, buttonText: "Reset password" });
			});
	};

	const passwordResetForm = () => (
		<form>
			<div className='form-group'>
				<label className='text-muted'>New Password</label>
				<input
					onChange={handleChange}
					value={newPassword}
					type='password'
					className='form-control'
					placeholder='Type new password'
					required
				/>
			</div>

			<div>
				<button
					className='btn btn-primary'
					onClick={clickSubmit}
					disabled={!newPassword}>
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
					className='text-center mt-2 mb-4 p-2'
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
					Hey {name}, Please Type your new password
				</div>
				{passwordResetForm()}
			</div>
		</Fragment>
	);
};

export default Reset;
