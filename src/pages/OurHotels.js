import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { gettingActiveHotelList } from "../apiCore";
import { Spin, Drawer, Button } from "antd"; // Import Spin, Drawer, and Button from Ant Design
// eslint-disable-next-line
import { FilterOutlined } from "@ant-design/icons"; // Import filter icon
import HotelList from "../components/OurHotels/HotelList";
import Search from "../components/OurHotels/Search"; // Your search component

const OurHotels = () => {
	const [activeHotels, setActiveHotels] = useState(null); // State for selected hotel
	const [loading, setLoading] = useState(true); // State for loading
	const [drawerVisible, setDrawerVisible] = useState(false); // Drawer state for smaller screens

	// Fetch hotel details on component mount
	useEffect(() => {
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
				<Search fromPage='OurHotels' />
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
					{loading ? (
						<SpinWrapper>
							<Spin size='large' />
						</SpinWrapper>
					) : (
						<HotelList activeHotels={activeHotels} />
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

	@media (max-width: 1000px) {
		padding: 70px 0px;
		margin-top: 310px;
	}
`;

const SearchSection = styled.div`
	width: 100%;
	margin-bottom: 50px;

	@media (max-width: 800px) {
		/* display: none; */
	}
`;

const ContentWrapper = styled.div`
	display: flex;
	width: 100%;
	gap: 20px;

	@media (max-width: 768px) {
		flex-direction: column;
		gap: 10px; // Reduce the gap for better spacing on smaller screens
	}
`;

// eslint-disable-next-line
const FilterSection = styled.div`
	width: 25%;
	background-color: #fff;
	padding: 20px;
	border-radius: 10px;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	@media (max-width: 768px) {
		display: none; /* Hide filters section on smaller screens */
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

// eslint-disable-next-line
const MobileFilterButton = styled(Button)`
	display: none;
	margin-top: 30px;
	margin-left: 20px;

	@media (max-width: 768px) {
		display: block;
	}
`;
