import React from "react";
import styled from "styled-components";
// eslint-disable-next-line
import hero1 from "../../GeneralImages/slider/slide-1.jpg";
import hero2 from "../../GeneralImages/Meccah.png";

const ListPropertyHero = () => {
	return (
		<ListPropertyHeroWrapper>
			<div className='slide-content'>
				<h1>List your hotel with Janatbooking.com</h1>
				<h2>The Only Platform dedicated to minor & major pilgrimage ONLY!</h2>
			</div>
		</ListPropertyHeroWrapper>
	);
};

export default ListPropertyHero;

const ListPropertyHeroWrapper = styled.section`
	width: 100%;
	height: 600px;
	position: relative;
	background-image: url(${hero2});
	background-position: center;
	background-size: cover;
	background-attachment: fixed;
	display: flex;
	justify-content: center;
	align-items: center;
	text-align: center;

	@media (max-width: 991px) {
		height: 600px;
	}

	@media (max-width: 767px) {
		height: 500px;
	}

	.slide-content {
		z-index: 2;
		color: #fff;
		text-align: center;
		padding: 0 20px; // Provides padding on smaller screens

		h1 {
			font-size: 3.5rem;
			font-weight: 900;
			line-height: 1.2;
			margin: 0 0 20px;

			@media (max-width: 1199px) {
				font-size: 50px;
			}

			@media (max-width: 991px) {
				font-size: 40px;
			}

			@media (max-width: 767px) {
				font-size: 30px;
			}
		}

		h2 {
			font-size: 2rem;
			font-weight: 900;
			line-height: 1.2;
			margin: 0 0 20px;

			@media (max-width: 1199px) {
				font-size: 30px;
			}

			@media (max-width: 991px) {
				font-size: 20px;
			}

			@media (max-width: 767px) {
				font-size: 18px;
			}
		}

		.theme-btn {
			background-color: #fc4c4c;
			padding: 10px 30px;
			color: white;
			font-weight: bold;
			border-radius: 5px; // Adds rounded corners to your button
			text-transform: uppercase; // Optional: makes the text uppercase
		}
	}

	&:before {
		content: "";
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		background: rgba(4, 1, 40, 0.6);
		z-index: 1;
	}
`;
