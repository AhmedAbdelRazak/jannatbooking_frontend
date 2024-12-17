import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { gettingActiveHotelList, gettingDistinctRoomTypes } from "../apiCore";
import { Spin } from "antd";
import Search from "../components/OurHotels/Search";
import HotelList2 from "../components/OurHotels/HotelList2";
import SortDropdown from "../components/OurHotels/SortDropdown";
import { Helmet } from "react-helmet";
import favicon from "../favicon.ico";

const roomTypesMapping = [
	{ value: "standardRooms", label: "Standard Rooms" },
	{ value: "singleRooms", label: "Single Rooms" },
	{ value: "doubleRooms", label: "Double Rooms" },
	{ value: "twinRooms", label: "Twin Rooms" },
	{ value: "queenRooms", label: "Queen Rooms" },
	{ value: "kingRooms", label: "King Rooms" },
	{ value: "tripleRooms", label: "Triple Rooms" },
	{ value: "quadRooms", label: "Quad Rooms" },
	{ value: "studioRooms", label: "Studio Rooms" },
	{ value: "suite", label: "Suite" },
	{ value: "masterSuite", label: "Master Suite" },
	{ value: "familyRooms", label: "Family Rooms" },
	{ value: "individualBed", label: "Rooms With Individual Beds" },
];

const OurHotels = () => {
	const [activeHotels, setActiveHotels] = useState(null);
	const [loading, setLoading] = useState(true);
	const [distinctRoomTypes, setDistinctRoomTypes] = useState([]);
	const [sortOption, setSortOption] = useState(null);
	const [currency, setCurrency] = useState(null);

	// Fetch currency from localStorage
	const storedCurrency = localStorage.getItem("selectedCurrency");

	// Set the currency state
	useEffect(() => {
		setCurrency(storedCurrency || "sar"); // Default to "sar" if no currency is selected
	}, [storedCurrency]);

	useEffect(() => {
		window.scrollTo({ top: 30, behavior: "smooth" });
		const fetchDistinctRoomTypes = async () => {
			const data3 = await gettingDistinctRoomTypes();
			const distinctRoomTypesArray = [
				...new Set(
					data3.map((room) => {
						const mapping = roomTypesMapping.find(
							(map) => map.value === room.roomType
						);
						return mapping ? mapping.label : room.roomType;
					})
				),
			];
			setDistinctRoomTypes(distinctRoomTypesArray);
		};

		const fetchHotels = async () => {
			const hotelData = await gettingActiveHotelList();
			setActiveHotels(hotelData);
			setLoading(false);
		};

		fetchDistinctRoomTypes();
		fetchHotels();
	}, []);

	const sortedHotels = React.useMemo(() => {
		if (!activeHotels) return [];

		const parseDistance = (distanceString) => {
			if (!distanceString) return Infinity; // Treat missing distances as infinitely far
			const regex = /(\d+)\s*(days?|hours?|mins?)/g;
			let totalMinutes = 0;
			let match;

			// Extract all time units and convert them to minutes
			while ((match = regex.exec(distanceString)) !== null) {
				const value = parseInt(match[1], 10);
				const unit = match[2];
				if (unit.startsWith("day"))
					totalMinutes += value * 24 * 60; // Convert days to minutes
				else if (unit.startsWith("hour"))
					totalMinutes += value * 60; // Convert hours to minutes
				else if (unit.startsWith("min")) totalMinutes += value; // Keep minutes as is
			}

			return totalMinutes;
		};

		return [...activeHotels].sort((a, b) => {
			if (sortOption === "closest") {
				// Parse driving distances for sorting
				const distanceA = parseDistance(a.distances?.drivingToElHaram);
				const distanceB = parseDistance(b.distances?.drivingToElHaram);
				return distanceA - distanceB;
			} else if (sortOption === "price") {
				const basePriceA =
					a.roomCountDetails?.find((room) => room.roomType === "singleRooms")
						?.price?.basePrice || Infinity;
				const basePriceB =
					b.roomCountDetails?.find((room) => room.roomType === "singleRooms")
						?.price?.basePrice || Infinity;

				return basePriceA - basePriceB;
			}

			return 0; // No sorting
		});
	}, [activeHotels, sortOption]);

	return (
		<OurHotelsWrapper>
			<Helmet>
				<title>
					Explore the Best Haj and Umrah Hotels in Makkah & Madinah | Jannat
					Booking
				</title>

				<meta
					name='description'
					content='Book your stay at the best hotels in Makkah and Madinah for Haj and Umrah. Compare prices, amenities, and locations near Al Haram. Discover comfortable, affordable, and luxury hotels for your pilgrimage journey.'
				/>

				<meta
					name='keywords'
					content='Haj hotels, Umrah hotels, hotels in Makkah, hotels in Madinah, hotels near Al Haram, luxury hotels Makkah, budget hotels Madinah, family rooms, free Wi-Fi, parking, Haj and Umrah accommodations'
				/>

				{/* Open Graph Tags */}
				<meta
					property='og:title'
					content='Explore the Best Hotels in Makkah & Madinah for Haj and Umrah | Jannat Booking'
				/>
				<meta
					property='og:description'
					content='Find the top-rated hotels in Makkah and Madinah for your Haj and Umrah pilgrimage. Explore comfortable stays near Al Haram with great amenities.'
				/>
				<meta property='og:type' content='website' />
				<meta
					property='og:url'
					content='https://jannatbooking.com/our-hotels'
				/>
				<meta
					property='og:image'
					content='https://res.cloudinary.com/infiniteapps/image/upload/v1734109765/janat/1734109764527.jpg'
				/>

				{/* Twitter Card */}
				<meta name='twitter:card' content='summary_large_image' />
				<meta
					name='twitter:title'
					content='Book the Best Haj and Umrah Hotels in Makkah & Madinah | Jannat Booking'
				/>
				<meta
					name='twitter:description'
					content='Plan your Haj and Umrah pilgrimage with Jannat Booking. Browse top-rated hotels in Makkah and Madinah near Al Haram with great amenities.'
				/>
				<meta
					name='twitter:image'
					content='https://res.cloudinary.com/infiniteapps/image/upload/v1734109751/janat/1734109751072.jpg'
				/>

				{/* Canonical URL */}
				<link rel='canonical' href='https://jannatbooking.com/our-hotels' />

				{/* Favicon */}
				<link rel='icon' href={favicon} />
			</Helmet>

			<SearchSection>
				<Search
					distinctRoomTypes={distinctRoomTypes}
					roomTypesMapping={roomTypesMapping}
				/>
			</SearchSection>

			<SortDropdownSection>
				<SortDropdown
					sortOption={sortOption}
					setSortOption={setSortOption}
					currency={currency}
					setCurrency={setCurrency}
				/>
			</SortDropdownSection>

			<ContentWrapper>
				<HotelListSection>
					{loading ? (
						<SpinWrapper>
							<Spin size='large' />
						</SpinWrapper>
					) : (
						<HotelList2 activeHotels={sortedHotels} currency={currency} />
					)}
				</HotelListSection>
			</ContentWrapper>
		</OurHotelsWrapper>
	);
};

export default OurHotels;

// Styled Components
const OurHotelsWrapper = styled.div`
	width: 100%;
	padding: 70px 250px;
	background-color: #f9f9f9;
	margin-top: 290px;

	@media (max-width: 1000px) {
		padding: 70px 0px;
		margin-top: 310px;
	}
`;

const SearchSection = styled.div`
	width: 100%;
	margin-bottom: 0px;

	@media (max-width: 800px) {
		margin-top: 30px;
	}
`;

const SortDropdownSection = styled.div`
	width: 100%;
	text-align: right;

	@media (max-width: 768px) {
		text-align: left;
		margin-top: 80px;
		margin-bottom: -10px;
	}
`;

const ContentWrapper = styled.div`
	display: flex;
	width: 100%;
	gap: 20px;

	@media (max-width: 768px) {
		flex-direction: column;
		gap: 10px;
	}
`;

const HotelListSection = styled.div`
	width: 95%;

	@media (max-width: 768px) {
		width: 100%;
	}
`;

const SpinWrapper = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
	width: 100%;
`;
