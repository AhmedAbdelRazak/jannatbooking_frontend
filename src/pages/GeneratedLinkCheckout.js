import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import {
	DatePicker,
	Collapse,
	message,
	Checkbox,
	Button,
	Modal,
	Spin,
} from "antd";
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
import { Helmet } from "react-helmet";
import favicon from "../favicon.ico";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import PaymentOptions from "../components/checkout/PaymentOptions";

const { RangePicker } = DatePicker;
const { Panel } = Collapse;

/**
 * Safely parse floating-point values, defaulting to `fallback` (0).
 */
const safeParseFloat = (value, fallback = 0) => {
	const parsed = parseFloat(value);
	return isNaN(parsed) ? fallback : parsed;
};

/**
 * calculateDepositDetails(pickedRooms):
 *   - Commission = Σ over each room & day of:
 *       (totalPriceWithCommission - rootPrice) × room.count
 *   - One-Night Cost = Σ over each room of:
 *       average(rootPrice across days) × room.count
 *   - depositAmount = Commission + One-Night Cost
 *
 * This matches the "robust logic" from CheckoutContent & ReceiptPDF.
 */
const calculateDepositDetails = (pickedRooms) => {
	if (!pickedRooms || pickedRooms.length === 0) {
		return { averageCommissionRate: "0.00", depositAmount: "0.00" };
	}

	let totalCommissionDiff = 0; // sum of daily differences
	let totalOneNightCost = 0; // sum of one-night cost across rooms

	pickedRooms.forEach((room) => {
		const count = safeParseFloat(room.count, 1);

		if (room.pricingByDay && room.pricingByDay.length > 0) {
			// 1) Commission = (wc - rp) across days × room.count
			let dailyDiffSum = 0;
			let rootPriceSum = 0; // for averaging rootPrice

			room.pricingByDay.forEach((day) => {
				const wc = safeParseFloat(day.totalPriceWithCommission, 0);
				const rp = safeParseFloat(day.rootPrice, 0);
				dailyDiffSum += wc - rp;
				rootPriceSum += rp;
			});

			totalCommissionDiff += dailyDiffSum * count;

			// 2) One-night cost => average of rootPrices × room.count
			const avgRoot = rootPriceSum / room.pricingByDay.length;
			totalOneNightCost += avgRoot * count;
		} else {
			// Fallback if no day data:
			// Commission = 0, one-night = chosenPrice × count
			const fallbackPrice = safeParseFloat(room.pricePerNight, 0);
			totalCommissionDiff += 0;
			totalOneNightCost += fallbackPrice * count;
		}
	});

	// Final deposit
	const finalDeposit = totalCommissionDiff + totalOneNightCost;

	return {
		averageCommissionRate: "0.00", // placeholder if needed
		depositAmount: finalDeposit.toFixed(2),
	};
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
		passport: "Not Provided",
		passportExpiry: "2029-12-20",
		pickedRooms: [],
	});
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [hotelDetails, setHotelDetails] = useState(null);
	const [verificationModalVisible, setVerificationModalVisible] =
		useState(false);
	const [isBuffering, setIsBuffering] = useState(false);

	const [convertedAmounts, setConvertedAmounts] = useState({
		depositUSD: null,
		totalUSD: null,
	});

	const [mobileExpanded, setMobileExpanded] = useState(false);

	const [cardNumber, setCardNumber] = useState("");
	const [expiryDate, setExpiryDate] = useState("");
	const [cvv, setCvv] = useState("");
	const [cardHolderName, setCardHolderName] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [guestAgreedOnTermsAndConditions, setGuestAgreedOnTermsAndConditions] =
		useState(false);
	const [selectedPaymentOption, setSelectedPaymentOption] = useState("");

	// Load from URL
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
			try {
				const encodedBreakdown = params.get(`pricingBreakdown${roomIndex}`);
				const decodedBreakdown = decodeURIComponent(
					decodeURIComponent(encodedBreakdown || "[]")
				);
				const pricingBreakdown = JSON.parse(decodedBreakdown);

				const commissionRateFromBreakdown =
					pricingBreakdown.length > 0
						? parseFloat(pricingBreakdown[0].commissionRate)
						: parseFloat(params.get(`commissionRate${roomIndex}`)) || 1;

				pickedRooms.push({
					roomType: params.get(`roomType${roomIndex}`),
					displayName: params.get(`displayName${roomIndex}`),
					count: parseInt(params.get(`roomCount${roomIndex}`), 10) || 1,
					pricePerNight:
						parseFloat(params.get(`pricePerNight${roomIndex}`)) || 0,
					commissionRate: commissionRateFromBreakdown,
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

	// Currency conversion (deposit + total)
	useEffect(() => {
		const fetchConversion = async () => {
			const deposit = formData.totalCommission; // from the URL or fallback
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

	const handleNotPaidReservation = () => {
		setIsBuffering(true);
		setTimeout(() => {
			setIsBuffering(false);
			setVerificationModalVisible(true);
		}, 2000);
	};

	const handleModalClose = () => {
		history.push("/");
	};

	/**
	 * Generate final "pickedRoomsType" structure for the backend.
	 */
	const transformPickedRoomsToPickedRoomsType = (pickedRooms, isPayInHotel) => {
		return pickedRooms.flatMap((room) => {
			const count = safeParseFloat(room.count, 1);
			return Array.from({ length: count }, () => {
				const pricingDetails = room.pricingByDay.map((day) => {
					const noHotelMultiplier = isPayInHotel ? 1.1 : 1.0;
					return {
						date: day.date,
						price: day.totalPriceWithCommission * noHotelMultiplier,
						rootPrice: safeParseFloat(day.rootPrice, 0),
						commissionRate: safeParseFloat(day.commissionRate, 0),
						totalPriceWithCommission:
							day.totalPriceWithCommission * noHotelMultiplier,
						totalPriceWithoutCommission: safeParseFloat(day.price, 0),
					};
				});

				const sumWithComm = pricingDetails.reduce(
					(acc, d) => acc + safeParseFloat(d.totalPriceWithCommission, 0),
					0
				);
				const avgWithComm =
					pricingDetails.length > 0 ? sumWithComm / pricingDetails.length : 0;

				return {
					room_type: room.roomType,
					displayName: room.displayName,
					chosenPrice: avgWithComm.toFixed(2),
					count: 1,
					pricingByDay: pricingDetails,
					totalPriceWithCommission: sumWithComm,
					hotelShouldGet: pricingDetails.reduce(
						(acc, d) => acc + safeParseFloat(d.rootPrice, 0),
						0
					),
				};
			});
		});
	};

	const { averageCommissionRate, depositAmount } = useMemo(() => {
		return calculateDepositDetails(formData.pickedRooms);
	}, [formData.pickedRooms]);

	// total price with commission (from URL)
	const total_price_with_commission =
		formData.totalAmount + (formData.totalCommission || 0);

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
			totalCommission,
		} = formData;

		if (!guestAgreedOnTermsAndConditions) {
			message.error(
				"You must accept the Terms & Conditions before proceeding."
			);
			return;
		}
		if (!name || name.trim().split(" ").length < 2) {
			message.error("Please provide your full name (first and last name).");
			return;
		}
		const phoneRegex = /^[0-9]{6,}$/;
		if (!phone || !phoneRegex.test(phone)) {
			message.error("Please provide a valid phone number (≥6 digits).");
			return;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email || !emailRegex.test(email)) {
			message.error("Please provide a valid email address.");
			return;
		}
		// password checks if user not authenticated
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
		if (!passport) {
			message.error("Please provide your passport number.");
			return;
		}
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

		// Payment details
		const paymentDetails = {
			cardNumber,
			cardExpiryDate: expiryDate,
			cardCVV: cvv,
			cardHolderName,
		};

		const isPayInHotel = selectedPaymentOption === "acceptReserveNowPayInHotel";
		const pickedRoomsType = transformPickedRoomsToPickedRoomsType(
			pickedRooms,
			isPayInHotel
		);

		// Payment logic
		let payment = "Not Paid";
		let commissionPaid = false;
		let commission = parseFloat(depositAmount); // from difference + oneNight approach
		let paid_amount = 0;
		let adjustedTotalAmount = totalAmount + totalCommission;

		if (selectedPaymentOption === "acceptDeposit") {
			payment = "Deposit Paid";
			commissionPaid = true;
			paid_amount = commission;
		} else if (selectedPaymentOption === "acceptPayWholeAmount") {
			payment = "Paid Online";
			commissionPaid = true;
			paid_amount = adjustedTotalAmount;
		} else if (selectedPaymentOption === "acceptReserveNowPayInHotel") {
			payment = "Not Paid";
			commissionPaid = false;
			adjustedTotalAmount *= 1.1;
			paid_amount = 0;
		}

		const reservationData = {
			guestAgreedOnTermsAndConditions,
			userId: user ? user._id : null,
			hotelId: formData.hotelId,
			belongsTo: hotelDetails?.belongsTo,
			hotel_name: hotelDetails?.hotelName || "",
			customerDetails: {
				name,
				email,
				phone,
				passport,
				passportExpiry,
				nationality: formData.nationality,
				password: !user ? password : undefined,
				postalCode: "00000",
			},
			paymentDetails,
			total_rooms: pickedRooms.reduce((acc, r) => acc + r.count, 0),
			total_guests: formData.adults + formData.children,
			adults: formData.adults,
			children: formData.children,
			checkin_date: checkInDate ? checkInDate.format("YYYY-MM-DD") : "",
			checkout_date: checkOutDate ? checkOutDate.format("YYYY-MM-DD") : "",
			days_of_residence: numberOfNights,
			booking_source: "Generated Link",
			pickedRoomsType,
			total_amount: adjustedTotalAmount,
			payment,
			paid_amount,
			commission,
			commissionPaid,
			convertedAmounts,
		};

		try {
			const response = await createNewReservationClient(reservationData);

			if (selectedPaymentOption === "acceptReserveNowPayInHotel") {
				handleNotPaidReservation();
			}

			if (response?.message === "Verification email sent successfully") {
				if (payment === "Not Paid") {
					message.success(response.message);
					handleNotPaidReservation();
					return;
				}
			}

			if (response?.message === "Reservation created successfully") {
				message.success("Reservation created successfully");

				ReactGA.event({
					category: "Reservation Paid (GeneratedLink)",
					action: "Reservation Paid (GeneratedLink)",
					label: "Reservation Paid (GeneratedLink)",
				});
				ReactPixel.track("Reservation Paid (GeneratedLink)", {
					action: "Checkout Completed (GeneratedLink)",
					page: "Link Generated",
				});

				const queryParams = new URLSearchParams();
				queryParams.append("name", name);
				queryParams.append("total_price", adjustedTotalAmount.toFixed(2));
				queryParams.append(
					"total_rooms",
					pickedRooms.reduce((acc, r) => acc + r.count, 0)
				);

				pickedRooms.forEach((room, index) => {
					queryParams.append(`room_type${index + 1}`, room.roomType);
					queryParams.append(`room_display_name${index + 1}`, room.displayName);
					// Possibly more fields
				});

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
							window.location.href = `/reservation-confirmed?${queryParams.toString()}`;
						});
					}
				} else {
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

	return (
		<GeneratedLinkCheckoutWrapper>
			<Helmet>
				<title>Generated Link By Customer Service | Jannat Booking</title>
				<meta
					name='description'
					content='Generated Link For Booking Confirmation'
				/>
				<meta
					name='keywords'
					content='Jannat Booking, Contact Us, Haj hotel support, Umrah hotel inquiries, pilgrimage support, hotel booking assistance, customer service'
				/>

				{/* Open Graph Tags */}
				<meta property='og:title' content='Contact Us | Jannat Booking' />
				<meta
					property='og:description'
					content='Get in touch with Jannat Booking for Haj and Umrah hotel bookings. Our support team is here to help you with all your inquiries and reservations.'
				/>
				<meta
					property='og:url'
					content='https://jannatbooking.com/generated-link'
				/>
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
					content="Reach out to Jannat Booking for assistance with Haj and Umrah hotel reservations. We're happy to help with your inquiries."
				/>

				{/* Canonical URL */}
				<link rel='canonical' href='https://jannatbooking.com/generated-link' />

				{/* Favicon */}
				<link rel='icon' href={favicon} />
			</Helmet>

			{isBuffering ? (
				<BufferingWrapper>
					<Spin size='large' />
					<p>Please wait, verifying your reservation...</p>
				</BufferingWrapper>
			) : (
				<>
					{/* Mobile accordion */}
					<MobileAccordion
						onChange={() => setMobileExpanded(!mobileExpanded)}
						activeKey={mobileExpanded ? "1" : null}
					>
						<Panel header='Your Reservation Summary' key='1'>
							<h2>Your Reservation</h2>
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
									const totalPriceWithCommission = room.pricingByDay.reduce(
										(acc, d) => acc + (d.totalPriceWithCommission || 0),
										0
									);
									const pricePerNight =
										totalNights > 0
											? totalPriceWithCommission / totalNights
											: 0;

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
													{formData.adults} Adult(s), {formData.children}{" "}
													Children
												</p>
												<p>
													Dates: {formData.checkInDate?.format("YYYY-MM-DD")} to{" "}
													{formData.checkOutDate?.format("YYYY-MM-DD")}
												</p>
												<p>{formData.numberOfNights} Nights</p>
												<h4>
													{(pricePerNight * room.count).toFixed(2)} SAR per
													night
												</h4>

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
																room.pricingByDay.map((d, i) => (
																	<li key={i}>
																		{dayjs(d.date).format("YYYY-MM-DD")}:{" "}
																		{Number(d.totalPriceWithCommission).toFixed(
																			2
																		)}{" "}
																		SAR
																	</li>
																))
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

							<TotalsWrapper>
								<p>Total Rooms: {formData.pickedRooms.length}</p>
								<p className='total-price'>
									Total Price:{" "}
									{(
										Number(formData.totalAmount) +
										Number(formData.totalCommission)
									).toFixed(2)}{" "}
									SAR
								</p>
							</TotalsWrapper>
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
							{/* Basic user form fields */}
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
													onClick={() => {
														const currentUrl =
															window.location.pathname + window.location.search;
														history.push(
															`/signin?returnUrl=${encodeURIComponent(currentUrl)}`
														);
													}}
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
									<label>Nationality</label>
									<input type='text' value={formData.nationality} readOnly />
								</InputGroup>
							</form>

							<TermsWrapper>
								<Checkbox
									checked={guestAgreedOnTermsAndConditions}
									onChange={(e) => {
										ReactGA.event({
											category: "User Accepted Terms And Cond (Link Generated)",
											action: "User Accepted Terms And Cond (Link Generated)",
											label: "User Accepted Terms And Cond (Link Generated)",
										});
										ReactPixel.track(
											"Terms And Conditions Accepted (Line Generated)",
											{
												action:
													"User Accepted Terms And Conditions Accepted (Line Generated)",
												page: "Link Generated",
											}
										);
										setGuestAgreedOnTermsAndConditions(e.target.checked);
									}}
								>
									Accept Terms & Conditions
								</Checkbox>
							</TermsWrapper>

							{hotelDetails && hotelDetails.hotelName ? (
								<PaymentOptions
									hotelDetails={hotelDetails}
									chosenLanguage={"English"}
									t={() => ""} // Minimal translation function
									// Now pass the robust difference + oneNight deposit
									depositAmount={depositAmount}
									averageCommissionRate={averageCommissionRate}
									total_price_with_commission={total_price_with_commission}
									convertedAmounts={convertedAmounts}
									selectedPaymentOption={selectedPaymentOption}
									setSelectedPaymentOption={setSelectedPaymentOption}
								/>
							) : null}

							<small onClick={() => window.open("/terms-conditions", "_blank")}>
								It's highly recommended to check our terms & conditions
								specially for refund and cancellation sections 4 & 5{" "}
							</small>

							{guestAgreedOnTermsAndConditions && selectedPaymentOption ? (
								selectedPaymentOption === "acceptReserveNowPayInHotel" ? (
									<Button
										type='primary'
										onClick={handleReservation}
										style={{ marginTop: "20px", width: "100%" }}
									>
										Reserve Now
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
										handleReservation={handleReservation}
										total={formData.totalAmount}
										total_price_with_commission={total_price_with_commission}
										convertedAmounts={convertedAmounts}
										nationality={formData.nationality}
										selectedPaymentOption={selectedPaymentOption}
									/>
								)
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
									const sumWithComm = room.pricingByDay.reduce(
										(acc, d) => acc + d.totalPriceWithCommission,
										0
									);
									const avgPerNight =
										totalNights > 0 ? sumWithComm / totalNights : 0;

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
													{formData.adults} Adult(s), {formData.children}{" "}
													Children
												</p>
												<p>
													Dates: {formData.checkInDate?.format("YYYY-MM-DD")} to{" "}
													{formData.checkOutDate?.format("YYYY-MM-DD")}
												</p>
												<p>{formData.numberOfNights} Nights</p>
												<h4>
													{(avgPerNight * room.count).toFixed(2)} SAR per night
												</h4>

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
																{room.pricingByDay.map((d, i) => (
																	<li key={i}>
																		{dayjs(d.date).format("YYYY-MM-DD")}:{" "}
																		{Number(d.totalPriceWithCommission).toFixed(
																			2
																		)}{" "}
																		SAR
																	</li>
																))}
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

							<TotalsWrapper>
								<p>Total Rooms: {formData.pickedRooms.length}</p>
								<p className='total-price'>
									Total Price:{" "}
									{(
										Number(formData.totalAmount) +
										Number(formData.totalCommission)
									).toFixed(2)}{" "}
									SAR
								</p>
							</TotalsWrapper>
						</RightSection>
					</DesktopWrapper>
				</>
			)}

			{/* Verification Modal */}
			<Modal
				title='Please Check Your Email'
				open={verificationModalVisible}
				onOk={handleModalClose}
				onCancel={handleModalClose}
				okText='OK'
				cancelText='Cancel'
			>
				<p>
					Please check your email to verify your reservation. If you can't find
					the email, please check your spam folder or contact support.
				</p>
			</Modal>
		</GeneratedLinkCheckoutWrapper>
	);
};

export default GeneratedLinkCheckout;

/* ------------------ STYLED COMPONENTS ------------------ */

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
		display: block; /* Show only on mobile */
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
		display: none; /* Hide on mobile */
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

const BufferingWrapper = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	min-height: 800px;
	padding: 20px;
	text-align: center;

	p {
		margin-top: 20px;
		font-size: 1.2rem;
		color: #555;
		text-align: center;
	}
`;
