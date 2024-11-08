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

const OurHotelRooms = () => {
	const { chosenLanguage, addRoomToCart, openSidebar2 } = useCartContext();

	const [loading, setLoading] = useState(true);
	const [roomData, setRoomData] = useState(null);
	const [distinctRoomTypes, setDistinctRoomTypes] = useState([]);
	const [showAllAmenities, setShowAllAmenities] = useState(false);
	const location = useLocation();
	const queryParams = getQueryParams(location.search);

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

	return (
		<OurHotelRoomsWrapper>
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
					{roomData.flatMap((hotel) =>
						hotel.roomCountDetails.map((room) => (
							<RoomCard
								key={room._id}
								room={room}
								hotelName={hotel.hotelName}
								hotelRating={hotel.hotelRating}
								hotelAddress={hotel.hotelAddress}
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
								showAllAmenities={showAllAmenities}
								setShowAllAmenities={setShowAllAmenities}
							/>
						))
					)}
				</RoomListWrapper>
			) : (
				<div>No data found.</div>
			)}
		</OurHotelRoomsWrapper>
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
	showAllAmenities,
	setShowAllAmenities,
}) => {
	const [thumbsSwiper, setThumbsSwiper] = useState(null);
	const averagePrice = calculateAveragePrice(
		room.pricingRate,
		startDate,
		endDate
	);
	const displayedPrice = averagePrice || room.price.basePrice || "N/A";

	const pricingByDay = calculatePricingByDay(
		room.pricingRate,
		startDate,
		endDate,
		room.price.basePrice
	);

	// console.log(pricingByDay, "pricingByDaypricingByDay");

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
		: uniqueFeatures.slice(0, 4);

	const handleAddToCart = () => {
		addRoomToCart(
			room._id,
			{
				id: room._id,
				name: room.displayName,
				roomType: room.roomType,
				price: displayedPrice,
				photos: room.photos,
				hotelName,
				hotelAddress,
				firstImage,
			},
			startDate,
			endDate,
			hotelId,
			belongsTo,
			pricingByDay,
			roomColor,
			adults,
			children
		);
		openSidebar2(); // Open the cart drawer after adding a room
	};

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
				<Swiper
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
				</Swiper>
			</RoomImageWrapper>

			<RoomDetails>
				<RoomDisplayName>
					{chosenLanguage === "Arabic"
						? room.displayName_OtherLanguage || room.displayName
						: room.displayName}
				</RoomDisplayName>
				<HotelName>{hotelName}</HotelName>
				<Location>{hotelAddress}</Location>
				{/* <StarRatings
					rating={hotelRating || 0}
					starRatedColor='orange'
					numberOfStars={5}
					name='rating'
					starDimension='20px'
					starSpacing='3px'
				/> */}
				<AmenitiesWrapper className='p-0 m-0'>
					{visibleFeatures.map((feature, index) => (
						<AmenityItem key={index}>
							{getIcon(feature)} <span>{feature}</span>
						</AmenityItem>
					))}
				</AmenitiesWrapper>

				{/* Show more/less link */}
				{uniqueFeatures.length > 4 && (
					<ShowMoreText onClick={() => setShowAllAmenities(!showAllAmenities)}>
						{showAllAmenities ? "Show less..." : "Show more..."}
					</ShowMoreText>
				)}
				<PriceWrapper>
					Price from {startDate} to {endDate}: <span>{displayedPrice} SAR</span>{" "}
					per night
				</PriceWrapper>
				<StyledButton onClick={handleAddToCart}>
					Add Room To Reservation
				</StyledButton>
			</RoomDetails>
		</RoomCardWrapper>
	);
};

export default OurHotelRooms;

// Styled-components for the component
const OurHotelRoomsWrapper = styled.div`
	width: 100%;
	padding: 220px 250px;
	background-color: #f9f9f9;
	min-height: 700px;

	@media (max-width: 1000px) {
		padding: 160px 0px;
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

const RoomListWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 20px;
	background-color: var(--neutral-light);
`;

const RoomCardWrapper = styled.div`
	display: grid;
	grid-template-columns: 35% 65%;
	background-color: #fff;
	border: 1px solid #ddd;
	border-radius: 10px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	transition: box-shadow 0.3s ease;

	&:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}

	/* Mobile view adjustments */
	@media (max-width: 768px) {
		display: block; /* Stack the elements vertically for mobile */
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

const ThumbnailImage = styled.img`
	width: 100%;
	height: 60px;
	object-fit: cover;
	border-radius: 5px;
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
		font-size: 1rem;
		font-weight: bold;
	}
`;

const HotelName = styled.p`
	font-size: 1rem;
	color: #555;
	margin-bottom: 5px;
	text-transform: capitalize;
`;

const Location = styled.p`
	font-size: 0.9rem;
	color: #888;
	margin-bottom: 10px;
	text-transform: capitalize;
`;

const PriceWrapper = styled.p`
	font-size: 0.85rem;
	font-weight: bold;
	color: #444;

	span {
		font-weight: bold;
		color: #1e90ff;
	}
`;

const AmenitiesWrapper = styled.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	grid-gap: 10px;
	margin-top: 15px;

	@media (max-width: 768px) {
		grid-template-columns: repeat(2, 1fr);
	}
`;

const AmenityItem = styled.div`
	display: flex;
	align-items: center;
	font-size: 12px;
	color: #666;

	span {
		margin-left: 5px;
	}
`;

const ShowMoreText = styled.span`
	color: var(--primaryBlue);
	cursor: pointer;
	font-weight: bold;
	text-decoration: underline;
	margin-top: 10px;
	display: inline-block;
	font-size: 13px;

	&:hover {
		color: var(--primaryBlueDarker);
	}
`;

const StyledButton = styled(Button)`
	width: 75%;
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
`;
