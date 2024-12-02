import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { gettingActiveHotelList, gettingDistinctRoomTypes } from "../apiCore";
import { Spin } from "antd";
import Search from "../components/OurHotels/Search";
import HotelList2 from "../components/OurHotels/HotelList2";
import SortDropdown from "../components/OurHotels/SortDropdown";

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

		return [...activeHotels].sort((a, b) => {
			if (sortOption === "closest") {
				const parseDistance = (distanceString) => {
					if (!distanceString) return Infinity;
					const regex = /(\d+)\s*(days|hours|mins)/g;
					let totalMinutes = 0;
					let match;

					while ((match = regex.exec(distanceString)) !== null) {
						const value = parseInt(match[1], 10);
						const unit = match[2];
						if (unit === "days") totalMinutes += value * 24 * 60;
						if (unit === "hours") totalMinutes += value * 60;
						if (unit === "mins") totalMinutes += value;
					}

					return totalMinutes;
				};

				const distanceA = parseDistance(a.distances?.walkingToElHaram);
				const distanceB = parseDistance(b.distances?.walkingToElHaram);

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

			return 0;
		});
	}, [activeHotels, sortOption]);

	return (
		<OurHotelsWrapper>
			<SearchSection>
				<Search
					distinctRoomTypes={distinctRoomTypes}
					roomTypesMapping={roomTypesMapping}
				/>
			</SearchSection>

			<SortDropdownSection>
				<SortDropdown sortOption={sortOption} setSortOption={setSortOption} />
			</SortDropdownSection>

			<ContentWrapper>
				<HotelListSection>
					{loading ? (
						<SpinWrapper>
							<Spin size='large' />
						</SpinWrapper>
					) : (
						<HotelList2 activeHotels={sortedHotels} />
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
	margin-bottom: 50px;

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
