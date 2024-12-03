import React from "react";
import { Link } from "react-router-dom";
import {
	Form,
	Input,
	Button,
	Typography,
	Row,
	Col,
	Card,
	Select,
	Checkbox,
} from "antd";
import {
	UserOutlined,
	MailOutlined,
	PhoneOutlined,
	HomeOutlined,
	LockOutlined,
} from "@ant-design/icons";
import styled from "styled-components";

const { Title } = Typography;
const { Option } = Select;

const ListYourProperty = ({ handleChange, clickSubmit, values }) => {
	return (
		<ListYourPropertyWrapper>
			<Row justify='center' align='middle' className='form-row'>
				<Col xs={24} sm={20} md={16} lg={14} xl={16}>
					<Card className='form-card'>
						<Title level={2} className='text-center'>
							Hotel Account <span className='text-primary'>Registration</span>
						</Title>
						<Form
							onFinish={clickSubmit}
							layout='vertical'
							initialValues={{ hotelCountry: "KSA" }}
						>
							<Row gutter={[16, 16]}>
								<Col xs={24} md={12}>
									<Form.Item
										name='name'
										label='User Name (Manager/ Owner/ Agent)'
										rules={[
											{
												required: true,
												message: "Please input your full name!",
											},
										]}
									>
										<Input
											prefix={<UserOutlined />}
											value={values.name}
											onChange={handleChange("name")}
											placeholder='Full Name'
										/>
									</Form.Item>
								</Col>
								<Col xs={24} md={12}>
									<Form.Item
										name='email'
										label='Email Address'
										rules={[
											{ required: true, message: "Please input your email!" },
										]}
									>
										<Input
											prefix={<MailOutlined />}
											value={values.email}
											onChange={handleChange("email")}
											placeholder='Email'
										/>
									</Form.Item>
								</Col>
								<Col xs={24} md={12}>
									<Form.Item
										name='phone'
										label='Phone Number'
										rules={[
											{
												required: true,
												message: "Please input your phone number!",
											},
										]}
									>
										<Input
											prefix={<PhoneOutlined />}
											value={values.phone}
											onChange={handleChange("phone")}
											placeholder='Phone'
										/>
									</Form.Item>
								</Col>
								<Col xs={24} md={12}>
									<Form.Item
										name='hotelName'
										label='Hotel Name'
										rules={[
											{
												required: true,
												message: "Please input your hotel name!",
											},
										]}
									>
										<Input
											prefix={<HomeOutlined />}
											value={values.hotelName}
											onChange={handleChange("hotelName")}
											placeholder='Hotel Name'
										/>
									</Form.Item>
								</Col>
								<Col xs={24} md={12}>
									<Form.Item
										name='hotelCountry'
										label='Hotel Country'
										rules={[
											{
												required: true,
												message: "Please input your hotel country!",
											},
										]}
									>
										<Select
											value={values.hotelCountry}
											onChange={(value) => handleChange("hotelCountry")(value)}
										>
											<Option value='KSA'>KSA</Option>
											<Option value='UAE'>UAE</Option>
											<Option value='Qatar'>Qatar</Option>
											{/* Add more options as needed */}
										</Select>
									</Form.Item>
								</Col>
								<Col xs={24} md={12}>
									<Form.Item
										name='hotelState'
										label='Hotel State'
										rules={[
											{
												required: true,
												message: "Please input your hotel state!",
											},
										]}
									>
										{values.hotelCountry === "KSA" ? (
											<Select
												value={values.hotelState}
												onChange={(value) => handleChange("hotelState")(value)}
												placeholder='Select State'
											>
												<Option value='makkah'>Makkah</Option>
												<Option value='madinah'>Madinah</Option>
											</Select>
										) : (
											<Input
												prefix={<HomeOutlined />}
												value={values.hotelState}
												onChange={handleChange("hotelState")}
												placeholder='Hotel State'
											/>
										)}
									</Form.Item>
								</Col>
								<Col xs={24} md={12}>
									<Form.Item
										name='hotelCity'
										label='Hotel City'
										rules={[
											{
												required: true,
												message: "Please input your hotel city!",
											},
										]}
									>
										<Input
											prefix={<HomeOutlined />}
											value={values.hotelCity}
											onChange={handleChange("hotelCity")}
											placeholder='Hotel City'
										/>
									</Form.Item>
								</Col>
								<Col xs={24} md={12}>
									<Form.Item
										name='hotelAddress'
										label='Hotel Address'
										rules={[
											{
												required: true,
												message: "Please input your hotel address!",
											},
										]}
									>
										<Input
											prefix={<HomeOutlined />}
											value={values.hotelAddress}
											onChange={handleChange("hotelAddress")}
											placeholder='Hotel Address'
										/>
									</Form.Item>
								</Col>
								<Col xs={24} md={12}>
									<Form.Item
										name='propertyType'
										label='Property Type'
										rules={[
											{
												required: true,
												message: "Please select your property type!",
											},
										]}
									>
										<Select
											value={values.propertyType}
											onChange={(value) => handleChange("propertyType")(value)}
											placeholder='Select Property Type'
										>
											<Option value='Hotel'>Hotel</Option>
											<Option value='Apartments'>Apartments</Option>
											<Option value='Houses'>Houses</Option>
										</Select>
									</Form.Item>
								</Col>
								<Col xs={24} md={12}>
									<Form.Item
										name='hotelFloors'
										label='How Many Floors?'
										rules={[
											{
												required: true,
												message:
													"Please input how many floors your property has?",
											},
										]}
									>
										<Input
											value={values.hotelFloors}
											onChange={handleChange("hotelFloors")}
											placeholder='How Many Floors'
										/>
									</Form.Item>
								</Col>
								<Col xs={24} md={12}>
									<Form.Item
										name='password'
										label='Password'
										rules={[
											{
												required: true,
												message: "Please input your password!",
											},
										]}
									>
										<Input.Password
											prefix={<LockOutlined />}
											value={values.password}
											onChange={handleChange("password")}
											placeholder='Password'
										/>
									</Form.Item>
								</Col>
								<Col xs={24} md={12}>
									<Form.Item
										name='password2'
										label='Confirm Password'
										rules={[
											{
												required: true,
												message: "Please confirm your password!",
											},
										]}
									>
										<Input.Password
											prefix={<LockOutlined />}
											value={values.password2}
											onChange={handleChange("password2")}
											placeholder='Confirm Password'
										/>
									</Form.Item>
								</Col>

								<Col xs={24}>
									<Form.Item
										name='acceptedTermsAndConditions'
										valuePropName='checked'
										rules={[
											{
												validator: (_, value) =>
													value
														? Promise.resolve()
														: Promise.reject(
																new Error(
																	"You must accept the terms and conditions!"
																)
															),
											},
										]}
									>
										<Checkbox
											checked={values.acceptedTermsAndConditions}
											onChange={(e) =>
												handleChange("acceptedTermsAndConditions")(
													e.target.checked
												)
											}
										>
											I accept <strong>JANNAT BOOKING's</strong>{" "}
											<Link to='/terms-conditions?tab=hotel' target='_blank'>
												<strong>Terms & Conditions</strong>
											</Link>
										</Checkbox>
									</Form.Item>
								</Col>
							</Row>
							<Form.Item>
								<StyledButton
									type='primary'
									htmlType='submit'
									block
									disabled={!values.acceptedTermsAndConditions} // Disable button if terms are not accepted
								>
									Register Your Property
								</StyledButton>
							</Form.Item>
						</Form>
						<p style={{ textAlign: "center" }}>
							If you already have a hotel account, please{" "}
							<Link
								to='/signin'
								className='btn btn-sm btn-outline-primary'
								onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
							>
								Login Here
							</Link>
						</p>
					</Card>
				</Col>
			</Row>
		</ListYourPropertyWrapper>
	);
};

export default ListYourProperty;

const ListYourPropertyWrapper = styled.div`
	.ant-input,
	.ant-input-password,
	.ant-select-selector,
	.ant-input-affix-wrapper {
		border-radius: 8px;
		padding: 0.5rem;
	}

	.ant-form-item {
		margin-bottom: 1rem;
	}

	.ant-card {
		padding: 2rem;
		border-radius: 20px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		background: #fff; /* Ensure the background is white */
		position: relative; /* Ensure the position is relative for z-indexing */
		z-index: 10; /* Ensure the form is on top of the hero component */
	}

	.ant-btn-primary {
		background-color: var(--primaryColor);
		border-color: var(--primaryColor);
	}

	.ant-btn-primary:hover,
	.ant-btn-primary:focus {
		background-color: var(--primaryColor);
		border-color: var(--primaryColor);
	}

	.form-row {
		min-height: 100vh;
		margin-top: -150px; /* Adjust this value to control the overlap */
		position: relative; /* Ensure the position is relative for z-indexing */
		z-index: 10; /* Ensure the form is on top of the hero component */
	}
`;

const StyledButton = styled(Button)`
	background-color: #000 !important;
	border-color: #000 !important;
	color: #fff !important;

	&:hover,
	&:focus {
		background-color: #333 !important;
		border-color: #333 !important;
	}
`;
