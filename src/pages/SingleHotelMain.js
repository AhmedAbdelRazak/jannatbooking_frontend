import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom"; // to get the hotelNameSlug from the URL
import SingleHotel from "../components/SingleHotel/SingleHotel";
import { gettingSingleHotel } from "../apiCore";

const SingleHotelMain = () => {
	const { hotelNameSlug } = useParams(); // Get hotelNameSlug from URL
	const [selectedHotel, setSelectedHotel] = useState(null); // State for selected hotel

	// Fetch hotel details on component mount

	useEffect(() => {
		const fetchHotel = async () => {
			try {
				const hotelData = await gettingSingleHotel(hotelNameSlug); // Fetch hotel by slug
				console.log(hotelData, "hotelData");
				setSelectedHotel(hotelData); // Set the response to selectedHotel state
			} catch (error) {
				console.error("Error fetching hotel:", error);
			}
		};

		if (hotelNameSlug) {
			fetchHotel();
		}
	}, [hotelNameSlug]); // Dependency array includes hotelNameSlug to trigger when slug changes

	console.log(selectedHotel, "selectedHotel");
	return (
		<SingleHotelMainWrapper>
			{/* Pass the selectedHotel state as a prop to the SingleHotel component */}
			<SingleHotel selectedHotel={selectedHotel} />
		</SingleHotelMainWrapper>
	);
};

export default SingleHotelMain;

const SingleHotelMainWrapper = styled.div`
	min-height: 800px;
`;
