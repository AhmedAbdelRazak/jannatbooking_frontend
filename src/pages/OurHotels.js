import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { gettingActiveHotelList } from "../apiCore";
import { Spin } from "antd"; // Import Spin component from Ant Design
import HotelList from "../components/OurHotels/HotelList";
import Search from "../components/OurHotels/Search"; // Your search component

const OurHotels = () => {
	const [activeHotels, setActiveHotels] = useState(null); // State for selected hotel
	const [loading, setLoading] = useState(true); // State for loading

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

	return (
		<OurHotelsWrapper>
			{/* Search bar for filtering hotels */}
			<SearchSection>
				<Search />
			</SearchSection>

			{/* Display hotel list or loading spinner */}
			<ContentWrapper>
				{/* Left section for filters (can add more filters later) */}
				<FilterSection>
					<h3>Filters (Coming Soon)</h3>
				</FilterSection>

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
		padding: 70px 10px;
	}
`;

const SearchSection = styled.div`
	width: 100%;
	margin-bottom: 80px;
`;

const ContentWrapper = styled.div`
	display: flex;
	width: 100%;
	gap: 20px;
`;

const FilterSection = styled.div`
	width: 25%;
	background-color: #fff;
	padding: 20px;
	border-radius: 10px;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const HotelListSection = styled.div`
	width: 75%;
`;

const SpinWrapper = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
	width: 100%;
`;
