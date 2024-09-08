import React from "react";
import styled from "styled-components";
import Slider from "react-slick";
import StarRatings from "react-star-ratings";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { amenitiesList, viewsList, extraAmenitiesList } from "../../Assets";

// Helper function to format the address
const formatAddress = (address) => {
	const addressParts = address.split(",");
	return addressParts.slice(1).join(", ").trim().toUpperCase();
};

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

// Function to get unique amenities, views, and extra amenities, limit to 12
const getUniqueFeatures = (featuresArray) => {
	const uniqueFeatures = [];

	featuresArray.forEach((feature) => {
		if (!uniqueFeatures.includes(feature)) {
			uniqueFeatures.push(feature);
		}
	});

	// Limit to 12 unique features
	return uniqueFeatures.slice(0, 12);
};

const HotelList = ({ activeHotels }) => {
	// Slick settings for the image slider
	const sliderSettings = {
		dots: true,
		infinite: true,
		speed: 500,
		slidesToShow: 1,
		slidesToScroll: 1,
		autoplay: true,
		autoplaySpeed: 4000,
		arrows: false,
	};

	return (
		<HotelListWrapper>
			{activeHotels && activeHotels.length > 0 ? (
				activeHotels.map((hotel, index) => {
					// Combine all amenities, views, and extra amenities into one array
					const combinedFeatures = [
						...hotel.roomCountDetails.flatMap((room) => room.amenities),
						...hotel.roomCountDetails.flatMap((room) => room.views),
						...hotel.roomCountDetails.flatMap((room) => room.extraAmenities),
					];

					// Get unique features and limit to 12
					const uniqueFeatures = getUniqueFeatures(combinedFeatures);

					return (
						<HotelCard key={hotel._id || index}>
							{/* Image section */}
							<HotelImageWrapper>
								<Slider {...sliderSettings}>
									{hotel.hotelPhotos.map((photo, idx) => (
										<div
											key={idx}
											onClick={() =>
												(window.location.href = `/single-hotel/${hotel.hotelName
													.replace(/\s+/g, "-")
													.toLowerCase()}`)
											}
										>
											<img
												src={photo.url}
												alt={`${hotel.hotelName} - ${idx + 1}`}
												className='hotel-image'
											/>
										</div>
									))}
								</Slider>
							</HotelImageWrapper>

							{/* Hotel details section */}
							<HotelDetails>
								<div>
									<HotelName>{hotel.hotelName}</HotelName>
									<Location>{formatAddress(hotel.hotelAddress)}</Location>
									<StarRatings
										rating={hotel.hotelRating || 0}
										starRatedColor='orange'
										numberOfStars={5}
										name='rating'
										starDimension='20px'
										starSpacing='3px'
									/>

									{/* Display unique amenities, views, and extra amenities */}
									<AmenitiesWrapper>
										{uniqueFeatures.map((feature, index) => (
											<AmenityItem key={index}>
												{getIcon(feature)} <span>{feature}</span>
											</AmenityItem>
										))}
									</AmenitiesWrapper>

									<PriceWrapper className='mt-3'>
										Starting from:{" "}
										<span>
											{hotel.roomCountDetails[0]?.price.basePrice} SAR
										</span>{" "}
										per night
									</PriceWrapper>
								</div>
							</HotelDetails>

							{/* Price and Offer section */}
							<PriceSection>
								<OfferTag>Limited Offer</OfferTag>
								<FinalPrice>
									<span className='old-price'>136 SAR</span>
									<span className='current-price'>
										{hotel.roomCountDetails[0]?.price.basePrice} SAR
									</span>
								</FinalPrice>
								<FreeCancellation>+ FREE CANCELLATION</FreeCancellation>
							</PriceSection>
						</HotelCard>
					);
				})
			) : (
				<p>No hotels available</p>
			)}
		</HotelListWrapper>
	);
};

export default HotelList;

// Styled-components for the component
const HotelListWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 20px;
	background-color: var(--neutral-light);
`;

const HotelCard = styled.div`
	display: grid;
	grid-template-columns: 35% 45% 20%;
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
		grid-template-columns: 1fr; /* Stacks cards in mobile view */
	}
`;

const HotelImageWrapper = styled.div`
	position: relative;
	.hotel-image {
		width: 100%;
		height: 300px;
		object-fit: cover;
		border-radius: 10px;
		cursor: pointer;
	}

	.slick-prev:before,
	.slick-next:before {
		color: var(--text-color-primary);
	}

	.slick-arrow {
		z-index: 1;
	}
`;

const HotelDetails = styled.div`
	padding: 0 15px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
`;

const HotelName = styled.h3`
	font-size: 1.5rem;
	color: var(--primaryBlue);
	margin-bottom: 5px;
	text-transform: capitalize;
	cursor: pointer;

	&:hover {
		color: var(--primaryBlueDarker);
	}
`;

const Location = styled.p`
	color: var(--text-color-secondary);
	font-size: 1rem;
	margin-bottom: 10px;
	text-transform: capitalize;
`;

const PriceWrapper = styled.p`
	font-size: 1rem;
	color: var(--text-color-primary);

	span {
		font-weight: bold;
		color: var(--secondary-color);
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

// New styled-components for amenities display
const AmenitiesWrapper = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr); /* 3 icons per row */
	grid-gap: 10px;
	margin-top: 15px;

	@media (max-width: 768px) {
		grid-template-columns: repeat(
			2,
			1fr
		); /* 2 icons per row on smaller screens */
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
