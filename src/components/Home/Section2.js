import React from "react";
import styled from "styled-components";
import { useHistory } from "react-router-dom";
import MakkahPhoto from "../../GeneralImages/Meccah.png";
import MadinahPhoto from "../../GeneralImages/Madenah.png";

const Section2 = () => {
	const history = useHistory();

	const handleImageClick = (destination) => {
		const queryParams = new URLSearchParams({
			destination,
			startDate: new Date().toISOString().split("T")[0], // Today's date as default
			endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split("T")[0], // One week from today
			roomType: "all",
			adults: "1",
			children: "0",
		}).toString();

		history.push(`/our-hotels-rooms?${queryParams}`);
	};

	return (
		<Section2Container>
			<Section2Wrapper>
				<Title>Top Destinations</Title>
				<Content>
					<Destination onClick={() => handleImageClick("Makkah")}>
						<ImageWrapper>
							<img src={MakkahPhoto} alt='Makkah' />
						</ImageWrapper>
						<Info>
							<h3>Makkah</h3>
							<p>362339 properties</p>
						</Info>
					</Destination>
					<Destination onClick={() => handleImageClick("Madinah")}>
						<ImageWrapper>
							<img src={MadinahPhoto} alt='Madinah' />
						</ImageWrapper>
						<Info>
							<h3>Madinah</h3>
							<p>224506 properties</p>
						</Info>
					</Destination>
				</Content>
			</Section2Wrapper>
		</Section2Container>
	);
};

export default Section2;

// Styled-components

const Section2Container = styled.div`
	display: flex;
	justify-content: center;
	width: 100%;
	background-color: var(--background-color, #f9f9f9);
	padding: 30px 0;
`;

const Section2Wrapper = styled.div`
	width: 68%;
	margin-top: 950px;

	@media (max-width: 800px) {
		width: 100%;
		margin-top: 700px;
	}
`;

const Title = styled.h2`
	font-size: 1.5rem;
	color: var(--primary-font-color, #333);
	margin-bottom: 20px;
	font-weight: bold;

	@media (max-width: 768px) {
		margin-left: 10px;
		font-size: 1.35rem;
	}
`;

const Content = styled.div`
	display: flex;
	flex-direction: column;
	gap: 15px;

	@media (min-width: 768px) {
		flex-direction: row;
		gap: 40px;
		justify-content: flex-start;
	}
`;

const Destination = styled.div`
	display: flex;
	align-items: center;
	background-color: #fff;
	border-radius: 10px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	padding: 10px;
	gap: 10px;
	cursor: pointer;

	@media (min-width: 768px) {
		flex-direction: column;
		align-items: center;
		padding: 20px;
		width: 250px;
	}
`;

const ImageWrapper = styled.div`
	width: 60px;
	height: 60px;
	border-radius: 5px;
	overflow: hidden;

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	@media (min-width: 768px) {
		width: 120px;
		height: 120px;
	}
`;

const Info = styled.div`
	text-align: center;

	h3 {
		font-size: 1rem;
		color: var(--primary-font-color, #333);
		margin: 0;
	}

	p {
		font-size: 0.875rem;
		color: var(--secondary-font-color, #666);
		margin: 0;
	}
`;
