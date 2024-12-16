import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { DatePicker, Collapse, message, Checkbox } from "antd";
import { useLocation, useHistory } from "react-router-dom";
import {
	gettingHotelDetailsById,
	createNewReservationClient,
	currencyConversion,
} from "../apiCore";
import dayjs from "dayjs";
import PaymentDetails from "../components/checkout/PaymentDetails";
import { CaretRightOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { authenticate, isAuthenticated, signin } from "../auth";

const { RangePicker } = DatePicker;
const { Panel } = Collapse;

// Helper function to calculate pricing by day
// eslint-disable-next-line
const calculatePricingByDay = (
	pricingRate,
	startDate,
	endDate,
	basePrice,
	commissionRate
) => {
	const start = dayjs(startDate).startOf("day");
	const end = dayjs(endDate).subtract(1, "day").startOf("day");
	const dateArray = [];
	let currentDate = start;

	// Compute the commission multiplier
	const commissionMultiplier = 1 + commissionRate / 100;

	while (currentDate.isBefore(end) || currentDate.isSame(end, "day")) {
		const formattedDate = currentDate.format("YYYY-MM-DD");
		const rateForDate = pricingRate.find(
			(rate) => dayjs(rate.date).format("YYYY-MM-DD") === formattedDate
		);

		const priceWithCommission = (
			(rateForDate?.price || basePrice) * commissionMultiplier
		).toFixed(2);

		dateArray.push({
			date: formattedDate,
			price: priceWithCommission,
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

	const [convertedAmounts, setConvertedAmounts] = useState({
		depositUSD: null,
		totalUSD: null,
	}); // Added for currency conversion

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

		// Parse room details from URL
		while (
			params.get(`roomType${roomIndex}`) &&
			params.get(`displayName${roomIndex}`)
		) {
			try {
				// Parse and decode pricing breakdown
				const pricingBreakdown = JSON.parse(
					decodeURIComponent(params.get(`pricingBreakdown${roomIndex}`) || "[]")
				);

				pickedRooms.push({
					roomType: params.get(`roomType${roomIndex}`),
					displayName: params.get(`displayName${roomIndex}`),
					count: parseInt(params.get(`roomCount${roomIndex}`), 10) || 1,
					pricePerNight:
						parseFloat(params.get(`pricePerNight${roomIndex}`)) || 0,
					commissionRate:
						parseFloat(params.get(`commissionRate${roomIndex}`)) || 1,
					pricingByDay: pricingBreakdown.map((day) => ({
						date: day.date,
						price: parseFloat(day.price) || 0,
						rootPrice: parseFloat(day.rootPrice) || 0,
						commissionRate: parseFloat(day.commissionRate) || 0,
						totalPriceWithCommission:
							parseFloat(day.totalPriceWithCommission) || 0,
					})),
				});
			} catch (error) {
				console.error(
					`Error parsing pricingBreakdown for room ${roomIndex}:`,
					error
				);
			}

			roomIndex++;
		}

		// Fetch hotel details and enrich room data
		if (hotelId) {
			gettingHotelDetailsById(hotelId).then((data) => {
				if (data) {
					setHotelDetails(data);

					const enrichedRooms = pickedRooms.map((room) => {
						const matchingRoom = data.roomCountDetails.find(
							(detail) =>
								detail.roomType === room.roomType &&
								detail.displayName === room.displayName
						);

						if (matchingRoom) {
							// Merge backend data with URL data
							return {
								...room,
								photos: matchingRoom.photos || [],
							};
						} else {
							console.warn(
								`Room details not found for room type: ${room.roomType}`
							);
							return room;
						}
					});

					setFormData((prevFormData) => ({
						...prevFormData,
						pickedRooms: enrichedRooms,
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
			totalCommission: parseFloat(params.get("totalCommission")) || 0,
			adults: parseInt(params.get("adults"), 10) || 1,
			children: parseInt(params.get("children"), 10) || 0,
			nationality: params.get("nationality") || "",
			name: params.get("name") || "",
			email: params.get("email") || "",
			phone: params.get("phone") || "",
			pickedRooms,
		}));
		// eslint-disable-next-line
	}, [location.search]);

	useEffect(() => {
		const fetchConversion = async () => {
			const deposit = formData.totalCommission; // Deposit is the commission
			const total = formData.totalAmount + formData.totalCommission;
			const amounts = [deposit, total];

			try {
				const conversions = await currencyConversion(amounts);
				setConvertedAmounts({
					depositUSD: Number(conversions[0]?.amountInUSD.toFixed(2)),
					totalUSD: Number(conversions[1]?.amountInUSD.toFixed(2)),
				});
			} catch (error) {
				console.error("Currency conversion failed", error);
			}
		};

		fetchConversion();
	}, [formData.totalAmount, formData.totalCommission]);

	// Updated transformPickedRoomsToPickedRoomsType Function
	// eslint-disable-next-line
	const transformPickedRoomsToPickedRoomsType = (pickedRooms) => {
		return pickedRooms.flatMap((room) => {
			// Process each room individually
			return Array.from({ length: room.count }, () => {
				// Transform each day's pricing details for the room
				const pricingDetails = room.pricingByDay.map((day) => ({
					date: day.date,
					price: Number(day.price), // Base price of the room
					rootPrice: Number(day.rootPrice), // Hotel's base price
					commissionRate: Number(day.commissionRate), // Commission rate
					totalPriceWithCommission: Number(day.totalPriceWithCommission), // Final price with commission
					totalPriceWithoutCommission: Number(day.price), // Original price without added commission
				}));

				// Calculate the average price with commission
				const averagePriceWithCommission =
					pricingDetails.reduce(
						(sum, day) => sum + day.totalPriceWithCommission,
						0
					) / pricingDetails.length;

				return {
					room_type: room.roomType, // Room type
					displayName: room.displayName, // Display name
					chosenPrice: averagePriceWithCommission.toFixed(2), // Average price with commission
					count: 1, // Each room is represented individually
					pricingByDay: pricingDetails, // Detailed pricing breakdown
					// Additional calculated totals
					totalPriceWithCommission: pricingDetails.reduce(
						(sum, day) => sum + day.totalPriceWithCommission,
						0
					), // Total price with commission
					hotelShouldGet: pricingDetails.reduce(
						(sum, day) => sum + day.rootPrice,
						0
					), // Total base price the hotel should get
				};
			});
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

		// Validate Terms & Conditions
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

		// Use the `transformPickedRoomsToPickedRoomsType` helper function
		const pickedRoomsType = transformPickedRoomsToPickedRoomsType(pickedRooms);

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
				password: !user ? password : undefined, // Include password only if user is not logged in
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
			total_amount: totalAmount + formData.totalCommission,
			payment: pay10Percent ? "Deposit Paid" : "Paid Online",
			paid_amount: pay10Percent
				? formData.totalCommission
				: totalAmount + formData.totalCommission,
			commission: formData.totalCommission,
			commissionPaid: true,
			convertedAmounts,
		};

		try {
			const response = await createNewReservationClient(reservationData);
			if (response?.message === "Reservation created successfully") {
				message.success("Reservation created successfully");

				// Automatically sign in the user if the account was just created
				if (!user) {
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
				}

				// Construct query params for redirection
				const queryParams = new URLSearchParams();
				queryParams.append("name", name);
				queryParams.append(
					"total_price",
					(totalAmount + formData.totalCommission).toFixed(2)
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
				queryParams.append("nights", numberOfNights);
				queryParams.append("hotel_name", hotelDetails?.hotelName);

				// Add each room's details to the query
				pickedRooms.forEach((room, index) => {
					queryParams.append(`room_type${index + 1}`, room.roomType);
					queryParams.append(`room_display_name${index + 1}`, room.displayName);
					queryParams.append(
						`price_per_night${index + 1}`,
						Number(room.pricePerNight * room.commissionRate).toFixed(2)
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
					<RightSection>
						<h2>Your Reservation</h2>

						{/* Date Range Picker */}
						<DateRangePickerWrapper>
							<RangePicker
								format='YYYY-MM-DD'
								value={[formData.checkInDate, formData.checkOutDate]}
								disabled
								style={{ width: "100%", marginBottom: "10px" }}
								dropdownClassName='mobile-friendly-picker'
							/>
						</DateRangePickerWrapper>

						{formData.pickedRooms.length > 0 ? (
							formData.pickedRooms.map((room, index) => {
								const totalNights = room.pricingByDay?.length || 0;

								// Calculate the price per night and total price
								const totalPriceWithCommission =
									room.pricingByDay?.reduce(
										(total, day) => total + (day.totalPriceWithCommission || 0),
										0
									) || 0;
								const pricePerNight =
									totalNights > 0 ? totalPriceWithCommission / totalNights : 0;

								return (
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
											<h4>{Number(pricePerNight).toFixed(2)} SAR per night</h4>

											{/* Accordion for Price Breakdown */}
											<Collapse
												accordion
												expandIcon={({ isActive }) => (
													<CaretRightOutlined
														rotate={isActive ? 90 : 0}
														style={{ color: "var(--primary-color)" }}
													/>
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
														{room.pricingByDay?.length > 0 ? (
															room.pricingByDay.map(
																({ date, totalPriceWithCommission }, i) => (
																	<li key={i}>
																		{dayjs(date).format("YYYY-MM-DD")}:{" "}
																		{Number(totalPriceWithCommission).toFixed(
																			2
																		)}{" "}
																		SAR
																	</li>
																)
															)
														) : (
															<li>No price breakdown available</li>
														)}
													</PricingList>
												</Panel>
											</Collapse>
										</RoomDetails>
									</RoomItem>
								);
							})
						) : (
							<p>No rooms selected.</p>
						)}

						{/* Totals Section */}
						<TotalsWrapper>
							<p>Total Rooms: {formData.pickedRooms.length}</p>
							<p className='total-price'>
								Total Price:{" "}
								{Number(
									formData.pickedRooms.reduce(
										(total, room) =>
											total +
											room.pricingByDay.reduce(
												(subTotal, day) =>
													subTotal + day.totalPriceWithCommission,
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
							Pay{" "}
							{Number(
								(formData.totalCommission /
									(Number(formData.totalAmount) +
										Number(formData.totalCommission))) *
									100
							).toFixed(0)}
							% Deposit{" "}
							<span style={{ fontWeight: "bold" }}>
								(SAR {Number(formData.totalCommission).toFixed(2)})
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
									Number(formData.totalAmount) +
										Number(formData.totalCommission)
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
							total_price_with_commission={
								Number(formData.totalAmount) + Number(formData.totalCommission)
							}
							convertedAmounts={convertedAmounts}
							depositAmount={Number(formData.totalCommission)}
						/>
					) : null}
				</LeftSection>

				<RightSection>
					<h2>Your Reservation</h2>

					<RangePicker
						value={[formData.checkInDate, formData.checkOutDate]}
						disabled
						style={{ width: "100%", marginBottom: "10px" }}
					/>

					{formData.pickedRooms.length > 0 ? (
						formData.pickedRooms.map((room, index) => {
							const totalNights = room.pricingByDay.length || 0;

							// Calculate the total price with commission and average price per night
							const totalPriceWithCommission = room.pricingByDay.reduce(
								(total, day) => total + day.totalPriceWithCommission,
								0
							);
							const averagePricePerNight =
								totalNights > 0 ? totalPriceWithCommission / totalNights : 0;

							return (
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
										<h4>{averagePricePerNight.toFixed(2)} SAR per night</h4>

										{/* Accordion for Price Breakdown */}
										{room.pricingByDay && room.pricingByDay.length > 0 && (
											<Collapse
												accordion
												expandIcon={({ isActive }) => (
													<CaretRightOutlined
														rotate={isActive ? 90 : 0}
														style={{ color: "var(--primary-color)" }}
													/>
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
														{room.pricingByDay.map(
															({ date, totalPriceWithCommission }, i) => (
																<li key={i}>
																	{dayjs(date).format("YYYY-MM-DD")}:{" "}
																	{Number(totalPriceWithCommission).toFixed(2)}{" "}
																	SAR
																</li>
															)
														)}
													</PricingList>
												</Panel>
											</Collapse>
										)}
									</RoomDetails>
								</RoomItem>
							);
						})
					) : (
						<p>No rooms selected.</p>
					)}

					{/* Totals Section */}
					<TotalsWrapper>
						<p>Total Rooms: {formData.pickedRooms.length}</p>
						<p className='total-price'>
							Total Price:{" "}
							{Number(
								formData.pickedRooms.reduce(
									(total, room) =>
										total +
										room.pricingByDay.reduce(
											(subTotal, day) =>
												subTotal + day.totalPriceWithCommission,
											0
										),
									0
								)
							).toFixed(2)}{" "}
							SAR
						</p>
					</TotalsWrapper>
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
