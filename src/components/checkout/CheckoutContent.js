import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useCartContext } from "../../cart_context";
import dayjs from "dayjs";
import { DatePicker, Button, Collapse, Select, message, Checkbox } from "antd";
import PaymentDetails from "./PaymentDetails";
import { countryList } from "../../Assets"; // Ensure this file contains an array of countries
import { CaretRightOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { createNewReservationClient, currencyConversion } from "../../apiCore";
import { FaMinus, FaPlus } from "react-icons/fa";
import { authenticate, isAuthenticated, signin } from "../../auth";
import { useHistory } from "react-router-dom";
import DesktopCheckout from "./DesktopCheckout";
import ReactGA from "react-ga4";

const { RangePicker } = DatePicker;
const { Panel } = Collapse;
const { Option } = Select;

const calculateDepositDetails = (roomCart) => {
	if (!roomCart || roomCart.length === 0) {
		return { averageCommissionRate: 0, depositAmount: 0 };
	}

	const totalCommissionRate = roomCart.reduce((total, room) => {
		const roomCommissionRate = room.pricingByDayWithCommission?.reduce(
			(sum, day) => sum + (day.commissionRate || 0),
			0
		);
		const daysCount = room.pricingByDayWithCommission?.length || 1;
		return total + roomCommissionRate / daysCount;
	}, 0);

	const averageCommissionRate = totalCommissionRate / roomCart.length;

	const depositAmount = roomCart.reduce((total, room) => {
		return (
			total +
			room.pricingByDayWithCommission?.reduce(
				(sum, day) =>
					sum +
					day.totalPriceWithCommission *
						(day.commissionRate || 0.1) *
						room.amount,
				0
			)
		);
	}, 0);

	return {
		averageCommissionRate: Number(averageCommissionRate * 100).toFixed(2), // Percentage
		depositAmount: Number(depositAmount).toFixed(2), // Total deposit amount
	};
};

const CheckoutContent = () => {
	const {
		roomCart,
		updateRoomDates,
		removeRoomItem,
		total_rooms,
		total_price,
		clearRoomCart,
		toggleRoomAmount,
		total_price_with_commission,
	} = useCartContext();
	const { user } = isAuthenticated();
	const history = useHistory();

	const [expanded, setExpanded] = useState({});
	const [mobileExpanded, setMobileExpanded] = useState(false); // Mobile collapse
	const [guestAgreedOnTermsAndConditions, setGuestAgreedOnTermsAndConditions] =
		useState(false);
	const [cardNumber, setCardNumber] = useState("");
	const [pay10Percent, setPay10Percent] = useState(false);
	const [payWholeAmount, setPayWholeAmount] = useState(false);
	const [expiryDate, setExpiryDate] = useState("");
	const [cvv, setCvv] = useState("");
	const [cardHolderName, setCardHolderName] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [nationality, setNationality] = useState("");
	const [customerDetails, setCustomerDetails] = useState({
		name: user ? user.name : "",
		phone: user ? user.phone : "",
		email: user ? user.email : "",
		passport: "",
		passportExpiry: "",
		nationality: "",
	});

	const [convertedAmounts, setConvertedAmounts] = useState({
		depositUSD: null,
		totalUSD: null,
	});

	const { averageCommissionRate, depositAmount } = useMemo(
		() => calculateDepositDetails(roomCart),
		[roomCart]
	);

	useEffect(() => {
		// Fetch conversion for both deposit and total amounts
		const fetchConversion = async () => {
			const deposit = depositAmount;
			const total = total_price_with_commission;
			const amounts = [deposit, total];

			try {
				const conversions = await currencyConversion(amounts);
				setConvertedAmounts({
					depositUSD: conversions[0]?.amountInUSD.toFixed(2),
					totalUSD: conversions[1]?.amountInUSD.toFixed(2),
				});
			} catch (error) {
				console.error("Currency conversion failed", error);
			}
		};

		fetchConversion();
		// eslint-disable-next-line
	}, [total_price, total_price_with_commission]);

	// Function to transform roomCart into pickedRoomsType format
	const transformRoomCartToPickedRoomsType = (roomCart) => {
		return roomCart.flatMap((room) => {
			return Array.from({ length: room.amount }, () => {
				// Transform each day in pricingByDayWithCommission
				const pricingDetails =
					room.pricingByDayWithCommission?.map((day) => ({
						date: day.date,
						price: day.totalPriceWithCommission, // Use totalPriceWithCommission
						rootPrice: Number(day.rootPrice) || 0, // Use rootPrice
						commissionRate: day.commissionRate || 0, // Use commissionRate
						totalPriceWithCommission: Number(day.totalPriceWithCommission), // Keep totalPriceWithCommission
						totalPriceWithoutCommission: Number(day.price), // Use price from roomCart
					})) || [];

				// Calculate the average price with commission
				const averagePriceWithCommission =
					pricingDetails.reduce(
						(sum, day) => sum + day.totalPriceWithCommission,
						0
					) / pricingDetails.length;

				return {
					room_type: room.roomType, // Room type
					displayName: room.name, // Display name
					chosenPrice: Number(averagePriceWithCommission).toFixed(2), // Average price from pricing details
					count: 1, // Each room is counted individually in pickedRoomsType
					pricingByDay: pricingDetails, // Transformed pricing details
					roomColor: room.roomColor, // Room color
					// Additional calculated totals
					totalPriceWithCommission: pricingDetails.reduce(
						(sum, day) => sum + day.totalPriceWithCommission,
						0
					), // Total price with commission
					hotelShouldGet: pricingDetails.reduce(
						(sum, day) => sum + day.rootPrice,
						0
					), // Total price without commission
				};
			});
		});
	};

	// Handle Date Range change
	const handleDateChange = (dates) => {
		if (dates && dates[0] && dates[1]) {
			const startDate = dates[0].format("YYYY-MM-DD");
			const endDate = dates[1].format("YYYY-MM-DD");

			// Ensure that roomCart is properly updated before re-rendering
			roomCart.forEach((room) => {
				updateRoomDates(room.id, startDate, endDate);
			});
		}
	};

	// Disable past dates
	const disabledDate = (current) => current && current < dayjs().endOf("day");

	const createNewReservation = async () => {
		const {
			name,
			phone,
			email,
			passport,
			passportExpiry,
			password,
			confirmPassword,
		} = customerDetails;

		// Check if terms and conditions are agreed
		if (!guestAgreedOnTermsAndConditions) {
			message.error(
				"You must accept the Terms & Conditions before proceeding."
			);
			return;
		}

		// Full name validation
		if (!name || name.trim().split(" ").length < 2) {
			message.error("Please provide your full name (first and last name).");
			return;
		}

		// Phone number validation
		const phoneRegex = /^[0-9]{6,}$/;
		if (!phone || !phoneRegex.test(phone)) {
			message.error("Please provide a valid phone number.");
			return;
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email || !emailRegex.test(email)) {
			message.error("Please provide a valid email address.");
			return;
		}

		// Password validation (only for non-authenticated users)
		if (!user) {
			if (!password || !confirmPassword) {
				message.error("Please enter your password and confirm it.");
				return;
			}

			if (password !== confirmPassword) {
				message.error("Passwords do not match.");
				return;
			}

			const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
			if (!passwordRegex.test(password)) {
				message.error(
					"Password must be at least 6 characters long and include both letters and numbers."
				);
				return;
			}
		}

		// Passport validation
		if (!passport) {
			message.error("Please provide your passport number.");
			return;
		}

		// Passport Expiry validation (less than 6 months check)
		if (passportExpiry) {
			const expiryDate = dayjs(passportExpiry);
			const sixMonthsFromNow = dayjs().add(6, "month");

			if (expiryDate.isBefore(sixMonthsFromNow)) {
				message.error(
					"Passport expiry date should be at least 6 months from today's date."
				);
				return;
			}
		} else {
			message.error("Please provide your passport expiry date.");
			return;
		}

		// Card expiry validation
		if (expiryDate) {
			// Ensure the input format is correct (MM/YYYY)
			const [month, year] = expiryDate.split("/");

			if (month && year && month.length === 2 && year.length === 4) {
				const cardExpiryDate = dayjs(`${year}-${month}-01`); // Construct the date as YYYY-MM-01
				const currentDate = dayjs();
				const tenYearsFromNow = currentDate.add(10, "year");

				if (cardExpiryDate.isBefore(currentDate, "month")) {
					message.error("The card expiry date is invalid or expired.");
					return;
				}

				if (cardExpiryDate.isAfter(tenYearsFromNow, "month")) {
					message.error(
						"The card expiry date cannot be more than 10 years from today's date."
					);
					return;
				}
			} else {
				message.error("Please enter a valid expiry date in MM/YYYY format.");
				return;
			}
		}

		// Nationality validation
		if (!nationality) {
			message.error("Please select your nationality.");
			return;
		}

		// Hotel name consistency validation
		const hotelNames = roomCart.map((room) => room.hotelName);
		const uniqueHotelNames = [...new Set(hotelNames)];

		// Check if there are multiple unique hotel names
		if (uniqueHotelNames.length > 1) {
			message.error(
				"You cannot make a reservation with rooms from multiple hotels. Please ensure all rooms are from the same hotel."
			);
			return;
		}

		// Prepare reservation data
		const paymentDetails = {
			cardNumber,
			cardExpiryDate: expiryDate,
			cardCVV: cvv,
			cardHolderName,
		};

		const pickedRoomsType = transformRoomCartToPickedRoomsType(roomCart);

		const reservationData = {
			guestAgreedOnTermsAndConditions: guestAgreedOnTermsAndConditions,
			userId: user ? user._id : null,
			hotelId: roomCart[0].hotelId,
			belongsTo: roomCart[0].belongsTo,
			customerDetails: {
				...customerDetails,
				nationality,
			},
			paymentDetails,
			total_rooms,
			total_guests: Number(roomCart[0].adults) + Number(roomCart[0].children),
			adults: Number(roomCart[0].adults),
			children: Number(roomCart[0].children) ? Number(roomCart[0].children) : 0,
			total_amount: total_price_with_commission,
			payment: pay10Percent ? "Deposit Paid" : "Paid Online",
			paid_amount: pay10Percent ? depositAmount : total_price_with_commission,
			commission: depositAmount,

			commissionPaid: true,

			checkin_date: roomCart[0].startDate,
			checkout_date: roomCart[0].endDate,
			days_of_residence: dayjs(roomCart[0].endDate).diff(
				dayjs(roomCart[0].startDate),
				"days"
			),
			booking_source: "Online Jannat Booking",
			pickedRoomsType,
			convertedAmounts,
		};

		try {
			const response = await createNewReservationClient(reservationData);
			if (response && response.message === "Reservation created successfully") {
				message.success("Reservation created successfully");

				// Construct query params
				const queryParams = new URLSearchParams();
				queryParams.append("name", customerDetails.name);
				queryParams.append("total_price", total_price_with_commission);
				queryParams.append("total_rooms", total_rooms);

				// Add each room's details to the query
				roomCart.forEach((room, index) => {
					queryParams.append(`hotel_name_${index}`, room.hotelName);
					queryParams.append(`room_type_${index}`, room.roomType);
					queryParams.append(`room_display_name_${index}`, room.name);
					queryParams.append(`nights_${index}`, room.nights);
					queryParams.append(`checkin_date_${index}`, room.startDate);
					queryParams.append(`checkout_date_${index}`, room.endDate);
				});

				// Automatically sign in the user if the account was just created
				if (!user) {
					const signInResponse = await signin({
						emailOrPhone: email,
						password: password,
					});

					if (signInResponse.error) {
						message.error(
							"Failed to sign in automatically after account creation."
						);
					} else {
						authenticate(signInResponse, () => {
							clearRoomCart();
							window.location.href = `/reservation-confirmed?${queryParams.toString()}`;
						});
					}
				} else {
					clearRoomCart();
					window.location.href = `/reservation-confirmed?${queryParams.toString()}`;
				}
			} else {
				message.error(response.message || "Error creating reservation");
			}
		} catch (error) {
			console.error("Error creating reservation", error);
			message.error("An error occurred while creating the reservation");
		}
	};

	const redirectToSignin = () => {
		const currentUrl = window.location.pathname + window.location.search;
		history.push(`/signin?returnUrl=${encodeURIComponent(currentUrl)}`);
	};

	return (
		<CheckoutContentWrapper>
			{/* Mobile Accordion for Reservation Summary */}
			<MobileAccordion
				onChange={() => setMobileExpanded(!mobileExpanded)}
				activeKey={mobileExpanded ? "1" : null}
			>
				<Panel header='Your Reservation Summary' key='1'>
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
								const totalNights =
									room.pricingByDayWithCommission?.length || 0;

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
											<h4>
												{Number(pricePerNight * room.amount).toFixed(2)} SAR per
												night
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
																			{Number(totalPriceWithCommission).toFixed(
																				2
																			)}{" "}
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
								Total Price:{" "}
								{Number(
									roomCart.reduce(
										(total, room) =>
											total +
											room.pricingByDayWithCommission.reduce(
												(subTotal, day) =>
													subTotal + day.totalPriceWithCommission * room.amount,
												0
											),
										0
									)
								).toFixed(2)}{" "}
								SAR
							</p>
						</TotalsWrapper>
					</RightSection>
				</Panel>
			</MobileAccordion>

			{/* Mobile form for user details */}
			<MobileFormWrapper>
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
								setCustomerDetails({ ...customerDetails, name: e.target.value })
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
										name='confirmPassword'
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
			</MobileFormWrapper>

			<DesktopCheckout
				customerDetails={customerDetails}
				setCustomerDetails={setCustomerDetails}
				redirectToSignin={redirectToSignin}
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
				createNewReservation={createNewReservation}
				guestAgreedOnTermsAndConditions={guestAgreedOnTermsAndConditions}
				setGuestAgreedOnTermsAndConditions={setGuestAgreedOnTermsAndConditions}
				user={user}
				nationality={nationality}
				setNationality={setNationality}
				countryList={countryList}
				total_price={total_price}
				handleDateChange={handleDateChange}
				disabledDate={disabledDate}
				roomCart={roomCart}
				toggleRoomAmount={toggleRoomAmount}
				removeRoomItem={removeRoomItem}
				expanded={expanded}
				setExpanded={setExpanded}
				total_rooms={total_rooms}
				pay10Percent={pay10Percent}
				setPay10Percent={setPay10Percent}
				payWholeAmount={payWholeAmount}
				setPayWholeAmount={setPayWholeAmount}
				total_price_with_commission={total_price_with_commission}
				convertedAmounts={convertedAmounts}
				depositAmount={depositAmount}
				averageCommissionRate={averageCommissionRate}
			/>
		</CheckoutContentWrapper>
	);
};

export default CheckoutContent;

// Styled components
const CheckoutContentWrapper = styled.div`
	display: flex;
	flex-direction: column;
	padding: 20px 150px;

	@media (max-width: 800px) {
		padding: 25px 0px;
	}

	small {
		font-weight: bold;
		font-size: 11px;
		cursor: pointer;
		color: darkred;
	}
`;

const MobileAccordion = styled(Collapse)`
	display: none;
	@media (max-width: 768px) {
		display: block;
		margin-top: 50px;
		background-color: white;
		font-weight: bolder;
	}
`;

const MobileFormWrapper = styled.div`
	display: block;
	margin: 20px 0;

	@media (min-width: 768px) {
		display: none;
	}

	@media (max-width: 768px) {
		h2 {
			font-size: 1.6rem;
		}
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

// eslint-disable-next-line
const TotalSection = styled.div`
	margin-top: 20px;
	padding-top: 10px;
	border-top: 1px solid #ddd;
	text-align: center;
	.total-price {
		font-size: 1.4rem;
		font-weight: bold;
		color: var(--text-color-dark);
	}
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
