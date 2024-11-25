import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import StarRatings from "react-star-ratings";
import { amenitiesList, viewsList, extraAmenitiesList } from "../../Assets";
// eslint-disable-next-line
import { FaCar, FaWalking } from "react-icons/fa";

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

	const handleChatClick = () => {
		const hotelNameSlug = hotel.hotelName.replace(/\s+/g, "-").toLowerCase();

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

	const combinedFeatures = [
		...hotel.roomCountDetails.flatMap((room) => room.amenities),
		...hotel.roomCountDetails.flatMap((room) => room.views),
		...hotel.roomCountDetails.flatMap((room) => room.extraAmenities),
	];

	const uniqueFeatures = [...new Set(combinedFeatures)]; // Get unique features

	// Determine visible features based on state
	const visibleFeatures = showAllAmenities
		? uniqueFeatures
		: uniqueFeatures.slice(0, 2);

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
					<HotelName className='p-0 m-0'>{hotel.hotelName}</HotelName>
					<Location className='p-0 m-0'>
						{formatAddress(hotel.hotelAddress)
							.split(",")
							.slice(0, 2)
							.join(", ")}
					</Location>
					<div
						className='m-0 p-0'
						style={{ display: "flex", alignItems: "center", gap: "2px" }}
					>
						<span
							style={{ fontSize: "10px", fontWeight: "bold", color: "#555" }}
						>
							Hotel Rating
						</span>
						<StarRatings
							className='p-0 m-0'
							rating={hotel.hotelRating || 0}
							starRatedColor='orange'
							numberOfStars={5}
							name='rating'
							starDimension='15px'
							starSpacing='1px'
						/>
					</div>
					<PriceWrapper className='mb-2'>
						{/* Starting From:{" "} */}
						<span
							style={{
								fontWeight: "bolder",
								// textDecoration: "underline",
								fontSize: "1.5rem",
								color: "black",
							}}
						>
							SAR {hotel.roomCountDetails[0]?.price.basePrice}
						</span>{" "}
						<span style={{ fontSize: "0.85rem" }}>/ NIGHT</span>
					</PriceWrapper>
					{/* Display unique amenities, views, and extra amenities */}
					<AmenitiesWrapper className='p-0 mt-1'>
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
					<Distances className='mt-1'>
						<FaCar /> {hotel.distances?.drivingToElHaram} <span>Driving</span>{" "}
						to El Haram
					</Distances>
					{/* <Distances>
						<FaWalking /> {hotel.distances?.walkingToElHaram} Walking to El
						Haram
					</Distances> */}
				</div>
			</HotelDetails>

			{/* Price and Offer section */}
			<div className='habal'></div>

			<PriceSection>
				{/* <OfferTag>Limited Offer</OfferTag> */}
				{/* <FinalPrice>
					<span className='old-price'>136 SAR</span>
					<span className='current-price'>
						{hotel.roomCountDetails[0]?.price.basePrice} SAR
					</span>
				</FinalPrice> */}
				<FreeCancellation>+ FREE CANCELLATION</FreeCancellation>
			</PriceSection>
			<div>
				<ReceptionChat className='float-right mr-3' onClick={handleChatClick}>
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
		</HotelCardWrapper>
	);
};

const HotelList2 = ({ activeHotels }) => {
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

export default HotelList2;

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
		font-size: 12px;
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

	.star-container,
	svg,
	.widget-svg {
		padding-top: -20px !important;
		margin-top: -3px !important;
	}

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

	@media (max-width: 800px) {
		.habal {
			display: none;
		}
	}
`;

const HotelCardWrapper = styled.div`
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
		gap: 10px;
		padding: 0px;
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
		.hotel-image {
			height: 200px; /* Adjust height for smaller screens */
			object-fit: cover;
			border-radius: 5px;
		}
	}
`;

const HotelDetails = styled.div`
	padding: 0 15px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;

	@media (max-width: 768px) {
		padding: 0 0px;
		margin-top: 15px;
	}
`;

const ThumbnailImage = styled.img`
	width: 100%;
	height: 60px !important; /* Smaller thumbnail size */
	object-fit: cover;
	border-radius: 10px;
	cursor: pointer;

	/* @media (max-width: 768px) {
		height: 60px;
	} */

	@media (max-width: 700px) {
		display: none;
	}
`;

const HotelName = styled.p`
	font-size: 1rem;
	color: #555;
	margin-bottom: 0px;
	text-transform: capitalize;
	font-weight: bold;

	@media (max-width: 700px) {
		font-size: 1.1rem;
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
		font-weight: bold;

		span {
			display: none;
		}
	}
`;

const Location = styled.p`
	color: var(--text-color-secondary);
	font-size: 1rem;
	margin-bottom: 0px;
	text-transform: capitalize;

	@media (max-width: 700px) {
		font-size: 0.7rem;
	}
`;

const PriceWrapper = styled.p`
	font-size: 1rem;
	color: var(--text-color-primary);

	span {
		font-weight: bold;
		color: var(--secondary-color);
	}

	@media (max-width: 700px) {
		font-size: 0.9rem;
		font-weight: bold;
		margin: 0px !important;
		padding: 0px !important;
	}
`;

const PriceSection = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	justify-content: space-between;

	@media (max-width: 768px) {
		align-items: center;
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

// eslint-disable-next-line
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
	margin-top: 12px;
	color: #34679b;

	@media (max-width: 768px) {
		text-align: center;
		/* margin-top: 10px !important; */
		padding-top: 0px !important;
		font-size: 0.72rem;
	}
`;

const AmenitiesWrapper = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	grid-gap: 10px;
	margin-top: 15px;

	@media (max-width: 768px) {
		grid-template-columns: repeat(2, 1fr);
		margin-top: 5px !important;
		padding-top: 0px !important;
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

const ReceptionChat = styled.div`
	background-color: darkorange;
	padding: 3px 7px;
	border-radius: 5px;
	font-size: 11px;
	font-weight: bold;
	color: white;
	align-items: center;
	cursor: pointer;

	@media (max-width: 800px) {
		width: 50% !important;
		margin-bottom: 10px;
	}

	.status-dot {
		width: 8px; /* Size of the green dot */
		height: 8px;
		background-color: green;
		border-radius: 50%;
	}
`;
