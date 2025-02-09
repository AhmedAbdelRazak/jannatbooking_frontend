import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useCartContext } from "../cart_context";
import { gettingJannatWebsiteData } from "../apiCore"; // Import the function to get data
import { Helmet } from "react-helmet";

const About = () => {
	const { chosenLanguage } = useCartContext();
	const [jannatBookingData, setJannatBookingData] = useState(null);
	const [plainDescription, setPlainDescription] = useState("");
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

	useEffect(() => {
		if (jannatBookingData?.aboutUsEnglish) {
			const cleanedDescription = jannatBookingData.aboutUsEnglish.replace(
				/<br>/g,
				""
			);
			const plainTextDescription = cleanedDescription.replace(/<[^>]+>/g, "");
			setPlainDescription(plainTextDescription);
		}
	}, [jannatBookingData]); // Safely include 'jannatBookingData' as a dependency

	return (
		<AboutWrapper
			dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
			isArabic={chosenLanguage === "Arabic"}
			className='container py-5'
		>
			<Helmet>
				<meta charSet='utf-8' />
				<title>About Jannat Booking | Haj & Omrah Hotels | Our Story</title>
				<meta
					name='description'
					content={`Discover Jannat Booking - your trusted platform for Haj and Omrah hotel bookings. Learn about our journey, values, and dedication to providing a seamless pilgrimage experience. ${plainDescription}`}
				/>
				<meta
					name='keywords'
					content='Jannat Booking, Haj hotel booking, Omrah hotel booking, pilgrimage hotels, Haj accommodations, Umrah reservations, Haj packages, Omrah trips, affordable hotels Haj, luxury Haj hotels, Makkah hotels, Madinah hotels'
				/>

				{/* Open Graph / Facebook */}
				<meta property='og:type' content='website' />
				<meta
					property='og:title'
					content='About Jannat Booking | Haj & Omrah Hotels'
				/>
				<meta
					property='og:description'
					content='Learn more about Jannat Booking and how we make your Haj and Omrah hotel reservations seamless and trustworthy. Explore our story and dedication to pilgrims.'
				/>
				<meta property='og:url' content='https://jannatbooking.com/about' />
				<meta
					property='og:image'
					content={
						jannatBookingData?.aboutUsBanner?.url ||
						"https://jannatbooking.com/default_banner.jpg"
					}
				/>
				<meta property='og:locale' content='en_US' />

				{/* Twitter */}
				<meta name='twitter:card' content='summary_large_image' />
				<meta
					name='twitter:title'
					content='About Jannat Booking | Haj & Omrah Hotels'
				/>
				<meta
					name='twitter:description'
					content='Discover Jannat Booking, the top platform for Haj and Omrah hotel reservations. Explore our mission and values for seamless pilgrim experiences.'
				/>
				<meta
					name='twitter:image'
					content={
						jannatBookingData?.aboutUsBanner?.url ||
						"https://jannatbooking.com/default_banner.jpg"
					}
				/>

				{/* Canonical Link */}
				<link rel='canonical' href='https://jannatbooking.com/about' />

				{/* Favicon */}
				<link rel='icon' href='/favicon.ico' />

				{/* Preload Banner Image */}
				{jannatBookingData?.aboutUsBanner?.url && (
					<link
						rel='preload'
						href={jannatBookingData.aboutUsBanner.url}
						as='image'
					/>
				)}
			</Helmet>

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
					<DescriptionWrapper dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}>
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
	direction: ${(props) => (props.dir === "rtl" ? "rtl" : "ltr")};
	text-align: ${(props) => (props.dir === "rtl" ? "right" : "")};

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
	}

	ul,
	ol {
		margin-left: ${(props) => (props.isArabic ? "" : "1.5em")};
		padding-left: ${(props) => (props.isArabic ? "" : "1.5em")};

		margin-right: ${(props) => (props.isArabic ? "1.5em" : "")};
		padding-right: ${(props) => (props.isArabic ? "1.5em" : "")};
		margin-top: 0px !important;
		padding-top: 0px !important;
		margin-bottom: 0px !important;
		padding-bottom: 0px !important;
	}

	h2 {
		font-weight: bold;
	}

	@media (max-width: 800px) {
		h1 > strong {
			font-size: 1.8rem !important;
		}

		h2 {
			font-size: 1.3rem;
			font-weight: bold;
		}

		ul,
		ol {
			margin-left: ${(props) => (props.isArabic ? "" : "1em")};
			padding-left: ${(props) => (props.isArabic ? "" : "1em")};
			margin-right: ${(props) => (props.isArabic ? "1em" : "")};
			padding-right: ${(props) => (props.isArabic ? "1em" : "")};
		}
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
	direction: ${(props) => (props.dir === "rtl" ? "rtl" : "ltr")};
	text-align: ${(props) => (props.dir === "rtl" ? "right" : "")};
	line-height: 1.3;

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
