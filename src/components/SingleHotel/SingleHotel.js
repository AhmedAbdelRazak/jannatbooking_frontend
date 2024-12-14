import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import StarRatings from "react-star-ratings";
import { amenitiesList, extraAmenitiesList, viewsList } from "../../Assets";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useCartContext } from "../../cart_context";
import { DatePicker, Button } from "antd";
import Tabs from "./Tabs";
import dayjs from "dayjs";
import StaticRating from "./StaticRating";
import { FaCar, FaWalking } from "react-icons/fa";

const { RangePicker } = DatePicker;

// Helper function to find the matching icon for each amenity
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
const calculatePricingByDay = (pricingRate, startDate, endDate, basePrice) => {
	const dateRange = generateDateRange(startDate, endDate);

	return dateRange.map((date) => {
		const rateForDate = pricingRate.find((rate) => rate.calendarDate === date);
		return {
			date,
			price: rateForDate
				? parseFloat(rateForDate.price)
				: parseFloat(basePrice), // Fallback to base price
		};
	});
};

// Main SingleHotel component
const SingleHotel = ({ selectedHotel }) => {
	// eslint-disable-next-line
	const [thumbsSwiper, setThumbsSwiper] = useState(null);
	// eslint-disable-next-line
	const [roomThumbsSwipers, setRoomThumbsSwipers] = useState([]);
	const [dateRange, setDateRange] = useState([
		dayjs().add(1, "day"),
		dayjs().add(6, "day"),
	]);

	const [showAllAmenities, setShowAllAmenities] = useState(false);
	const [showAllAmenities2, setShowAllAmenities2] = useState(false);
	const [showFullDescription, setShowFullDescription] = useState(false);

	const [selectedCurrency, setSelectedCurrency] = useState("SAR");
	const [currencyRates, setCurrencyRates] = useState({});

	useEffect(() => {
		const currency = localStorage.getItem("selectedCurrency") || "SAR";
		const rates = JSON.parse(localStorage.getItem("rates")) || {
			SAR_USD: 0.27,
			SAR_EUR: 0.25,
		};

		setSelectedCurrency(currency);
		setCurrencyRates(rates);
	}, []);

	const handleAmenitiesToggle = () => {
		setShowAllAmenities((prev) => !prev);
	};

	// Combine all amenities into one list
	const combinedFeatures = [
		...new Set([
			...selectedHotel.roomCountDetails.flatMap((room) => room.amenities),
			...selectedHotel.roomCountDetails.flatMap((room) => room.views),
			...selectedHotel.roomCountDetails.flatMap((room) => room.extraAmenities),
		]),
	];

	const visibleFeatures = showAllAmenities
		? combinedFeatures
		: combinedFeatures.slice(0, 4);

	const { addRoomToCart, openSidebar2, chosenLanguage } = useCartContext();
	const tabRefs = useRef({});

	// Section references for tabs
	const overviewRef = useRef(null);
	const aboutRef = useRef(null);
	const roomsRef = useRef(null);
	const policiesRef = useRef(null);
	const comparisonsRef = useRef(null);

	// Sections data to pass to the Tabs component
	const sections = [
		{ id: "overview", label: "Overview", ref: overviewRef },
		{ id: "about", label: "About", ref: aboutRef },
		{ id: "rooms", label: "Rooms", ref: roomsRef },
		{ id: "policies", label: "Policies", ref: policiesRef },
		{ id: "comparisons", label: "Comparisons", ref: comparisonsRef },
	];

	// Assign refs to tabRefs in Tabs component
	useEffect(() => {
		sections.forEach((section) => {
			tabRefs.current[section.id] = section.ref.current;
		});
		// eslint-disable-next-line
	}, []);

	const handleDateChange = (dates) => {
		if (dates && dates.length === 2) {
			setDateRange(dates);
		} else {
			setDateRange([dayjs().add(1, "day"), dayjs().add(6, "day")]);
		}
	};

	if (!selectedHotel) return null;

	const formatAddress = (address) => {
		const addressParts = address.split(",");
		return addressParts.slice(1).join(", ").trim();
	};

	// eslint-disable-next-line
	const handleRoomThumbsSwiper = (index) => (swiper) => {
		setRoomThumbsSwipers((prev) => {
			const newSwipers = [...prev];
			newSwipers[index] = swiper;
			return newSwipers;
		});
	};

	// Add to Cart functionality
	const handleAddRoomToCart = (room) => {
		const startDate = dateRange[0].format("YYYY-MM-DD");
		const endDate = dateRange[1].format("YYYY-MM-DD");

		// Calculate pricing by day
		const pricingByDay = calculatePricingByDay(
			room.pricingRate,
			startDate,
			endDate,
			room.price.basePrice
		);

		// Calculate the total price and number of nights
		const totalPrice = pricingByDay.reduce(
			(total, day) => total + day.price,
			0
		);
		const numberOfNights = pricingByDay.length;

		// Determine commission rate
		const roomCommission =
			room.roomCommission ||
			selectedHotel.commission ||
			(Number(process.env.REACT_APP_COMMISSIONRATE) - 1) * 100;

		const commissionRate = roomCommission / 100; // Convert to decimal

		// Calculate the average price per night
		const averagePrice = numberOfNights
			? (totalPrice / numberOfNights).toFixed(2)
			: room.price.basePrice;

		// Room details structure matches OurHotelRooms, with safe checks for photos
		const roomDetails = {
			id: room._id,
			name: room.displayName,
			roomType: room.roomType,
			price: averagePrice,
			defaultCost: room.defaultCost || averagePrice, // Pass default cost
			photos: room.photos || [], // Default to an empty array if photos is undefined
			hotelName: selectedHotel.hotelName,
			hotelAddress: selectedHotel.hotelAddress,
			firstImage:
				room.photos && room.photos.length > 0 ? room.photos[0].url : "", // Safe check for first image
			commissionRate, // Pass calculated commission
		};

		const adults = 1;
		// Add room to cart with relevant details, including pricingByDay
		addRoomToCart(
			room._id,
			roomDetails,
			startDate,
			endDate,
			selectedHotel._id,
			selectedHotel.belongsTo,
			pricingByDay,
			room.roomColor,
			adults,
			0,
			commissionRate
		);

		openSidebar2(); // Open the sidebar/cart drawer
	};

	const handleTabClick = (sectionId) => {
		const section = tabRefs.current[sectionId];
		if (section) {
			const headerOffset = 80; // Adjust this value based on the height of your fixed header
			const elementPosition =
				section.getBoundingClientRect().top + window.scrollY;
			const offsetPosition = elementPosition - headerOffset;

			window.scrollTo({
				top: offsetPosition,
				behavior: "smooth",
			});
		}
	};

	const convertCurrency = (amount) => {
		if (selectedCurrency === "usd")
			return (amount * currencyRates.SAR_USD).toFixed(2);
		if (selectedCurrency === "eur")
			return (amount * currencyRates.SAR_EUR).toFixed(2);
		return amount.toFixed(2); // Default to SAR
	};

	return (
		<SingleHotelWrapper dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}>
			{/* Hero Section */}

			<HeroSection dir='ltr'>
				<Swiper
					modules={[Pagination, Autoplay, Thumbs]}
					spaceBetween={10}
					slidesPerView={1}
					pagination={{ clickable: true }}
					autoplay={{
						delay: 4000,
						disableOnInteraction: false,
					}}
					thumbs={{ swiper: thumbsSwiper }}
					loop={true}
					className='main-swiper'
				>
					{selectedHotel.hotelPhotos.map((photo, index) => (
						<SwiperSlide key={index}>
							<img
								src={photo.url}
								alt={`${selectedHotel.hotelName} - ${index + 1}`}
								className='hotel-image'
							/>
						</SwiperSlide>
					))}
				</Swiper>
				{/* <Swiper
					modules={[Thumbs]}
					onSwiper={setThumbsSwiper}
					spaceBetween={2}
					slidesPerView={6}
					watchSlidesProgress
					className='thumbnail-swiper'
					breakpoints={{
						768: {
							slidesPerView: 4,
						},
						1024: {
							slidesPerView: 6,
						},
					}}
				>
					{selectedHotel.hotelPhotos.map((photo, index) => (
						<SwiperSlide key={index}>
							<ThumbnailImage
								src={photo.url}
								alt={`${selectedHotel.hotelName} - ${index + 1}`}
							/>
						</SwiperSlide>
					))}
				</Swiper> */}
			</HeroSection>
			<div>
				<Tabs sections={sections} onTabClick={handleTabClick} />
			</div>

			{/* Hotel Overview */}
			<HotelInfo ref={overviewRef} id='overview'>
				<h1>{selectedHotel.hotelName}</h1>
				<p>
					{formatAddress(selectedHotel.hotelAddress)
						.split(",")
						.slice(0, 2)
						.join(", ")}
				</p>
				<Distances>
					<FaCar /> {selectedHotel.distances?.drivingToElHaram} Driving to El
					Haram
				</Distances>
				<Distances>
					<FaWalking /> {selectedHotel.distances?.walkingToElHaram} Walking to
					El Haram
				</Distances>
				<StarRatings
					rating={selectedHotel.hotelRating || 0}
					starRatedColor='orange'
					numberOfStars={5}
					name='rating'
					starDimension='15px'
					starSpacing='1px'
				/>
				<StaticRating />
				{/* <p>Phone: {selectedHotel.phone}</p> */}
			</HotelInfo>

			{/* Hotel About */}

			<HotelOverview ref={aboutRef} id='about'>
				<h2>About</h2>
				<p>
					{selectedHotel && selectedHotel.aboutHotel
						? selectedHotel.aboutHotel
						: "About Hotel"}
				</p>

				<AmenitiesWrapper>
					{visibleFeatures.map((feature, idx) => (
						<AmenityItem key={idx}>
							{getIcon(feature)} <span>{feature}</span>
						</AmenityItem>
					))}
				</AmenitiesWrapper>

				{combinedFeatures.length > 4 && (
					<ToggleText onClick={handleAmenitiesToggle}>
						{showAllAmenities ? "Hide..." : "Show More..."}
					</ToggleText>
				)}

				<LoadScript googleMapsApiKey={process.env.REACT_APP_MAPS_API_KEY}>
					<MapContainer>
						<GoogleMap
							mapContainerStyle={{
								width: "100%", // Let the styled-component handle the width
								height: "100%", // Let the styled-component handle the height
							}}
							center={{
								lat: parseFloat(selectedHotel.location.coordinates[1]),
								lng: parseFloat(selectedHotel.location.coordinates[0]),
							}}
							zoom={14}
						>
							<Marker
								position={{
									lat: parseFloat(selectedHotel.location.coordinates[1]),
									lng: parseFloat(selectedHotel.location.coordinates[0]),
								}}
								draggable={false}
							/>
						</GoogleMap>
					</MapContainer>
				</LoadScript>
			</HotelOverview>

			{/* Rooms Section */}
			<RoomsSection ref={roomsRef} id='rooms'>
				<h2>Choose Your Room</h2>
				{/* Date Range Picker */}
				<DateRangeWrapper>
					<ResponsiveRangePicker
						format='YYYY-MM-DD'
						value={dateRange}
						onChange={handleDateChange}
						disabledDate={(current) =>
							current && current < dayjs().endOf("day")
						}
						panelRender={panelRender} // Add this to customize the panel rendering
					/>
				</DateRangeWrapper>

				{selectedHotel.roomCountDetails.map((room, index) => {
					// Combine all room-specific amenities
					const roomAmenities = [
						...new Set([
							...room.amenities,
							...room.views,
							...room.extraAmenities,
						]),
					];

					const visibleAmenities = showAllAmenities2
						? roomAmenities
						: roomAmenities.slice(0, 3);

					const startDate = dateRange[0].format("YYYY-MM-DD");
					const endDate = dateRange[1].format("YYYY-MM-DD");

					// Calculate pricing by day
					const pricingByDay = calculatePricingByDay(
						room.pricingRate || [],
						startDate,
						endDate,
						room.price.basePrice
					);

					const totalPrice = pricingByDay.reduce(
						(total, day) => total + day.price,
						0
					);

					const numberOfNights = pricingByDay.length;

					// Check if any date in the range has a price of 0
					const isRoomAvailable = !pricingByDay.some((day) => day.price <= 0);
					console.log(pricingByDay, "pricingByDaypricingByDay");
					console.log(isRoomAvailable, "isRoomAvailableisRoomAvailable");

					// Determine commission rate and calculate commission
					const roomCommission =
						room.roomCommission ||
						selectedHotel.commission ||
						(Number(process.env.REACT_APP_COMMISSIONRATE) - 1) * 100;
					const commissionRate = roomCommission / 100; // Convert to decimal
					const commission =
						(room.defaultCost || room.price.basePrice) *
						numberOfNights *
						commissionRate;

					// Calculate final prices with commission
					const pricePerNight = totalPrice / (numberOfNights || 1);
					const pricePerNightWithCommission =
						pricePerNight + commission / numberOfNights;
					const totalPriceWithCommission = totalPrice + commission;

					// Currency conversion
					const convertedPricePerNight = convertCurrency(
						pricePerNightWithCommission
					);
					const convertedTotalPrice = convertCurrency(totalPriceWithCommission);

					return (
						<RoomCardWrapper key={room._id || index}>
							{/* Badge for Unavailability */}

							<RoomImageWrapper dir='ltr'>
								<Swiper
									modules={[Pagination, Autoplay, Thumbs]}
									spaceBetween={10}
									slidesPerView={1}
									pagination={{ clickable: true }}
									autoplay={{
										delay: 4000,
										disableOnInteraction: false,
									}}
									loop={true}
									thumbs={{ swiper: roomThumbsSwipers[index] }}
									className='room-swiper'
								>
									{room.photos.map((photo, idx) => (
										<SwiperSlide key={idx}>
											<RoomImage
												src={photo.url}
												alt={`${room.displayName} - ${idx + 1}`}
											/>
										</SwiperSlide>
									))}
								</Swiper>
							</RoomImageWrapper>

							{/* Room Details */}
							<RoomDetails dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}>
								<h3>
									{chosenLanguage === "Arabic"
										? room.displayName_OtherLanguage || room.displayName
										: room.displayName}
								</h3>
								<p className='m-0'>
									{chosenLanguage === "Arabic"
										? showFullDescription
											? room.description_OtherLanguage || room.description
											: (room.description_OtherLanguage || room.description)
													.split(" ")
													.slice(0, 8)
													.join(" ")
										: showFullDescription
											? room.description
											: room.description.split(" ").slice(0, 9).join(" ")}
									...
									{!showFullDescription && (
										<div
											onClick={() => setShowFullDescription(true)}
											style={{
												color: "var(--primaryBlue)",
												cursor: "pointer",
												fontWeight: "bold",
												textDecoration: "underline",
											}}
										>
											{chosenLanguage === "Arabic"
												? "إظهار المزيد..."
												: "show more..."}
										</div>
									)}
								</p>
								{showFullDescription && (
									<span
										onClick={() => setShowFullDescription(false)}
										style={{
											color: "var(--primaryBlue)",
											cursor: "pointer",
											fontWeight: "bold",
											textDecoration: "underline",
										}}
									>
										{chosenLanguage === "Arabic" ? "إظهار أقل" : "show less..."}
									</span>
								)}

								<AmenitiesWrapper>
									<h4>Amenities:</h4>
									{visibleAmenities.map((feature, idx) => (
										<AmenityItem key={idx}>
											{getIcon(feature)} <span>{feature}</span>
										</AmenityItem>
									))}
									{roomAmenities.length > 4 && (
										<ToggleText
											onClick={() => setShowAllAmenities2(!showAllAmenities2)}
										>
											{showAllAmenities2 ? "Hide" : "Show More..."}
										</ToggleText>
									)}
								</AmenitiesWrapper>
							</RoomDetails>

							{/* Updated Price Section */}
							<PriceSection>
								<FinalPrice>
									<span className='current-price'>
										{convertedPricePerNight} {selectedCurrency.toUpperCase()} /
										Night
									</span>
									<div className='nights'>{numberOfNights} nights</div>
									<div className='finalTotal'>
										Total: {convertedTotalPrice}{" "}
										{selectedCurrency.toUpperCase()}
									</div>
								</FinalPrice>
								{/* <div className='commission'>
									Commission: {convertCurrency(commission)}{" "}
									{selectedCurrency.toUpperCase()}
								</div> */}
							</PriceSection>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
								}}
							>
								<StyledButton
									disabled={!isRoomAvailable} // Disable button if room is unavailable
									style={{
										backgroundColor: !isRoomAvailable
											? "#ccc"
											: "var(--primaryBlue)",
										cursor: !isRoomAvailable ? "not-allowed" : "pointer",
									}}
									onClick={() => isRoomAvailable && handleAddRoomToCart(room)}
								>
									Add Room To Reservation
								</StyledButton>

								{/* Unavailable Badge */}
								{!isRoomAvailable && (
									<UnavailableBadge>Not Available</UnavailableBadge>
								)}
							</div>
						</RoomCardWrapper>
					);
				})}
			</RoomsSection>
		</SingleHotelWrapper>
	);
};

export default SingleHotel;

// Styled-components
const SingleHotelWrapper = styled.div`
	padding: 20px;
	display: flex;
	flex-direction: column;
	align-items: center;
	overflow: hidden;
	@media (max-width: 800px) {
		margin-top: 40px;
		padding: 10px;
	}
`;

const HeroSection = styled.div`
	width: 100%;
	max-width: 1200px;
	margin: 20px 0;

	.hotel-image {
		width: 100%;
		height: 700px;
		border-radius: 10px;
		object-fit: cover;
	}

	.thumbnail-swiper {
		margin-top: 10px;
		padding: 0px !important;

		.swiper-slide {
			opacity: 0.6;
			margin: 2px;
		}

		.swiper-slide-thumb-active {
			opacity: 1;
			border: 2px solid var(--primary-color);
			border-radius: 10px;
		}
	}

	@media (max-width: 800px) {
		padding: 0px !important;
		width: 430px;
		.hotel-image {
			width: 100%;
			height: 420px;
			border-radius: 10px;
			object-fit: cover;
		}
	}
`;

const HotelInfo = styled.div`
	margin: 20px 0;
	text-align: left; /* Aligns text to the left */
	text-transform: capitalize;
	width: 100%; /* Ensures full width */
	max-width: 1200px; /* Limits the width on larger screens */
	margin-left: 0; /* Aligns to the left of the parent container */

	h1 {
		font-size: 36px;
		color: var(--primaryBlue);
		margin-bottom: 10px;
		text-transform: capitalize;
		font-weight: bold;
	}

	p {
		margin: 5px 0;
		font-size: 18px;
		color: var(--darkGrey);
		white-space: pre-wrap;
		line-height: 1.5;
	}

	@media (max-width: 768px) {
		/* text-align: center; */
		text-align: left; /* Aligns text to the left */
		width: 100%;
		margin: 5px 0;
		h1 {
			font-size: 28px;
			padding: 0px;
			margin: 0px;
		}

		p {
			font-size: 16px;
			padding: 0px;
			margin: 0px;
		}
	}
`;

const HotelOverview = styled.div`
	text-align: left; /* Aligns text to the left */
	text-transform: capitalize;
	width: 100%; /* Ensures full width */
	max-width: 1200px; /* Limits the width on larger screens */
	margin-left: 0; /* Aligns to the left of the parent container */

	h2 {
		font-size: 30px;
		color: var(--primaryBlue);
		margin-bottom: 10px;
		text-transform: capitalize;
		font-weight: bold;
	}

	p {
		margin: 5px 0;
		font-size: 18px;
		color: var(--darkGrey);
		white-space: pre-wrap;
		line-height: 1.5;
	}

	@media (max-width: 768px) {
		/* text-align: center; */
		margin-left: auto; /* Centers content on smaller screens */
		margin-right: auto; /* Centers content on smaller screens */
		padding: 0px !important;

		h2 {
			font-size: 25px;
		}

		p {
			font-size: 14px;
		}
	}
`;

const ToggleText = styled.span`
	display: inline-block;
	margin-top: 10px;
	color: var(--primaryBlue);
	cursor: pointer;
	font-weight: bold;
	text-decoration: underline;
	font-size: 13px;
	&:hover {
		color: var(--primaryBlueDarker);
	}
`;

const MapContainer = styled.div`
	width: 100%; /* Default width to take the full width */
	height: 300px; /* Keep the height constant */
	border-radius: 10px;
	margin-top: 15px;

	@media (min-width: 1024px) {
		width: 600px; /* Wider width for larger screens */
	}

	@media (min-width: 1440px) {
		width: 1000px; /* Even wider width for very large screens */
	}
`;

// const ThumbnailImage = styled.img`
// 	width: 100%;
// 	height: 120px;
// 	object-fit: cover;
// 	border-radius: 10px;
// 	cursor: pointer;

// 	@media (max-width: 800px) {
// 		height: 80px;
// 	}
// `;

const Distances = styled.div`
	font-size: 1rem;
	color: #555;
	margin-bottom: 2px;
	text-transform: capitalize;
	font-weight: bold;

	@media (max-width: 700px) {
		font-size: 0.7rem;
	}
`;

// eslint-disable-next-line
const RoomThumbnailImage = styled.img`
	width: 90%;
	height: 80px;
	object-fit: cover;
	margin-top: 8px;
	border-radius: 10px;
	cursor: pointer;

	@media (max-width: 800px) {
		height: 80px;
	}
`;

const RoomsSection = styled.div`
	width: 100%;
	padding: 20px;
	background-color: var(--neutral-light);
	border-radius: 10px;
	margin-top: 20px;
	max-width: 1200px;

	h2 {
		/* text-align: center; */
		color: var(--primaryBlue);
		margin-bottom: 20px;
		text-transform: capitalize;
		margin-left: 5px;
		margin-right: 5px;
		font-weight: bold;
	}

	@media (max-width: 750px) {
		width: 100%;
		padding: 5px;

		h2 {
			font-size: 1.35rem;
		}
	}
`;

const RoomCardWrapper = styled.div`
	display: grid;
	grid-template-columns: 35% 45% 20%;
	background-color: var(--mainWhite);
	border: 1px solid var(--border-color-light);
	border-radius: 10px;
	box-shadow: var(--box-shadow-light);
	padding: 20px;
	margin-bottom: 20px;
	transition: var(--main-transition);

	@media (max-width: 768px) {
		display: block; /* Stack the elements vertically for mobile */
		padding: 5px;
	}
`;

const RoomImageWrapper = styled.div`
	.room-swiper {
		border-radius: 10px;
		overflow: hidden;
	}
`;

const RoomImage = styled.img`
	width: 100%;
	height: 300px;
	object-fit: cover;
	border-radius: 10px;

	@media (max-width: 750px) {
		height: 220px;
	}
`;

const RoomDetails = styled.div`
	padding: 0 15px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;

	h3 {
		font-size: 1.5rem;
		color: var(--primaryBlue);
		margin-bottom: 10px;
		text-transform: capitalize;
		text-align: left;
	}

	p {
		font-size: 1rem;
		margin-bottom: 10px;
	}

	@media (max-width: 750px) {
		padding: 0 0px;

		h3 {
			font-size: 1.15rem;
			margin-top: 10px;
			font-weight: bold;
		}

		p {
			font-size: 13px;
		}
	}
`;

const PriceSection = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	justify-content: space-between;

	@media (max-width: 768px) {
		align-items: left;
		margin-top: 20px;
		align-items: flex-start;
	}
`;

const FinalPrice = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	font-size: 1.25rem;

	.current-price {
		font-weight: bold;
		color: var(--secondary-color);
		font-size: 1.3rem;
	}

	@media (max-width: 768px) {
		align-items: left;
		align-items: flex-start;

		.current-price {
			font-size: 1rem;
		}

		.finalTotal,
		.nights {
			font-size: 0.75rem;
			font-weight: bold;
		}
	}
`;

const AmenitiesWrapper = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	grid-gap: 10px;
	margin-top: 15px;

	@media (max-width: 768px) {
		grid-template-columns: 1fr; /* Change to 1 column on smaller screens */
		margin-top: 5px;
		grid-gap: 5px;

		h4 {
			font-size: 1.15rem;
		}
	}
`;

const AmenityItem = styled.div`
	display: flex;
	align-items: center;
	font-size: 12px;
	color: var(--text-color-primary);
	font-weight: bold;

	span {
		margin-left: 5px;
	}
`;

const StyledButton = styled(Button)`
	width: 75%;
	margin: 20px auto 0; /* Ensure it is centered */
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
`;

// Styled RangePicker container for customizing panel rendering
const StyledRangePickerContainer = styled.div`
	@media (max-width: 768px) {
		.ant-picker-panel:last-child {
			width: 0;
			overflow: hidden;
			.ant-picker-header,
			.ant-picker-body {
				display: none;
			}
		}
	}
`;

// Panel render function
const panelRender = (panelNode) => (
	<StyledRangePickerContainer>{panelNode}</StyledRangePickerContainer>
);

// Responsive RangePicker styled component
const ResponsiveRangePicker = styled(RangePicker)`
	width: 100%;
	.ant-picker-input {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 7px;
		padding-bottom: 7px;
	}
	.ant-picker {
		border-radius: 10px;
	}

	@media (max-width: 768px) {
		.ant-picker {
			width: 100%;
		}
	}
`;

// DateRangeWrapper for consistent layout
const DateRangeWrapper = styled.div`
	margin-top: 20px;
	margin-bottom: 20px;
	display: flex;
	justify-content: center;
	width: 100%;
`;

const UnavailableBadge = styled.div`
	display: inline-block;
	margin-top: 0.5rem; /* Space below the button */
	padding: 0.3rem 0.8rem;
	border-radius: 0.25rem;
	background-color: var(--accent-color-1); /* Light orange */
	color: var(--secondary-color-dark); /* Darker secondary text */
	font-size: 0.85rem;
	font-weight: bold;
	text-align: center;
	box-shadow: var(--box-shadow-light); /* Light shadow for elevation */
	transition: var(--main-transition); /* Smooth transitions */
`;
