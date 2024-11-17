import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useCartContext } from "../cart_context";
import { gettingJannatWebsiteData } from "../apiCore"; // Import the function to get data

const About = () => {
	const { chosenLanguage } = useCartContext();
	const [jannatBookingData, setJannatBookingData] = useState(null);
	const [loading, setLoading] = useState(false);

	const gettingJannatBookingData = () => {
		setLoading(true);
		gettingJannatWebsiteData().then((data) => {
			if (data.error) {
				console.log(data.error);
			} else {
				setJannatBookingData(data[data.length - 1]);
			}
			setLoading(false);
		});
	};

	useEffect(() => {
		gettingJannatBookingData();
		// eslint-disable-next-line
	}, []);

	return (
		<AboutWrapper dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}>
			{window.scrollTo({ top: 8, behavior: "smooth" })}
			{loading ? (
				<p>Loading...</p>
			) : jannatBookingData ? (
				<>
					{/* Display the banner */}
					{jannatBookingData.aboutUsBanner && (
						<BannerWrapper>
							<img
								src={jannatBookingData.aboutUsBanner.url}
								alt='About Us Banner'
							/>
						</BannerWrapper>
					)}

					{/* Display the description */}
					<DescriptionWrapper>
						<div
							dangerouslySetInnerHTML={{
								__html:
									chosenLanguage === "Arabic"
										? jannatBookingData.aboutUsArabic
										: jannatBookingData.aboutUsEnglish,
							}}
						/>
					</DescriptionWrapper>
				</>
			) : (
				<p>No data available</p>
			)}
		</AboutWrapper>
	);
};

export default About;

const AboutWrapper = styled.div`
	margin-top: 90px;
	min-height: 750px;
	padding: 20px;
	background-color: #f9f9f9;
`;

const BannerWrapper = styled.div`
	margin-bottom: 30px;
	img {
		width: 100%;
		height: auto;
		border-radius: 10px;
	}
`;

const DescriptionWrapper = styled.div`
	font-size: 1rem;
	line-height: 1.6;
	color: #333;
`;
