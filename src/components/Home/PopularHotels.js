import React, { useState, useRef } from "react";
import styled from "styled-components";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import StarRatings from "react-star-ratings";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const PopularHotels = ({ activeHotels }) => {
	const swiperRef = useRef(null);
	// eslint-disable-next-line
	const [geocoder, setGeocoder] = useState(null);

	return (
		<PopularHotelsWrapper>
			<div className='container'>
				<div className='wpo-section-title-s2'>
					<h2>OUR MOST POPULAR HOTELS!</h2>
					<p>
						Enjoy Your Major & Minor Pilgrimage With The Best Rates ONLY WITH
						JANAT BOOKING!
					</p>
				</div>

				<div className='room-wrapper mt-5'>
					<Swiper
						modules={[Navigation, Pagination, Autoplay]}
						spaceBetween={30}
						slidesPerView={1}
						navigation={{
							prevEl: ".swiper-button-prev",
							nextEl: ".swiper-button-next",
						}}
						pagination={{ clickable: true }}
						loop={true}
						autoplay={{
							delay: 6000,
							disableOnInteraction: false,
						}}
						speed={1500}
						onSwiper={(swiper) => {
							swiperRef.current = swiper;
						}}
					>
						{activeHotels.map((hotel) => (
							<SwiperSlide key={hotel._id}>
								<HotelCard
									onMouseEnter={() => swiperRef.current.autoplay.stop()}
									onMouseLeave={() => swiperRef.current.autoplay.start()}
								>
									<div
										className='hotel-image'
										onClick={() =>
											(window.location.href = `/single-hotel/${hotel.hotelName.replace(/\s+/g, "-").toLowerCase()}`)
										}
									>
										<img
											src={hotel.hotelPhotos[0]?.url}
											alt={hotel.hotelName}
										/>
									</div>
									<div className='hotel-details'>
										<div
											onClick={() =>
												(window.location.href = `/single-hotel/${hotel.hotelName.replace(/\s+/g, "-").toLowerCase()}`)
											}
										>
											<h3>{hotel.hotelName}</h3>
											<p>
												{hotel.hotelCity}, {hotel.hotelState},{" "}
												{hotel.hotelCountry}
											</p>
										</div>

										<StarRatings
											rating={hotel.hotelRating}
											starRatedColor='gold'
											numberOfStars={5}
											name='rating'
											starDimension='20px'
											starSpacing='2px'
										/>
										<LoadScript
											googleMapsApiKey={process.env.REACT_APP_MAPS_API_KEY}
										>
											<GoogleMap
												mapContainerStyle={{
													width: "100%",
													height: "400px",
													borderRadius: "10px",
													marginTop: "15px",
												}}
												center={{
													lat: parseFloat(hotel.location.coordinates[1]),
													lng: parseFloat(hotel.location.coordinates[0]),
												}}
												zoom={14}
											>
												<Marker
													position={{
														lat: parseFloat(hotel.location.coordinates[1]),
														lng: parseFloat(hotel.location.coordinates[0]),
													}}
													draggable={false}
												/>
											</GoogleMap>
										</LoadScript>
									</div>
								</HotelCard>
							</SwiperSlide>
						))}
					</Swiper>
					<div className='swiper-button-prev'>
						<LeftOutlined />
					</div>
					<div className='swiper-button-next'>
						<RightOutlined />
					</div>
				</div>
			</div>
		</PopularHotelsWrapper>
	);
};

export default PopularHotels;

const PopularHotelsWrapper = styled.div`
	position: relative;
	padding: 30px;
	width: 100%;
	margin-top: 70px;
	background-color: var(--neutral-light);

	.wpo-section-title-s2 {
		text-align: center;
	}

	.wpo-section-title-s2 h2 {
		font-size: 45px;
		line-height: 55px;
		margin: 0;
		text-transform: capitalize;
		color: var(--primaryBlue);
		font-weight: 600;
		margin-bottom: 20px;
	}

	.wpo-section-title-s2 p {
		font-size: 18px;
		max-width: 540px;
		margin: 0 auto 30px;
		color: var(--primaryBlueDarker);
	}

	.room-wrapper {
		position: relative;
	}

	.swiper-button-prev,
	.swiper-button-next {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 10;
		width: 50px;
		height: 50px;
		background-color: var(--primaryBlue);
		color: var(--mainWhite);
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		box-shadow: var(--box-shadow-dark);
		transition: var(--main-transition);
	}

	.swiper-button-prev {
		left: 15px;
	}

	.swiper-button-next {
		right: 15px;
	}

	.swiper-button-prev:hover,
	.swiper-button-next:hover {
		background-color: var(--primaryBlueDarker);
	}

	.swiper-pagination-bullet {
		background-color: var(--primaryBlue) !important;
	}

	.swiper-pagination-bullet-active {
		background-color: var(--primaryBlueDarker) !important;
	}
`;

const HotelCard = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	/* background-color: var(--mainWhite); */
	border-radius: 20px; /* Added border radius */
	box-shadow: var(--box-shadow-light);
	overflow: hidden;
	transition: var(--main-transition);
	text-align: center;
	cursor: pointer;
	/* max-height: 600px; */
	width: 100%;

	.hotel-image img {
		width: 100%;
		height: 500px; /* Ensures the image height is fixed */
		object-fit: cover; /* Ensures the image covers the full area */
		transition: var (--main-transition);
		border-top-left-radius: 20px; /* Match border radius */
		border-top-right-radius: 20px; /* Match border radius */
	}

	.hotel-details {
		padding: 20px;
		background-color: var(--neutral-light2);
		width: 100%;
		border-bottom-left-radius: 20px; /* Match border radius */
		border-bottom-right-radius: 20px; /* Match border radius */
	}

	.hotel-details h3 {
		font-size: 24px;
		margin-bottom: 10px;
		color: var(--primaryBlue);
		text-transform: capitalize;
	}

	.hotel-details p {
		font-size: 16px;
		color: var(--darkGrey);
		text-transform: capitalize;
	}

	&:hover {
		transform: translateY(-5px);
		box-shadow: var(--box-shadow-dark);
	}
`;
