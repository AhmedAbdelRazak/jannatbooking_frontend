import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom"; // to get the hotelNameSlug from the URL
import SingleHotel from "../components/SingleHotel/SingleHotel";
import { gettingSingleHotel } from "../apiCore";
import { Spin } from "antd"; // Import Spin component from Ant Design

const SingleHotelMain = () => {
	const { hotelNameSlug } = useParams(); // Get hotelNameSlug from URL
	const [selectedHotel, setSelectedHotel] = useState(null); // State for selected hotel
	const [loading, setLoading] = useState(true); // State for loading

	// Fetch hotel details on component mount
	useEffect(() => {
		window.scrollTo({ top: 70, behavior: "smooth" });
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

	return (
		<SingleHotelMainWrapper>
			{/* Show the Spin component while loading is true */}
			{loading ? (
				<SpinWrapper>
					<Spin size='large' />
				</SpinWrapper>
			) : (
				<SingleHotel selectedHotel={selectedHotel} />
			)}
		</SingleHotelMainWrapper>
	);
};

export default SingleHotelMain;

const SingleHotelMainWrapper = styled.div`
	min-height: 800px;
`;

const SpinWrapper = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh; // Full height of the viewport
`;
