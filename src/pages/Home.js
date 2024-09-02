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

const Home = () => {
	const [homePage, setHomePage] = useState("");
	const [activeHotels, setActiveHotels] = useState("");
	const [generalRoomTypes, setGeneralRoomTypes] = useState("");
	const [distinctRoomTypes, setDistinctRoomTypes] = useState("");

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

	const gettingAllHomes = () => {
		gettingJannatWebsiteData().then((data) => {
			if (data.error) {
				console.log(data.error);
			} else {
				setHomePage(data[data.length - 1]);

				gettingActiveHotels().then((data2) => {
					if (data2.error) {
						console.log(data2.error);
					} else {
						setActiveHotels(data2);
					}
				});

				gettingDistinctRoomTypes().then((data3) => {
					if (data3.error) {
						console.log(data3.error);
					} else {
						setGeneralRoomTypes(data3);

						// Extract and map distinct room types
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
			}
		});
	};

	useEffect(() => {
		gettingAllHomes();
		// eslint-disable-next-line
	}, []);

	return (
		<HomeWrapper>
			{homePage ? <Hero homePage={homePage} /> : null}

			{distinctRoomTypes ? (
				<Search distinctRoomTypes={distinctRoomTypes} />
			) : null}

			{activeHotels && generalRoomTypes ? (
				<div className='py-5' style={{ marginTop: "800px" }}>
					<PopularHotels
						activeHotels={activeHotels}
						generalRoomTypes={generalRoomTypes}
					/>
				</div>
			) : null}
		</HomeWrapper>
	);
};

export default Home;

const HomeWrapper = styled.div`
	min-height: 2000px;
`;
