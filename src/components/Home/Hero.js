import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/autoplay";
import styled from "styled-components";
import { useCartContext } from "../../cart_context";

const Hero = ({ homePage }) => {
	const { chosenLanguage } = useCartContext();

	// Default slider images
	const defaultImages = [
		{
			sImg: require("../../GeneralImages/slider/slide-1.jpg").default,
			title: "Find Your Perfect Place To Stay",
			subtitle: "Experience comfort and luxury in our amazing hotels.",
			buttonTitle: "Book Now",
			pageRedirectURL: "/our-hotels",
			btnBackgroundColor: "#fc4c4c",
		},
		{
			sImg: require("../../GeneralImages/slider/slide-2.jpg").default,
			title: "Enjoy Your Stay",
			subtitle: "Discover the best destinations and accommodations.",
			buttonTitle: "Book Now",
			pageRedirectURL: "/our-hotels",
			btnBackgroundColor: "#fc4c4c",
		},
		{
			sImg: require("../../GeneralImages/slider/slide-3.jpg").default,
			title: "A Unique Experience",
			subtitle: "Stay with us and make unforgettable memories.",
			buttonTitle: "Book Now",
			pageRedirectURL: "/our-hotels",
			btnBackgroundColor: "#fc4c4c",
		},
	];

	// Generate slider items from homePage data or fall back to defaults
	const sliderItems =
		homePage?.homeMainBanners?.map((banner, index) => ({
			sImg: banner.url || defaultImages[index].sImg,
			title: chosenLanguage === "Arabic" ? banner.titleArabic : banner.title,
			subtitle:
				chosenLanguage === "Arabic" ? banner.subtitleArabic : banner.subTitle,
			buttonTitle:
				chosenLanguage === "Arabic"
					? banner.buttonTitleArabic || defaultImages[index].buttonTitle
					: banner.buttonTitle || defaultImages[index].buttonTitle,
			pageRedirectURL:
				banner.pageRedirectURL || defaultImages[index].pageRedirectURL,
			btnBackgroundColor:
				banner.btnBackgroundColor || defaultImages[index].btnBackgroundColor,
		})) || defaultImages;

	return (
		<HeroWrapper>
			<Swiper
				modules={[Navigation, Pagination, Autoplay]}
				spaceBetween={0}
				slidesPerView={1}
				pagination={{ clickable: true }}
				loop={true}
				speed={1800}
				parallax={true}
				navigation
				autoplay={{
					delay: 3000,
					disableOnInteraction: false,
					pauseOnMouseEnter: true,
				}}
			>
				{sliderItems.map((item, index) => (
					<SwiperSlide key={index}>
						<div
							className='swiper-slide'
							style={{ backgroundImage: `url(${item.sImg})` }}
						>
							<div
								className='slide-inner slide-bg-image'
								dir={chosenLanguage === "Arabic" ? "rtl" : ""}
								style={{
									textAlign: chosenLanguage === "Arabic" ? "right" : "",
								}}
							>
								<div className='container-fluid'>
									<div className='slide-content'>
										<div data-swiper-parallax='100' className='slide-title'>
											<h1>{item.title}</h1>
										</div>
										<div data-swiper-parallax='200' className='slide-text'>
											<p>{item.subtitle}</p>
										</div>
										<div className='clearfix'></div>
										<div data-swiper-parallax='500' className='slide-btns'>
											<div
												className='theme-btn'
												style={{ backgroundColor: item.btnBackgroundColor }}
												onClick={() =>
													(window.location.href = item.pageRedirectURL)
												}
											>
												{item.buttonTitle}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</SwiperSlide>
				))}
			</Swiper>
		</HeroWrapper>
	);
};

export default Hero;

const HeroWrapper = styled.section`
	width: 100%;
	height: 900px;
	display: flex;
	position: absolute;
	z-index: 0;
	top: 0;

	@media (max-width: 991px) {
		height: 600px;
	}

	@media (max-width: 767px) {
		height: 440px;
	}

	.swiper-slide {
		overflow: hidden;
		background-position: 50%;
		background-size: cover;
		position: relative;
		z-index: 11;
	}

	.slide-inner {
		width: 100%;
		height: 100%;
		left: 0;
		top: 0;
		z-index: 1;
		background-size: cover;
		background-position: center;
		display: flex;
		justify-content: center;
		align-items: center;
		text-align: left;
	}

	/* .slide-inner:before {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		background: #040128;
		content: "";
		opacity: 0.6;
	} */

	.slide-inner:before {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(to bottom, #1e1f2a 10%, rgba(4, 1, 40, 0) 50%);
		content: "";
		opacity: 0.9;
	}

	.slide-content {
		padding-bottom: 85px;
		padding-left: 240px;
		z-index: 11;
		position: relative;

		@media (max-width: 1700px) {
			padding-left: 140px;
		}

		@media (max-width: 991px) {
			padding-bottom: 0;
			padding-left: 30px;
		}

		@media (max-width: 767px) {
			padding-left: 5px;
			padding-bottom: 30px; /* Move content slightly higher on mobile */
			margin-top: -50px; /* Adjust spacing from the top */
		}
	}

	.slide-title,
	h1 {
		font-size: 70px;
		font-weight: 900;
		line-height: 90px;
		margin: 10px 0 15px;
		font-size: 3.5rem;
		color: #fff;

		@media (max-width: 1199px) {
			font-size: 50px;
			line-height: 60px;
		}

		@media (max-width: 991px) {
			font-size: 40px;
			line-height: 55px;
		}

		@media (max-width: 767px) {
			font-size: 24px; /* Increase text size slightly for readability */
			line-height: 30px;
			margin-top: 10px; /* Move title up */
		}
	}

	.slide-text p {
		font-size: 22px;
		color: #e2e2e2;
		line-height: 35px;
		margin-bottom: 40px;

		@media (max-width: 991px) {
			font-size: 18px;
		}

		@media (max-width: 767px) {
			font-size: 16px;
			line-height: 22px;
			margin-bottom: 20px; /* Reduce space below subtitle */
			margin-top: 5px; /* Move subtitle up */
		}
	}

	.swiper-button-prev {
		background-color: lightgrey;
		border-radius: 30px;
		padding: 30px;
		color: black;
		opacity: 0.5;
	}

	.swiper-button-next {
		background-color: lightgrey;
		border-radius: 30px;
		padding: 30px;
		color: black;
		opacity: 0.5;
	}

	.swiper-pagination-bullet {
		background-color: black !important;
	}

	@media (max-width: 1000px) {
		.swiper-button-prev {
			display: none;
		}

		.swiper-button-next {
			display: none;
		}
	}

	.slide-btns {
		margin-left: 40px;
		.theme-btn {
			padding: 8px 20px; /* Adjust button padding for mobile */
			color: white;
			font-weight: bold;
			cursor: pointer;
			text-decoration: none;
			display: inline-block;

			@media (max-width: 767px) {
				margin-left: 0;
				margin-top: 10px; /* Move button closer to text */
				padding: 6px 15px;
				font-size: 0.9rem;
			}
		}
	}
`;
