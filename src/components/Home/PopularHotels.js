import React, { useRef } from "react";
import styled from "styled-components";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import StarRatings from "react-star-ratings";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { amenitiesList, viewsList, extraAmenitiesList } from "../../Assets";

const PopularHotels = ({ activeHotels }) => {
	const swiperRef = useRef(null);

	// Helper function to find the matching icon for each amenity, view, or extra amenity
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

	// Function to get unique amenities, views, and extra amenities
	const getUniqueFeatures = (featuresArray) => {
		const uniqueFeatures = [];

		featuresArray.forEach((feature) => {
			if (!uniqueFeatures.includes(feature)) {
				uniqueFeatures.push(feature);
			}
		});

		return uniqueFeatures;
	};

	// Function to format hotel address for readability
	const formatAddress = (address) => {
		const addressParts = address.split(",");
		return addressParts.slice(1).join(", ").trim();
	};

	return (
		<PopularHotelsWrapper>
			<div className='container'>
				<div className='wpo-section-title-s2'>
					<h2>OUR MOST POPULAR HOTELS!</h2>
					<p>
						Enjoy Your Major & Minor Pilgrimage With The Best Rates ONLY WITH
						JANNAT BOOKING!
					</p>
				</div>

				<div className='room-wrapper mt-5'>
					<Swiper
						modules={[Navigation, Pagination, Autoplay]}
						spaceBetween={30}
						slidesPerView={1}
						navigation={{
							prevEl: ".swiper-button-prev",
							nextEl: ".swiper-button-next",
						}}
						pagination={{ clickable: true }}
						loop={true}
						autoplay={{
							delay: 6000,
							disableOnInteraction: false,
						}}
						speed={1500}
						onSwiper={(swiper) => {
							swiperRef.current = swiper;
						}}
					>
						{activeHotels.map((hotel) => {
							// Combine all amenities, views, and extra amenities into one array
							const combinedFeatures = [
								...hotel.roomCountDetails.flatMap((room) => room.amenities),
								...hotel.roomCountDetails.flatMap((room) => room.views),
								...hotel.roomCountDetails.flatMap(
									(room) => room.extraAmenities
								),
							];

							// Get unique features
							const uniqueFeatures = getUniqueFeatures(combinedFeatures);

							return (
								<SwiperSlide key={hotel._id}>
									<HotelCard
										onMouseEnter={() => {
											if (swiperRef.current && swiperRef.current.autoplay) {
												swiperRef.current.autoplay.stop();
											}
										}}
										onMouseLeave={() => {
											if (swiperRef.current && swiperRef.current.autoplay) {
												swiperRef.current.autoplay.start();
											}
										}}
									>
										<div className='hotel-image'>
											<Swiper
												modules={[Navigation, Pagination, Autoplay]}
												pagination={{ clickable: true }}
												loop={true}
												autoplay={{
													delay: 2000,
													disableOnInteraction: false,
												}}
												speed={1000}
											>
												{hotel.hotelPhotos.map((photo, index) => (
													<SwiperSlide
														key={index}
														onClick={() =>
															(window.location.href = `/single-hotel/${hotel.hotelName
																.replace(/\s+/g, "-")
																.toLowerCase()}`)
														}
													>
														<img
															src={photo.url}
															alt={`${hotel.hotelName} - ${index + 1}`}
														/>
													</SwiperSlide>
												))}
											</Swiper>
										</div>
										<div className='hotel-details'>
											<div
												onClick={() =>
													(window.location.href = `/single-hotel/${hotel.hotelName
														.replace(/\s+/g, "-")
														.toLowerCase()}`)
												}
											>
												<h3 className='mb-3'>{hotel.hotelName}</h3>
												<p>{formatAddress(hotel.hotelAddress)}</p>
											</div>

											<StarRatings
												rating={4.6}
												// rating={hotel.hotelRating}
												starRatedColor='var(--orangeDark)'
												numberOfStars={5}
												name='rating'
												starDimension='20px'
												starSpacing='2px'
											/>

											{/* Display unique amenities, views, and extra amenities */}
											<AmenitiesWrapper>
												{uniqueFeatures.map((feature, index) => (
													<AmenityItem key={index}>
														{getIcon(feature)} <span>{feature}</span>
													</AmenityItem>
												))}
											</AmenitiesWrapper>

											<LoadScript
												googleMapsApiKey={process.env.REACT_APP_MAPS_API_KEY}
											>
												<GoogleMap
													mapContainerStyle={{
														width: "100%",
														height: "250px",
														borderRadius: "10px",
														marginTop: "15px",
													}}
													center={{
														lat: parseFloat(hotel.location.coordinates[1]),
														lng: parseFloat(hotel.location.coordinates[0]),
													}}
													zoom={14}
												>
													<Marker
														position={{
															lat: parseFloat(hotel.location.coordinates[1]),
															lng: parseFloat(hotel.location.coordinates[0]),
														}}
														draggable={false}
													/>
												</GoogleMap>
											</LoadScript>
										</div>
									</HotelCard>
								</SwiperSlide>
							);
						})}
					</Swiper>
					<div className='swiper-button-prev'>
						<LeftOutlined />
					</div>
					<div className='swiper-button-next'>
						<RightOutlined />
					</div>
				</div>
			</div>
		</PopularHotelsWrapper>
	);
};

export default PopularHotels;

const PopularHotelsWrapper = styled.div`
	position: relative;
	padding: 30px;
	width: 100%;
	margin-top: 70px;

	.container {
		background-color: var(--neutral-light);
		padding: 10px;
		border-radius: 5px;
	}

	.wpo-section-title-s2 {
		text-align: center;
	}

	.wpo-section-title-s2 h2 {
		font-size: 35px;
		line-height: 45px;
		margin: 0;
		text-transform: capitalize;
		color: var(--primary-color);
		font-weight: 600;
		margin-bottom: 15px;

		@media (min-width: 768px) {
			font-size: 45px;
			line-height: 55px;
			padding: 10px;
		}
	}

	@media (max-width: 1000px) {
		font-size: 30px;
		line-height: 20px;
		padding: 10px;
		margin-top: 0px;
	}

	.wpo-section-title-s2 p {
		font-size: 16px;
		max-width: 540px;
		margin: 0 auto 20px;
		color: var(--primary-color-dark);

		@media (min-width: 768px) {
			font-size: 18px;
		}
	}

	.room-wrapper {
		position: relative;
	}

	.swiper-button-prev,
	.swiper-button-next {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 10;
		width: 40px;
		height: 40px;
		background-color: var(--primary-color);
		color: var(--mainWhite);
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		box-shadow: var(--box-shadow-dark);
		transition: var(--main-transition);

		@media (min-width: 768px) {
			width: 50px;
			height: 50px;
		}
	}

	.swiper-button-prev {
		left: -50px; /* Centered horizontally */
	}

	.swiper-button-next {
		right: -50px; /* Centered horizontally */
	}

	.swiper-button-prev:hover,
	.swiper-button-next:hover {
		background-color: var(--primary-color-darker);
	}

	.swiper-pagination-bullet {
		background-color: var(--primary-color) !important;
	}

	.swiper-pagination-bullet-active {
		background-color: var(--primary-color-darker) !important;
	}
`;

const HotelCard = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	background-color: var(--mainWhite);
	border-radius: 20px;
	box-shadow: var(--box-shadow-light);
	overflow: hidden;
	transition: var(--main-transition);
	text-align: center;
	cursor: pointer;
	width: 100%;
	max-width: 1200px; /* Set max width for the card */
	margin: 0 auto 20px;

	@media (min-width: 768px) {
		margin-bottom: 0;
		margin: 0 auto 0px;
	}

	.hotel-image img {
		width: 900px;
		height: 500px;
		object-fit: cover;
		transition: var(--main-transition);
		border-top-left-radius: 20px;
		border-top-right-radius: 20px;
	}

	@media (max-width: 1000px) {
		.hotel-image img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			transition: var(--main-transition);
			border-top-left-radius: 20px;
			border-top-right-radius: 20px;
		}

		.swiper-button-prev {
			display: none !important;
		}
	}

	.hotel-details {
		padding: 15px;
		background-color: var(--neutral-light2);
		width: 100%;
		border-bottom-left-radius: 20px;
		border-bottom-right-radius: 20px;

		@media (min-width: 768px) {
			padding: 20px;
		}
	}

	.hotel-details h3 {
		font-size: 20px;
		margin-bottom: 5px;
		color: var(--primary-color);
		text-transform: capitalize;

		@media (min-width: 768px) {
			font-size: 24px;
		}
	}

	.hotel-details p {
		font-size: 14px;
		color: var(--text-color-secondary);
		text-transform: capitalize;

		@media (min-width: 768px) {
			font-size: 16px;
		}
	}

	&:hover {
		transform: translateY(-5px);
		box-shadow: var(--box-shadow-dark);
	}
`;

const AmenitiesWrapper = styled.div`
	display: grid;
	grid-template-columns: repeat(5, 1fr); /* 5 icons per row on tablets */
	grid-gap: 10px;
	justify-content: center;
	margin-top: 15px;

	@media (max-width: 768px) {
		grid-template-columns: repeat(3, 1fr); /* 3 icons per row on cell phones */
	}
`;

const AmenityItem = styled.div`
	display: flex;
	align-items: center;
	font-size: 14px;
	color: var(--text-color-primary);

	span {
		margin-left: 5px;
	}
`;
