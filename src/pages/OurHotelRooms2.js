import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import { Button, Spin } from "antd";
import { useLocation } from "react-router-dom";
import { getRoomQuery, gettingDistinctRoomTypes } from "../apiCore";
import { Swiper, SwiperSlide } from "swiper/react";
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

const generateDateRange = (startDate, endDate) => {
	const start = dayjs(startDate);
	const end = dayjs(endDate);
	const dateArray = [];

	let currentDate = start;
	while (currentDate <= end) {
		dateArray.push(currentDate.format("YYYY-MM-DD"));
		currentDate = currentDate.add(1, "day");
	}

	return dateArray;
};

// Function to get pricing by day
const calculatePricingByDay = (pricingRate, startDate, endDate, basePrice) => {
	const dateRange = generateDateRange(startDate, endDate);

	// Calculate total price for each day
	return dateRange.map((date) => {
		const rateForDate = pricingRate.find((rate) => rate.calendarDate === date);
		return {
			date,
			price: rateForDate ? rateForDate.price : basePrice,
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
		window.scrollTo({ top: 20, behavior: "smooth" });
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

	return (
		<OurHotelRooms2Wrapper>
			{loading ? (
				<LoadingOverlay>
					<Spin size='large' tip='Loading room data...' />
				</LoadingOverlay>
			) : roomData ? (
				<RoomListWrapper>
					<SearchSection>
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
					</SearchSection>

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
const RoomCard = ({
	room,
	hotelName,
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
}) => {
	// eslint-disable-next-line
	const [thumbsSwiper, setThumbsSwiper] = useState(null);

	// Define the commission rate dynamically (can be passed from props or a constant)

	// Determine commission rate
	const roomCommission =
		room.roomCommission ||
		hotel.commission ||
		(Number(process.env.REACT_APP_COMMISSIONRATE) - 1) * 100;

	const commissionRate = roomCommission / 100 + 1; // Convert to decimal

	const averagePrice = calculateAveragePrice(
		room.pricingRate,
		startDate,
		endDate
	);

	const displayedPrice = averagePrice || room.price.basePrice || "N/A";

	const displayedPriceAfterCommission =
		Number(averagePrice * commissionRate) ||
		Number(room.price.basePrice * commissionRate) ||
		"N/A";

	const pricingByDay = calculatePricingByDay(
		room.pricingRate,
		startDate,
		endDate,
		room.price.basePrice
	);

	// Calculate total price
	// eslint-disable-next-line
	const totalPrice = calculateTotalPrice(displayedPrice, startDate, endDate);

	// Calculate total price with commission
	const totalPriceWithCommission = Number(
		calculateTotalPrice(displayedPrice, startDate, endDate) * commissionRate
	).toFixed(2);

	const firstImage = room.photos[0]?.url || "";

	const combinedFeatures = [
		...room.amenities,
		...room.views,
		...room.extraAmenities,
	];
	const uniqueFeatures = [...new Set(combinedFeatures)].slice(0, 12);
	// Determine visible features: show only the first 4 by default
	const visibleFeatures = showAllAmenities
		? uniqueFeatures
		: uniqueFeatures.slice(0, 2);

	const handleAddToCart = () => {
		const rateDecimal = Number(commissionRate - 1).toFixed(2);
		addRoomToCart(
			room._id,
			{
				id: room._id,
				name: room.displayName,
				roomType: room.roomType,
				price: displayedPrice,
				defaultCost: room.defaultCost || displayedPrice,
				photos: room.photos,
				hotelName,
				hotelAddress,
				firstImage,
				commissionRate: Number(rateDecimal),
			},
			startDate,
			endDate,
			hotelId,
			belongsTo,
			pricingByDay,
			roomColor,
			adults,
			children,
			Number(rateDecimal) // Pass the dynamic commission rate
		);
		openSidebar2(); // Open the cart drawer after adding a room
	};

	const handleChatClick = () => {
		const hotelNameSlug = hotelName.replace(/\s+/g, "-").toLowerCase();

		// Use URLSearchParams to update the search query without refreshing
		const params = new URLSearchParams(window.location.search);
		params.set("hotelNameSlug", hotelNameSlug);

		// Update the URL without refreshing
		const newUrl = `${window.location.pathname}?${params.toString()}`;
		window.history.pushState({}, "", newUrl); // Push the new URL to browser history

		// Trigger a custom event for ChatIcon to detect changes (optional)
		const searchChangeEvent = new CustomEvent("searchChange");
		window.dispatchEvent(searchChangeEvent);
	};

	const calculateConvertedPrice = (price) => {
		if (currency === "usd") return (price * rates.SAR_USD).toFixed(2);
		if (currency === "eur") return (price * rates.SAR_EUR).toFixed(2);
		return Number(price).toFixed(2); // Default to SAR
	};

	const nights = dayjs(endDate).diff(dayjs(startDate), "day");

	// Convert prices based on selected currency
	const convertedPrice = calculateConvertedPrice(displayedPriceAfterCommission);
	const convertedTotalPrice = calculateConvertedPrice(totalPriceWithCommission);

	return (
		<RoomCardWrapper>
			<RoomImageWrapper>
				<Swiper
					modules={[Pagination, Autoplay, Thumbs]}
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
							onClick={() =>
								(window.location.href = `/single-hotel/${hotelName
									.replace(/\s+/g, "-")
									.toLowerCase()}`)
							}
						>
							<img
								src={photo.url}
								alt={room.displayName}
								className='room-image'
							/>
						</SwiperSlide>
					))}
				</Swiper>
				{/* <Swiper
					modules={[Thumbs]}
					onSwiper={setThumbsSwiper}
					spaceBetween={2}
					slidesPerView={5}
					watchSlidesProgress
					className='thumbnail-swiper'
				>
					{room.photos.map((photo, idx) => (
						<SwiperSlide key={idx}>
							<ThumbnailImage src={photo.url} alt={room.displayName} />
						</SwiperSlide>
					))}
				</Swiper> */}
			</RoomImageWrapper>

			<RoomDetails>
				<RoomDisplayName>
					{chosenLanguage === "Arabic"
						? room.displayName_OtherLanguage || room.displayName
						: room.displayName}
				</RoomDisplayName>
				<HotelName>{hotelName}</HotelName>
				{/* <Location>
					{formatAddress(hotelAddress).split(",").slice(0, 2).join(", ")}
				</Location> */}
				<StarRatings
					rating={hotelRating || 0}
					starRatedColor='orange'
					numberOfStars={5}
					name='rating'
					starDimension='15px'
					starSpacing='1px'
				/>
				<PriceWrapper>
					<span
						style={{
							fontWeight: "bolder",
							fontSize: "1.5rem",
							color: "black",
						}}
					>
						{currency && currency.toUpperCase()} {convertedPrice}
					</span>{" "}
					<span style={{ fontSize: "0.82rem", color: "black" }}>/ NIGHT</span>
					{nights > 0 && (
						<div
							style={{
								fontSize: "0.7rem",
								color: "var(--darkGrey)",
								fontWeight: "bold",
							}}
						>
							Total {nights} nights:{" "}
							<strong>
								{currency && currency.toUpperCase()} {convertedTotalPrice}
							</strong>
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
				{/* Show more/less link */}
				{uniqueFeatures.length > 4 && (
					<ShowMoreText onClick={toggleShowAmenities}>
						{showAllAmenities ? "Show less..." : "Show more..."}
					</ShowMoreText>
				)}
				<Distances className='mt-1'>
					<FaCar /> {distanceToElHaramDriving} <span>Driving</span> to El Haram
				</Distances>
				{/* <Distances>
					<FaWalking /> {distanceToElHaramWalking} Walking to El Haram
				</Distances> */}
			</RoomDetails>
			<div className='habal'></div>
			<StyledButton
				className='mb-2 mt-1'
				style={{ textAlign: "left" }}
				onClick={handleAddToCart}
			>
				Add to Reservation
			</StyledButton>
			<div>
				<ReceptionChat className='float-right mr-2' onClick={handleChatClick}>
					Reception
					<div className='row'>
						<div className='col-3'>Chat</div>
						<div className='col-9'>
							<span style={{ fontSize: "8px", marginLeft: "10px" }}>
								<span
									className='mx-1'
									style={{
										backgroundColor: "#00ff00",
										padding: "0px 5px",
										borderRadius: "50%",
									}}
								></span>{" "}
								Available
							</span>
						</div>
					</div>
				</ReceptionChat>
			</div>
		</RoomCardWrapper>
	);
};

export default OurHotelRooms2;

// Styled-components for the component
const OurHotelRooms2Wrapper = styled.div`
	width: 100%;
	padding: 220px 250px;
	background-color: #f9f9f9;
	min-height: 700px;

	@media (max-width: 1000px) {
		padding: 200px 0px;

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
	margin-bottom: 50px;

	@media (max-width: 800px) {
		margin-top: 50px;
		margin-bottom: 270px;
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

	@media (max-width: 750px) {
		font-size: 0.8rem;
		/* font-weight: bold; */
		margin-bottom: 0px;
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
	}
`;

const Distances = styled.div`
	font-size: 1rem;
	color: #555;
	margin-bottom: 2px;
	text-transform: capitalize;
	font-weight: bold;

	@media (max-width: 700px) {
		font-size: 0.85rem;
		margin-bottom: 0px;
		font-weight: bold;

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
		font-size: 0.65rem;
		font-weight: bolder;
		width: 90% !important;
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
		width: 50% !important;
	}
`;
