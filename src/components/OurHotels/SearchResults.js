import React from "react";
import styled from "styled-components";
import { useCartContext } from "../../cart_context";

const SearchResults = ({ initialSearchParams }) => {
	const { dates, destination, roomType, adults, children } =
		initialSearchParams;

	const { chosenLanguage } = useCartContext();

	// Format the date range
	const formattedDates =
		dates && dates.length === 2
			? chosenLanguage === "Arabic"
				? `النطاق المختار: ${dates[0].format("YYYY-MM-DD")} إلى ${dates[1].format("YYYY-MM-DD")}`
				: `Selected Range: ${dates[0].format("YYYY-MM-DD")} to ${dates[1].format("YYYY-MM-DD")}`
			: chosenLanguage === "Arabic"
				? "غير متوفر"
				: "N/A";

	// Format the remainder parameters
	const formattedDetails =
		chosenLanguage === "Arabic"
			? `${destination || "غير متوفر"}, نوع الغرفة: ${
					roomType || "غير متوفر"
				}, بالغين: ${adults || 0}, أطفال: ${children || 0}`
			: `${destination || "N/A"}, Room Type: ${
					roomType || "N/A"
				}, Adults: ${adults || 0}, Children: ${children || 0}`;

	return (
		<SearchResultsWrapper
			isArabic={chosenLanguage === "Arabic"}
			dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
		>
			<div className='header'>
				{chosenLanguage === "Arabic" ? "نتائج البحث:" : "Search Results:"}
			</div>
			<StyledDates>{formattedDates}</StyledDates>
			<StyledDetails>{formattedDetails}</StyledDetails>
		</SearchResultsWrapper>
	);
};

// Styled-components
const SearchResultsWrapper = styled.div`
	display: flex;
	flex-direction: column; /* Stack the lines vertically */
	justify-content: center;
	margin: 20px 0;
	gap: 5px; /* Add spacing between lines */
	margin-top: -120px;
	margin-bottom: 55px;
	text-align: ${({ isArabic }) => (isArabic ? `right` : "")};

	@media (min-width: 600px) {
		display: none;
	}

	.header {
		font-weight: bold;
		line-height: 0.7;
		text-align: ${({ isArabic }) => (isArabic ? `right` : "")};
		margin-right: ${({ isArabic }) => (isArabic ? `10px` : "")};
		margin-left: ${({ isArabic }) => (isArabic ? `` : "10px")};
	}
`;

const StyledDates = styled.div`
	font-size: 1rem;
	color: #333;
	background-color: #f9f9f9;
	padding: 8px 15px;
	border-radius: 10px;
	width: 100%;
	max-width: 600px; /* Limit width for better responsiveness */
	line-height: 1;

	@media (max-width: 768px) {
		font-size: 0.8rem;
		padding: 6px 10px;
		max-width: 100%;
	}
`;

const StyledDetails = styled.div`
	font-size: 0.9rem;
	color: #555;
	background-color: #f9f9f9;
	padding: 8px 15px;
	border-radius: 10px;
	width: 100%;
	max-width: 600px; /* Limit width for better responsiveness */
	white-space: nowrap; /* Prevent wrapping */
	overflow: hidden; /* Hide overflowing text */
	text-overflow: ellipsis; /* Add ellipsis for overflowing text */
	line-height: 1;
	text-transform: capitalize;

	@media (max-width: 768px) {
		font-size: 0.8rem;
		padding: 6px 10px;
		max-width: 100%;
	}
`;

export default SearchResults;
