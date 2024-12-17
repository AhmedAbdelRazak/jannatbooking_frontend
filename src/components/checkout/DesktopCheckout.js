import React from "react";
import styled from "styled-components";
import dayjs from "dayjs";
import { DatePicker, Button, Collapse, Select, Checkbox } from "antd";
import PaymentDetails from "./PaymentDetails";
import { CaretRightOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { FaMinus, FaPlus } from "react-icons/fa";
import ReactGA from "react-ga4";

const { RangePicker } = DatePicker;
const { Panel } = Collapse;
const { Option } = Select;

const DesktopCheckout = ({
	customerDetails,
	setCustomerDetails,
	redirectToSignin,
	cardNumber,
	setCardNumber,
	expiryDate,
	setExpiryDate,
	cvv,
	setCvv,
	cardHolderName,
	setCardHolderName,
	postalCode,
	setPostalCode,
	guestAgreedOnTermsAndConditions,
	setGuestAgreedOnTermsAndConditions,
	user,
	nationality,
	setNationality,
	countryList,
	createNewReservation,
	total_price,
	handleDateChange,
	disabledDate,
	roomCart,
	toggleRoomAmount,
	handleReservation,
	removeRoomItem,
	expanded,
	setExpanded,
	total_rooms,
	pay10Percent,
	setPay10Percent,
	payWholeAmount,
	setPayWholeAmount,
	total_price_with_commission,
	convertedAmounts,
	depositAmount,
	averageCommissionRate,
}) => {
	return (
		<DesktopWrapper>
			<LeftSection>
				<h2>Customer Details</h2>
				<form>
					<InputGroup>
						<label>Name</label>
						<input
							type='text'
							name='name'
							placeholder='First & Last Name'
							value={customerDetails.name}
							onChange={(e) =>
								setCustomerDetails({
									...customerDetails,
									name: e.target.value,
								})
							}
						/>
					</InputGroup>
					<InputGroup>
						<label>Phone</label>
						<input
							type='text'
							name='phone'
							placeholder='Phone Number'
							value={customerDetails.phone}
							onChange={(e) =>
								setCustomerDetails({
									...customerDetails,
									phone: e.target.value,
								})
							}
						/>
					</InputGroup>
					<InputGroup>
						<label>Email</label>
						<input
							type='email'
							name='email'
							placeholder='Email Address'
							value={customerDetails.email}
							onChange={(e) =>
								setCustomerDetails({
									...customerDetails,
									email: e.target.value,
								})
							}
						/>
					</InputGroup>
					{!user ? (
						<div className='row'>
							<div className='col-md-12 mt-1'>
								<p style={{ fontWeight: "bold", fontSize: "13px" }}>
									Already Have An Account?{" "}
									<span
										onClick={redirectToSignin}
										style={{
											color: "blue",
											cursor: "pointer",
											textDecoration: "underline",
										}}
									>
										Please Click Here To Signin
									</span>
								</p>
							</div>

							<div className='col-md-6'>
								<InputGroup>
									<label>Password</label>
									<input
										type='password'
										name='password'
										placeholder='Password'
										value={customerDetails.password}
										onChange={(e) =>
											setCustomerDetails({
												...customerDetails,
												password: e.target.value,
											})
										}
									/>
								</InputGroup>
							</div>

							<div className='col-md-6'>
								<InputGroup>
									<label>Confirm Password</label>
									<input
										type='password'
										name='confirmpassword'
										placeholder='Confirm Password'
										value={customerDetails.confirmPassword}
										onChange={(e) =>
											setCustomerDetails({
												...customerDetails,
												confirmPassword: e.target.value,
											})
										}
									/>
								</InputGroup>
							</div>
						</div>
					) : null}

					<InputGroup>
						<label>Passport</label>
						<input
							type='text'
							name='passport'
							placeholder='Passport Number'
							value={customerDetails.passport}
							onChange={(e) =>
								setCustomerDetails({
									...customerDetails,
									passport: e.target.value,
								})
							}
						/>
					</InputGroup>
					<InputGroup>
						<label>Passport Expiry</label>
						<input
							type='date'
							name='passportExpiry'
							value={customerDetails.passportExpiry}
							onChange={(e) =>
								setCustomerDetails({
									...customerDetails,
									passportExpiry: e.target.value,
								})
							}
						/>
					</InputGroup>
					<InputGroup>
						<label>Nationality</label>
						<Select
							showSearch
							placeholder='Select a country'
							optionFilterProp='children'
							filterOption={(input, option) =>
								option.children.toLowerCase().includes(input.toLowerCase())
							}
							value={nationality}
							onChange={(value) => setNationality(value)}
							style={{ width: "100%" }}
						>
							{countryList.map((country) => (
								<Option key={country} value={country}>
									{country}
								</Option>
							))}
						</Select>
					</InputGroup>

					<div>
						<TermsWrapper>
							<Checkbox
								checked={guestAgreedOnTermsAndConditions}
								onChange={(e) => {
									setGuestAgreedOnTermsAndConditions(e.target.checked);
									ReactGA.event({
										category: "User Accepted Terms And Cond",
										action: "User Accepted Terms And Cond",
										label: `User Accepted Terms And Cond`,
									});
								}}
							>
								Accept Terms & Conditions
							</Checkbox>
						</TermsWrapper>
						<small onClick={() => window.open("/terms-conditions", "_blank")}>
							It's highly recommended to check our terms & conditions specially
							for refund and cancellation sections 4 & 5{" "}
						</small>

						<TermsWrapper>
							<Checkbox
								checked={pay10Percent}
								onChange={(e) => {
									setPayWholeAmount(false);
									setPay10Percent(e.target.checked);
									ReactGA.event({
										category: "User Checked On Paying Deposit",
										action: "User Checked On Paying Deposit",
										label: `User Checked On Paying Deposit`,
									});
								}}
							>
								Pay {averageCommissionRate}% Deposit{" "}
								<span style={{ fontWeight: "bold", fontSize: "12.5px" }}>
									(SAR {depositAmount})
								</span>{" "}
								<span style={{ fontWeight: "bold", fontSize: "12.5px" }}>
									(${convertedAmounts && convertedAmounts.depositUSD})
								</span>
							</Checkbox>
						</TermsWrapper>

						<TermsWrapper>
							<Checkbox
								checked={payWholeAmount}
								onChange={(e) => {
									setPay10Percent(false);
									setPayWholeAmount(e.target.checked);
									ReactGA.event({
										category: "User Checked On Paying Whole Amount",
										action: "User Checked On Paying Whole Amount",
										label: `User Checked On Paying Whole Amount`,
									});
								}}
							>
								Pay the whole Total Amount{" "}
								<span style={{ fontWeight: "bold", fontSize: "12.5px" }}>
									(SAR {Number(total_price_with_commission).toFixed(2)})
								</span>{" "}
								<span style={{ fontWeight: "bold", fontSize: "12.5px" }}>
									(${convertedAmounts && convertedAmounts.totalUSD})
								</span>
							</Checkbox>
						</TermsWrapper>

						{guestAgreedOnTermsAndConditions &&
						(pay10Percent || payWholeAmount) ? (
							<PaymentDetails
								cardNumber={cardNumber}
								setCardNumber={setCardNumber}
								expiryDate={expiryDate}
								setExpiryDate={setExpiryDate}
								cvv={cvv}
								setCvv={setCvv}
								cardHolderName={cardHolderName}
								setCardHolderName={setCardHolderName}
								postalCode={postalCode}
								setPostalCode={setPostalCode}
								handleReservation={createNewReservation}
								total={total_price}
								total_price_with_commission={total_price_with_commission}
								pay10Percent={pay10Percent}
								convertedAmounts={convertedAmounts}
								depositAmount={depositAmount}
							/>
						) : null}
					</div>
				</form>
			</LeftSection>

			<RightSection>
				<h2>Your Reservation</h2>

				{/* Ant Design Date Range Picker */}
				<DateRangePickerWrapper>
					<RangePicker
						format='YYYY-MM-DD'
						disabledDate={disabledDate}
						onChange={handleDateChange}
						defaultValue={[
							dayjs(roomCart[0]?.startDate),
							dayjs(roomCart[0]?.endDate),
						]}
						style={{ width: "100%" }}
						dropdownClassName='mobile-friendly-picker'
					/>
				</DateRangePickerWrapper>

				{roomCart.length > 0 ? (
					roomCart.map((room) => {
						const totalNights = room.pricingByDayWithCommission?.length || 0;

						// Calculate the price per night and total price
						const totalCommissionPrice =
							room.pricingByDayWithCommission?.reduce(
								(total, day) => total + (day.totalPriceWithCommission || 0),
								0
							) || 0;
						const pricePerNight =
							totalNights > 0 ? totalCommissionPrice / totalNights : 0;

						return (
							<RoomItem key={room.id}>
								<RoomImage src={room.photos[0]?.url} alt={room.name} />

								<RoomDetails>
									<h3>{room.name}</h3>
									<p>{room.amount} room(s)</p>
									<DateRangeWrapper>
										<label>Dates:</label>
										<p>
											{room.startDate} to {room.endDate}
										</p>
									</DateRangeWrapper>
									<h4>{Number(pricePerNight).toFixed(2)} SAR per night</h4>

									{/* Room Quantity Controls */}
									<QuantityControls>
										<MinusIcon
											onClick={() => toggleRoomAmount(room.id, "dec")}
										/>
										<Quantity>{room.amount}</Quantity>
										<PlusIcon
											onClick={() => toggleRoomAmount(room.id, "inc")}
										/>
									</QuantityControls>

									{/* Updated Accordion for Price Breakdown */}
									<Collapse
										accordion
										expandIcon={({ isActive }) => (
											<CaretRightOutlined
												rotate={isActive ? 90 : 0}
												style={{ color: "var(--primary-color)" }}
											/>
										)}
										onChange={() =>
											setExpanded((prev) => ({
												...prev,
												[room.id]: !prev[room.id],
											}))
										}
										activeKey={expanded[room.id] ? "1" : null}
									>
										<Panel
											header={
												<PriceDetailsHeader>
													<InfoCircleOutlined /> Price Breakdown
												</PriceDetailsHeader>
											}
											key='1'
										>
											<PricingList>
												{room.pricingByDayWithCommission &&
												room.pricingByDayWithCommission.length > 0 ? (
													room.pricingByDayWithCommission.map(
														({ date, totalPriceWithCommission }, index) => {
															return (
																<li key={index}>
																	{date}:{" "}
																	{Number(totalPriceWithCommission).toFixed(2)}{" "}
																	SAR
																</li>
															);
														}
													)
												) : (
													<li>No price breakdown available</li>
												)}
											</PricingList>
										</Panel>
									</Collapse>

									<RemoveButton onClick={() => removeRoomItem(room.id)}>
										Remove
									</RemoveButton>
								</RoomDetails>
							</RoomItem>
						);
					})
				) : (
					<p>No rooms selected.</p>
				)}

				{/* Totals Section */}
				<TotalsWrapper>
					<p>Total Rooms: {total_rooms}</p>
					<p className='total-price'>
						Total Price: {Number(total_price_with_commission).toFixed(2)} SAR
					</p>
				</TotalsWrapper>
			</RightSection>
		</DesktopWrapper>
	);
};

export default DesktopCheckout;

const DesktopWrapper = styled.div`
	display: flex;
	gap: 20px;
	@media (max-width: 768px) {
		display: none;
	}

	small {
		font-weight: bold;
		font-size: 11px;
		cursor: pointer;
		color: darkred;
	}
`;

const LeftSection = styled.div`
	flex: 2;
	background: var(--background-light);
	padding: 20px;
	border-radius: 10px;
	box-shadow: var(--box-shadow-light);

	h2 {
		font-size: 1.7rem;
		font-weight: bolder;
	}
`;

const RightSection = styled.div`
	flex: 1;
	padding: 20px;
	border-radius: 10px;
	box-shadow: var(--box-shadow-light);
	position: sticky;
	top: 20px;
`;

const RoomItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-bottom: 20px;
	border-bottom: 1px solid #ddd;
	padding-bottom: 10px;
`;

const RoomImage = styled.img`
	width: 100%;
	height: 220px;
	object-fit: cover;
	border-radius: 8px;
`;

const RoomDetails = styled.div`
	text-align: center;
	h3 {
		font-size: 1.2rem;
		text-transform: capitalize;
	}

	h4 {
		font-size: 1.1rem;
	}
`;

const DateRangeWrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	margin: 10px 0;
`;

const PriceDetailsHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	color: var(--primary-color);
`;

const RemoveButton = styled(Button)`
	background: var(--secondary-color);
	color: var(--mainWhite);
	margin-top: 10px;
	width: 100%;
`;

const PricingList = styled.ul`
	list-style-type: none;
	padding: 0;
	margin-top: 10px;
`;

const InputGroup = styled.div`
	margin-bottom: 10px;
	label {
		display: block;
		font-size: 0.9rem;
		margin-bottom: 5px;
	}
	input {
		width: 100%;
		padding: 8px;
		border-radius: 5px;
		border: 1px solid #ddd;
	}
`;

const QuantityControls = styled.div`
	display: flex;
	align-items: center;
	text-align: center;
	margin: auto;
	width: 25%;
	margin-bottom: 10px;
`;

const PlusIcon = styled(FaPlus)`
	color: var(--accent-color-3-light);
	font-size: 1rem;
	cursor: pointer;
	text-align: center;
	margin: auto;
	border: 1px solid var(--border-color-light);
	padding: 4px;
	width: 44%;
	height: 27px;

	&:hover {
		color: var(--primary-color);
	}
`;

const MinusIcon = styled(FaMinus)`
	color: var(--accent-color-3-light);
	font-size: 1rem;
	cursor: pointer;
	text-align: center;
	margin: auto;
	border: 1px solid var(--border-color-light);
	padding: 4px;
	width: 44%;
	height: 27px;

	&:hover {
		color: var(--primary-color);
	}
`;

const Quantity = styled.span`
	font-size: 1rem;
	color: var(--accent-color-3-light);
	margin: 0 10px;
	font-weight: bold;
	text-align: center;
	margin: auto;
	border: 1px solid var(--border-color-light);
	width: 100%;
	height: 27px;
`;

const TotalsWrapper = styled.div`
	margin-top: 20px;
	padding-top: 10px;
	border-top: 1px solid #ddd;
	text-align: center;
	font-weight: bold;

	.total-price {
		font-size: 1.4rem;
		font-weight: bold;
	}
`;

const DateRangePickerWrapper = styled.div`
	margin: 10px 0;

	.ant-picker {
		width: 100%;
	}

	@media (max-width: 768px) {
		.ant-picker-dropdown {
			width: 100vw;
			left: 0;
			right: 0;
			top: 50px;
			transform: none;
		}
	}
`;

const TermsWrapper = styled.div`
	margin: 5px auto;
	font-size: 1rem;
	display: flex;
	align-items: center;

	.ant-checkbox-wrapper {
		margin-left: 10px;
	}
`;
