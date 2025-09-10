import React from "react";
import styled from "styled-components";
import { Typography } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";

const { Text } = Typography;

const ReviewContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
`;
const ScoreBox = styled.div`
	background-color: #2f8543;
	color: white;
	padding: 5px 10px;
	border-radius: 5px;
	font-weight: bold;
	font-size: 1rem;
`;
const ReviewLink = styled.a`
	color: #1890ff;
	text-decoration: none;
	display: flex;
	align-items: center;
	gap: 5px;
	font-size: 13px;
	&:hover {
		text-decoration: underline;
	}
`;

const StaticRating = ({ selectedHotel, chosenLanguage }) => {
	const base =
		selectedHotel && selectedHotel.hotelRating
			? Number(selectedHotel.hotelRating)
			: 4.2;
	const rating = Math.max(0, Math.min(10, base * 2));

	const ratingText =
		rating >= 9
			? "Excellent"
			: rating >= 8
				? "Very good"
				: rating >= 6
					? "Good"
					: "Not too bad";

	return (
		<>
			<ReviewContainer dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}>
				<ScoreBox>{rating.toFixed(1)}</ScoreBox>
				<div>
					<Text strong style={{ fontSize: "1rem" }}>
						{ratingText}
					</Text>
				</div>
				<br />
			</ReviewContainer>
			<ReviewLink
				href='#reviews'
				dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
			>
				See all 1,000 reviews <ArrowRightOutlined />
			</ReviewLink>
		</>
	);
};

export default StaticRating;
