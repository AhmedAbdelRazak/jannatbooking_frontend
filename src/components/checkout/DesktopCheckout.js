import React from "react";
import styled from "styled-components";
import dayjs from "dayjs";
import { DatePicker, Button, Collapse, Select, Checkbox } from "antd";
import PaymentDetails from "./PaymentDetails";
import { CaretRightOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { FaMinus, FaPlus } from "react-icons/fa";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import PaymentOptions from "./PaymentOptions";

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
	t,
	hotelDetails,
	chosenLanguage,
	selectedCurrency,
	convertCurrency,
	selectedPaymentOption,
	setSelectedPaymentOption,
	setPaymentClicked,
	paymentClicked,
	overallAverageCommissionRate,
	totalRoomsPricePerNight,
	createUncompletedDocument,
}) => {
	return (
		<DesktopWrapper>
			<LeftSection dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}>
				<h2>{t.customerDetails}</h2>
				<form>
					<InputGroup>
						<label>{t.name}</label>
						<input
							type='text'
							name='name'
							placeholder={t.namePlaceholder}
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
						<label>{t.phone}</label>
						<input
							type='text'
							name='phone'
							placeholder={t.phonePlaceholder}
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
						<label>{t.email}</label>
						<input
							type='email'
							name='email'
							placeholder={t.emailPlaceholder}
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
									{t.alreadyHaveAccount}{" "}
									<span
										onClick={redirectToSignin}
										style={{
											color: "blue",
											cursor: "pointer",
											textDecoration: "underline",
										}}
									>
										{t.clickToSignin}
									</span>
								</p>
							</div>

							<div className='col-md-6'>
								<InputGroup>
									<label>{t.password}</label>
									<input
										type='password'
										name='password'
										placeholder={t.passwordPlaceholder}
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
									<label>{t.confirmPassword}</label>
									<input
										type='password'
										name='confirmpassword'
										placeholder={t.confirmPasswordPlaceholder}
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
						<label>{t.nationality}</label>
						<Select
							showSearch
							placeholder={t.nationalityPlaceholder}
							optionFilterProp='children'
							filterOption={(input, option) =>
								option.children.toLowerCase().includes(input.toLowerCase())
							}
							value={nationality} // Display the selected code in the dropdown value
							onChange={(value) => {
								setNationality(value);
								setCustomerDetails({ ...customerDetails, nationality: value });
							}} // Set the state with the selected code
							style={{ width: "100%" }}
						>
							{countryList.map((country) => (
								<Option key={country.code} value={country.code}>
									{country.name}
								</Option>
							))}
						</Select>
					</InputGroup>

					<div className='my-4'>
						{hotelDetails && hotelDetails.hotelName ? (
							<PaymentOptions
								hotelDetails={hotelDetails}
								chosenLanguage={chosenLanguage}
								t={t}
								depositAmount={depositAmount}
								averageCommissionRate={averageCommissionRate}
								total_price_with_commission={total_price_with_commission}
								convertedAmounts={convertedAmounts}
								selectedPaymentOption={selectedPaymentOption}
								setSelectedPaymentOption={setSelectedPaymentOption}
								overallAverageCommissionRate={overallAverageCommissionRate}
								totalRoomsPricePerNight={totalRoomsPricePerNight}
								createUncompletedDocument={createUncompletedDocument}
							/>
						) : null}

						<TermsWrapper
							selected={guestAgreedOnTermsAndConditions}
							onClick={() => {
								setGuestAgreedOnTermsAndConditions(
									!guestAgreedOnTermsAndConditions
								);
								createUncompletedDocument("User Accepted Terms And Conditions");
								ReactGA.event({
									category: "User Accepted Terms And Cond",
									action: "User Accepted Terms And Cond",
									label: `User Accepted Terms And Cond`,
								});

								ReactPixel.track("Terms And Conditions Accepted", {
									action: "User Accepted Terms And Conditions Accepted",
									page: "checkout",
								});
							}}
						>
							<Checkbox
								checked={guestAgreedOnTermsAndConditions}
								onChange={(e) => {
									setGuestAgreedOnTermsAndConditions(e.target.checked);
									ReactGA.event({
										category: "User Accepted Terms And Cond",
										action: "User Accepted Terms And Cond",
										label: `User Accepted Terms And Cond`,
									});
									ReactPixel.track("Terms And Conditions Accepted", {
										action: "User Accepted Terms And Conditions Accepted",
										page: "checkout",
									});
								}}
							>
								{t.acceptTerms}
							</Checkbox>
						</TermsWrapper>
						<small onClick={() => window.open("/terms-conditions", "_blank")}>
							{t.checkTerms}
						</small>

						{selectedPaymentOption === "acceptReserveNowPayInHotel" ? (
							<Button
								type='primary'
								onClick={createNewReservation}
								style={{ marginTop: "20px", width: "100%" }}
							>
								{chosenLanguage === "Arabic" ? "احجز الآن" : "Reserve Now"}
							</Button>
						) : (
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
								convertedAmounts={convertedAmounts}
								depositAmount={depositAmount}
								setCustomerDetails={setCustomerDetails}
								nationality={nationality}
								customerDetails={customerDetails}
								selectedPaymentOption={selectedPaymentOption}
								guestAgreedOnTermsAndConditions={
									guestAgreedOnTermsAndConditions
								}
								setPaymentClicked={setPaymentClicked}
								paymentClicked={paymentClicked}
								overallAverageCommissionRate={overallAverageCommissionRate}
								totalRoomsPricePerNight={totalRoomsPricePerNight}
								createUncompletedDocument={createUncompletedDocument}
							/>
						)}
					</div>
				</form>
			</LeftSection>

			<RightSection>
				<h2>
					{chosenLanguage === "Arabic"
						? "ملخص الحجز الخاص بك"
						: "Your Reservation Summary"}
				</h2>

				<div
					style={{
						textAlign: "center",
						marginBottom: "5px",
						textTransform: "capitalize",
						fontSize: "1.4rem",
						fontWeight: "bold",
					}}
				>
					{roomCart[0] && roomCart[0].hotelName}
				</div>

				{/* Ant Design Date Range Picker */}
				<DateRangePickerWrapper>
					<RangePicker
						format='YYYY-MM-DD'
						disabledDate={disabledDate}
						onChange={handleDateChange}
						disabled
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
									<h3>
										{chosenLanguage === "Arabic"
											? room.nameOtherLanguage
											: room.name}
									</h3>
									<p>
										{room.amount}{" "}
										{chosenLanguage === "Arabic" ? "غرفة" : "room(s)"}
									</p>
									<DateRangeWrapper>
										<label>
											{chosenLanguage === "Arabic"
												? "تواريخ الدخول والخروج"
												: "Dates:"}
										</label>
										<p>
											{chosenLanguage === "Arabic" ? "من" : "from"}{" "}
											{room.startDate}{" "}
											{chosenLanguage === "Arabic" ? "الى" : "to"}{" "}
											{room.endDate}
										</p>
									</DateRangeWrapper>
									<h4>
										{Number(pricePerNight * room.amount).toFixed(2)}{" "}
										{t[selectedCurrency.toUpperCase()]} {t.perNight}
									</h4>

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
													<InfoCircleOutlined />{" "}
													{chosenLanguage === "Arabic"
														? "تفاصيل السعر"
														: "Price Breakdown"}
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
																	{t[selectedCurrency.toUpperCase()]}
																</li>
															);
														}
													)
												) : (
													<li>{t.noPriceBreakdown}</li>
												)}
											</PricingList>
										</Panel>
									</Collapse>

									<RemoveButton onClick={() => removeRoomItem(room.id)}>
										{t.remove}
									</RemoveButton>
								</RoomDetails>
							</RoomItem>
						);
					})
				) : (
					<p>{t.noReservations}</p>
				)}

				{/* Totals Section */}
				<TotalsWrapper>
					<p>
						{t.totalRooms}: {total_rooms}
					</p>
					<p className='total-price'>
						{t.totalPrice}: {convertCurrency(total_price_with_commission)}{" "}
						{t[selectedCurrency.toUpperCase()]}
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
		/* color: var(--primaryBlue); */
		color: blue;
		text-decoration: underline;
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
	padding: 12px;
	border: 2px solid
		${({ selected }) => (selected ? "#c4e2ff" : "var(--border-color-light)")};
	background-color: ${({ selected }) =>
		selected ? "#c4e2ff" : "var(--accent-color-2-dark)"};
	border-radius: 8px;
	margin-bottom: 2px;
	cursor: pointer;
	transition: var(--main-transition);

	&:hover {
		background-color: ${({ selected }) =>
			selected ? "#c4e2ff" : "var(--accent-color-2-dark)"};
	}

	.ant-checkbox-wrapper {
		margin-left: 10px;
	}
`;
