/** @format */

import React, { useState, Fragment } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

const Forgot = () => {
	const [values, setValues] = useState({
		emailOrPhone: "",
		buttonText: "Reset Link",
		waLink: "",
	});

	const { emailOrPhone, buttonText, waLink } = values;

	const toEnglishDigits = (value = "") =>
		value
			.replace(/[\u0660-\u0669]/g, (d) =>
				String(d.charCodeAt(0) - 0x0660)
			)
			.replace(/[\u06f0-\u06f9]/g, (d) =>
				String(d.charCodeAt(0) - 0x06f0)
			);

	const normalizeCredential = (value = "") => {
		const normalized = toEnglishDigits(value).trim();
		if (normalized.includes("@")) return normalized.toLowerCase();
		return normalized.replace(/[^\d+]/g, "");
	};

	const handleChange = (name) => (event) => {
		setValues({
			...values,
			[name]: normalizeCredential(event.target.value),
			waLink: "",
		});
	};

	const clickSubmit = (event) => {
		event.preventDefault();
		setValues({ ...values, buttonText: "Submitting", waLink: "" });
		axios({
			method: "PUT",
			url: `${process.env.REACT_APP_API_URL}/forgot-password`,
			data: { emailOrPhone, client: "jannat" },
		})
			.then((response) => {
				console.log("FORGOT PASSWORD SUCCESS", response);
				toast.success(response.data.message);
				setValues({
					...values,
					buttonText: "Password Reset Requested",
					waLink: response.data?.wa_link || "",
				});
			})
			.catch((error) => {
				console.log("FORGOT PASSWORD ERROR", error.response?.data || error);
				toast.error(
					error.response?.data?.error || "Failed to request password reset."
				);
				setValues({
					...values,
					buttonText: "Request password reset link",
					waLink: "",
				});
			});
	};

	const passwordForgotForm = () => (
		<form>
			<div className='form-group'>
				<label className='text-muted'>Email or WhatsApp number</label>
				<input
					onChange={handleChange("emailOrPhone")}
					value={emailOrPhone}
					type='text'
					className='form-control'
					placeholder='you@example.com or +966...'
				/>
				<small className='text-muted'>
					Enter an email to receive the link by email, or a phone number to
					receive it by WhatsApp.
				</small>
			</div>

			<div>
				<button
					className='btn btn-primary'
					onClick={clickSubmit}
					disabled={!emailOrPhone}>
					{buttonText}
				</button>
			</div>
			{waLink && (
				<div className='mt-3 text-center'>
					<a
						href={waLink}
						target='_blank'
						rel='noreferrer'
						className='btn btn-success btn-sm'
					>
						Open WhatsApp
					</a>
				</div>
			)}
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
