import React from "react";
import styled from "styled-components";
import StarRatings from "react-star-ratings";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
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
	// Return null if no selected hotel to prevent rendering issues
	if (!selectedHotel) return null;

	// Slick settings for the hero carousel
	const heroSliderSettings = {
		dots: true,
		infinite: true,
		speed: 1500,
		slidesToShow: 1,
		slidesToScroll: 1,
		autoplay: true,
		autoplaySpeed: 4000,
		arrows: true,
	};

	// Slick settings for room photo carousels
	const imageSettings = {
		dots: true,
		infinite: true,
		speed: 1500,
		slidesToShow: 1,
		slidesToScroll: 1,
		autoplay: true,
		autoplaySpeed: 4000,
	};

	const formatAddress = (address) => {
		const addressParts = address.split(",");
		return addressParts.slice(1).join(", ").trim();
	};

	return (
		<SingleHotelWrapper>
			{/* Hero Section with react-slick */}
			<HeroSection>
				<Slider {...heroSliderSettings}>
					{selectedHotel.hotelPhotos.map((photo, index) => (
						<div key={index}>
							<img
								src={photo.url}
								alt={`${selectedHotel.hotelName} - ${index + 1}`}
							/>
						</div>
					))}
				</Slider>
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
				<RoomGrid>
					{selectedHotel &&
						selectedHotel.roomCountDetails &&
						selectedHotel.roomCountDetails.map((room, index) => {
							// Calculate average price
							const prices = room.pricingRate.map((rate) => Number(rate.price));
							const totalPrices = prices.reduce((sum, price) => sum + price, 0);
							const averagePrice =
								prices.length > 0 ? totalPrices / prices.length : 0;

							return (
								<RoomCard key={room._id || index}>
									{/* Room Photos Carousel */}
									{room && room.photos && room.photos.length > 1 ? (
										<CarouselWrapper>
											<Slider {...imageSettings}>
												{room.photos.map((photo, index) => (
													<div key={index}>
														<RoomImage
															src={photo.url}
															alt={`${room.displayName} - ${index + 1}`}
														/>
													</div>
												))}
											</Slider>
										</CarouselWrapper>
									) : (
										<RoomImage
											src={room.photos[0] && room.photos[0].url}
											alt={`${room.displayName} - ${index + 1}`}
										/>
									)}

									{/* Room details */}
									<div className='room-details'>
										<h3>{room.displayName}</h3>
										<p>
											Price:{" "}
											{averagePrice
												? averagePrice.toFixed(2)
												: room.price.basePrice}{" "}
											<span style={{ textTransform: "uppercase" }}>
												{selectedHotel.currency}
											</span>
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

										{/* Room amenities */}
										<AmenitiesWrapper>
											<h4>Amenities</h4>
											{room.amenities.map((amenity, index) => (
												<AmenityItem key={index}>
													{getIcon(amenity)} <span>{amenity}</span>
												</AmenityItem>
											))}
										</AmenitiesWrapper>
									</div>
								</RoomCard>
							);
						})}
				</RoomGrid>
			</RoomsSection>
		</SingleHotelWrapper>
	);
};

export default SingleHotel;

// Styled-components for the sections, using your custom color palette

const SingleHotelWrapper = styled.div`
	padding: 20px;
	display: flex;
	flex-direction: column;
	align-items: center;
	overflow: hidden;
`;

const HeroSection = styled.div`
	width: 100%;
	max-width: 1200px;
	margin: 20px 0;

	img {
		width: 100%;
		height: 600px;
		object-fit: cover;
		border-radius: 10px;
		box-shadow: var(--box-shadow-light);
	}

	@media (max-width: 768px) {
		margin-top: 70px;

		img {
			height: 400px;
		}
	}

	@media (max-width: 480px) {
		img {
			height: 300px;
		}
	}

	.slick-slide {
		padding: 10px;
		box-sizing: border-box;
	}

	.slick-dots {
		bottom: -30px;
	}

	.slick-prev:before,
	.slick-next:before {
		color: var(--text-color-dark);
	}

	.slick-dots li button:before {
		color: var(--text-color-dark);
	}

	.slick-dots {
		display: none !important;
	}

	@media (max-width: 900px) {
		.slick-arrow,
		.slick-prev {
			display: none !important;
		}
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

const RoomsSection = styled.div`
	width: 100%;
	padding: 20px;
	background-color: var(--neutral-light);
	border-radius: 10px;
	margin-top: 20px;
	max-width: 1200px;

	img {
		width: 100% !important;
		height: 300px !important;
		object-fit: cover;
		border-radius: 10px;
	}

	h2 {
		text-align: center;
		color: var(--primaryBlue);
		margin-bottom: 20px;
		text-transform: capitalize;
	}

	@media (max-width: 768px) {
		padding: 10px;
	}

	@media (max-width: 480px) {
		padding: 5px;
	}
`;

const RoomGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(
		3,
		minmax(0, 1fr)
	); /* Use minmax to ensure flexibility */
	gap: 20px;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 768px) {
		grid-template-columns: repeat(1, minmax(0, 1fr));
	}
`;

const RoomCard = styled.div`
	border: 1px solid var(--neutral-light3);
	border-radius: 10px;
	padding: 20px;
	background-color: white;

	.room-details {
		margin-top: 20px;
		width: 100%;
		text-align: center;

		h3 {
			font-size: 24px;
			color: var(--primaryBlue);
			margin-bottom: 10px;
			text-transform: capitalize;
		}

		p {
			font-size: 16px;
			margin-bottom: 10px;
		}
	}
`;

const CarouselWrapper = styled.div`
	width: 100%;
	height: 300px;
	border-radius: 10px;
	overflow: hidden;
`;

const RoomImage = styled.img`
	width: 100%;
	height: 100%;
	object-fit: cover;
	border-radius: 10px;
	overflow: hidden;
`;

const AmenitiesWrapper = styled.div`
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 10px;
	margin-top: 15px;

	h4 {
		width: 100%;
		text-align: center;
		margin-bottom: 10px;
		color: var(--darkGrey);
	}
`;

const AmenityItem = styled.div`
	display: flex;
	align-items: center;
	font-size: 14px;
	color: var(--darkGrey);

	span {
		margin-left: 5px;
	}
`;
