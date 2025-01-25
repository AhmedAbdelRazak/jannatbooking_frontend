import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom"; // to get the hotelNameSlug from the URL
import SingleHotel from "../components/SingleHotel/SingleHotel";
import { gettingSingleHotel } from "../apiCore";
import { Spin } from "antd"; // Import Spin component from Ant Design
// import { useCartContext } from "../cart_context";
import { Helmet } from "react-helmet";
import favicon from "../favicon.ico"; // Import your favicon

const SingleHotelMain = () => {
	const { hotelNameSlug } = useParams(); // Get hotelNameSlug from URL
	const [selectedHotel, setSelectedHotel] = useState(null); // State for selected hotel
	const [loading, setLoading] = useState(true); // State for loading
	// const { chosenLanguage } = useCartContext();
	// Fetch hotel details on component mount
	useEffect(() => {
		window.scrollTo({ top: 10, behavior: "smooth" });
		const fetchHotel = async () => {
			try {
				const hotelData = await gettingSingleHotel(hotelNameSlug); // Fetch hotel by slug
				setSelectedHotel(hotelData); // Set the response to selectedHotel state
				setLoading(false); // Stop loading after the hotel data is fetched
			} catch (error) {
				console.error("Error fetching hotel:", error);
				setLoading(false); // Stop loading even if there's an error
			}
		};

		if (hotelNameSlug) {
			fetchHotel();
		}
	}, [hotelNameSlug]); // Dependency array includes hotelNameSlug to trigger when slug changes

	const capitalize = (str) => {
		if (!str) return "";
		return str
			.split(" ")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(" ");
	};

	// Function to capitalize and format amenities
	const generateCapitalizedAmenities = (hotel) => {
		if (!hotel || !hotel.roomCountDetails) return "Top Amenities";
		const amenities = [
			...new Set(
				hotel.roomCountDetails.flatMap((room) => [
					...room.amenities,
					...room.views,
					...room.extraAmenities,
				])
			),
		];
		return amenities.slice(0, 5).map(capitalize).join(", ");
	};

	return (
		<SingleHotelMainWrapper>
			<Helmet>
				{/* Dynamic Title */}
				<title>
					{`Book ${capitalize(selectedHotel?.hotelName)} - ${capitalize(
						selectedHotel?.hotelCity
					)}, Near Al Haram | Jannat Booking`}
				</title>

				{/* Dynamic Meta Description */}
				<meta
					name='description'
					content={`Discover ${capitalize(selectedHotel?.hotelName)} located in ${capitalize(
						selectedHotel?.hotelCity
					)}, ${capitalize(selectedHotel?.hotelCountry)}. Enjoy amenities like ${generateCapitalizedAmenities(
						selectedHotel
					)}. Walking to Al Haram: ${selectedHotel?.distances?.walkingToElHaram}. Book a comfortable and affordable stay for Haj and Umrah now.`}
				/>

				{/* Dynamic Keywords */}
				<meta
					name='keywords'
					content={`Haj Hotels, Umrah Hotels, ${capitalize(
						selectedHotel?.hotelName
					)}, Hotels Near Al Haram, ${generateCapitalizedAmenities(
						selectedHotel
					)}, Hotels In ${capitalize(selectedHotel?.hotelCity)}, Luxury Rooms, Family Rooms`}
				/>

				{/* Open Graph for Social Media */}
				<meta
					property='og:title'
					content={`Stay at ${capitalize(selectedHotel?.hotelName)} in ${capitalize(
						selectedHotel?.hotelCity
					)} - Book Now`}
				/>
				<meta
					property='og:description'
					content={`Experience a comfortable stay at ${capitalize(
						selectedHotel?.hotelName
					)} with amenities like ${generateCapitalizedAmenities(
						selectedHotel
					)}. Located in ${capitalize(selectedHotel?.hotelCity)}, near Al Haram.`}
				/>
				<meta
					property='og:image'
					content={
						selectedHotel?.hotelPhotos?.[0]?.url ||
						"https://res.cloudinary.com/infiniteapps/image/upload/v1734109751/janat/1734109751072.jpg"
					}
				/>
				<meta
					property='og:url'
					content={`https://jannatbooking.com/single-hotel/${selectedHotel?.hotelName
						?.replace(/\s+/g, "-")
						.toLowerCase()}`}
				/>
				<meta property='og:type' content='website' />

				{/* Twitter Card */}
				<meta name='twitter:card' content='summary_large_image' />
				<meta
					name='twitter:title'
					content={`Stay at ${capitalize(selectedHotel?.hotelName)} - Near Al Haram`}
				/>
				<meta
					name='twitter:description'
					content={`Book ${capitalize(selectedHotel?.hotelName)} in ${capitalize(
						selectedHotel?.hotelCity
					)}, close to Al Haram. Enjoy great amenities and spacious rooms for Haj & Umrah.`}
				/>
				<meta
					name='twitter:image'
					content={
						selectedHotel?.hotelPhotos?.[0]?.url ||
						"https://res.cloudinary.com/infiniteapps/image/upload/v1734109751/janat/1734109751072.jpg"
					}
				/>

				{/* Canonical URL */}
				<link
					rel='canonical'
					href={`https://jannatbooking.com/single-hotel/${selectedHotel?.hotelName
						?.replace(/\s+/g, "-")
						.toLowerCase()}`}
				/>

				{/* Favicon */}
				<link rel='icon' href={favicon} />
			</Helmet>
			{/* Show the Spin component while loading is true */}
			{loading ? (
				<SpinWrapper>
					<Spin size='large' />
				</SpinWrapper>
			) : (
				<>
					{selectedHotel && selectedHotel.hotelName ? (
						<SingleHotel selectedHotel={selectedHotel} />
					) : null}
				</>
			)}
		</SingleHotelMainWrapper>
	);
};

export default SingleHotelMain;

const SingleHotelMainWrapper = styled.div`
	min-height: 800px;
	background-color: white;
`;

const SpinWrapper = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh; // Full height of the viewport
`;
