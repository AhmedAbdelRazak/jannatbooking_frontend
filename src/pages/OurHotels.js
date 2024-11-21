import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { gettingActiveHotelList, gettingDistinctRoomTypes } from "../apiCore";
import { Spin, Drawer } from "antd"; // Import Spin, Drawer, and Button from Ant Design
// eslint-disable-next-line
import { FilterOutlined } from "@ant-design/icons"; // Import filter icon
// eslint-disable-next-line
import HotelList from "../components/OurHotels/HotelList";
import Search from "../components/OurHotels/Search"; // Your search component
import HotelList2 from "../components/OurHotels/HotelList2";

const OurHotels = () => {
	const [activeHotels, setActiveHotels] = useState(null); // State for selected hotel
	const [loading, setLoading] = useState(true); // State for loading
	const [drawerVisible, setDrawerVisible] = useState(false); // Drawer state for smaller screens
	const [distinctRoomTypes, setDistinctRoomTypes] = useState([]); // Initialize as an array

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
		const gettingDistinctRooms = () => {
			gettingDistinctRoomTypes().then((data3) => {
				if (data3.error) {
					console.log(data3.error);
				} else {
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
		};

		gettingDistinctRooms();

		window.scrollTo({ top: 50, behavior: "smooth" });
		const fetchHotel = async () => {
			try {
				const hotelData = await gettingActiveHotelList(); // Fetch hotels
				setActiveHotels(hotelData); // Set response to activeHotels state
				setLoading(false); // Stop loading after fetching data
			} catch (error) {
				console.error("Error fetching hotels:", error);
				setLoading(false); // Stop loading even if there's an error
			}
		};

		fetchHotel();
		// eslint-disable-next-line
	}, []);

	// Drawer functions
	// eslint-disable-next-line
	const showDrawer = () => {
		setDrawerVisible(true);
	};

	const closeDrawer = () => {
		setDrawerVisible(false);
	};

	return (
		<OurHotelsWrapper>
			{/* Search bar for filtering hotels */}
			<SearchSection>
				<Search
					distinctRoomTypes={distinctRoomTypes}
					roomTypesMapping={roomTypesMapping}
				/>
			</SearchSection>

			{/* Filter button for mobile view */}
			{/* <MobileFilterButton onClick={showDrawer}>
                <FilterOutlined /> Filters
            </MobileFilterButton> */}

			{/* Drawer for filters */}
			<Drawer
				title='Filters'
				placement='left'
				onClose={closeDrawer}
				visible={drawerVisible}
			>
				<h3>Filters (Coming Soon)</h3>
			</Drawer>

			{/* Display hotel list or loading spinner */}
			<ContentWrapper>
				{/* Left section for filters (on larger screens) */}
				{/* <FilterSection>
                    <h3>Filters (Coming Soon)</h3>
                </FilterSection> */}

				{/* Hotel list or loading spinner */}
				<HotelListSection>
					{/* {loading ? (
						<SpinWrapper>
							<Spin size='large' />
						</SpinWrapper>
					) : (
						<HotelList activeHotels={activeHotels} />
					)} */}

					{loading ? (
						<SpinWrapper>
							<Spin size='large' />
						</SpinWrapper>
					) : (
						<HotelList2 activeHotels={activeHotels} />
					)}
				</HotelListSection>
			</ContentWrapper>
		</OurHotelsWrapper>
	);
};

export default OurHotels;

// Styled-components
const OurHotelsWrapper = styled.div`
	width: 100%;
	padding: 70px 250px;
	background-color: #f9f9f9;
	margin-top: 290px;

	@media (max-width: 1000px) {
		padding: 70px 0px;
		margin-top: 410px;
	}
`;

const SearchSection = styled.div`
	width: 100%;
	margin-bottom: 50px;

	@media (max-width: 800px) {
		margin-top: 30px;
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
