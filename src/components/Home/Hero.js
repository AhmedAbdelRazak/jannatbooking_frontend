import React from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/autoplay";
import styled from "styled-components";
import { useCartContext } from "../../cart_context";

const Hero = (props) => {
	const { homePage } = props;

	const { chosenLanguage } = useCartContext();

	// Default slider images
	const defaultImages = [
		{ sImg: require("../../GeneralImages/slider/slide-1.jpg").default },
		{ sImg: require("../../GeneralImages/slider/slide-2.jpg").default },
		{ sImg: require("../../GeneralImages/slider/slide-3.jpg").default },
	];

	// Custom slider images based on homePage data
	const sliderItems = [];

	// Check for first banner
	if (homePage?.homeMainBanners?.[0]?.url) {
		sliderItems.push({ sImg: homePage.homeMainBanners[0].url });
	} else {
		sliderItems.push(defaultImages[0]);
	}

	// Check for second banner
	if (homePage?.homeMainBanners?.[1]?.url) {
		sliderItems.push({ sImg: homePage.homeMainBanners[1].url });
	}

	// Check for third banner
	if (homePage?.homeMainBanners?.[2]?.url) {
		sliderItems.push({ sImg: homePage.homeMainBanners[2].url });
	}

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
				{sliderItems.map((item, slr) => (
					<SwiperSlide key={slr}>
						<div
							className='swiper-slide'
							style={{ backgroundImage: `url(${item.sImg})` }}
						>
							<div className='slide-inner slide-bg-image'>
								<div className='container-fluid'>
									<div className='slide-content'>
										<div data-swiper-parallax='100' className='slide-title'>
											<h1>
												{" "}
												{chosenLanguage === "Arabic"
													? ""
													: "Find Your Perfect Place To Stay"}{" "}
											</h1>
										</div>
										<div className='clearfix'></div>
										<div data-swiper-parallax='500' className='slide-btns'>
											<Link to='/our-hotels' className='theme-btn'>
												Book Now
											</Link>
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
		height: 500px;
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

	.slide-inner:before {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		background: #040128;
		content: "";
		opacity: 0.6;
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
			padding-left: 10px;
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
			font-size: 30px;
			line-height: 36px;
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
			margin-bottom: 30px;
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
		a {
			background-color: #fc4c4c !important;
			padding: 10px 30px;
			color: white;
			font-weight: bold;
		}

		@media (max-width: 767px) {
			margin-left: 20px;
		}
	}
`;
