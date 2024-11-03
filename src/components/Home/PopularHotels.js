import React from "react";
import styled from "styled-components";
import Slider from "react-slick";
import { Card } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import StarRatings from "react-star-ratings";
import { amenitiesList } from "../../Assets"; // Assuming amenitiesList is imported here

const PopularHotels = ({ activeHotels }) => {
	const settings = {
		dots: true,
		infinite: true,
		speed: 500,
		slidesToShow: 4,
		slidesToScroll: 1,
		autoplay: true,
		autoplaySpeed: 4000,
		centerMode: true, // Enable center mode to show a portion of the next slide
		centerPadding: "30px", // Adjust padding to show only a small part of the next slide
		arrows: true,
		prevArrow: (
			<Arrow className='slick-prev'>
				<LeftOutlined />
			</Arrow>
		),
		nextArrow: (
			<Arrow className='slick-next'>
				<RightOutlined />
			</Arrow>
		),
		responsive: [
			{
				breakpoint: 1024,
				settings: {
					slidesToShow: 3,
					slidesToScroll: 1,
					centerMode: false,
					centerPadding: "0px",
				},
			},
			{
				breakpoint: 768,
				settings: {
					slidesToShow: 2,
					slidesToScroll: 1,
					centerMode: false,
					centerPadding: "0px",
				},
			},
			{
				breakpoint: 480,
				settings: {
					slidesToShow: 1,
					slidesToScroll: 1,
					centerMode: true,
					centerPadding: "30px", // Adjust this value as needed
					dots: false,
				},
			},
		],
	};

	const getIcon = (amenity) => {
		const foundAmenity = amenitiesList.find((item) => item.name === amenity);
		return foundAmenity ? foundAmenity.icon : null;
	};

	const formatAddress = (address) => {
		const addressParts = address.split(",");
		return addressParts.slice(1).join(", ").trim();
	};

	return (
		<PopularHotelsContainer>
			<SectionTitle>OUR MOST POPULAR HOTELS!</SectionTitle>
			<Slider {...settings}>
				{activeHotels.map((hotel) => (
					<div key={hotel._id} className='slide'>
						<HotelCard
							hoverable
							onClick={() =>
								(window.location.href = `/single-hotel/${hotel.hotelName
									.replace(/\s+/g, "-")
									.toLowerCase()}`)
							}
							cover={
								<HotelImage
									src={hotel.hotelPhotos[0]?.url || "/placeholder-image.jpg"}
									alt={hotel.hotelName}
								/>
							}
						>
							<HotelInfo>
								<h3>{hotel.hotelName}</h3>
								<p>{formatAddress(hotel.hotelAddress)}</p>
								<StarRatings
									rating={hotel.hotelRating || 4.6} // Replace with actual rating if available
									starRatedColor='orange'
									numberOfStars={5}
									starDimension='20px'
									starSpacing='2px'
								/>
								<AmenitiesWrapper>
									{hotel.roomCountDetails[0]?.amenities
										.slice(0, 4)
										.map((amenity, index) => (
											<AmenityItem key={index}>
												{getIcon(amenity)} <span>{amenity}</span>
											</AmenityItem>
										))}
								</AmenitiesWrapper>
							</HotelInfo>
						</HotelCard>
					</div>
				))}
			</Slider>
		</PopularHotelsContainer>
	);
};

export default PopularHotels;

// Styled Components
const PopularHotelsContainer = styled.div`
	width: 75%;
	margin: 0 auto;
	background: var(--neutral-light2);
	padding: 50px 0;
	border-radius: 5px;
	overflow-x: hidden;

	.slick-slider {
		padding-bottom: 30px; // Space for dots
	}

	.slick-dots {
		bottom: -10px;
	}

	.slide {
		padding: 10px;
		box-sizing: border-box;
	}

	@media (max-width: 800px) {
		width: 100%;
	}
`;

const SectionTitle = styled.h2`
	text-align: left;
	font-size: 2rem;
	font-weight: bold;
	margin-bottom: 20px;
	color: var(--primary-color);
	padding-left: 10px;

	@media (max-width: 800px) {
		font-size: 1.4rem;
	}
`;

const HotelCard = styled(Card)`
	border-radius: 10px;
	overflow: hidden;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	transition:
		transform 0.3s ease,
		box-shadow 0.3s ease;
	/* text-align: center; */
	cursor: pointer;
	min-height: 430px;
	max-height: 430px;
	text-transform: capitalize;

	&:hover {
		transform: translateY(-10px);
		box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
	}

	.ant-card-body {
		padding: 15px;
	}
`;

const HotelImage = styled.img`
	width: 100%;
	height: 250px;
	object-fit: cover;
	border-top-left-radius: 10px;
	border-top-right-radius: 10px;
`;

const HotelInfo = styled.div`
	/* text-align: center; */

	h3 {
		font-size: 1.2rem;
		color: var(--primary-color);
		margin-bottom: 5px;
	}

	p {
		font-size: 0.9rem;
		color: var(--secondary-font-color);
		margin-bottom: 10px;
	}
`;

const AmenitiesWrapper = styled.div`
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	gap: 5px;
	margin-top: 10px;
`;

const AmenityItem = styled.div`
	display: flex;
	align-items: center;
	font-size: 0.8rem;
	color: var(--text-color-primary);

	span {
		margin-left: 5px;
	}
`;

const Arrow = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	width: 40px;
	height: 40px;
	color: var(--primary-color);
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	cursor: pointer;

	&:hover {
		color: var(--primary-color-darker);
	}

	&.slick-prev {
		left: -50px;
	}

	&.slick-next {
		right: -50px;
	}
`;
