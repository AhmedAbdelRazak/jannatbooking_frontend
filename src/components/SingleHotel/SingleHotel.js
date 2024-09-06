import React from "react";
import styled from "styled-components";
import StarRatings from "react-star-ratings";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { amenitiesList, extraAmenitiesList, viewsList } from "../../Assets";

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

	// eslint-disable-next-line
	const roomSliderSettings = {
		dots: true,
		infinite: true,
		speed: 500,
		slidesToShow: 2,
		slidesToScroll: 1,
		arrows: true,
		responsive: [
			{
				breakpoint: 1024,
				settings: {
					slidesToShow: 2,
				},
			},
			{
				breakpoint: 768,
				settings: {
					slidesToShow: 1,
				},
			},
		],
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
				<p>{selectedHotel.hotelAddress}</p>
				<StarRatings
					rating={selectedHotel.hotelRating || 0}
					starRatedColor='var(--orangeDark)'
					numberOfStars={5}
					name='rating'
					starDimension='24px'
					starSpacing='3px'
				/>
				<p>Phone: {selectedHotel.phone}</p>
			</HotelInfo>

			{/* Rooms section */}
			<RoomsSection>
				<h2>Rooms</h2>
				<RoomGrid>
					{selectedHotel &&
						selectedHotel.roomCountDetails &&
						selectedHotel.roomCountDetails.map((room, index) => {
							return (
								<RoomCard key={room._id || index}>
									{/* Room details */}
									<div className='room-details'>
										<h3>{room.displayName}</h3>
										<p>
											Price: {room.price.basePrice} {selectedHotel.currency}
										</p>
										<p>{room.description}</p>

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
		img {
			height: 400px;
		}
	}

	@media (max-width: 480px) {
		img {
			height: 300px;
		}
	}
`;

const HotelInfo = styled.div`
	margin: 20px 0;
	text-align: center;

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
	grid-template-columns: repeat(3, 1fr);
	gap: 20px;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (max-width: 768px) {
		grid-template-columns: repeat(1, 1fr);
	}
`;

const RoomCard = styled.div`
	border: 1px solid var(--neutral-light3);
	border-radius: 10px;
	padding: 20px;
	background-color: white;

	img {
		width: 100%;
		height: 200px;
		object-fit: cover;
		border-radius: 10px;
	}

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
