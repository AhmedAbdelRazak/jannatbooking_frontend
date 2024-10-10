import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Button, Spin } from "antd";
import { useLocation } from "react-router-dom";
import { getRoomQuery, gettingDistinctRoomTypes } from "../apiCore";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import StarRatings from "react-star-ratings";
import { amenitiesList, viewsList, extraAmenitiesList } from "../Assets";
import Search from "../components/OurHotels/Search";
import { useCartContext } from "../cart_context";

// Helper function to extract query parameters from the URL
const getQueryParams = (search) => {
	const params = new URLSearchParams(search);
	return {
		startDate: params.get("startDate"),
		endDate: params.get("endDate"),
		roomType: params.get("roomType"),
		adults: params.get("adults"),
		children: params.get("children"),
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
	const { chosenLanguage } = useCartContext();

	const [loading, setLoading] = useState(true);
	const [roomData, setRoomData] = useState(null);
	const [distinctRoomTypes, setDistinctRoomTypes] = useState([]); // Initialize as an array

	const location = useLocation();

	const roomTypesMapping = [
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
	];

	useEffect(() => {
		window.scrollTo({ top: 20, behavior: "smooth" });
		const fetchRoomData = async () => {
			const queryParams = getQueryParams(location.search);
			const query = `${queryParams.startDate}_${queryParams.endDate}_${queryParams.roomType}_${queryParams.adults}_${queryParams.children}`;

			try {
				const data = await getRoomQuery(query);
				setRoomData(data);
			} catch (error) {
				console.error("Error fetching room data", error);
			} finally {
				setLoading(false);
			}
		};

		fetchRoomData();
	}, [location.search]);

	useEffect(() => {
		const gettingDistinctRooms = () => {
			gettingDistinctRoomTypes().then((data3) => {
				if (data3.error) {
					console.log(data3.error);
				} else {
					// Extract and map distinct room types
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

		// eslint-disable-next-line
	}, []);

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
								startDate={getQueryParams(location.search).startDate}
								endDate={getQueryParams(location.search).endDate}
								chosenLanguage={chosenLanguage}
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
}) => {
	const [thumbsSwiper, setThumbsSwiper] = useState(null);
	// eslint-disable-next-line
	const [mainSwiper, setMainSwiper] = useState(null);

	const averagePrice = calculateAveragePrice(
		room.pricingRate,
		startDate,
		endDate
	);
	const displayedPrice = averagePrice || room.price.basePrice || "N/A";

	// Combine all amenities, views, and extra amenities
	const combinedFeatures = [
		...room.amenities,
		...room.views,
		...room.extraAmenities,
	];
	const uniqueFeatures = [...new Set(combinedFeatures)].slice(0, 12); // Limit to 12 features

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
					onSwiper={setMainSwiper}
					className='main-swiper'
				>
					{room.photos.map((photo, idx) => (
						<SwiperSlide key={idx}>
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
						? room.displayName_OtherLanguage
							? room.displayName_OtherLanguage
							: room.displayName
						: room.displayName}
				</RoomDisplayName>
				<HotelName className='mt-2'>{hotelName}</HotelName>
				<Location className='mt-2'>{hotelAddress}</Location>
				<StarRatings
					rating={hotelRating || 0}
					starRatedColor='orange'
					numberOfStars={5}
					name='rating'
					starDimension='20px'
					starSpacing='3px'
				/>
				<AmenitiesWrapper className='mt-2'>
					{uniqueFeatures.map((feature, index) => (
						<AmenityItem key={index}>
							{getIcon(feature)} <span>{feature}</span>
						</AmenityItem>
					))}
				</AmenitiesWrapper>
				<PriceWrapper className='mt-2'>
					Price for date from {startDate} to {endDate}:{" "}
					<span>{displayedPrice} SAR</span> per night
				</PriceWrapper>
				<StyledButton>Add Room To Reservation</StyledButton>
			</RoomDetails>
		</RoomCardWrapper>
	);
};

export default OurHotelRooms;

// Styled-components for the component
const OurHotelRoomsWrapper = styled.div`
	width: 100%;
	padding: 70px 250px;
	background-color: #f9f9f9;
	min-height: 700px;

	@media (max-width: 1000px) {
		padding: 70px 0px;
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
	font-size: 1rem;
	color: #444;

	span {
		font-weight: bold;
		color: #1e90ff;
	}
`;

const AmenitiesWrapper = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	grid-gap: 10px;
	margin-top: 15px;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
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
