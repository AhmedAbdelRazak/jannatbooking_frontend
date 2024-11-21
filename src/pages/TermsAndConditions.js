import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useCartContext } from "../cart_context";
import { gettingJannatWebsiteData } from "../apiCore"; // Import the function to get data

const TermsAndConditions = () => {
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
		<TermsAndConditionsWrapper
			isArabic={chosenLanguage === "Arabic"}
			dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
		>
			{window.scrollTo({ top: 8, behavior: "smooth" })}
			{loading ? (
				<p>Loading...</p>
			) : jannatBookingData ? (
				<>
					{/* Display the terms and conditions */}
					<DescriptionWrapper>
						<div
							style={{ textAlign: chosenLanguage === "Arabic" ? "right" : "" }}
							dangerouslySetInnerHTML={{
								__html:
									chosenLanguage === "Arabic"
										? jannatBookingData.termsAndConditionArabic
										: jannatBookingData.termsAndConditionEnglish,
							}}
						/>
					</DescriptionWrapper>
				</>
			) : (
				<p>No data available</p>
			)}
		</TermsAndConditionsWrapper>
	);
};

export default TermsAndConditions;

const TermsAndConditionsWrapper = styled.div`
	min-height: 750px;
	padding: 50px 200px;
	background-color: #f9f9f9;

	ul,
	ol {
		margin-left: ${(props) => (props.isArabic ? "" : "1.5em")};
		padding-left: ${(props) => (props.isArabic ? "" : "1.5em")};

		margin-right: ${(props) => (props.isArabic ? "1.5em" : "")};
		padding-right: ${(props) => (props.isArabic ? "1.5em" : "")};
	}

	h2 {
		font-weight: bold;
	}

	@media (max-width: 800px) {
		margin-top: 100px;
		padding: 10px 25px;

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

// eslint-disable-next-line
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
