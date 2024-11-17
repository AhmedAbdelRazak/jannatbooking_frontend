import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { isAuthenticated, updateUserProfile, readUser } from "../../auth";
import { Form, Input, Button, Typography } from "antd";
import {
	UserOutlined,
	MailOutlined,
	PhoneOutlined,
	LockOutlined,
} from "@ant-design/icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";
import { updateUser } from "../../apiCore";

const { Title } = Typography;

const UpdateAccount = () => {
	const [form] = Form.useForm();
	const [values, setValues] = useState({
		name: "",
		email: "",
		phone: "",
		password: "",
		confirmPassword: "",
		loading: false,
	});

	const { name, email, phone, password, confirmPassword, loading } = values;
	const { token } = isAuthenticated();
	const userId = isAuthenticated().user._id;

	const loadUserProfile = () => {
		readUser(userId, token).then((data) => {
			if (data.error) {
				toast.error(data.error);
			} else {
				console.log(data, "data");
				setValues((prevValues) => ({
					...prevValues,
					name: data.name,
					email: data.email,
					phone: data.phone,
				}));
				form.setFieldsValue({
					name: data.name,
					email: data.email,
					phone: data.phone,
				});
			}
		});
	};

	useEffect(() => {
		loadUserProfile();
		// eslint-disable-next-line
	}, []);

	const handleChange = (name) => (event) => {
		setValues({ ...values, [name]: event.target.value });
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

	const handleSubmit = () => {
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

		if (password !== confirmPassword) {
			setValues({
				...values,
				success: false,
				misMatch: true,
			});
			return toast.error("Passwords don't match, please try again");
		}

		setValues({ ...values, loading: true });

		const user = { name, email, phone };
		if (password) {
			user.password = password;
		}

		updateUserProfile(userId, token, user).then((data) => {
			if (data.error) {
				toast.error(data.error);
			} else {
				updateUser(data, () => {
					toast.success("Profile updated successfully");
					setValues({
						...values,
						password: "",
						confirmPassword: "",
						loading: false,
					});
				});
			}
		});
	};

	return (
		<ProfileWrapper>
			<Title level={2} className='text-center'>
				Update Profile
			</Title>
			<FormWrapper>
				<Form
					form={form}
					onFinish={handleSubmit}
					layout='vertical'
					initialValues={{ name, email, phone }}
				>
					<Form.Item
						label='Full Name'
						name='name'
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
						label='Email'
						name='email'
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
						label='Phone'
						name='phone'
						rules={[
							{ required: true, message: "Please input your phone number!" },
						]}
					>
						<Input
							prefix={<PhoneOutlined />}
							value={phone}
							onChange={handleChange("phone")}
							placeholder='Phone'
						/>
					</Form.Item>
					<Form.Item label='Password' name='password'>
						<Input.Password
							prefix={<LockOutlined />}
							value={password}
							onChange={handleChange("password")}
							placeholder='Password'
						/>
					</Form.Item>
					<Form.Item label='Confirm Password' name='confirmPassword'>
						<Input.Password
							prefix={<LockOutlined />}
							value={confirmPassword}
							onChange={handleChange("confirmPassword")}
							placeholder='Confirm Password'
						/>
					</Form.Item>
					<Form.Item>
						<Button type='primary' htmlType='submit' block loading={loading}>
							Update Profile
						</Button>
					</Form.Item>
				</Form>
			</FormWrapper>
			<ToastContainer className='toast-top-center' position='top-center' />
		</ProfileWrapper>
	);
};

export default UpdateAccount;

const ProfileWrapper = styled.div`
	padding: 20px;
	max-width: 600px;
	margin: 0 auto;
`;

const FormWrapper = styled.div`
	background-color: #f9f9f9; /* Light background color */
	padding: 20px;
	border-radius: 3px; /* 3px border radius */
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
`;
