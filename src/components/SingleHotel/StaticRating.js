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
	background-color: #2f8543; /* Green background */
	color: white;
	padding: 5px 10px;
	border-radius: 5px;
	font-weight: bold;
	font-size: 1rem;
`;

const ReviewLink = styled.a`
	color: #1890ff; /* Ant Design blue */
	/* font-weight: bold; */
	text-decoration: none;
	display: flex;
	align-items: center;
	gap: 5px;
	font-size: 13px;

	&:hover {
		text-decoration: underline;
	}
`;

const StaticRating = () => {
	return (
		<>
			<ReviewContainer>
				<ScoreBox>8.4</ScoreBox>
				<div>
					<Text strong style={{ fontSize: "1rem" }}>
						Very good
					</Text>
				</div>
				<br />
			</ReviewContainer>
			<ReviewLink href='#reviews'>
				See all 1,000 reviews <ArrowRightOutlined />
			</ReviewLink>
		</>
	);
};

export default StaticRating;
