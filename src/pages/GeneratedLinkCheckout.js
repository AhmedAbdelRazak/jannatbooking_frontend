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
import { useCartContext } from "../cart_context";

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
	const { chosenLanguage } = useCartContext();

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
		pickedRooms: [], // Array to hold multiple room selections
	});
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [hotelDetails, setHotelDetails] = useState(null);
	const [verificationModalVisible, setVerificationModalVisible] =
		useState(false);
	const [isBuffering, setIsBuffering] = useState(false); // New state for buffering

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
	const [selectedPaymentOption, setSelectedPaymentOption] = useState("");

	useEffect(() => {
		// Extract parameters from the URL
		const params = new URLSearchParams(location.search);
		const hotelId = params.get("hotelId");
		window.scrollTo({ top: 8, behavior: "smooth" }); // Scroll to the top for better user experience

		const pickedRooms = [];
		let roomIndex = 1; // To iterate through room parameters in the URL

		// Parse room details from the URL until no more room data is found
		while (
			params.get(`roomType${roomIndex}`) &&
			params.get(`displayName${roomIndex}`)
		) {
			try {
				// Parse and decode the pricing breakdown from the URL (double-decoding)
				const encodedBreakdown = params.get(`pricingBreakdown${roomIndex}`);
				const decodedBreakdown = decodeURIComponent(
					decodeURIComponent(encodedBreakdown || "[]")
				);

				// Parse the JSON string into an object
				const pricingBreakdown = JSON.parse(decodedBreakdown);

				// Check and parse commission rate from the breakdown or fallback to URL parameter
				const commissionRateFromBreakdown =
					pricingBreakdown.length > 0
						? parseFloat(pricingBreakdown[0].commissionRate.trim()) // Ensure proper parsing with trim
						: parseFloat(params.get(`commissionRate${roomIndex}`)) || 1;

				// Add the parsed room details to the pickedRooms array
				pickedRooms.push({
					roomType: params.get(`roomType${roomIndex}`),
					displayName: params.get(`displayName${roomIndex}`),
					count: parseInt(params.get(`roomCount${roomIndex}`), 10) || 1,
					pricePerNight:
						parseFloat(params.get(`pricePerNight${roomIndex}`)) || 0,
					commissionRate: commissionRateFromBreakdown, // Use the corrected commission rate
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
				// Log any errors encountered during parsing
				console.error(
					`Error parsing pricingBreakdown for room ${roomIndex}:`,
					error
				);
			}

			roomIndex++; // Increment to check for the next room in the URL
		}

		// Fetch hotel details if the hotelId exists
		if (hotelId) {
			gettingHotelDetailsById(hotelId).then((data) => {
				if (data) {
					setHotelDetails(data);

					// Enrich room data with additional details from the backend
					const enrichedRooms = pickedRooms.map((room) => {
						const matchingRoom = data.roomCountDetails.find(
							(detail) =>
								detail.roomType === room.roomType &&
								detail.displayName === room.displayName
						);

						if (matchingRoom) {
							// Merge backend data with existing room data
							return {
								...room,
								photos: matchingRoom.photos || [], // Add room photos if available
							};
						} else {
							console.warn(
								`Room details not found for room type: ${room.roomType}`
							);
							return room;
						}
					});

					// Update formData with enriched room data
					setFormData((prevFormData) => ({
						...prevFormData,
						pickedRooms: enrichedRooms,
					}));
				} else {
					message.error("Failed to fetch hotel details."); // Show error message if hotel details couldn't be fetched
				}
			});
		}

		// Update formData with the extracted parameters and parsed room details
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

	// Show the modal if there's a "Not Paid" reservation after buffering
	const handleNotPaidReservation = () => {
		setIsBuffering(true);
		setTimeout(() => {
			setIsBuffering(false); // Stop buffering after 2 seconds
			setVerificationModalVisible(true); // Show modal
		}, 2000);
	};

	// Handle modal close (ok or cancel)
	const handleModalClose = () => {
		history.push("/"); // Redirect to the home page
	};

	// Updated transformPickedRoomsToPickedRoomsType Function
	// eslint-disable-next-line
	const transformPickedRoomsToPickedRoomsType = (pickedRooms, isPayInHotel) => {
		return pickedRooms.flatMap((room) => {
			// Process each room individually
			return Array.from({ length: room.count }, () => {
				// Transform each day's pricing details for the room
				const pricingDetails = room.pricingByDay.map((day) => ({
					date: day.date,
					price: isPayInHotel
						? day.totalPriceWithCommission * 1.1 // Increase by 10% if paying in hotel
						: day.totalPriceWithCommission, // Keep as is otherwise
					rootPrice: Number(day.rootPrice) || 0, // Base price
					commissionRate: Number(day.commissionRate) || 0, // Commission rate
					totalPriceWithCommission: isPayInHotel
						? day.totalPriceWithCommission * 1.1 // Increase by 10% if paying in hotel
						: day.totalPriceWithCommission, // Keep as is otherwise
					totalPriceWithoutCommission: Number(day.price) || 0, // Price without commission
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
					chosenPrice: isPayInHotel
						? Number(averagePriceWithCommission).toFixed(2) // Increase by 10% if paying in hotel
						: Number(averagePriceWithCommission).toFixed(2), // Keep as is otherwise
					count: 1, // Represent each room individually
					pricingByDay: pricingDetails, // Detailed pricing breakdown
					totalPriceWithCommission: pricingDetails.reduce(
						(sum, day) => sum + day.totalPriceWithCommission,
						0
					), // Total price with commission
					hotelShouldGet: pricingDetails.reduce(
						(sum, day) => sum + day.rootPrice,
						0
					), // Total base price for the hotel
				};
			});
		});
	};

	// Computed fields for deposit and average commission rate
	const calculateDepositDetails = (pickedRooms) => {
		if (!pickedRooms || pickedRooms.length === 0) {
			return { averageCommissionRate: 0, depositAmount: 0 };
		}

		const totalWeightedCommissionRate = pickedRooms.reduce((total, room) => {
			const totalRoomCommissionRate = room.pricingByDay.reduce(
				(sum, day) => sum + day.commissionRate, // Accumulate commission rates
				0
			);
			const daysCount = room.pricingByDay.length || 1; // Ensure at least 1 day
			const averageRoomCommissionRate = totalRoomCommissionRate / daysCount; // Average for the room
			return total + averageRoomCommissionRate * room.count; // Weight by room count
		}, 0);

		const totalRooms = pickedRooms.reduce(
			(total, room) => total + room.count,
			0
		); // Total number of rooms

		const averageCommissionRate = totalWeightedCommissionRate / totalRooms; // Average across all rooms

		const depositAmount = pickedRooms.reduce((total, room) => {
			return (
				total +
				room.pricingByDay.reduce(
					(sum, day) =>
						sum +
						day.totalPriceWithCommission * (day.commissionRate / 100 || 0), // Use proper percentage
					0
				) *
					room.count // Multiply by room count
			);
		}, 0);

		return {
			averageCommissionRate: Number(averageCommissionRate).toFixed(2), // Keep as percentage
			depositAmount: Number(depositAmount).toFixed(2), // Total deposit amount
		};
	};

	const { averageCommissionRate, depositAmount } = useMemo(
		() => calculateDepositDetails(formData.pickedRooms),
		[formData.pickedRooms] // Ensure this is the minimal dependency
	);

	const total_price_with_commission =
		formData.totalAmount + formData.totalCommission;

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

		// Step 1: Validate Terms & Conditions acceptance
		if (!guestAgreedOnTermsAndConditions) {
			message.error(
				"You must accept the Terms & Conditions before proceeding."
			);
			return;
		}

		// Step 2: Validate full name (must have first and last name)
		if (!name || name.trim().split(" ").length < 2) {
			message.error("Please provide your full name (first and last name).");
			return;
		}

		// Step 3: Validate phone number (must be at least 6 digits)
		const phoneRegex = /^[0-9]{6,}$/;
		if (!phone || !phoneRegex.test(phone)) {
			message.error("Please provide a valid phone number.");
			return;
		}

		// Step 4: Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email || !emailRegex.test(email)) {
			message.error("Please provide a valid email address.");
			return;
		}

		// Step 5: Validate password (only for non-authenticated users)
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

		// Step 6: Validate passport number
		if (!passport) {
			message.error("Please provide your passport number.");
			return;
		}

		// Step 7: Validate passport expiry date (must be at least 6 months from today)
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

		// Step 8: Prepare payment details (if applicable)
		const paymentDetails = {
			cardNumber,
			cardExpiryDate: expiryDate,
			cardCVV: cvv,
			cardHolderName,
		};

		// Step 9: Transform pickedRooms into the correct format
		const isPayInHotel = selectedPaymentOption === "acceptReserveNowPayInHotel";
		const pickedRoomsType = transformPickedRoomsToPickedRoomsType(
			pickedRooms,
			isPayInHotel
		);

		// Step 10: Determine payment-related fields dynamically based on selectedPaymentOption
		let payment = "Not Paid";
		let commissionPaid = false;
		let commission = 0;
		let paid_amount = 0;
		let adjustedTotalAmount = totalAmount + formData.totalCommission; // Default total amount

		if (selectedPaymentOption === "acceptDeposit") {
			payment = "Deposit Paid";
			commissionPaid = true;
			commission = depositAmount;
			paid_amount = depositAmount;
		} else if (selectedPaymentOption === "acceptPayWholeAmount") {
			payment = "Paid Online";
			commissionPaid = true;
			commission = depositAmount;
			paid_amount = adjustedTotalAmount;
		} else if (selectedPaymentOption === "acceptReserveNowPayInHotel") {
			payment = "Not Paid";
			commissionPaid = false;
			commission = depositAmount; // Same calculation as in PaymentOptions
			adjustedTotalAmount *= 1.1; // Increase total by 10%
			paid_amount = 0; // No payment made upfront
		}

		// Step 11: Construct the reservation data object
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
				postalCode: postalCode ? postalCode : "00000",
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
			total_amount: adjustedTotalAmount, // Adjusted for "Pay in Hotel"
			payment,
			paid_amount,
			commission,
			commissionPaid,
			convertedAmounts,
		};

		try {
			// Step 12: Make the API call to create the reservation

			const response = await createNewReservationClient(reservationData);

			if (selectedPaymentOption === "acceptReserveNowPayInHotel") {
				handleNotPaidReservation(); // Trigger buffering and modal display
			}

			// Handle the "Not Paid" scenario
			if (response?.message === "Verification email sent successfully") {
				if (payment === "Not Paid") {
					message.success(response.message);
					handleNotPaidReservation(); // Trigger Not Paid workflow
					return;
				}
			}

			// Handle successful reservation creation
			if (response?.message === "Reservation created successfully") {
				message.success("Reservation created successfully");

				// Track successful payment events
				ReactGA.event({
					category: "Reservation Paid (GeneratedLink)",
					action: "Reservation Paid (GeneratedLink)",
					label: "Reservation Paid (GeneratedLink)",
				});

				ReactPixel.track("Reservation Paid (GeneratedLink)", {
					action: "Checkout Completed (GeneratedLink)",
					page: "checkout",
				});

				// Step 13: Construct query parameters for redirection
				const queryParams = new URLSearchParams();
				queryParams.append("name", name);
				queryParams.append("total_price", adjustedTotalAmount.toFixed(2));
				queryParams.append("total_rooms", reservationData.total_rooms);

				pickedRooms.forEach((room, index) => {
					queryParams.append(`room_type${index + 1}`, room.roomType);
					queryParams.append(`room_display_name${index + 1}`, room.displayName);
					queryParams.append(
						`price_per_night${index + 1}`,
						Number(room.pricePerNight * room.commissionRate).toFixed(2)
					);
					queryParams.append(`room_count${index + 1}`, room.count);
				});

				// Step 14: Handle automatic sign-in for new users
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
					// Redirect authenticated users to the confirmation page
					window.location.href = `/reservation-confirmed?${queryParams.toString()}`;
				}
			} else {
				// Handle reservation errors
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
					<p>
						{chosenLanguage === "Arabic"
							? "الرجاء الانتظار، يتم التحقق من الحجز..."
							: "Please wait, verifying your reservation..."}
					</p>
				</BufferingWrapper>
			) : (
				<>
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
										(total, day) => total + (day.totalPriceWithCommission || 0),
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
												<p>{formData.numberOfNights} Nights</p>
												<p>
													Dates: {formData.checkInDate?.format("YYYY-MM-DD")} to{" "}
													{formData.checkOutDate?.format("YYYY-MM-DD")}
												</p>
												<h4>
													{Number(pricePerNight).toFixed(2) * (room.count || 1)}{" "}
													SAR per night
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
																room.pricingByDay.map(
																	({ date, totalPriceWithCommission }, i) => (
																		<li key={i}>
																			{dayjs(date).format("YYYY-MM-DD")}:{" "}
																			{Number(totalPriceWithCommission).toFixed(
																				2
																			)}{" "}
																			SAR Per Room
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

							<TotalsWrapper>
								<p>Total Rooms: {formData.pickedRooms.length}</p>
								<p className='total-price'>
									Total Price:{" "}
									{Number(
										formData.totalAmount + formData.totalCommission
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
										onChange={
											(e) => setFormData({ ...formData, phone: e.target.value }) // Corrected to use e.target.value
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
									<label>Phone</label>
									<input
										type='text'
										value={formData.phone}
										onChange={
											(e) => setFormData({ ...formData, phone: e.target.value }) // Corrected to use e.target.value
										}
										readOnly={!!user}
									/>
								</InputGroup>
								{/* <InputGroup>
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
						</InputGroup> */}
								<InputGroup>
									<label>Nationality</label>
									<input type='text' value={formData.nationality} disabled />
								</InputGroup>
							</form>

							<TermsWrapper>
								<Checkbox
									checked={guestAgreedOnTermsAndConditions}
									onChange={(e) => {
										ReactGA.event({
											category: "User Accepted Terms And Cond (Link Generated)",
											action: "User Accepted Terms And Cond (Link Generated)",
											label: `User Accepted Terms And Cond (Link Generated)`,
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
									t={() => ""} // Dummy translation function
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
										pricePerNight={formData.pricePerNight}
										total={formData.totalAmount}
										total_price_with_commission={
											Number(formData.totalAmount) +
											Number(formData.totalCommission)
										}
										convertedAmounts={convertedAmounts}
										depositAmount={Number(formData.totalCommission)}
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

									// Calculate the total price with commission and average price per night
									const totalPriceWithCommission = room.pricingByDay.reduce(
										(total, day) => total + day.totalPriceWithCommission,
										0
									);
									const averagePricePerNight =
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
													{averagePricePerNight.toFixed(2) * (room.count || 1)}{" "}
													SAR per night
												</h4>

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
																			{Number(totalPriceWithCommission).toFixed(
																				2
																			)}{" "}
																			SAR Per Room
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
										formData.totalAmount + formData.totalCommission
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
				title={
					chosenLanguage === "Arabic"
						? "يرجى التحقق من بريدك الإلكتروني"
						: "Please Check Your Email"
				}
				open={verificationModalVisible}
				onOk={handleModalClose}
				onCancel={handleModalClose}
				okText={chosenLanguage === "Arabic" ? "موافق" : "OK"}
				cancelText={chosenLanguage === "Arabic" ? "إلغاء" : "Cancel"}
			>
				<p>
					{chosenLanguage === "Arabic"
						? "يرجى التحقق من بريدك الإلكتروني للتحقق من حجزك. إذا لم تتمكن من العثور على البريد الإلكتروني، يرجى التحقق من صندوق البريد العشوائي أو التواصل مع الدعم."
						: "Please check your email to verify your reservation. If you can't find the email, please check your spam folder or contact support."}
				</p>
			</Modal>
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
