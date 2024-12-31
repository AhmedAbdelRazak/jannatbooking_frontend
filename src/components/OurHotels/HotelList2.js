import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Swiper, SwiperSlide } from "swiper/react";
// eslint-disable-next-line
import { Pagination, Autoplay, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import StarRatings from "react-star-ratings";
import { amenitiesList, viewsList, extraAmenitiesList } from "../../Assets";
// eslint-disable-next-line
import { FaCar, FaWalking } from "react-icons/fa";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import { useCartContext } from "../../cart_context";

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

const translations = {
	English: {
		hotelRating: "Hotel Rating:",
		pricePerNight: "/ NIGHT",
		freeCancellation: "+ FREE CANCELLATION",
		drivingToHaram: "Driving to El Haram",
		showMore: "Show more...",
		showLess: "Show less...",
		receptionChat: "Reception Chat",
		available: "Available",
		SAR: "SAR",
		USD: "USD",
		EUR: "EUR",
	},
	Arabic: {
		hotelRating: "تقييم الفندق:",
		pricePerNight: "لليلة",
		freeCancellation: "+ إلغاء مجاني",
		drivingToHaram: "بالسيارة إلى الحرم",
		showMore: "عرض المزيد...",
		showLess: "عرض أقل...",
		receptionChat: "تحدث مباشرة مع الاستقبال",
		available: "متاح",
		SAR: "ريال",
		USD: "دولار",
		EUR: "يورو",
	},
};

// HotelCard component for individual hotels
const HotelCard = ({ hotel, currency, chosenLanguage }) => {
	const [thumbsSwiper, setThumbsSwiper] = useState(null); // Each hotel has its own thumbsSwiper
	const [mainSwiper, setMainSwiper] = useState(null); // Main swiper reference to control autoplay
	const [showAllAmenities, setShowAllAmenities] = useState(false); // State to show/hide all amenities
	const [convertedPrice, setConvertedPrice] = useState(null);

	const t = translations[chosenLanguage] || translations.English; // Get translations based on language

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

	useEffect(() => {
		const basePrice = hotel.roomCountDetails[0]?.price.basePrice || 0;
		const rates = JSON.parse(localStorage.getItem("rates")) || {
			SAR_USD: 0.27,
			SAR_EUR: 0.25,
		};

		if (currency === "usd") {
			setConvertedPrice((basePrice * rates.SAR_USD).toFixed(0));
		} else if (currency === "eur") {
			setConvertedPrice((basePrice * rates.SAR_EUR).toFixed(0));
		} else {
			setConvertedPrice(basePrice.toFixed(0)); // Default to SAR
		}
	}, [hotel, currency]);

	const handleChatClick = () => {
		const hotelNameSlug = hotel.hotelName.replace(/\s+/g, "-").toLowerCase();

		ReactGA.event({
			category: "Chat Window Opened From Hotel Card",
			action: "Chat Window Opened From Hotel Card",
			label: `Chat Window Opened From Hotel Card`,
		});

		ReactPixel.track("Chat Window Opened_OurHotels", {
			action: "User Opened Chat Window From Hotel Card",
			page: "Our Hotels",
		});

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
		<HotelCardWrapper isArabic={chosenLanguage === "Arabic"}>
			{/* Image section with Swiper */}
			<HotelImageWrapper>
				<Swiper
					modules={[Pagination, Thumbs]}
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
								onClick={() => {
									ReactGA.event({
										category: "User Nav To A HOTEL from Our Hotels Page",
										action: "User Nav To A HOTEL from Our Hotels Page",
										label: `User Nav To A HOTEL from Our Hotels Page`,
									});
									ReactPixel.track("User Clicked On A Hotel", {
										action: "Single Hotel Page Clicked",
										page: "Our Hotels",
									});

									window.location.href = `/single-hotel/${hotel.hotelName
										.replace(/\s+/g, "-")
										.toLowerCase()}`;
								}}
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
			<HotelDetails isArabic={chosenLanguage === "Arabic"}>
				<div>
					<HotelName
						className='p-0 m-0'
						style={{ textAlign: chosenLanguage === "Arabic" ? "center" : "" }}
					>
						{chosenLanguage === "Arabic" && hotel.hotelName_OtherLanguage
							? hotel.hotelName_OtherLanguage
							: hotel.hotelName}
					</HotelName>

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
							style={{
								fontSize: "10px",
								fontWeight: "bold",
								color: "#555",
							}}
						>
							{t.hotelRating}
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
					<PriceWrapper
						className='my-2'
						isArabic={chosenLanguage === "Arabic"}
						dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
					>
						{Number(
							convertedPrice * process.env.REACT_APP_COMMISSIONRATE
						).toFixed(0)}{" "}
						{t[currency.toUpperCase()]} {t.pricePerNight}{" "}
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
							{showAllAmenities ? t.showLess : t.showMore}
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
				<FreeCancellation isArabic={chosenLanguage === "Arabic"}>
					{t.freeCancellation}
				</FreeCancellation>
			</PriceSection>
			<div>
				<ReceptionChat
					isArabic={chosenLanguage === "Arabic"}
					className='float-right mr-3'
					onClick={handleChatClick}
				>
					{t.receptionChat}
					<div className='row'>
						<div className='col-3'></div>
						<div className='col-9'>
							<span
								style={{
									fontSize: chosenLanguage === "Arabic" ? "7px" : "7.5px",
									marginLeft: chosenLanguage === "Arabic" ? "" : "10px",
									marginRight: chosenLanguage === "Arabic" ? "10px" : "",
								}}
							>
								<span
									className='mx-1 status-dot'
									style={{
										backgroundColor: "#00ff00",
										padding: "0px 5px",
										borderRadius: "50%",
										animation: "blink 2.5s infinite",
										marginLeft: chosenLanguage === "Arabic" ? "12px" : "",
									}}
								></span>{" "}
								{chosenLanguage === "Arabic" ? null : t.available}
							</span>
						</div>
					</div>
				</ReceptionChat>
			</div>
		</HotelCardWrapper>
	);
};

const HotelList2 = ({ activeHotels, currency }) => {
	const { chosenLanguage } = useCartContext();

	return (
		<HotelListWrapper>
			{activeHotels && activeHotels.length > 0 ? (
				activeHotels.map((hotel, index) => (
					<HotelCard
						key={hotel._id || index}
						hotel={hotel}
						currency={currency}
						chosenLanguage={chosenLanguage}
					/>
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
	font-family: ${({ isArabic }) =>
		isArabic ? `"Droid Arabic Kufi", sans-serif !important` : ""};

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
		padding: 10px;
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
	font-family: ${({ isArabic }) =>
		isArabic ? `"Droid Arabic Kufi", sans-serif` : ""};

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

	div,
	span,
	section,
	p {
		font-family: ${({ isArabic }) =>
			isArabic ? `"Droid Arabic Kufi", sans-serif` : ""};
	}

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
	color: #006ed9;
	margin-bottom: 2px;
	text-transform: capitalize;
	font-weight: bold;
	line-height: 1.1;

	@media (max-width: 700px) {
		font-size: 0.85rem;
		margin-bottom: 0px;
		font-weight: normal;

		span {
			display: none;
		}
	}
`;

const Location = styled.h3`
	font-size: 1.25rem;
	color: #333;
	margin-bottom: 5px;
	text-transform: capitalize;

	@media (max-width: 750px) {
		font-size: 0.7rem;
		margin-bottom: 0px;
		white-space: nowrap; /* Prevent wrapping */
		overflow: hidden; /* Hide overflowing text */
		text-overflow: ellipsis; /* Add ellipses (...) to truncated text */
	}
`;

const PriceWrapper = styled.p`
	font-weight: bold;
	color: #444;
	line-height: 1;
	font-size: ${({ isArabic }) => (isArabic ? "1.4rem" : "1rem")};

	span {
		font-weight: bold;
		/* color: #1e90ff; */
	}

	@media (max-width: 800px) {
		margin: 0px;
		padding: 0px;
		font-size: 0.9rem;
		font-size: ${({ isArabic }) => (isArabic ? "1.4rem" : "0.9rem")};
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
	font-size: ${({ isArabic }) => (isArabic ? "1.1rem" : "0.9rem")};
	font-family: ${({ isArabic }) =>
		isArabic ? `"Droid Arabic Kufi", sans-serif` : ""};

	@media (max-width: 768px) {
		text-align: center;
		/* margin-top: 10px !important; */
		padding-top: 0px !important;
		font-size: 0.65rem;
		font-size: ${({ isArabic }) => (isArabic ? "0.85rem" : "0.65rem")};
	}
`;

const AmenitiesWrapper = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	grid-gap: 10px;
	margin-top: 15px;
	line-height: 1.1;

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
	font-family: ${({ isArabic }) =>
		isArabic ? `"Droid Arabic Kufi", sans-serif` : ""};

	@media (max-width: 800px) {
		width: 63% !important;
		margin-bottom: 10px;
		font-size: ${({ isArabic }) => (isArabic ? "9.5px" : "10px")};
	}
`;
