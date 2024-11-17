/** @format */
import React, { useState } from "react";
import { Link, Redirect } from "react-router-dom";
import { Form, Input, Button, Typography, Row, Col, Card } from "antd";
import {
	UserOutlined,
	LockOutlined,
	MailOutlined,
	PhoneOutlined,
} from "@ant-design/icons";
import { signup, authenticate, isAuthenticated, signin } from "../auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";
import Helmet from "react-helmet";

const { Title } = Typography;

const Signup = () => {
	const [values, setValues] = useState({
		name: "",
		email: "",
		phone: "",
		password: "",
		password2: "",
		error: "",
		success: false,
		misMatch: false,
		loading: false,
	});

	const { name, email, phone, password, password2, loading } = values;

	const handleChange = (name) => (event) => {
		setValues({
			...values,
			error: false,
			misMatch: false,
			[name]: event.target.value,
		});
	};

	const formatPhoneNumber = (value) => {
		if (!value) return value;
		const phoneNumber = value.replace(/[^\d]/g, "");
		const phoneNumberLength = phoneNumber.length;

		if (phoneNumberLength < 4) return phoneNumber;
		if (phoneNumberLength < 7) {
			return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
		}
		return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(
			3,
			6
		)}-${phoneNumber.slice(6, 10)}`;
	};

	const handlePhoneChange = (event) => {
		const formattedPhoneNumber = formatPhoneNumber(event.target.value);
		setValues({
			...values,
			phone: formattedPhoneNumber,
		});
	};

	const validateEmail = (email) => {
		const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
		return re.test(String(email).toLowerCase());
	};

	const validatePhone = (phone) => {
		const phoneNumber = phone.replace(/[^\d]/g, "");
		const re = /^[2-9]{1}[0-9]{2}[2-9]{1}[0-9]{2}[0-9]{4}$/;
		return re.test(phoneNumber);
	};

	const validateName = (name) => {
		const parts = name.trim().split(" ");
		return parts.length >= 2 && parts.every((part) => part.length > 0);
	};

	const clickSubmit = async () => {
		const plainPhone = phone.replace(/[^\d]/g, ""); // Removing formatting for validation and submission
		if (!validateName(name)) {
			toast.error("Please add your full name");
			return;
		}

		if (!validateEmail(email)) {
			toast.error("Please enter a valid email address");
			return;
		}

		if (!validatePhone(plainPhone)) {
			toast.error("Please enter a valid US phone number");
			return;
		}

		if (password.length < 6) {
			toast.error("Password must be at least 6 characters long");
			return;
		}

		if (password !== password2) {
			setValues({
				...values,
				success: false,
				misMatch: true,
			});
			return toast.error("Passwords don't match, please try again");
		}

		setValues({ ...values, error: false, misMatch: false, loading: true });

		try {
			const data = await signup({ name, email, phone: plainPhone, password });
			if (data.error) {
				setValues({
					...values,
					error: data.error,
					success: false,
					loading: false,
				});
				toast.error(data.error);
			} else {
				const signinData = await signin({ emailOrPhone: email, password });
				if (signinData.error) {
					setValues({ ...values, error: signinData.error, loading: false });
					toast.error(signinData.error);
				} else {
					authenticate(signinData, () => {
						setValues({
							...values,
							success: true,
							loading: false,
						});
						window.location.reload(false);
					});
				}
			}
		} catch (error) {
			setValues({ ...values, error: error.message, loading: false });
			toast.error(error.message);
		}
	};

	const redirectUser = () => {
		if (isAuthenticated()) {
			return <Redirect to='/' />;
		}
	};

	const signUpForm = () => (
		<Row justify='center' style={{ marginTop: "50px" }}>
			<Col xs={24} sm={20} md={16} lg={12} xl={8}>
				<Card>
					<Title level={2} className='text-center'>
						Account <span className='text-primary'>Register</span>
					</Title>
					<Form onFinish={clickSubmit} layout='vertical'>
						<Form.Item
							name='name'
							label='Full Name'
							rules={[
								{ required: true, message: "Please input your full name!" },
							]}
						>
							<Input
								prefix={<UserOutlined />}
								value={name}
								onChange={handleChange("name")}
								placeholder='Full Name'
							/>
						</Form.Item>
						<Form.Item
							name='email'
							label='Email'
							rules={[{ required: true, message: "Please input your email!" }]}
						>
							<Input
								prefix={<MailOutlined />}
								value={email}
								onChange={handleChange("email")}
								placeholder='Email'
							/>
						</Form.Item>
						<Form.Item
							name='phone'
							label='Phone'
							rules={[
								{ required: true, message: "Please input your phone number!" },
							]}
						>
							<Input
								prefix={<PhoneOutlined />}
								value={phone}
								onChange={handlePhoneChange}
								placeholder='Phone'
							/>
						</Form.Item>
						<Form.Item
							name='password'
							label='Password'
							rules={[
								{ required: true, message: "Please input your password!" },
							]}
						>
							<Input.Password
								prefix={<LockOutlined />}
								value={password}
								onChange={handleChange("password")}
								placeholder='Password'
							/>
						</Form.Item>
						<Form.Item
							name='password2'
							label='Confirm Password'
							rules={[
								{ required: true, message: "Please confirm your password!" },
							]}
						>
							<Input.Password
								prefix={<LockOutlined />}
								value={password2}
								onChange={handleChange("password2")}
								placeholder='Confirm Password'
							/>
						</Form.Item>
						<Form.Item>
							<Button type='primary' htmlType='submit' block loading={loading}>
								Register
							</Button>
						</Form.Item>
					</Form>
					<hr />
					<p style={{ textAlign: "center" }}>
						If you already have an account, please{" "}
						<Link to='/signin' className='btn btn-sm btn-outline-primary'>
							Login Here
						</Link>
					</p>
				</Card>
			</Col>
		</Row>
	);

	return (
		<div
			style={{
				paddingBottom: "15px",
				minHeight: "800px",
				marginTop: "50px",
			}}
		>
			{window.scrollTo({ top: 8, behavior: "smooth" })}

			<Helmet>
				<meta charSet='utf-8' />
				<title>Jannat Booking | Account Register</title>
				<meta name='description' content='' />
				<meta name='keywords' content='' />
				<meta property='og:title' content='' />
				<meta property='og:description' content='' />
				<meta property='og:image' content='%PUBLIC_URL%/logo192.png' />
				<meta property='og:url' content='https://jannatbooking.com/signup' />
				<meta property='og:type' content='website' />
				<meta property='og:locale' content='en_US' />
				{/* <link rel='icon' href='gq_frontend/src/GeneralImgs/favicon.ico' /> */}
				<link rel='canonical' href='https://jannatbooking.com/signup' />
			</Helmet>
			<br />
			<ToastContainer className='toast-top-center' position='top-center' />
			{signUpForm()}
			{redirectUser()}
		</div>
	);
};

export default Signup;
