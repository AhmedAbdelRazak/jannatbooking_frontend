import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { gettingJannatWebsiteData } from "../../apiCore";

const Footer = (props) => {
	const [homePage, setHomePage] = useState({});
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

	const ClickHandler = () => {
		window.scrollTo(10, 0);
	};

	const gettingAllHomes = () => {
		gettingJannatWebsiteData().then((data) => {
			if (data.error) {
				console.log(data.error);
			} else {
				setHomePage(data[data.length - 1]);
			}
		});
	};

	// Function to get tomorrow's date and three days after tomorrow
	const calculateDates = () => {
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(today.getDate() + 1);

		const threeDaysAfterTomorrow = new Date(tomorrow);
		threeDaysAfterTomorrow.setDate(tomorrow.getDate() + 3);

		// Format dates as YYYY-MM-DD
		const formatDate = (date) => {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const day = String(date.getDate()).padStart(2, "0");
			return `${year}-${month}-${day}`;
		};

		setStartDate(formatDate(tomorrow));
		setEndDate(formatDate(threeDaysAfterTomorrow));
	};

	useEffect(() => {
		gettingAllHomes();
		calculateDates();
		// eslint-disable-next-line
	}, []);

	return (
		<FooterWrapper className='wpo-site-footer'>
			<div className='wpo-upper-footer'>
				<div className='container'>
					<div className='row'>
						<div className='col col-lg-3 col-md-6 col-sm-12 col-12'>
							<div className='widget about-widget'>
								<div className='logo widget-title' style={{ color: "white" }}>
									<img
										src={
											homePage && homePage.janatLogo && homePage.janatLogo.url
												? homePage.janatLogo.url
												: "https://res.cloudinary.com/infiniteapps/image/upload/v1707282182/janat/1707282182070.png"
										}
										alt='jannatbooking umrah trips'
									/>
								</div>
								<p>
									Management consulting includes a broad range of activities,
									and the many firms and their members often define these
									practices.
								</p>
								<ul>
									<li>
										<Link onClick={ClickHandler} to='/'>
											<i className='ti-facebook'></i>
										</Link>
									</li>
									<li>
										<Link onClick={ClickHandler} to='/'>
											<i className='ti-twitter-alt'></i>
										</Link>
									</li>
									<li>
										<Link onClick={ClickHandler} to='/'>
											<i className='ti-instagram'></i>
										</Link>
									</li>
									<li>
										<Link onClick={ClickHandler} to='/'>
											<i className='ti-google'></i>
										</Link>
									</li>
								</ul>
							</div>
						</div>
						<div className='col col-lg-3 col-md-6 col-sm-12 col-12'>
							<div className='widget link-widget s1'>
								<div className='widget-title'>
									<h3>Our Hotels</h3>
								</div>
								<ul>
									<li>
										<Link onClick={ClickHandler} to={`/hotel/zaer`}>
											Zaer Plaza
										</Link>
									</li>
									<li>
										<Link onClick={ClickHandler} to={`/hotel/ayed`}>
											Ayed Hotel
										</Link>
									</li>
								</ul>
							</div>
						</div>
						<div className='col col-lg-3 col-md-6 col-sm-12 col-12'>
							<div className='widget link-widget'>
								<div className='widget-title'>
									<h3>Important Link</h3>
								</div>
								<ul>
									<li>
										<Link onClick={ClickHandler} to='/about'>
											About Us
										</Link>
									</li>
									<li>
										<Link onClick={ClickHandler} to='/our-hotels'>
											Popular Hotels
										</Link>
									</li>
									<li>
										<Link
											onClick={ClickHandler}
											to={`/our-hotels-rooms?destination=Makkah&startDate=${startDate}&endDate=${endDate}&roomType=all&adults=1&children=`}
										>
											Awesome Rooms
										</Link>
									</li>
									<li>
										<Link onClick={ClickHandler} to='/our-hotels'>
											Our Services
										</Link>
									</li>
									<li>
										<Link onClick={ClickHandler} to='/pricing'>
											Pricing Plan
										</Link>
									</li>
									<li>
										<Link onClick={ClickHandler} to='/terms-conditions'>
											Terms & Conditions
										</Link>
									</li>
								</ul>
							</div>
						</div>

						<div className='col col-lg-3 col-md-6 col-sm-12 col-12'>
							<div className='widget wpo-service-link-widget'>
								<div className='widget-title'>
									<h3>Contact </h3>
								</div>
								<div className='contact-ft'>
									<ul>
										<li>
											<i className='fi flaticon-placeholder'></i>PO 322,
											Crestline, CA 92325
										</li>
										<li>
											<i className='fi flaticon-phone-call'></i>+1909 (991) 4386
										</li>
										<li>
											<i className='fi flaticon-send'></i>
											support@jannatbooking.com
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className='wpo-lower-footer'>
				<div className='container'>
					<div className='row'>
						<div className='col col-xs-12'>
							<p className='copyright'>
								{" "}
								Copyright &copy; {new Date().getFullYear()} JANNAT BOOKING by{" "}
								<Link
									onClick={() => {
										ClickHandler();
										window.open("https://xhotelpro.com");
									}}
									to='#'
								>
									xhotelpro.com
								</Link>
								. All Rights Reserved.
							</p>
						</div>
					</div>
				</div>
			</div>
		</FooterWrapper>
	);
};

export default Footer;

const FooterWrapper = styled.footer`
	background: var(--primaryBlue);
	position: relative;
	font-size: 15px;
	overflow: hidden;

	.wpo-site-footer,
	ul {
		list-style: none;
	}

	.wpo-site-footer,
	p {
		color: #fff;
	}

	.wpo-site-footer,
	li {
		color: #fff;
	}

	.wpo-site-footer,
	.container {
		position: relative;
	}

	.wpo-site-footer,
	.wpo-upper-footer {
		padding: 90px 0;
	}

	@media (max-width: 991px) {
		.wpo-site-footer,
		.wpo-upper-footer {
			padding: 60px 0 0;
		}
	}

	@media (max-width: 767px) {
		.wpo-site-footer,
		.wpo-upper-footer {
			padding: 60px 0 0;
		}
	}

	@media (max-width: 991px) {
		.wpo-site-footer,
		.wpo-upper-footer .col {
			min-height: 235px;
			margin-bottom: 70px;
		}
	}

	@media (max-width: 767px) {
		.wpo-site-footer,
		.wpo-upper-footer .col {
			min-height: auto;
			margin-bottom: 60px;
		}
	}

	.wpo-site-footer,
	.widget-title {
		margin-bottom: 30px;
	}

	@media (max-width: 767px) {
		.wpo-site-footer .widget-title {
			margin-bottom: 20px;
		}
	}

	.wpo-site-footer,
	.widget-title h3 {
		font-size: 20px;
		color: #fff;
		margin: 0;
		text-transform: uppercase;
		position: relative;
		font-family: "Futura PT Demi";
	}

	@media (max-width: 991px) {
		.wpo-site-footer,
		.widget-title h3 {
			font-size: 20px;
			font-size: 1.25rem;
		}
	}

	.wpo-site-footer,
	.about-widget .logo {
		max-width: 180px;
	}

	.wpo-site-footer,
	.about-widget p {
		margin-bottom: 0.8em;
		line-height: 1.9em;
	}

	.wpo-site-footer,
	.about-widget p:last-child {
		margin-bottom: 0;
	}

	.wpo-site-footer,
	.about-widget ul {
		overflow: hidden;
		padding-top: 10px;
	}

	.wpo-site-footer,
	.about-widget ul li {
		font-size: 22px;
		float: left;
	}

	.wpo-site-footer,
	.about-widget ul li a {
		color: #fff;
		width: 36px;
		height: 36px;
		line-height: 40px;
		background: rgba(255, 255, 255, 0.1);
		display: block;
		text-align: center;
		border-radius: 50%;
		font-size: 18px;
	}

	.wpo-site-footer,
	.about-widget ul li a:hover {
		color: #303443;
		background: #fff;
	}

	.wpo-site-footer .about-widget ul li + li {
		margin-left: 25px;
	}

	@media screen and (min-width: 1200px) {
		.wpo-site-footer,
		.wpo-service-link-widget {
			padding-left: 70px;
		}
	}

	.wpo-site-footer,
	.link-widget {
		overflow: hidden;
	}

	@media screen and (min-width: 1200px) {
		.wpo-site-footer,
		.link-widget {
			padding-left: 75px;
		}
		.wpo-site-footer,
		.link-widget.s1 {
			padding-left: 95px;
		}
	}

	@media (max-width: 1199px) {
		.wpo-site-footer,
		.link-widget {
			padding-left: 20px;
		}
	}

	@media (max-width: 991px) {
		.wpo-site-footer,
		.link-widget {
			padding-left: 0;
		}
	}

	@media (max-width: 767px) {
		.wpo-site-footer,
		.link-widget {
			max-width: 350px;
		}
	}

	.wpo-site-footer,
	.link-widget ul li {
		position: relative;
	}

	.wpo-site-footer,
	.link-widget ul li a {
		color: #fff;
		font-size: 17px;
	}

	.wpo-site-footer,
	.link-widget ul li a:hover {
		text-decoration: underline;
	}

	.wpo-site-footer,
	.link-widget ul li + li {
		padding-top: 15px;
	}

	.wpo-site-footer,
	.contact-ft {
		margin-top: 20px;
	}

	.wpo-site-footer,
	.contact-ft ul li {
		padding-bottom: 15px;
		position: relative;
		padding-left: 35px;
		color: #e5e3e3;
		font-size: 17px;
	}

	.wpo-site-footer,
	.contact-ft ul li i {
		position: absolute;
		left: 0;
		top: 0;
	}

	.wpo-site-footer,
	.contact-ft ul li .fi:before {
		font-size: 20px;
		margin-right: 15px;
	}

	.wpo-site-footer,
	.wpo-lower-footer {
		text-align: center;
		position: relative;
		background: var(--primaryBlueDarker);
	}

	.wpo-site-footer,
	.wpo-lower-footer .row {
		padding: 20px 0;
		position: relative;
	}

	.wpo-site-footer,
	.wpo-lower-footer .copyright {
		display: inline-block;
		font-size: 15px;
		font-size: 0.9375rem;
		margin: 0;
	}

	.wpo-site-footer,
	.wpo-lower-footer .copyright a {
		color: #fff;
		text-decoration: none;
	}

	@media (max-width: 991px) {
		.wpo-site-footer,
		.wpo-lower-footer .copyright {
			float: none;
			display: block;
		}
	}

	.sticky-header {
		width: 100%;
		position: fixed;
		left: 0;
		top: -200px;
		z-index: 9999;
		opacity: 0;
		-webkit-transition: all 0.7s;
		transition: all 0.7s;
	}

	.sticky-on {
		opacity: 1;
		top: 0;
	}
`;
