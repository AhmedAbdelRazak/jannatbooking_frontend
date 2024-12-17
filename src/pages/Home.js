import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Hero from "../components/Home/Hero";
import Search from "../components/Home/Search";
import PopularHotels from "../components/Home/PopularHotels";
import {
	gettingActiveHotels,
	gettingDistinctRoomTypes,
	gettingJannatWebsiteData,
} from "../apiCore";
import { Spin } from "antd";
import Section2 from "../components/Home/Section2";
import { Helmet } from "react-helmet";
import favicon from "../favicon.ico";

const Home = () => {
	const [homePage, setHomePage] = useState("");
	const [activeHotels, setActiveHotels] = useState([]);
	const [generalRoomTypes, setGeneralRoomTypes] = useState("");
	const [distinctRoomTypes, setDistinctRoomTypes] = useState("");
	const [loading, setLoading] = useState(true);

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

	useEffect(() => {
		const gettingAllHomes = () => {
			setLoading(true);
			gettingJannatWebsiteData().then((data) => {
				if (!data.error) setHomePage(data[data.length - 1]);

				gettingActiveHotels().then((data2) => {
					if (!data2.error) {
						setActiveHotels(data2);
						setLoading(false);
					}
				});

				gettingDistinctRoomTypes().then((data3) => {
					if (!data3.error) {
						setGeneralRoomTypes(data3);

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
					}
				});
			});
		};
		gettingAllHomes();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const generateHotelNames = (hotels) => {
		return hotels.map((hotel) => hotel.hotelName).join(", ");
	};

	const generateAmenitiesList = (hotels) => {
		const amenities = [];
		hotels.forEach((hotel) => {
			const roomAmenities = hotel.roomCountDetails[0]?.amenities || [];
			roomAmenities.forEach((amenity) => {
				if (!amenities.includes(amenity)) amenities.push(amenity);
			});
		});
		return amenities.join(", ");
	};

	return (
		<>
			<Helmet>
				<title>Jannat Booking | Book Haj & Omrah Hotels with Ease</title>
				<meta
					name='description'
					content={`Explore the most popular hotels for Haj and Omrah with Jannat Booking. Top hotels include ${generateHotelNames(
						activeHotels
					)}. Enjoy amenities like ${generateAmenitiesList(
						activeHotels
					)} and find rooms that match your needs, from Standard Rooms to Luxury Suites.`}
				/>
				<meta
					name='keywords'
					content={`Jannat Booking, Haj hotels, Omrah hotels, popular hotels, ${generateHotelNames(
						activeHotels
					)}, ${generateAmenitiesList(activeHotels)}, Standard Rooms, Luxury Suites, best accommodations`}
				/>

				{/* Open Graph Tags */}
				<meta
					property='og:title'
					content='Jannat Booking | Find Haj & Omrah Hotels'
				/>
				<meta
					property='og:description'
					content={`Explore the best Haj and Omrah hotels: ${generateHotelNames(
						activeHotels
					)}. Top amenities include ${generateAmenitiesList(
						activeHotels
					)}. Secure your booking now!`}
				/>
				<meta property='og:url' content='https://jannatbooking.com' />
				<meta
					property='og:image'
					content='https://res.cloudinary.com/infiniteapps/image/upload/v1734109765/janat/1734109764527.jpg'
				/>
				<meta property='og:type' content='website' />
				<meta property='og:locale' content='en_US' />

				{/* Twitter Card */}
				<meta name='twitter:card' content='summary_large_image' />
				<meta
					name='twitter:title'
					content='Jannat Booking | Best Haj & Omrah Hotels'
				/>
				<meta
					name='twitter:description'
					content={`Top hotels: ${generateHotelNames(
						activeHotels
					)}. Enjoy premium amenities like ${generateAmenitiesList(
						activeHotels
					)}.`}
				/>
				<meta
					name='twitter:image'
					content='https://res.cloudinary.com/infiniteapps/image/upload/v1734109751/janat/1734109751072.jpg'
				/>

				{/* Canonical URL */}
				<link rel='canonical' href='https://jannatbooking.com' />

				{/* Favicon */}
				<link rel='icon' href={favicon} />
			</Helmet>

			<HomeWrapper>
				{homePage && <Hero homePage={homePage} />}

				{distinctRoomTypes && (
					<div>
						<Search
							distinctRoomTypes={distinctRoomTypes}
							roomTypesMapping={roomTypesMapping}
						/>
					</div>
				)}

				<div>
					<Section2 />
				</div>

				{activeHotels && generalRoomTypes && !loading ? (
					<div>
						<PopularHotels
							activeHotels={activeHotels}
							generalRoomTypes={generalRoomTypes}
						/>
					</div>
				) : (
					<SpinWrapper>
						<Spin size='large' />
					</SpinWrapper>
				)}
			</HomeWrapper>
		</>
	);
};

export default Home;

const HomeWrapper = styled.div`
	min-height: 1600px;
`;

const SpinWrapper = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 200vh;
`;
