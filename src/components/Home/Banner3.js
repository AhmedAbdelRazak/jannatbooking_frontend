import React from "react";
import styled from "styled-components";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";

const Banner3 = ({ homePage }) => {
	return (
		<Banner3Wrapper
			onClick={() => {
				ReactGA.event({
					category: `User Clicked on Banner 3 In Home Page`,
					action: `User Clicked on Banner 3 In Home Page`,
					label: `User Clicked on Banner 3 In Home Page`,
				});

				ReactPixel.track("User Clicked on Banner 3 In Home Page", {
					destination: "User Clicked on Banner 3 In Home Page",
					action: "User Clicked on Banner 3 In Home Page",
					page: "Home Page",
				});

				window.location.href = homePage.homeThirdBanner.pageRedirectURL
					? homePage.homeThirdBanner.pageRedirectURL
					: "";
			}}
		>
			<div>
				<img
					src={homePage.homeThirdBanner.url}
					alt='Jannat Booking For Umrah Hotels Reservations'
				/>
			</div>
		</Banner3Wrapper>
	);
};

export default Banner3;

const Banner3Wrapper = styled.div`
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
