import React from "react";
import styled from "styled-components";
import { useHistory } from "react-router-dom";
import MakkahPhoto from "../../GeneralImages/Meccah.png";
import MadinahPhoto from "../../GeneralImages/Madenah.png";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import { useCartContext } from "../../cart_context";

const Section2 = () => {
	const history = useHistory();
	const { chosenLanguage } = useCartContext();

	const handleImageClick = (destination) => {
		ReactGA.event({
			category: `User Clicked on ${destination} From Home Page`,
			action: `User Clicked on ${destination} From Home Page`,
			label: `User Clicked on ${destination} From Home Page`,
		});

		ReactPixel.track("DestinationClick", {
			destination: destination, // Makkah or Madinah
			action: "User clicked on destination",
			page: "Home Page",
		});

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
		<Section2Container dir={chosenLanguage === "Arabic" ? "rtl" : ""}>
			<Section2Wrapper>
				<Title
					style={{
						textAlign: chosenLanguage === "Arabic" ? "right" : "left",
						fontSize: chosenLanguage === "Arabic" ? "1.7rem" : "1.5rem",
					}}
				>
					{chosenLanguage === "Arabic" ? "أفضل الوجهات" : "Top Destinations"}
				</Title>
				<Content>
					<Destination onClick={() => handleImageClick("Makkah")}>
						<ImageWrapper>
							<img src={MakkahPhoto} alt='Makkah' />
						</ImageWrapper>
						<Info>
							<h3
								style={{
									textAlign: chosenLanguage === "Arabic" ? "right" : "center",
									fontSize: chosenLanguage === "Arabic" ? "1.2rem" : "1rem",
								}}
							>
								{chosenLanguage === "Arabic" ? "مكة" : "Makkah"}
							</h3>
						</Info>
					</Destination>
					<Destination onClick={() => handleImageClick("Madinah")}>
						<ImageWrapper>
							<img src={MadinahPhoto} alt='Madinah' />
						</ImageWrapper>
						<Info>
							<h3
								style={{
									textAlign: chosenLanguage === "Arabic" ? "right" : "center",
									fontSize: chosenLanguage === "Arabic" ? "1.2rem" : "1rem",
								}}
							>
								{chosenLanguage === "Arabic" ? "المدينة المنورة" : "Madinah"}
							</h3>
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
	padding: 30px 0;
`;

const Section2Wrapper = styled.div`
	width: 68%;
	margin-top: 920px;

	@media (max-width: 800px) {
		width: 100%;
		margin-top: 705px;
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
