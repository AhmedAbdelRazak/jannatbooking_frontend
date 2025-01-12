import React from "react";
import styled from "styled-components";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";

const Banner2 = ({ homePage }) => {
	return (
		<Banner2Wrapper
			onClick={() => {
				ReactGA.event({
					category: `User Clicked on Banner 2 In Home Page`,
					action: `User Clicked on Banner 2 In Home Page`,
					label: `User Clicked on Banner 2 In Home Page`,
				});

				ReactPixel.track("User Clicked on Banner 2 In Home Page", {
					destination: "User Clicked on Banner 2 In Home Page",
					action: "User Clicked on Banner 2 In Home Page",
					page: "Home Page",
				});

				window.location.href = homePage.homeSecondBanner.pageRedirectURL
					? homePage.homeSecondBanner.pageRedirectURL
					: "";
			}}
		>
			<div>
				<img
					src={homePage.homeSecondBanner.url}
					alt='Jannat Booking For Umrah Hotels Reservations'
				/>
			</div>
		</Banner2Wrapper>
	);
};

export default Banner2;

const Banner2Wrapper = styled.div`
	text-align: center;

	img {
		width: 50%;
		object-fit: cover;
	}

	@media (max-width: 1000px) {
		img {
			width: 100%;
			object-fit: cover;
		}
	}
`;
