import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useCartContext } from "../cart_context";
import { gettingJannatWebsiteData } from "../apiCore"; // Import the function to get data

const About = () => {
	const { chosenLanguage } = useCartContext();
	const [jannatBookingData, setJannatBookingData] = useState(null);
	const [loading, setLoading] = useState(false);

	//Reception Chat Available border radius and width should be less
	//Add To Reservation font-size less
	//Distances should be a different color with a nice blue color
	//Room displayName is not bold
	//Hotel Name should be bold and font-size a bit bigger.
	//Rating word should be added
	//FREE Cancellation should be darkgreen and should be on one line
	//Chat icon when going to the hotel single page
	//Data validation in the search
	//Privacy Policy 3araby w english

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
	min-height: 750px;
	padding: 20px;
	background-color: #f9f9f9;
	p {
		padding: 0px !important;
		margin: 5px 0px !important;
	}

	div {
		padding: 0px !important;
		margin: 5px 0px !important;
	}

	@media (max-width: 800px) {
		margin-top: 90px;
		padding: 5px;
	}
`;

const BannerWrapper = styled.div`
	margin-bottom: 30px;

	img {
		width: 100%;
		height: auto;
		border-radius: 5px;
		max-height: 600px;
		object-fit: cover;
	}
`;

const DescriptionWrapper = styled.div`
	font-size: 1rem;
	color: #333;

	img {
		width: 100%;
		height: auto;
		border-radius: 5px;
		max-height: 600px;
		object-fit: cover;
		padding: 0px !important;
		margin: 0px !important;
	}
`;
