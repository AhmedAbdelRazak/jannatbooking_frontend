import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useParams, useLocation } from "react-router-dom";
import SingleHotel from "../components/SingleHotel/SingleHotel";
import { gettingSingleHotel } from "../apiCore";
import { Spin } from "antd";
import { Helmet } from "react-helmet";
import favicon from "../favicon.ico";

const SingleHotelMain = () => {
	const { hotelNameSlug } = useParams();
	const location = useLocation();

	const [selectedHotel, setSelectedHotel] = useState(null);
	const [loading, setLoading] = useState(true);

	const initialSection = useMemo(() => {
		const params = new URLSearchParams(location.search);
		const raw = (
			params.get("section") ||
			params.get("tab") ||
			params.get("goto") ||
			""
		).toLowerCase();
		const s = location.search.toLowerCase();
		const normalize = (x) => (x === "offers" ? "packages" : x);

		if (raw) return normalize(raw);
		if (s.includes("packages") || s.includes("offers") || s.includes("deals"))
			return "packages";
		if (s.includes("rooms")) return "rooms";
		return "";
	}, [location.search]);

	useEffect(() => {
		window.scrollTo({ top: 10, behavior: "smooth" });
		const fetchHotel = async () => {
			try {
				const hotelData = await gettingSingleHotel(hotelNameSlug);
				setSelectedHotel(hotelData);
			} catch (error) {
				console.error("Error fetching hotel:", error);
				setSelectedHotel(null);
			} finally {
				setLoading(false);
			}
		};
		if (hotelNameSlug) fetchHotel();
	}, [hotelNameSlug]);

	const capitalize = (str) => {
		if (!str) return "";
		return str
			.split(" ")
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
			.join(" ");
	};

	const toSlug = (str) =>
		typeof str === "string" && str.trim()
			? str.trim().replace(/\s+/g, "-").toLowerCase()
			: "";

	const hotelSlugForSeo = useMemo(
		() => toSlug(selectedHotel?.hotelName),
		[selectedHotel?.hotelName]
	);

	const generateCapitalizedAmenities = (hotel) => {
		if (!hotel || !hotel.roomCountDetails) return "Top Amenities";
		const amenities = [
			...new Set(
				hotel.roomCountDetails.flatMap((room) => [
					...(room.amenities || []),
					...(room.views || []),
					...(room.extraAmenities || []),
				])
			),
		];
		return amenities.slice(0, 5).map(capitalize).join(", ");
	};

	return (
		<SingleHotelMainWrapper>
			<Helmet>
				<title>
					{`Book ${capitalize(selectedHotel?.hotelName)} - ${capitalize(
						selectedHotel?.hotelCity
					)}, Near Al Haram | Jannat Booking`}
				</title>

				<meta
					name='description'
					content={`Discover ${capitalize(selectedHotel?.hotelName)} located in ${capitalize(
						selectedHotel?.hotelCity
					)}, ${capitalize(selectedHotel?.hotelCountry)}. Enjoy amenities like ${generateCapitalizedAmenities(
						selectedHotel
					)}. Walking to Al Haram: ${selectedHotel?.distances?.walkingToElHaram}. Book a comfortable and affordable stay for Haj and Umrah now.`}
				/>
				<meta
					name='keywords'
					content={`Haj Hotels, Umrah Hotels, ${capitalize(selectedHotel?.hotelName)}, Hotels Near Al Haram, ${generateCapitalizedAmenities(
						selectedHotel
					)}, Hotels In ${capitalize(selectedHotel?.hotelCity)}, Luxury Rooms, Family Rooms`}
				/>

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
					content={`https://jannatbooking.com/single-hotel/${hotelSlugForSeo}`}
				/>
				<meta property='og:type' content='website' />

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

				<link
					rel='canonical'
					href={`https://jannatbooking.com/single-hotel/${hotelSlugForSeo}`}
				/>
				<link rel='icon' href={favicon} />
			</Helmet>

			{loading ? (
				<SpinWrapper>
					<Spin size='large' />
				</SpinWrapper>
			) : (
				<>
					{selectedHotel && selectedHotel.hotelName ? (
						<SingleHotel
							selectedHotel={selectedHotel}
							initialSection={initialSection}
						/>
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
	height: 100vh;
`;
