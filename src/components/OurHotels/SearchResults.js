import React from "react";
import styled from "styled-components";

const SearchResults = ({ initialSearchParams }) => {
	const { dates, destination, roomType, adults, children } =
		initialSearchParams;

	// Format the date range
	const formattedDates =
		dates && dates.length === 2
			? `Selected Range: ${dates[0].format("YYYY-MM-DD")} to ${dates[1].format("YYYY-MM-DD")}`
			: "N/A";

	// Format the remainder parameters
	const formattedDetails = `${destination || "N/A"}, Room Type: ${
		roomType || "N/A"
	}, Adults: ${adults || 0}, Children: ${children || 0}`;

	return (
		<SearchResultsWrapper>
			<div className='header'>Search Results:</div>
			<StyledDates>{formattedDates}</StyledDates>
			<StyledDetails>{formattedDetails}</StyledDetails>
		</SearchResultsWrapper>
	);
};

// Styled-components
const SearchResultsWrapper = styled.div`
	display: flex;
	flex-direction: column; /* Stack the lines vertically */
	/* align-items: center; */
	justify-content: center;
	margin: 20px 0;
	gap: 5px; /* Add spacing between lines */
	margin-top: -120px;
	margin-bottom: 55px;

	@media (min-width: 600px) {
		display: none;
	}

	.header {
		text-align: left !important;
		font-weight: bold;
		line-height: 0.7;

		margin-left: 10px;
	}
`;

const StyledDates = styled.div`
	font-size: 1rem;
	/* font-weight: bold; */
	color: #333;
	background-color: #f9f9f9;
	padding: 8px 15px;
	border-radius: 10px;
	/* border: 1px solid #ddd; */
	width: 100%;
	max-width: 600px; /* Limit width for better responsiveness */
	/* box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); */
	line-height: 1;

	@media (max-width: 768px) {
		font-size: 0.8rem;
		padding: 6px 10px;
		max-width: 100%;
	}
`;

const StyledDetails = styled.div`
	font-size: 0.9rem;
	/* font-weight: bold; */
	color: #555;
	background-color: #f9f9f9;
	padding: 8px 15px;
	border-radius: 10px;
	/* border: 1px solid #ddd; */
	width: 100%;
	max-width: 600px; /* Limit width for better responsiveness */
	/* box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); */
	white-space: nowrap; /* Prevent wrapping */
	overflow: hidden; /* Hide overflowing text */
	text-overflow: ellipsis; /* Add ellipsis for overflowing text */
	line-height: 0;

	@media (max-width: 768px) {
		font-size: 0.8rem;
		padding: 6px 10px;
		max-width: 100%;
	}
`;

export default SearchResults;
