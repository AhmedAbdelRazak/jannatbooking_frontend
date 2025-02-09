import React, { useState } from "react";
import { Form, Input, Button, Row, Col, Typography } from "antd";
import { MailOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { contactUs } from "../auth";
import { ToastContainer, toast } from "react-toastify";
import { gettingJannatWebsiteData as getContacts } from "../apiCore";
import styled from "styled-components";
import { Helmet } from "react-helmet";
import favicon from "../favicon.ico";
import { FaWhatsapp } from "react-icons/fa";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const ContactUs = () => {
	const [values, setValues] = useState({
		name: "",
		email: "",
		subject: "",
		text: "",
		success: false,
		loading: false,
	});
	const [contact, setContact] = useState({});
	const { name, email, subject, text, loading } = values;

	const handleChange = (name) => (event) => {
		setValues({ ...values, [name]: event.target.value });
	};

	const clickSubmit = (event) => {
		event.preventDefault();
		window.scrollTo({ top: 0, behavior: "smooth" });
		setValues({ ...values, loading: true });

		contactUs({ name, email, subject, text }).then((data) => {
			if (data.error) {
				setValues({
					...values,
					error: data.error,
					success: false,
					loading: false,
				});
				toast.error(data.error);
			} else {
				toast.success(
					"Your form was successfully submitted. Our support team will contact you!"
				);
				setValues({
					name: "",
					email: "",
					subject: "",
					text: "",
					success: true,
					loading: false,
				});
			}
		});
	};

	// eslint-disable-next-line
	const gettingAllContacts = () => {
		getContacts().then((data) => {
			if (data.error) {
				console.log(data.error);
			} else {
				const lastContact = data[data.length - 1];
				if (lastContact) {
					setContact({
						...lastContact,
						email: lastContact.email.replace(/<br>/g, ""),
						phone: lastContact.phone.replace(/<br>/g, ""),
					});
				}
			}
		});
	};

	// WhatsApp support number (digits only, without special characters)
	const supportWhatsAppNumber = "19092223374"; // corresponds to +1 (909) 222-3374

	return (
		<ContactUsWrapper>
			{window.scrollTo({ top: 10, behavior: "smooth" })}
			<Helmet>
				<title>Contact Us | Jannat Booking - Haj & Omrah Support</title>
				<meta
					name='description'
					content="Contact Jannat Booking for inquiries, support, or feedback regarding Haj and Omrah hotel bookings. We're here to assist you with your pilgrimage accommodations."
				/>
				<meta
					name='keywords'
					content='Jannat Booking, Contact Us, Haj hotel support, Omrah hotel inquiries, pilgrimage support, hotel booking assistance, customer service'
				/>

				{/* Open Graph Tags */}
				<meta property='og:title' content='Contact Us | Jannat Booking' />
				<meta
					property='og:description'
					content='Get in touch with Jannat Booking for Haj and Omrah hotel bookings. Our support team is here to help you with all your inquiries and reservations.'
				/>
				<meta property='og:url' content='https://jannatbooking.com/contact' />
				<meta property='og:type' content='website' />
				<meta
					property='og:image'
					content='https://jannatbooking.com/contact_banner.jpg'
				/>
				<meta property='og:locale' content='en_US' />

				{/* Twitter Card */}
				<meta name='twitter:card' content='summary_large_image' />
				<meta name='twitter:title' content='Contact Us | Jannat Booking' />
				<meta
					name='twitter:description'
					content="Reach out to Jannat Booking for assistance with Haj and Omrah hotel reservations. We're happy to help with your inquiries."
				/>

				{/* Canonical URL */}
				<link rel='canonical' href='https://jannatbooking.com/contact' />

				{/* Favicon */}
				<link rel='icon' href={favicon} />
			</Helmet>

			<Row justify='center' align='middle'>
				<Col xs={24} sm={20} md={16} lg={12} xl={16}>
					<ContactUsContent>
						<Title level={2}>Contact Us</Title>
						<Paragraph>
							Your comfort is our first priority. Please reach out to us with
							any inquiries or concerns. We are here to help you and ensure you
							have the best experience with our services.
						</Paragraph>
						<Paragraph>
							<ClockCircleOutlined /> We are available Monday through Friday
							from 9 AM to 5 PM.
						</Paragraph>
						<Paragraph>
							<MailOutlined /> Email:{" "}
							{contact.email || "support@jannatbooking.com"}
						</Paragraph>
						<Paragraph
							onClick={() => {
								ReactGA.event({
									category: "Whatsapp phone was clicked Contact Us Page",
									action: "Whatsapp phone was clicked Contact Us Page",
									label: `Whatsapp phone was clicked Contact Us Page`,
								});

								ReactPixel.track("Whatsapp phone was clicked Contact Us Page", {
									action: "User Clicked on Whatsapp phone",
									page: "Contact Us Page",
								});
							}}
						>
							{/* WhatsApp phone number – click to launch WhatsApp */}
							<a
								href={`https://wa.me/${supportWhatsAppNumber}`}
								target='_blank'
								rel='noreferrer'
								style={{
									textDecoration: "none",
									color: "inherit",
									display: "flex",
									alignItems: "center",
								}}
							>
								<FaWhatsapp
									style={{
										color: "#25D366",
										marginRight: "8px",
										fontSize: "20px",
									}}
								/>
								+1 (909) 222-3374
							</a>
						</Paragraph>
						<Paragraph>
							Please allow us 24 hours to respond to your inquiry.
						</Paragraph>

						<FormWrapper>
							<Form
								layout='vertical'
								name='contact_form'
								onFinish={clickSubmit}
							>
								<ToastContainer />
								<Form.Item
									name='name'
									label='Name'
									rules={[
										{ required: true, message: "Please enter your name" },
									]}
								>
									<Input
										value={name}
										onChange={handleChange("name")}
										placeholder='Your Name'
									/>
								</Form.Item>
								<Form.Item
									name='email'
									label='Email'
									rules={[
										{ required: true, message: "Please enter your email" },
										{ type: "email", message: "Please enter a valid email" },
									]}
								>
									<Input
										value={email}
										onChange={handleChange("email")}
										placeholder='Your Email'
									/>
								</Form.Item>
								<Form.Item
									name='subject'
									label='Subject'
									rules={[
										{ required: true, message: "Please enter the subject" },
									]}
								>
									<Input
										value={subject}
										onChange={handleChange("subject")}
										placeholder='Subject'
									/>
								</Form.Item>
								<Form.Item
									name='message'
									label='Message'
									rules={[
										{ required: true, message: "Please enter your message" },
									]}
								>
									<TextArea
										value={text}
										onChange={handleChange("text")}
										rows={4}
										placeholder='Your Message'
									/>
								</Form.Item>
								<Form.Item>
									<SubmitButton
										type='primary'
										htmlType='submit'
										loading={loading}
									>
										Submit
									</SubmitButton>
								</Form.Item>
							</Form>
						</FormWrapper>
					</ContactUsContent>
				</Col>
			</Row>
		</ContactUsWrapper>
	);
};

export default ContactUs;

const ContactUsWrapper = styled.div`
	padding: 100px 20px;
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const ContactUsContent = styled.div`
	background: white;
	padding: 30px;
	border-radius: 10px;
	box-shadow: var(--box-shadow-light);
	margin: 0 auto;

	@media (max-width: 768px) {
		padding: 20px;
		max-width: 100%; /* Full width on smaller screens */
	}
`;

const FormWrapper = styled.div`
	margin-top: 30px;
`;

const SubmitButton = styled(Button)`
	width: 100%;
	background-color: var(--primary-color);
	border-color: var(--primary-color);
	color: var(--button-font-color);
	transition: var(--main-transition);

	&:hover,
	&:focus {
		background-color: var(--primary-color-dark);
		border-color: var(--primary-color-dark);
	}
`;
