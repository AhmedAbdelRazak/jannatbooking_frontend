/** @format */
import React, { useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import styled from "styled-components";
import { authenticate, isAuthenticated, signin } from "../auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";
import { Helmet } from "react-helmet";
import { Form, Input, Button, Typography, Row, Col, Card } from "antd";
import { MailOutlined, PhoneOutlined, LockOutlined } from "@ant-design/icons";

const { Title } = Typography;

const Signin = ({ history }) => {
	const location = useLocation();
	// eslint-disable-next-line
	const historyInstance = useHistory();

	const [values, setValues] = useState({
		emailOrPhone: "",
		password: "",
		loading: false,
		redirectToReferrer: false,
	});

	const { emailOrPhone, password, loading, redirectToReferrer } = values;
	const { user } = isAuthenticated();

	// Extract the returnUrl from query params
	const params = new URLSearchParams(location.search);
	const returnUrl = params.get("returnUrl") || "/our-hotels";

	const handleChange = (name) => (event) => {
		setValues({ ...values, error: false, [name]: event.target.value });
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
			emailOrPhone: formattedPhoneNumber,
		});
	};

	const clickSubmit = (values) => {
		setValues({ ...values, error: false, loading: true });
		signin({
			emailOrPhone: values.emailOrPhone,
			password: values.password,
		}).then((data) => {
			if (data.error) {
				setValues({ ...values, error: data.error, loading: false });
				toast.error(data.error);
			} else if (data.user.activeUser === false) {
				setValues({ ...values, error: data.error, loading: false });
				return toast.error(
					"User was deactivated, Please reach out to the admin site"
				);
			} else {
				authenticate(data, () => {
					setValues({
						...values,
					});
					if (data.user.role === 1) {
						window.location.href = `${process.env.REACT_APP_XHOTEL}/admin/dashboard`;
					} else {
						window.location.href = returnUrl;
						// historyInstance.push(returnUrl); // Redirect to the returnUrl or default route
					}
				});
			}
		});
	};

	const showLoading = () =>
		loading && (
			<div className='alert alert-info'>
				<h2>Loading...</h2>
			</div>
		);

	const redirectUser = () => {
		if (redirectToReferrer) {
			if (user.user.role === 1) {
				window.location.href = "/admin/dashboard";
			} else if (user.user.role === 3) {
				window.location.href = "/order-taker/create-new-order";
			} else if (user.user.role === 4) {
				window.location.href = "/operations/sales-history";
			} else {
				window.location.href = "/";
			}
		}
	};

	const signinForm = () => (
		<Row justify='center' style={{ marginTop: "50px" }}>
			<Col xs={24} sm={20} md={17} lg={14} xl={15}>
				<Card>
					<Title level={2} className='text-center'>
						Account <span className='text-primary'>Login</span>
					</Title>
					<Form onFinish={clickSubmit} layout='vertical'>
						<Form.Item
							name='emailOrPhone'
							label='Email or Phone'
							rules={[
								{
									required: true,
									message: "Please input your email or phone!",
								},
							]}
						>
							<Input
								prefix={
									emailOrPhone.includes("@") ? (
										<MailOutlined />
									) : (
										<PhoneOutlined />
									)
								}
								value={emailOrPhone}
								onChange={
									emailOrPhone.includes("@")
										? handleChange("emailOrPhone")
										: handlePhoneChange
								}
								placeholder='Email / Phone'
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
						<Form.Item>
							<Button type='primary' htmlType='submit' block loading={loading}>
								Login
							</Button>
						</Form.Item>
					</Form>
					<hr />
					<p style={{ textAlign: "center" }}>
						Forgot Your Password? Please{" "}
						<Link
							to='/auth/password/forgot'
							className='btn btn-sm btn-outline-danger'
						>
							Reset Your Password
						</Link>
					</p>
				</Card>
			</Col>
		</Row>
	);

	return (
		<WholeSignin>
			<Helmet>
				<meta charSet='utf-8' />
				<title>Jannat Booking | Account Login</title>
				<meta name='description' content='' />
				<meta name='keywords' content='' />
				<meta property='og:title' content='Jannat Booking | Account Login' />
				<meta property='og:description' content='' />
				<meta property='og:url' content='https://jannatbooking.com/signin' />
				<meta property='og:type' content='website' />
				<meta property='og:locale' content='en_US' />
				{/* <link rel='icon' href='serene_frontend/src/GeneralImgs/favicon.ico' /> */}
				<link rel='canonical' href='https://jannatbooking.com/signin' />
			</Helmet>
			<ToastContainer />
			{showLoading()}
			<div className='row'>
				<div className='col-md-8 mx-auto'>{signinForm()}</div>
			</div>
			{redirectUser()}
		</WholeSignin>
	);
};

export default Signin;

const WholeSignin = styled.div`
	overflow-x: hidden;
	min-height: 700px;
	margin: 0px !important;

	.storeName {
		color: darkred;
		letter-spacing: 5px;
		font-size: 1.8rem;
		font-weight: bold;
	}

	@media (max-width: 1000px) {
		.infiniteAppsLogo {
			width: 48px;
			height: 48px;
		}
	}
`;
