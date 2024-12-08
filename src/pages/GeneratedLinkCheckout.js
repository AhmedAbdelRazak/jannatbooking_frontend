import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { DatePicker, Collapse, message, Checkbox } from "antd";
import { useLocation, useHistory } from "react-router-dom";
import {
	gettingHotelDetailsById,
	createNewReservationClient,
} from "../apiCore";
import dayjs from "dayjs";
import PaymentDetails from "../components/checkout/PaymentDetails";
import { CaretRightOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { authenticate, isAuthenticated, signin } from "../auth";

const { RangePicker } = DatePicker;
const { Panel } = Collapse;

// Helper function to calculate pricing by day
const calculatePricingByDay = (pricingRate, startDate, endDate, basePrice) => {
	const start = dayjs(startDate).startOf("day");
	const end = dayjs(endDate).subtract(1, "day").startOf("day");
	const dateArray = [];
	let currentDate = start;

	while (currentDate.isBefore(end) || currentDate.isSame(end, "day")) {
		const formattedDate = currentDate.format("YYYY-MM-DD");
		const rateForDate = pricingRate.find(
			(rate) => dayjs(rate.date).format("YYYY-MM-DD") === formattedDate
		);

		dateArray.push({
			date: formattedDate,
			price: rateForDate ? rateForDate.price : basePrice,
		});

		currentDate = currentDate.add(1, "day");
	}

	return dateArray;
};

const GeneratedLinkCheckout = () => {
	const location = useLocation();
	const history = useHistory();
	const { user } = isAuthenticated();

	const [formData, setFormData] = useState({
		hotelId: "",
		name: user ? user.name : "",
		email: user ? user.email : "",
		checkInDate: null,
		checkOutDate: null,
		numberOfNights: 0,
		totalAmount: 0,
		adults: 1,
		children: 0,
		nationality: "",
		phone: user ? user.phone : "",
		passport: "",
		passportExpiry: "",
		pickedRooms: [], // Array to hold multiple room selections
	});
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [hotelDetails, setHotelDetails] = useState(null);

	// eslint-disable-next-line
	const [priceByDay, setPriceByDay] = useState([]);
	const [mobileExpanded, setMobileExpanded] = useState(false);

	const [cardNumber, setCardNumber] = useState("");
	const [expiryDate, setExpiryDate] = useState("");
	const [cvv, setCvv] = useState("");
	const [cardHolderName, setCardHolderName] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [guestAgreedOnTermsAndConditions, setGuestAgreedOnTermsAndConditions] =
		useState(false);
	const [pay10Percent, setPay10Percent] = useState(false);
	const [payWholeAmount, setPayWholeAmount] = useState(false);

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const hotelId = params.get("hotelId");
		window.scrollTo({ top: 8, behavior: "smooth" });

		const pickedRooms = [];
		let roomIndex = 1;

		while (
			params.get(`roomType${roomIndex}`) &&
			params.get(`displayName${roomIndex}`)
		) {
			pickedRooms.push({
				roomType: params.get(`roomType${roomIndex}`),
				displayName: params.get(`displayName${roomIndex}`),
				count: parseInt(params.get(`roomCount${roomIndex}`), 10),
				pricePerNight: parseFloat(params.get(`pricePerNight${roomIndex}`)) || 0,
			});
			roomIndex++;
		}

		console.log(hotelId, "hotelIdhotelIdhotelId");
		// Fetch hotel details and adjust pricingByDay with commission
		if (hotelId) {
			gettingHotelDetailsById(hotelId).then((data) => {
				if (data) {
					setHotelDetails(data);

					// Parse commission rate from environment variable or set default
					const commissionRate =
						parseFloat(process.env.REACT_APP_COMMISSIONRATE) || 1;

					// Update pickedRooms with adjusted pricingByDay
					const updatedPickedRooms = pickedRooms.map((room) => {
						const matchingRoom = data.roomCountDetails.find(
							(detail) =>
								detail.roomType === room.roomType &&
								detail.displayName === room.displayName
						);

						if (matchingRoom) {
							const calculatedPricing = calculatePricingByDay(
								matchingRoom.pricingByDay || [],
								params.get("checkInDate"),
								params.get("checkOutDate"),
								room.pricePerNight
							).map((day) => ({
								...day,
								price: (day.price * commissionRate).toFixed(2), // Adjust price with commission
							}));

							return {
								...room,
								photos: matchingRoom.photos,
								pricingByDay: calculatedPricing,
							};
						} else {
							message.error(
								"One of the selected room details not found in hotel data."
							);
							return room;
						}
					});

					// Update formData with new pickedRooms
					setFormData((prevFormData) => ({
						...prevFormData,
						pickedRooms: updatedPickedRooms,
					}));
				} else {
					message.error("Failed to fetch hotel details.");
				}
			});
		}

		setFormData((prevFormData) => ({
			...prevFormData,
			hotelId: hotelId || "",
			checkInDate: params.get("checkInDate")
				? dayjs(params.get("checkInDate"))
				: null,
			checkOutDate: params.get("checkOutDate")
				? dayjs(params.get("checkOutDate"))
				: null,
			numberOfNights: parseInt(params.get("numberOfNights"), 10) || 0,
			totalAmount: parseFloat(params.get("totalAmount")) || 0,
			adults: parseInt(params.get("adults"), 10) || 1,
			children: parseInt(params.get("children"), 10) || 0,
			nationality: params.get("nationality") || "",
			name: params.get("name") ? params.get("name") : user ? user.name : "",
			email:
				user && user.email
					? user.email
					: params.get("email")
						? params.get("email")
						: "",
			phone:
				user && user.phone
					? user.phone
					: params.get("phone")
						? params.get("phone")
						: "",
			pickedRooms,
		}));
		// eslint-disable-next-line
	}, [location.search]);

	// Add this function to match the transformation logic from `CheckoutContent`
	const transformPickedRoomsToPickedRoomsType = (
		pickedRooms,
		commissionRate
	) => {
		return pickedRooms.flatMap((room) => {
			return Array.from({ length: room.count }, () => ({
				room_type: room.roomType, // Room type
				displayName: room.displayName, // Display name for the room
				chosenPrice: (room.pricePerNight * commissionRate).toFixed(2), // Price with commission
				count: 1, // Each room counted individually
				pricingByDay: room.pricingByDay || [], // Pricing breakdown by day
			}));
		});
	};

	const handleReservation = async () => {
		const {
			name,
			email,
			phone,
			passport,
			passportExpiry,
			checkInDate,
			checkOutDate,
			pickedRooms,
			totalAmount,
			numberOfNights,
		} = formData;

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

		// Passport expiry validation
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

		// Prepare payment details
		const paymentDetails = {
			cardNumber,
			cardExpiryDate: expiryDate,
			cardCVV: cvv,
			cardHolderName,
		};

		// Parse commission rate from environment variable or set default
		const commissionRate =
			parseFloat(process.env.REACT_APP_COMMISSIONRATE) || 1;

		// Transform pickedRooms to pickedRoomsType
		const pickedRoomsType = transformPickedRoomsToPickedRoomsType(
			pickedRooms,
			commissionRate
		);

		// Construct reservation data
		const reservationData = {
			guestAgreedOnTermsAndConditions,
			userId: user ? user._id : null,
			hotelId: formData.hotelId,
			belongsTo: hotelDetails.belongsTo,
			hotel_name: hotelDetails?.hotelName || "",
			customerDetails: {
				name,
				email,
				phone,
				passport,
				passportExpiry,
				nationality: formData.nationality,
				password: !user ? password : undefined, // Include password if user is not logged in
			},
			paymentDetails,
			total_rooms: pickedRooms.reduce((total, room) => total + room.count, 0),
			total_guests: formData.adults + formData.children,
			adults: formData.adults,
			children: formData.children,
			checkin_date: checkInDate ? checkInDate.format("YYYY-MM-DD") : "",
			checkout_date: checkOutDate ? checkOutDate.format("YYYY-MM-DD") : "",
			days_of_residence: numberOfNights,
			booking_source: "Generated Link",
			pickedRoomsType,
			total_amount: (totalAmount * commissionRate).toFixed(2),
			payment: pay10Percent ? "Deposit Paid" : "Paid Online",
			paid_amount: pay10Percent
				? (totalAmount * 0.1).toFixed(2)
				: (totalAmount * commissionRate).toFixed(2),
			commission: (totalAmount * (commissionRate - 1)).toFixed(2),
			commissionPaid: true,
		};

		try {
			const response = await createNewReservationClient(reservationData);
			if (response?.message === "Reservation created successfully") {
				message.success("Reservation created successfully");

				// Automatically sign in the user if the account was just created
				if (!user) {
					try {
						const signInResponse = await signin({
							emailOrPhone: email,
							password,
						});
						if (signInResponse.error) {
							message.error(
								"Failed to sign in automatically after account creation."
							);
						} else {
							authenticate(signInResponse, () => {
								message.success("User authenticated successfully.");
							});
						}
					} catch (error) {
						console.error("Error during sign-in:", error);
						message.error("An error occurred while signing in.");
					}
				}

				// Construct query params for redirection
				const queryParams = new URLSearchParams();
				queryParams.append("name", name);
				queryParams.append(
					"total_price",
					Number(totalAmount * commissionRate).toFixed(2)
				);
				queryParams.append("total_rooms", reservationData.total_rooms);
				queryParams.append(
					"checkin_date",
					checkInDate ? checkInDate.format("YYYY-MM-DD") : ""
				);
				queryParams.append(
					"checkout_date",
					checkOutDate ? checkOutDate.format("YYYY-MM-DD") : ""
				);
				queryParams.append("nights", numberOfNights); // Pass number of nights
				queryParams.append("hotel_name", hotelDetails.hotelName);
				// Add each room's details to the query
				pickedRooms.forEach((room, index) => {
					queryParams.append(`room_type${index + 1}`, room.roomType);
					queryParams.append(`room_display_name${index + 1}`, room.displayName);
					queryParams.append(
						`price_per_night${index + 1}`,
						Number(room.pricePerNight * commissionRate).toFixed(2)
					);
					queryParams.append(`room_count${index + 1}`, room.count);
				});

				// Redirect to the confirmation page
				window.location.href = `/reservation-confirmed?${queryParams.toString()}`;
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
		<GeneratedLinkCheckoutWrapper>
			<MobileAccordion
				onChange={() => setMobileExpanded(!mobileExpanded)}
				activeKey={mobileExpanded ? "1" : null}
			>
				<Panel header='Your Reservation Summary' key='1'>
					{hotelDetails && (
						<RightSection>
							<RangePicker
								value={[formData.checkInDate, formData.checkOutDate]}
								disabled
								style={{ width: "100%", marginBottom: "10px" }}
							/>
							{formData.pickedRooms.map((room, index) => (
								<RoomItem key={index}>
									<RoomImage
										src={room.photos?.[0]?.url || "/default-room.jpg"}
										alt='Room'
									/>
									<RoomDetails>
										<h3>{room.displayName}</h3>
										<p>{room.count} Room(s)</p>
										<p>
											{formData.adults} Adult(s), {formData.children} Children
										</p>
										<p>{formData.numberOfNights} Nights</p>
										<p>
											Dates: {formData.checkInDate?.format("YYYY-MM-DD")} to{" "}
											{formData.checkOutDate?.format("YYYY-MM-DD")}
										</p>
										<h4>
											{Number(
												room.pricePerNight *
													process.env.REACT_APP_COMMISSIONRATE
											).toFixed(2)}{" "}
											SAR per night
										</h4>
									</RoomDetails>
									{room.pricingByDay && room.pricingByDay.length > 0 && (
										<Collapse
											accordion
											expandIcon={({ isActive }) => (
												<CaretRightOutlined rotate={isActive ? 90 : 0} />
											)}
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
													{room.pricingByDay.map(({ date, price }, i) => (
														<li key={i}>
															{dayjs(date).format("YYYY-MM-DD")}: {price} SAR
														</li>
													))}
												</PricingList>
											</Panel>
										</Collapse>
									)}
								</RoomItem>
							))}
							<h4>
								Total:{" "}
								{Number(
									formData.totalAmount * process.env.REACT_APP_COMMISSIONRATE
								).toFixed(2)}{" "}
								SAR
							</h4>
						</RightSection>
					)}
				</Panel>
			</MobileAccordion>

			<DesktopWrapper>
				<LeftSection>
					<h1
						style={{
							fontSize: "1.5rem",
							fontWeight: "bolder",
							textAlign: "center",
						}}
					>
						Hotel: {hotelDetails && hotelDetails.hotelName}
					</h1>

					<h2>Customer Details</h2>
					<form>
						<InputGroup>
							<label>Name</label>
							<input
								type='text'
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								readOnly={!!user}
							/>
						</InputGroup>
						<InputGroup>
							<label>Phone</label>
							<input
								type='text'
								value={formData.phone}
								onChange={(e) =>
									setFormData({ ...formData, phone: e.target.value })
								}
								readOnly={!!user}
							/>
						</InputGroup>
						<InputGroup>
							<label>Email</label>
							<input
								type='email'
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
								readOnly={!!user}
							/>
						</InputGroup>
						{!user && (
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
											placeholder='Password'
											value={password}
											onChange={(e) => setPassword(e.target.value)}
										/>
									</InputGroup>
								</div>
								<div className='col-md-6'>
									<InputGroup>
										<label>Confirm Password</label>
										<input
											type='password'
											placeholder='Confirm Password'
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
										/>
									</InputGroup>
								</div>
							</div>
						)}
						<InputGroup>
							<label>Passport Number</label>
							<input
								type='text'
								value={formData.passport}
								onChange={(e) =>
									setFormData({ ...formData, passport: e.target.value })
								}
							/>
						</InputGroup>
						<InputGroup>
							<label>Passport Expiry</label>
							<input
								type='date'
								value={formData.passportExpiry}
								onChange={(e) =>
									setFormData({ ...formData, passportExpiry: e.target.value })
								}
							/>
						</InputGroup>
						<InputGroup>
							<label>Nationality</label>
							<input type='text' value={formData.nationality} disabled />
						</InputGroup>
					</form>

					<TermsWrapper>
						<Checkbox
							checked={guestAgreedOnTermsAndConditions}
							onChange={(e) =>
								setGuestAgreedOnTermsAndConditions(e.target.checked)
							}
						>
							Accept Terms & Conditions
						</Checkbox>
					</TermsWrapper>

					<TermsWrapper>
						<Checkbox
							checked={pay10Percent}
							onChange={(e) => {
								setPayWholeAmount(false);
								setPay10Percent(e.target.checked);
							}}
						>
							Pay 10% Deposit{" "}
							<span style={{ fontWeight: "bold" }}>
								(SAR {Number(formData.totalAmount * 0.1).toFixed(2)})
							</span>
						</Checkbox>
					</TermsWrapper>
					<TermsWrapper>
						<Checkbox
							checked={payWholeAmount}
							onChange={(e) => {
								setPay10Percent(false);
								setPayWholeAmount(e.target.checked);
							}}
						>
							Pay the whole Total Amount{" "}
							<span style={{ fontWeight: "bold" }}>
								(SAR{" "}
								{Number(
									formData.totalAmount * process.env.REACT_APP_COMMISSIONRATE
								).toFixed(2)}
								)
							</span>
						</Checkbox>
					</TermsWrapper>

					<small onClick={() => window.open("/terms-conditions", "_blank")}>
						It's highly recommended to check our terms & conditions specially
						for refund and cancellation sections 4 & 5{" "}
					</small>

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
							handleReservation={handleReservation}
							pricePerNight={formData.pricePerNight}
							total={formData.totalAmount}
							pay10Percent={pay10Percent}
							total_price_with_commission={Number(
								formData.totalAmount * process.env.REACT_APP_COMMISSIONRATE
							)}
						/>
					) : null}
				</LeftSection>

				<RightSection>
					<h2>Your Reservation</h2>
					{hotelDetails && (
						<>
							<RangePicker
								value={[formData.checkInDate, formData.checkOutDate]}
								disabled
								style={{ width: "100%", marginBottom: "10px" }}
							/>
							{formData.pickedRooms.map((room, index) => (
								<RoomItem key={index}>
									<RoomImage
										src={room.photos?.[0]?.url || "/default-room.jpg"}
										alt='Room'
									/>
									<RoomDetails>
										<h3>{room.displayName}</h3>
										<p>{room.count} Room(s)</p>
										<p>
											{formData.adults} Adult(s), {formData.children} Children
										</p>
										<p>
											Dates: {formData.checkInDate?.format("YYYY-MM-DD")} to{" "}
											{formData.checkOutDate?.format("YYYY-MM-DD")}
										</p>
										<p>{formData.numberOfNights} Nights</p>
										<h4>
											{Number(
												room.pricePerNight *
													process.env.REACT_APP_COMMISSIONRATE
											).toFixed(2)}{" "}
											SAR per night
										</h4>
									</RoomDetails>
									{room.pricingByDay && room.pricingByDay.length > 0 && (
										<Collapse
											accordion
											expandIcon={({ isActive }) => (
												<CaretRightOutlined rotate={isActive ? 90 : 0} />
											)}
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
													{room.pricingByDay.map(({ date, price }, i) => (
														<li key={i}>
															{dayjs(date).format("YYYY-MM-DD")}:{" "}
															{Number(price).toFixed(2)} SAR
														</li>
													))}
												</PricingList>
											</Panel>
										</Collapse>
									)}
								</RoomItem>
							))}
							<h4>
								Total:{" "}
								{Number(
									formData.totalAmount * process.env.REACT_APP_COMMISSIONRATE
								).toFixed(2)}{" "}
								SAR
							</h4>
						</>
					)}
				</RightSection>
			</DesktopWrapper>
		</GeneratedLinkCheckoutWrapper>
	);
};

export default GeneratedLinkCheckout;

// Styled components
const GeneratedLinkCheckoutWrapper = styled.div`
	display: flex;
	flex-direction: column;
	padding: 20px;
	text-transform: capitalize;
	padding: 20px 150px;

	small {
		font-weight: bold;
		font-size: 11px;
		cursor: pointer;
		color: darkred;
	}

	@media (max-width: 800px) {
		padding: 25px 0px;
		margin-top: 80px;
	}
`;

const MobileAccordion = styled(Collapse)`
	display: none;
	@media (max-width: 768px) {
		display: block;
		margin-top: 20px;
		background-color: white;
		font-weight: bolder;
	}
`;

const DesktopWrapper = styled.div`
	display: flex;
	gap: 20px;
	@media (max-width: 768px) {
		flex-direction: column;
	}
`;

const LeftSection = styled.div`
	flex: 2;
	background: #f5f5f5;
	padding: 20px;
	border-radius: 10px;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	@media (max-width: 768px) {
		padding: 15px;
	}
`;

const RightSection = styled.div`
	flex: 1;
	padding: 20px;
	background: #ffffff;
	border-radius: 10px;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	position: sticky;
	top: 20px;
	@media (max-width: 768px) {
		padding: 15px;
	}
`;

const RoomItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	border-bottom: 1px solid #ddd;
	padding-bottom: 10px;
`;

const RoomImage = styled.img`
	width: 100%;
	height: 200px;
	object-fit: cover;
	border-radius: 8px;
`;

const RoomDetails = styled.div`
	text-align: center;
	h3 {
		font-size: 1.2rem;
	}
	h4 {
		font-size: 1.1rem;
		color: #555;
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

const PriceDetailsHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
`;

const PricingList = styled.ul`
	list-style-type: none;
	padding: 0;
	margin-top: 10px;
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
