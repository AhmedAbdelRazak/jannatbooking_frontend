import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import { Button, Spin } from "antd";
import { useLocation } from "react-router-dom";
import { getRoomQuery, gettingDistinctRoomTypes } from "../apiCore";
import { Swiper, SwiperSlide } from "swiper/react";
// eslint-disable-next-line
import { Pagination, Autoplay, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/thumbs";
// eslint-disable-next-line
import StarRatings from "react-star-ratings";
import { amenitiesList, viewsList, extraAmenitiesList } from "../Assets";
import Search from "../components/OurHotels/Search";
import { useCartContext } from "../cart_context";
import dayjs from "dayjs";
// eslint-disable-next-line
import { FaCar, FaWalking } from "react-icons/fa";
import SortDropdown from "../components/OurHotels/SortDropdown";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import SearchResults from "../components/OurHotels/SearchResults";
import SearchUpdate from "../components/OurHotels/SearchUpdate";

//Rooms to our hotels
//Sliders shouldn't be auto.
//Search no unavailable rooms.
//No shared rooms to show, it should be a different page.

// Helper to generate date range
const generateDateRange = (startDate, endDate) => {
	const start = dayjs(startDate);
	const end = dayjs(endDate);
	const dateArray = [];

	let currentDate = start;
	while (currentDate < end) {
		// Adjusted to exclude the end date
		dateArray.push(currentDate.format("YYYY-MM-DD"));
		currentDate = currentDate.add(1, "day");
	}

	return dateArray;
};

// Function to get pricing by day
const calculatePricingByDay = (
	pricingRate,
	startDate,
	endDate,
	basePrice,
	defaultCost,
	roomCommission
) => {
	const dateRange = generateDateRange(startDate, endDate);

	return dateRange.map((date) => {
		const rateForDate = pricingRate.find((rate) => rate.calendarDate === date);
		const selectedCommissionRate = rateForDate?.commissionRate
			? rateForDate.commissionRate / 100 // Use commission from pricingRate
			: roomCommission
				? roomCommission / 100 // Use room-specific commission
				: parseFloat(process.env.REACT_APP_COMMISSIONRATE) - 1; // Fallback to default env commission

		return {
			date,
			price: rateForDate
				? parseFloat(rateForDate.price) || 0 // Use `price` if available
				: parseFloat(basePrice || 0), // Fallback to `basePrice`
			rootPrice: rateForDate
				? parseFloat(rateForDate.rootPrice) ||
					parseFloat(defaultCost || basePrice || 0) // Fallback to defaultCost -> basePrice -> 0
				: parseFloat(defaultCost || basePrice || 0),
			commissionRate: selectedCommissionRate, // Add selected commission rate for the date
		};
	});
};

// Helper function to extract query parameters from the URL
const getQueryParams = (search) => {
	const params = new URLSearchParams(search);
	return {
		startDate: params.get("startDate"),
		endDate: params.get("endDate"),
		roomType: params.get("roomType"),
		adults: params.get("adults"),
		children: params.get("children"),
		destination: params.get("destination"), // Add destination parameter
	};
};

// Function to calculate the average price over the selected date range
const calculateAveragePrice = (pricingRate, startDate, endDate) => {
	const start = new Date(startDate);
	const end = new Date(endDate);
	const ratesInRange = pricingRate.filter(({ calendarDate }) => {
		const date = new Date(calendarDate);
		return date >= start && date <= end;
	});
	const total = ratesInRange.reduce(
		(sum, { price }) => sum + parseFloat(price),
		0
	);
	return ratesInRange.length ? (total / ratesInRange.length).toFixed(2) : null;
};

// Helper function to get icons for amenities, views, and extra amenities
const getIcon = (item) => {
	const amenity = amenitiesList.find((amenity) => amenity.name === item);
	if (amenity) return amenity.icon;

	const view = viewsList.find((view) => view.name === item);
	if (view) return view.icon;

	const extraAmenity = extraAmenitiesList.find(
		(extraAmenity) => extraAmenity.name === item
	);
	if (extraAmenity) return extraAmenity.icon;

	return null;
};

// Helper function to format the address
// eslint-disable-next-line
const formatAddress = (address) => {
	const addressParts = address.split(",");
	return addressParts.slice(1).join(", ").trim().toUpperCase();
};

// Function to calculate the total price for the stay
// eslint-disable-next-line
const calculateTotalPrice = (averagePrice, startDate, endDate) => {
	if (!averagePrice || !startDate || !endDate) {
		console.error("Missing data for calculating total price", {
			averagePrice,
			startDate,
			endDate,
		});
		return null;
	}

	const nights = dayjs(endDate).diff(dayjs(startDate), "day");

	if (nights <= 0) {
		console.error("Invalid date range for calculating total price", {
			startDate,
			endDate,
			nights,
		});
		return null;
	}

	return (averagePrice * nights).toFixed(2);
};

const translations = {
	English: {
		loadingMessage: "Loading room data...",
		noDataFound: "No data found.",
		hotelRating: "Hotel Rating:",
		perNight: "/ NIGHT",
		totalNights: "Total",
		nights: "nights",
		addToReservation: "Add to Reservation",
		notAvailable: "Not Available",
		receptionChat: "Reception Chat",
		available: "Available",
		drivingToHaram: "Driving to El Haram",
		drivingToProphetMosque: "Driving to the Mosque",
		showMore: "Show more...",
		showLess: "Show less...",
		pricePerNight: "/ NIGHT",
		SAR: "SAR",
		USD: "USD",
		EUR: "EUR",
	},
	Arabic: {
		loadingMessage: "جاري تحميل بيانات الغرف...",
		noDataFound: "لا توجد بيانات.",
		hotelRating: "تقييم الفندق:",
		perNight: "/ الليلة",
		totalNights: "المجموع",
		nights: "ليالٍ",
		addToReservation: "إضافة إلى الحجز",
		notAvailable: "غير متوفر",
		receptionChat: "تحدث مع الاستقبال",
		available: "متاح",
		drivingToHaram: "بالسيارة إلى الحرم",
		drivingToProphetMosque: "الى المسجد النبوي الشريف",
		showMore: "عرض المزيد...",
		showLess: "عرض أقل...",
		pricePerNight: "/ ليلة",
		SAR: "ريال",
		USD: "دولار",
		EUR: "يورو",
	},
};

const OurHotelRooms2 = () => {
	const { chosenLanguage, addRoomToCart, openSidebar2 } = useCartContext();

	const [loading, setLoading] = useState(true);
	const [roomData, setRoomData] = useState(null);
	const [distinctRoomTypes, setDistinctRoomTypes] = useState([]);
	// eslint-disable-next-line
	const [showAllAmenities, setShowAllAmenities] = useState(false);
	const [showAmenitiesState, setShowAmenitiesState] = useState({}); // State to track showAllAmenities per room
	const [sortOption, setSortOption] = useState(null);
	const [currency, setCurrency] = useState("sar");

	const location = useLocation();
	const queryParams = getQueryParams(location.search);

	// Fetch currency from localStorage
	const storedCurrency = localStorage.getItem("selectedCurrency");

	// Set the currency state
	useEffect(() => {
		setCurrency(storedCurrency || "sar"); // Default to "sar" if no currency is selected
	}, [storedCurrency]);

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth > 768) {
				setShowAllAmenities(true); // For larger screens
			} else {
				setShowAllAmenities(false); // For smaller screens
			}
		};

		// Run on initial load
		handleResize();

		// Listen to resize events
		window.addEventListener("resize", handleResize);

		// Cleanup listener on component unmount
		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	const roomTypesMapping = useMemo(
		() => [
			{ value: "standardRooms", label: "Standard Rooms" },
			{ value: "singleRooms", label: "Single Rooms" },
			{ value: "doubleRooms", label: "Double Rooms" },
			{ value: "twinRooms", label: "Twin Rooms" },
			{ value: "queenRooms", label: "Queen Rooms" },
			{ value: "kingRooms", label: "King Rooms" },
			{ value: "tripleRooms", label: "Triple Rooms" },
			{ value: "quadRooms", label: "Quad Rooms" },
			{ value: "studioRooms", label: "Studio Rooms" },
			{ value: "suite", label: "Suite" },
			{ value: "masterSuite", label: "Master Suite" },
			{ value: "familyRooms", label: "Family Rooms" },
			{ value: "individualBed", label: "Rooms With Individual Beds" },
		],
		[]
	);

	useEffect(() => {
		window.scrollTo({ top: 30, behavior: "smooth" });
		const fetchRoomData = async () => {
			const query = [
				encodeURIComponent(queryParams.startDate),
				encodeURIComponent(queryParams.endDate),
				encodeURIComponent(queryParams.roomType),
				encodeURIComponent(queryParams.adults),
				encodeURIComponent(queryParams.children || ""),
				encodeURIComponent(queryParams.destination || ""),
			]
				.join("_")
				.replace(/_+$/, "");

			console.log("Encoded query being sent:", query);

			try {
				const data = await getRoomQuery(query);
				setRoomData(Array.isArray(data) ? data : []); // Ensure roomData is always an array
			} catch (error) {
				console.error("Error fetching room data", error);
			} finally {
				setLoading(false);
			}
		};

		fetchRoomData();
	}, [
		location.search,
		queryParams.startDate,
		queryParams.endDate,
		queryParams.roomType,
		queryParams.adults,
		queryParams.children,
		queryParams.destination,
	]);

	useEffect(() => {
		const gettingDistinctRooms = () => {
			gettingDistinctRoomTypes().then((data3) => {
				if (!data3.error) {
					const distinctRoomTypesArray = [
						...new Set(
							data3.map((room) => {
								const mapping = roomTypesMapping.find(
									(map) => map.value === room.roomType
								);
								return mapping ? mapping.label : room.roomType;
							})
						),
					];
					setDistinctRoomTypes(distinctRoomTypesArray);
				}
			});
		};

		gettingDistinctRooms();
	}, [roomTypesMapping]);

	// Function to toggle showAllAmenities for a specific room
	const toggleShowAmenities = (roomId) => {
		setShowAmenitiesState((prevState) => ({
			...prevState,
			[roomId]: !prevState[roomId], // Toggle the state for the specific room ID
		}));
	};

	const sortedAndConvertedRooms = useMemo(() => {
		if (!roomData) return [];

		const convertCurrency = (price) => {
			const rates = JSON.parse(localStorage.getItem("rates")) || {
				SAR_USD: 0.27,
				SAR_EUR: 0.25,
			};
			if (currency === "usd") return (price * rates.SAR_USD).toFixed(2);
			if (currency === "eur") return (price * rates.SAR_EUR).toFixed(2);
			return price.toFixed(2); // Default to SAR
		};

		const calculateRoomPrice = (room) => {
			const { pricingRate, price } = room;
			const averagePrice = calculateAveragePrice(
				pricingRate,
				queryParams.startDate,
				queryParams.endDate
			);
			const displayedPrice = averagePrice || price.basePrice || 0;
			return parseFloat(displayedPrice);
		};

		const parseDistance = (distance) => {
			if (!distance) return Infinity;
			const match = distance.match(/(\d+)/);
			return match ? parseInt(match[0], 10) : Infinity;
		};

		// Map hotels and calculate the lowest price for sorting
		const hotelsWithMinPrice = roomData.map((hotel) => {
			const roomPrices = hotel.roomCountDetails.map((room) =>
				calculateRoomPrice(room)
			);
			const minRoomPrice = Math.min(...roomPrices);

			// Add the minimum room price to the hotel object for sorting
			return {
				...hotel,
				minRoomPrice,
				roomCountDetails: hotel.roomCountDetails.map((room) => ({
					...room,
					rawPrice: calculateRoomPrice(room),
					convertedPrice: convertCurrency(calculateRoomPrice(room)), // For display
				})),
			};
		});

		// Sort hotels based on the lowest room price or distance
		const sortedHotels = hotelsWithMinPrice.sort((a, b) => {
			if (sortOption === "closest") {
				const distanceA = parseDistance(a.distances?.drivingToElHaram);
				const distanceB = parseDistance(b.distances?.drivingToElHaram);
				return distanceA - distanceB;
			}
			if (sortOption === "price") {
				return a.minRoomPrice - b.minRoomPrice;
			}
			return 0;
		});

		return sortedHotels;
	}, [roomData, sortOption, currency, queryParams]);

	const t = translations[chosenLanguage] || translations.English;

	return (
		<OurHotelRooms2Wrapper isArabic={chosenLanguage === "Arabic"}>
			{loading ? (
				<LoadingOverlay>
					<Spin size='large' tip={t.loadingMessage} />
				</LoadingOverlay>
			) : roomData ? (
				<RoomListWrapper>
					<SearchSection>
						{distinctRoomTypes && (
							<div className='mobile-search'>
								<SearchUpdate
									distinctRoomTypes={distinctRoomTypes}
									roomTypesMapping={roomTypesMapping}
									initialSearchParams={{
										dates: [
											dayjs(queryParams.startDate, "YYYY-MM-DD"),
											dayjs(queryParams.endDate, "YYYY-MM-DD"),
										],
										destination: queryParams.destination || "", // Include destination
										roomType: queryParams.roomType || "",
										adults: queryParams.adults || "",
										children: queryParams.children || "",
									}}
								/>
							</div>
						)}

						{distinctRoomTypes && (
							<div className='desktop-search'>
								<Search
									distinctRoomTypes={distinctRoomTypes}
									roomTypesMapping={roomTypesMapping}
									initialSearchParams={{
										dates: [
											dayjs(queryParams.startDate, "YYYY-MM-DD"),
											dayjs(queryParams.endDate, "YYYY-MM-DD"),
										],
										destination: queryParams.destination || "", // Include destination
										roomType: queryParams.roomType || "",
										adults: queryParams.adults || "",
										children: queryParams.children || "",
									}}
								/>
							</div>
						)}
					</SearchSection>

					<SearchResults
						initialSearchParams={{
							dates: [
								dayjs(queryParams.startDate, "YYYY-MM-DD"),
								dayjs(queryParams.endDate, "YYYY-MM-DD"),
							],
							destination: queryParams.destination || "", // Include destination
							roomType: queryParams.roomType || "",
							adults: queryParams.adults || "",
							children: queryParams.children || "",
						}}
					/>
					<SortDropdownSection>
						<SortDropdown
							sortOption={sortOption}
							setSortOption={setSortOption}
							currency={currency}
							setCurrency={setCurrency}
						/>
					</SortDropdownSection>

					{sortedAndConvertedRooms &&
						sortedAndConvertedRooms.flatMap((hotel) =>
							hotel.roomCountDetails.map((room) => (
								<RoomCard
									key={room._id}
									room={room}
									hotel={hotel}
									hotelName={hotel.hotelName}
									hotelName_OtherLanguage={hotel.hotelName_OtherLanguage}
									hotelRating={hotel.hotelRating}
									hotelAddress={hotel.hotelAddress}
									distanceToElHaramWalking={
										hotel.distances?.walkingToElHaram || "N/A"
									}
									distanceToElHaramDriving={
										hotel.distances?.drivingToElHaram || "N/A"
									}
									startDate={queryParams.startDate}
									endDate={queryParams.endDate}
									chosenLanguage={chosenLanguage}
									addRoomToCart={addRoomToCart}
									openSidebar2={openSidebar2}
									hotelId={hotel._id}
									belongsTo={hotel.belongsTo}
									priceRating={[]}
									roomColor={room.roomColor}
									adults={queryParams.adults}
									children={queryParams.children}
									setShowAllAmenities={setShowAllAmenities}
									showAllAmenities={!!showAmenitiesState[room._id]} // Pass room-specific state
									toggleShowAmenities={() => toggleShowAmenities(room._id)} // Pass toggle handler
									currency={currency}
									rates={
										JSON.parse(localStorage.getItem("rates")) || {
											SAR_USD: 0.27,
											SAR_EUR: 0.25,
										}
									}
									t={t}
								/>
							))
						)}
				</RoomListWrapper>
			) : (
				<div>No data found.</div>
			)}
		</OurHotelRooms2Wrapper>
	);
};

// Component for rendering each room card
// eslint-disable-next-line
const RoomCard = ({
	room,
	hotelName,
	hotelName_OtherLanguage,
	hotelRating,
	hotelAddress,
	startDate,
	endDate,
	chosenLanguage,
	addRoomToCart,
	openSidebar2,
	hotelId,
	belongsTo,
	roomColor,
	adults,
	children,
	hotel,
	setShowAllAmenities,
	distanceToElHaramWalking,
	distanceToElHaramDriving,
	showAllAmenities, // Room-specific state
	toggleShowAmenities, // Handler to toggle state
	currency, // New prop for currency
	rates, // New prop for conversion rates
	t,
}) => {
	// eslint-disable-next-line
	const [thumbsSwiper, setThumbsSwiper] = useState(null);

	// Calculate commission rate
	const roomCommission =
		room.roomCommission ||
		hotel.commission ||
		(parseFloat(process.env.REACT_APP_COMMISSIONRATE) - 1) * 100 ||
		10; // Default to 20% commission
	const commissionRate = roomCommission / 100; // Convert to decimal

	const pricingByDay = calculatePricingByDay(
		room.pricingRate || [],
		startDate,
		endDate,
		room.price.basePrice,
		room.defaultCost,
		commissionRate * 100
	);

	const totalPriceWithCommission = pricingByDay.reduce(
		(total, day) => total + (day.price + day.rootPrice * day.commissionRate),
		0
	);

	const nights = pricingByDay.length;

	const pricePerNightWithCommission =
		nights > 0 ? totalPriceWithCommission / nights : 0;

	// Currency Conversion
	// Convert prices based on selected currency
	const calculateConvertedPrice = (price) => {
		if (currency === "usd") return (price * rates.SAR_USD).toFixed(0);
		if (currency === "eur") return (price * rates.SAR_EUR).toFixed(0);
		return Number(price).toFixed(0); // Default to SAR
	};

	const convertedPricePerNight = calculateConvertedPrice(
		pricePerNightWithCommission
	);
	const convertedTotalPrice = calculateConvertedPrice(totalPriceWithCommission);

	// Check if the room is available
	const isRoomAvailable = !pricingByDay.some((day) => day.price <= 0);

	const handleAddToCart = () => {
		addRoomToCart(
			room._id,
			{
				id: room._id,
				name: room.displayName,
				nameOtherLanguage: room.displayName_OtherLanguage
					? room.displayName_OtherLanguage
					: room.displayName,
				roomType: room.roomType,
				price: pricePerNightWithCommission.toFixed(2),
				defaultCost: room.defaultCost || room.price.basePrice,
				photos: room.photos,
				hotelName,
				hotelAddress,
				commissionRate,
			},
			startDate,
			endDate,
			hotelId,
			belongsTo,
			pricingByDay,
			roomColor,
			adults,
			children,
			commissionRate
		);
		openSidebar2();
	};

	const handleChatClick = () => {
		const hotelNameSlug = hotelName.replace(/\s+/g, "-").toLowerCase();

		ReactGA.event({
			category: "Chat Window Opened From Room Card",
			action: "Chat Window Opened From Room Card",
			label: `Chat Window Opened From Room Card`,
		});

		ReactPixel.track("Chat Window Opened_RoomPage", {
			action: "User Opened Chat Window From Room Card",
			page: "Rooms Page",
		});

		const params = new URLSearchParams(window.location.search);
		params.set("hotelNameSlug", hotelNameSlug);
		const newUrl = `${window.location.pathname}?${params.toString()}`;
		window.history.pushState({}, "", newUrl);

		const searchChangeEvent = new CustomEvent("searchChange");
		window.dispatchEvent(searchChangeEvent);
	};

	const combinedFeatures = [
		...room.amenities,
		...room.views,
		...room.extraAmenities,
	];
	const uniqueFeatures = [...new Set(combinedFeatures)];
	const visibleFeatures = showAllAmenities
		? uniqueFeatures
		: uniqueFeatures.slice(0, 2);

	// console.log(room, "roomroomroomroom");

	return (
		<>
			{!isRoomAvailable ||
			room.roomType === "individualBed" ||
			room.roomType === "individualBeds" ? null : (
				<>
					<RoomCardWrapper>
						<RoomImageWrapper>
							<Swiper
								modules={[Pagination, Thumbs]}
								spaceBetween={10}
								slidesPerView={1}
								pagination={{ clickable: true }}
								autoplay={{ delay: 4000, disableOnInteraction: false }}
								thumbs={{ swiper: thumbsSwiper }}
								loop={true}
								className='main-swiper'
							>
								{room.photos.map((photo, idx) => (
									<SwiperSlide
										key={idx}
										onClick={() => {
											ReactGA.event({
												category: "User Navigated To A Hotel From Rooms Page",
												action: "User Navigated To A Hotel From Rooms Page",
												label: `User Navigated To A Hotel From Rooms Page`,
											});

											ReactPixel.track("Single Hotel From Rooms Page", {
												action:
													"User Navigated to Single Hotel From Rooms Page",
												page: "Rooms Page",
											});

											window.location.href = `/single-hotel/${hotelName
												.replace(/\s+/g, "-")
												.toLowerCase()}`;
										}}
									>
										<img
											src={photo.url}
											alt={room.displayName}
											className='room-image'
										/>
									</SwiperSlide>
								))}
							</Swiper>
						</RoomImageWrapper>

						<RoomDetails>
							<HotelName
								dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
								style={{
									textAlign: chosenLanguage === "Arabic" ? "center" : "",
								}}
							>
								{chosenLanguage === "Arabic" && hotelName_OtherLanguage
									? hotelName_OtherLanguage
									: hotelName}
							</HotelName>
							<RoomDisplayName
								dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
							>
								{chosenLanguage === "Arabic"
									? room.displayName_OtherLanguage || room.displayName
									: room.displayName}
							</RoomDisplayName>
							<div
								style={{ display: "flex", alignItems: "center", gap: "5px" }}
							>
								<span
									style={{
										fontSize: "11px",
										fontWeight: "bold",
										color: "#555",
									}}
								>
									Hotel Rating:
								</span>
								<StarRatings
									rating={hotelRating || 0}
									starRatedColor='orange'
									numberOfStars={5}
									name='rating'
									starDimension='15px'
									starSpacing='1px'
								/>
							</div>
							<PriceWrapper
								isArabic={chosenLanguage === "Arabic"}
								dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
								style={{
									textAlign: chosenLanguage === "Arabic" ? "right" : "",
								}}
							>
								{/* Add the discounted price for display purposes */}
								<span
									style={{
										fontWeight: "bold",
										fontSize: "0.9rem",
										color: "red",
									}}
								>
									<s>
										{" "}
										{(convertedPricePerNight * 1.1).toFixed(0)}{" "}
										{currency && t[currency.toUpperCase()]}{" "}
									</s>
								</span>{" "}
								<span
									style={{
										fontWeight: "bolder",
										fontSize: "1.1rem",
										color: "black",
									}}
								>
									{convertedPricePerNight}{" "}
									{currency && t[currency.toUpperCase()]}{" "}
								</span>
								<span style={{ fontSize: "0.7rem", color: "black" }}>
									{t.pricePerNight}
								</span>
								{nights > 0 && (
									<div
										style={{
											fontSize: "0.7rem",
											color: "var(--darkGrey)",
											fontWeight: "bold",
										}}
									>
										{/* Check the chosenLanguage and render the text accordingly */}
										{chosenLanguage === "Arabic" ? (
											<>
												{t.totalNights} {nights} {t.nights}:{" "}
												<strong>
													{convertedTotalPrice} {t[currency.toUpperCase()]}
												</strong>
											</>
										) : (
											<>
												{t.totalNights} {nights} {t.nights}:{" "}
												<strong>
													{t[currency.toUpperCase()]} {convertedTotalPrice}
												</strong>
											</>
										)}
									</div>
								)}
							</PriceWrapper>
							<AmenitiesWrapper className='p-0 m-0'>
								{visibleFeatures.map((feature, index) => (
									<AmenityItem key={index}>
										{getIcon(feature)} <span>{feature}</span>
									</AmenityItem>
								))}
							</AmenitiesWrapper>
							{uniqueFeatures.length > 4 && (
								<ShowMoreText onClick={toggleShowAmenities}>
									{showAllAmenities ? "Show less..." : "Show more..."}
								</ShowMoreText>
							)}
							<Distances
								className='mt-1'
								dir={chosenLanguage === "Arabic" ? "rtl" : ""}
							>
								<FaCar />
								{hotel.hotelState?.toLowerCase().includes("madinah") ? (
									<>
										{distanceToElHaramDriving
											? `${distanceToElHaramDriving.replace(
													"Mins",
													chosenLanguage === "Arabic" ? "دقائق" : "Mins"
												)} ${t.drivingToProphetMosque}`
											: `N/A ${t.drivingToProphetMosque}`}
									</>
								) : (
									<>
										{distanceToElHaramDriving
											? `${distanceToElHaramDriving.replace(
													"Mins",
													chosenLanguage === "Arabic" ? "دقائق" : "Mins"
												)} ${t.drivingToHaram}`
											: `N/A ${t.drivingToHaram}`}
									</>
								)}
							</Distances>
						</RoomDetails>
						<div className='habal'></div>

						<div
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
							}}
							onClick={() => {
								ReactGA.event({
									category: "User Added To The Cart From Rooms Page",
									action: "User Added To The Cart From Rooms Page",
									label: `User Added To The Cart From Rooms Page`,
								});
							}}
						>
							<StyledButton
								isArabic={chosenLanguage === "Arabic"}
								className='mb-2 mt-1'
								disabled={!isRoomAvailable}
								style={{
									backgroundColor: !isRoomAvailable
										? "#ccc"
										: "var(--primaryBlue)",
									cursor: !isRoomAvailable ? "not-allowed" : "pointer",
								}}
								onClick={isRoomAvailable ? handleAddToCart : null}
							>
								{chosenLanguage === "Arabic"
									? t.addToReservation
									: t.addToReservation}
							</StyledButton>
							{!isRoomAvailable && (
								<UnavailableBadge>Not Available</UnavailableBadge>
							)}
						</div>
						<div>
							<ReceptionChat
								className='float-right mr-2'
								onClick={handleChatClick}
							>
								Reception Chat
								<div className='row'>
									<div className='col-3'></div>
									<div className='col-9'>
										<span style={{ fontSize: "8px", marginLeft: "10px" }}>
											<span
												className='mx-1'
												style={{
													backgroundColor: "#00ff00",
													padding: "0px 5px",
													borderRadius: "50%",
													animation: "blink 2.5s infinite",
												}}
											></span>{" "}
											Available
										</span>
									</div>
								</div>
							</ReceptionChat>
						</div>
					</RoomCardWrapper>
				</>
			)}
		</>
	);
};

export default OurHotelRooms2;

// Styled-components for the component
const OurHotelRooms2Wrapper = styled.div`
	width: 100%;
	padding: 220px 250px;
	background-color: #f9f9f9;
	min-height: 700px;

	div,
	p,
	span,
	section,
	small,
	input,
	button,
	li,
	ul {
		font-family: ${({ isArabic }) =>
			isArabic ? `"Droid Arabic Kufi", sans-serif` : ""};
	}

	@media (max-width: 1000px) {
		padding: 100px 0px;

		.habal {
			display: none;
		}
	}
`;

const LoadingOverlay = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	justify-content: center;
	align-items: center;
	background: rgba(240, 240, 240, 0.7);
	z-index: 10;
`;

const SearchSection = styled.div`
	width: 100%;

	@media (min-width: 1001px) {
		width: 100%;
		margin-bottom: 50px;
		.desktop-search {
			display: block;
		}
		.mobile-search {
			display: none;
		}
	}

	@media (max-width: 1000px) {
		margin-top: 0px;
		margin-bottom: 120px;
		padding: 0px !important;

		.mobile-search {
			display: block;
		}

		.desktop-search {
			display: none;
		}
	}
`;

const SortDropdownSection = styled.div`
	width: 100%;
	text-align: right;

	@media (max-width: 768px) {
		text-align: left;
		margin-top: -60px;
		margin-bottom: -10px;
	}
`;

const RoomListWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 20px;
	background-color: var(--neutral-light);
`;

const RoomCardWrapper = styled.div`
	display: grid;
	grid-template-columns: 35% 45% 20%; /* Desktop layout */
	background-color: var(--mainWhite);
	border: 1px solid var(--border-color-light);
	border-radius: 10px;
	box-shadow: var(--box-shadow-light);
	padding: 20px;
	transition: var(--main-transition);

	&:hover {
		box-shadow: var(--box-shadow-dark);
	}

	@media (max-width: 768px) {
		grid-template-columns: 40% 60%; /* Image takes 35%, content takes 65% */
		display: grid;
		gap: 0px;
		padding: 0px;
	}
`;

const RoomImageWrapper = styled.div`
	position: relative;

	.room-image {
		width: 100%;
		height: 300px;
		object-fit: cover;
		border-radius: 10px;
		cursor: pointer;
		transition: opacity 0.3s ease; /* Smooth transition for opacity */
		opacity: 1; /* Ensure the main image is fully visible */
	}

	.thumbnail-swiper {
		margin-top: 2px; /* Reduced margin to ensure smaller gaps */
	}

	.swiper-slide {
		opacity: 0.6; /* Thumbnails are semi-transparent */
		margin: 2px; /* Reduced margin to 2 pixels */
	}

	.swiper-slide-thumb-active {
		opacity: 1; /* Active thumbnail is fully opaque */
		border: 2px solid var(--primary-color);
		border-radius: 5px;
	}

	.main-swiper {
		.swiper-slide {
			opacity: 1; /* Ensure that the main Swiper images are not faded */
		}
	}

	@media (max-width: 768px) {
		.room-image {
			height: 200px; /* Adjust image height for mobile */
		}
	}
`;

// eslint-disable-next-line
const ThumbnailImage = styled.img`
	width: 100%;
	height: 40px;
	object-fit: cover;
	border-radius: 5px;

	@media (max-width: 700px) {
		display: none;
	}
`;

const RoomDetails = styled.div`
	padding: 15px;
	display: flex;
	flex-direction: column;
`;

const RoomDisplayName = styled.h3`
	font-size: 1.25rem;
	color: #333;
	margin-bottom: 5px;
	text-transform: capitalize;
	margin-top: 5px;

	@media (max-width: 750px) {
		font-size: 0.8rem;
		/* font-weight: bold; */
		margin-bottom: 0px;
		white-space: nowrap; /* Prevent wrapping */
		overflow: hidden; /* Hide overflowing text */
		text-overflow: ellipsis; /* Add ellipses (...) to truncated text */
	}
`;

const HotelName = styled.p`
	font-size: 1rem;
	color: #555;
	margin-bottom: 5px;
	text-transform: capitalize;
	font-weight: bold;

	@media (max-width: 700px) {
		font-size: 1.1rem;
		margin-bottom: 0px;
		line-height: 1.4;
	}
`;

const Distances = styled.div`
	font-size: 1rem;
	color: #006ed9;
	margin-bottom: 2px;
	text-transform: capitalize;
	font-weight: bold;

	@media (max-width: 700px) {
		font-size: 0.85rem;
		margin-bottom: 0px;
		font-weight: normal;

		span {
			display: none;
		}
	}
`;

// eslint-disable-next-line
const Location = styled.p`
	font-size: 0.9rem;
	color: #888;
	margin-bottom: 10px;
	text-transform: capitalize;

	@media (max-width: 700px) {
		font-size: 0.7rem;
		margin-bottom: 0px;
	}
`;

const PriceWrapper = styled.p`
	font-size: 1rem;
	font-weight: bold;
	color: #444;
	margin-top: 10px;

	span {
		font-weight: bold;
		color: #1e90ff;
	}

	@media (max-width: 800px) {
		margin: 0px;
		padding: 0px;
	}
`;

const AmenitiesWrapper = styled.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	grid-gap: 10px;
	margin-top: 15px;

	@media (max-width: 768px) {
		grid-template-columns: repeat(2, 1fr);
		margin-top: 0px !important;
	}
`;

const AmenityItem = styled.div`
	display: flex;
	align-items: center;
	font-size: 12px;
	color: #666;

	span {
		margin-left: 5px;
		font-size: 9px;
		font-weight: bold;
	}
`;

const ShowMoreText = styled.span`
	color: var(--primaryBlue);
	cursor: pointer;
	font-weight: bold;
	text-decoration: underline;
	display: inline-block;
	font-size: 13px;

	&:hover {
		color: var(--primaryBlueDarker);
	}

	@media (max-width: 800px) {
		font-size: 11px;
	}
`;

const StyledButton = styled(Button)`
	width: 100%;
	margin: 0 auto;
	background-color: var(--button-bg-primary);
	color: var(--button-font-color);
	border: 1px solid var(--primary-color);
	padding: 0.5rem 1rem; /* Adjusted padding for better vertical centering */
	font-size: 1rem;
	text-transform: uppercase;
	transition: var(--main-transition);
	box-shadow: var(--box-shadow-light);
	display: flex;
	align-items: center;
	justify-content: center; /* Ensures the text is centered horizontally and vertically */

	&:hover {
		background-color: var(--primary-color-light);
		border-color: var(--primary-color-lighter);
		color: var(--button-font-color);
		box-shadow: var(--box-shadow-dark);
	}

	&:focus {
		background-color: var(--primary-color-darker);
		border-color: var(--primary-color-dark);
		box-shadow: var(--box-shadow-dark);
	}

	&:active {
		background-color: var(--primary-color);
		border-color: var(--primary-color-darker);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	@media (max-width: 800px) {
		font-size: ${({ isArabic }) => (isArabic ? "0.75rem" : "0.57rem")};
		font-weight: bolder;
		width: 90% !important;
		text-transform: capitalize;
		padding: 1.15rem 1rem; /* Adjusted padding for better vertical centering */
	}
`;

const ReceptionChat = styled.div`
	background-color: darkorange;
	padding: 3px 7px;
	border-radius: 5px;
	font-size: 11px;
	font-weight: bold;
	color: white;
	align-items: center;
	margin-top: -5px !important;
	cursor: pointer;

	@media (max-width: 800px) {
		width: 60% !important;
		margin-top: 4px !important;
	}
`;

// Unavailable Badge
const UnavailableBadge = styled.div`
	margin-top: 0.5rem; /* Space below the button */
	padding: 0.3rem 0.8rem;
	border-radius: 0.25rem;
	background-color: var(--accent-color-1); /* Light orange */
	color: var(--secondary-color-dark); /* Darker text */
	font-size: 0.85rem;
	font-weight: bold;
	text-align: center;
	box-shadow: var(--box-shadow-light); /* Light shadow */
	transition: var(--main-transition); /* Smooth transitions */
`;
