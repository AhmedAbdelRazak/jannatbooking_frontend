import React, { useState } from "react";
import styled from "styled-components";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import StarRatings from "react-star-ratings";
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

	return null;
};

// HotelCard component for individual hotels
const HotelCard = ({ hotel }) => {
	const [thumbsSwiper, setThumbsSwiper] = useState(null); // Each hotel has its own thumbsSwiper
	const [mainSwiper, setMainSwiper] = useState(null); // Main swiper reference to control autoplay
	const [showAllAmenities, setShowAllAmenities] = useState(false); // State to show/hide all amenities

	const combinedFeatures = [
		...hotel.roomCountDetails.flatMap((room) => room.amenities),
		...hotel.roomCountDetails.flatMap((room) => room.views),
		...hotel.roomCountDetails.flatMap((room) => room.extraAmenities),
	];

	const uniqueFeatures = [...new Set(combinedFeatures)]; // Get unique features

	// Determine visible features based on state
	const visibleFeatures = showAllAmenities
		? uniqueFeatures
		: uniqueFeatures.slice(0, 4);

	// Stop autoplay when user hovers over the image
	const handleMouseEnter = () => {
		if (mainSwiper) mainSwiper.autoplay.stop();
	};

	// Resume autoplay when the user stops hovering
	const handleMouseLeave = () => {
		if (mainSwiper) mainSwiper.autoplay.start();
	};

	return (
		<HotelCardWrapper>
			{/* Image section with Swiper */}
			<HotelImageWrapper>
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
					loop={true} // Ensure infinite loop
					onSwiper={setMainSwiper} // Set the main swiper reference
					className='main-swiper'
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
				>
					{hotel.hotelPhotos.map((photo, idx) => (
						<SwiperSlide key={idx}>
							<div
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
						</SwiperSlide>
					))}
				</Swiper>

				{/* Thumbnail Navigation Swiper */}
				<Swiper
					modules={[Thumbs]}
					onSwiper={setThumbsSwiper} // Set the specific hotel thumbsSwiper
					spaceBetween={2} // Reduced space to 2 pixels between thumbnails
					slidesPerView={5} // Larger screens
					watchSlidesProgress
					className='thumbnail-swiper'
					breakpoints={{
						768: {
							slidesPerView: 3, // For smaller screens
						},
						1024: {
							slidesPerView: 5, // For larger screens
						},
					}}
				>
					{hotel.hotelPhotos.map((photo, idx) => (
						<SwiperSlide key={idx}>
							<ThumbnailImage
								src={photo.url}
								alt={`${hotel.hotelName} - ${idx + 1}`}
							/>
						</SwiperSlide>
					))}
				</Swiper>
			</HotelImageWrapper>

			{/* Hotel details section */}
			<HotelDetails>
				<div>
					<HotelName className='p-0 m-1'>{hotel.hotelName}</HotelName>
					<Location className='p-0 m-1'>
						{formatAddress(hotel.hotelAddress)}
					</Location>
					<StarRatings
						className='p-0 m-1'
						rating={hotel.hotelRating || 0}
						starRatedColor='orange'
						numberOfStars={5}
						name='rating'
						starDimension='15px'
						starSpacing='1px'
					/>

					{/* Display unique amenities, views, and extra amenities */}
					<AmenitiesWrapper className='p-0 m-1'>
						{visibleFeatures.map((feature, index) => (
							<AmenityItem key={index}>
								{getIcon(feature)} <span>{feature}</span>
							</AmenityItem>
						))}
					</AmenitiesWrapper>

					{/* Show more/less link */}
					{uniqueFeatures.length > 6 && (
						<ShowMoreText
							onClick={() => setShowAllAmenities(!showAllAmenities)}
						>
							{showAllAmenities ? "Show less..." : "Show more..."}
						</ShowMoreText>
					)}

					<PriceWrapper className='mt-3'>
						Starting from:{" "}
						<span>{hotel.roomCountDetails[0]?.price.basePrice} SAR</span> per
						night
					</PriceWrapper>
				</div>
			</HotelDetails>

			{/* Price and Offer section */}
			<PriceSection>
				{/* <OfferTag>Limited Offer</OfferTag> */}
				<FinalPrice>
					{/* <span className='old-price'>136 SAR</span> */}
					<span className='current-price'>
						{hotel.roomCountDetails[0]?.price.basePrice} SAR
					</span>
				</FinalPrice>
				<FreeCancellation>+ FREE CANCELLATION</FreeCancellation>
			</PriceSection>
		</HotelCardWrapper>
	);
};

const HotelList = ({ activeHotels }) => {
	return (
		<HotelListWrapper>
			{activeHotels && activeHotels.length > 0 ? (
				activeHotels.map((hotel, index) => (
					<HotelCard key={hotel._id || index} hotel={hotel} />
				))
			) : (
				<p>No hotels available</p>
			)}
		</HotelListWrapper>
	);
};

export default HotelList;

// Styled-components for the new show more text
const ShowMoreText = styled.span`
	color: var(--primaryBlue);
	cursor: pointer;
	font-weight: bold;
	text-decoration: underline;
	margin-top: 10px;
	display: inline-block;

	&:hover {
		color: var(--primaryBlueDarker);
	}

	@media (max-width: 750px) {
		font-size: 13px;
		margin-top: 5px;
	}
`;

// Styled-components for the component
const HotelListWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 20px;
	background-color: var(--neutral-light);
	overflow-x: hidden; /* Prevent horizontal scroll */

	.swiper-button-prev,
	.swiper-button-next {
		display: none !important; /* Remove navigation arrows */
	}

	.swiper-pagination-bullet {
		background-color: darkgrey !important; /* Inactive dot color */
	}

	.swiper-pagination-bullet-active {
		background-color: black !important; /* Active dot color */
	}
`;

const HotelCardWrapper = styled.div`
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

	/* Mobile view adjustments */
	@media (max-width: 768px) {
		display: block; /* Stack the elements vertically for mobile */
		padding: 0px;
	}

	/* Ensure that the images take full width for small screens */
	img {
		width: 100%;
		height: auto; /* Automatically adjust the height based on the width */
		object-fit: cover;
		border-radius: 10px;
		padding: 0px;
	}

	/* For tablets and larger screens, keep the grid layout */
	@media (min-width: 769px) {
		img {
			height: 300px; /* Adjust the height for larger screens */
			object-fit: cover; /* Ensure the image maintains its aspect ratio */
		}
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

	@media (max-width: 768px) {
		grid-column: 1 / -1; /* Make the image span the full width on mobile */

		.hotel-image {
			width: 100%;
			object-fit: cover;
			border-radius: 10px 10px 0 0; /* Optional: Rounded top corners */
			height: 240px;
		}
	}

	.thumbnail-swiper {
		margin-top: 2px; /* Reduced margin to ensure smaller gaps */
		width: 100%; /* Thumbnails take full width */

		.swiper-slide {
			opacity: 0.6;
			margin: 2px; /* Reduced margin to 2 pixels */
		}

		.swiper-slide-thumb-active {
			opacity: 1;
			border: 2px solid var(--primary-color); /* Highlight the active thumbnail */
			border-radius: 10px;
		}
	}
`;

const ThumbnailImage = styled.img`
	width: 100%;
	height: 60px !important; /* Smaller thumbnail size */
	object-fit: cover;
	border-radius: 10px;
	cursor: pointer;

	@media (max-width: 768px) {
		height: 60px;
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
		margin-top: 0px;
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
