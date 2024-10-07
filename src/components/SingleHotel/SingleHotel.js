import React, { useState } from "react";
import styled from "styled-components";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import StarRatings from "react-star-ratings";
import { amenitiesList, extraAmenitiesList, viewsList } from "../../Assets";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

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

	return null; // Fallback if no icon is found
};

// Main SingleHotel component
const SingleHotel = ({ selectedHotel }) => {
	const [thumbsSwiper, setThumbsSwiper] = useState(null);
	// Array of swiper references for each room
	const [roomThumbsSwipers, setRoomThumbsSwipers] = useState([]);

	// Return null if no selected hotel to prevent rendering issues
	if (!selectedHotel) return null;

	const formatAddress = (address) => {
		const addressParts = address.split(",");
		return addressParts.slice(1).join(", ").trim();
	};

	const handleRoomThumbsSwiper = (index) => (swiper) => {
		setRoomThumbsSwipers((prev) => {
			const newSwipers = [...prev];
			newSwipers[index] = swiper;
			return newSwipers;
		});
	};

	return (
		<SingleHotelWrapper>
			{/* Hero Section */}
			<HeroSection>
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
				<Swiper
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
				</Swiper>
			</HeroSection>

			{/* Hotel basic info */}
			<HotelInfo>
				<h1>{selectedHotel.hotelName}</h1>
				<p>{formatAddress(selectedHotel.hotelAddress)}</p>
				<StarRatings
					rating={selectedHotel.hotelRating || 0}
					starRatedColor='var(--orangeDark)'
					numberOfStars={5}
					name='rating'
					starDimension='24px'
					starSpacing='3px'
				/>
				<p>Phone: {selectedHotel.phone}</p>
				<LoadScript googleMapsApiKey={process.env.REACT_APP_MAPS_API_KEY}>
					<GoogleMap
						mapContainerStyle={{
							width: "1000px",
							height: "350px",
							borderRadius: "10px",
							marginTop: "15px",
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
				</LoadScript>
			</HotelInfo>

			{/* Rooms section */}
			<RoomsSection>
				<h2>Rooms</h2>
				{selectedHotel.roomCountDetails.map((room, index) => {
					// Calculate average price
					const prices = room.pricingRate.map((rate) => Number(rate.price));
					const totalPrices = prices.reduce((sum, price) => sum + price, 0);
					const averagePrice =
						prices.length > 0 ? totalPrices / prices.length : 0;

					return (
						<RoomCardWrapper key={room._id || index}>
							{/* Room image section with Swiper */}
							<RoomImageWrapper>
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

								<Swiper
									modules={[Thumbs]}
									onSwiper={handleRoomThumbsSwiper(index)}
									spaceBetween={2}
									slidesPerView={4}
									watchSlidesProgress
									className='thumbnail-swiper'
									breakpoints={{
										768: {
											slidesPerView: 3,
										},
										1024: {
											slidesPerView: 4,
										},
									}}
								>
									{room.photos.map((photo, idx) => (
										<SwiperSlide key={idx}>
											<RoomThumbnailImage
												src={photo.url}
												alt={`${room.displayName} - ${idx + 1}`}
											/>
										</SwiperSlide>
									))}
								</Swiper>
							</RoomImageWrapper>

							{/* Room details in the center */}
							<RoomDetails>
								<h3>{room.displayName}</h3>
								<p>
									Price:{" "}
									{averagePrice
										? averagePrice.toFixed(2)
										: room.price.basePrice}{" "}
									<span style={{ textTransform: "uppercase" }}>
										{selectedHotel.currency}
									</span>{" "}
									/ Night{" "}
									<div
										style={{
											fontWeight: "bold",
											fontSize: "12px",
											color: "darkred",
										}}
									>
										(Price Varies Based On Selected Date Range)
									</div>
								</p>
								<p>
									{room.description.length > 200
										? `${room.description.slice(0, 200)}...`
										: room.description}
								</p>
								<AmenitiesWrapper>
									<h4>Amenities</h4>
									{room.amenities.map((amenity, idx) => (
										<AmenityItem key={idx}>
											{getIcon(amenity)} <span>{amenity}</span>
										</AmenityItem>
									))}
								</AmenitiesWrapper>
							</RoomDetails>

							{/* Price section on the right */}
							<PriceSection>
								{/* <OfferTag>Limited Offer</OfferTag> */}
								<FinalPrice>
									<span className='old-price'>136 SAR</span>
									<span className='current-price'>
										{room.price.basePrice} SAR
									</span>
								</FinalPrice>
								<FreeCancellation>+ FREE CANCELLATION</FreeCancellation>
							</PriceSection>
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
		margin-top: 20px;
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
		.hotel-image {
			width: 100%;
			height: 500px;
			border-radius: 10px;
			object-fit: cover;
		}
	}
`;

const ThumbnailImage = styled.img`
	width: 100%;
	height: 120px;
	object-fit: cover;
	border-radius: 10px;
	cursor: pointer;

	@media (max-width: 800px) {
		height: 80px;
	}
`;

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
		text-align: center;
		color: var(--primaryBlue);
		margin-bottom: 20px;
		text-transform: capitalize;
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
	}

	p {
		font-size: 1rem;
		margin-bottom: 10px;
	}
`;

const PriceSection = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	justify-content: space-between;

	@media (max-width: 768px) {
		align-items: center;
		margin-top: 20px;
	}
`;

// eslint-disable-next-line
const OfferTag = styled.div`
	background-color: var(--secondary-color);
	color: var(--mainWhite);
	font-weight: bold;
	padding: 5px 10px;
	border-radius: 5px;
	margin-bottom: 10px;
	text-transform: uppercase;
`;

const FinalPrice = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	font-size: 1.25rem;

	.old-price {
		text-decoration: line-through;
		color: var(--neutral-dark);
		font-size: 1rem;
	}

	.current-price {
		font-weight: bold;
		color: var(--secondary-color);
		font-size: 1.5rem;
	}

	@media (max-width: 768px) {
		align-items: center;
	}
`;

const FreeCancellation = styled.p`
	font-size: 0.9rem;
	color: var(--primaryBlueDarker);
	font-weight: bold;
	text-align: right;

	@media (max-width: 768px) {
		text-align: center;
	}
`;

const AmenitiesWrapper = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
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
	color: var(--text-color-primary);

	span {
		margin-left: 5px;
	}
`;
const HotelInfo = styled.div`
	margin: 20px 0;
	text-align: center;
	text-transform: capitalize;

	h1 {
		font-size: 36px;
		color: var(--primaryBlue);
		margin-bottom: 10px;
		text-transform: capitalize;
	}

	p {
		margin: 5px 0;
		font-size: 18px;
		color: var(--darkGrey);
		white-space: pre-wrap;
		line-height: 1.5;
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 28px;
		}

		p {
			font-size: 16px;
		}
	}
`;
