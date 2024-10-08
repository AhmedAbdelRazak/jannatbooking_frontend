import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useCartContext } from "../../cart_context";
import { Link } from "react-router-dom";
import HeaderTopbar from "./HeaderTopbar";
import { gettingJannatWebsiteData } from "../../apiCore";

const Navbar = () => {
	const { languageToggle, chosenLanguage } = useCartContext();
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [inTop, setInTop] = useState(true);
	const [homePage, setHomePage] = useState({});

	const gettingAllHomes = () => {
		gettingJannatWebsiteData().then((data) => {
			if (data.error) {
				console.log(data.error);
			} else {
				setHomePage(data[data.length - 1]);
			}
		});
	};

	useEffect(() => {
		gettingAllHomes();
		// eslint-disable-next-line
	}, []);

	// Function to toggle the drawer
	const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
	// Function to close the drawer
	const closeDrawer = () => setIsDrawerOpen(false);

	// Function to handle scroll event
	const handleScroll = () => {
		const position = window.scrollY;
		setInTop(position < 100 && window.location.pathname === "/");
	};

	// Add scroll event listener on component mount
	useEffect(() => {
		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
		// eslint-disable-next-line
	}, [window.location.pathname]);

	return (
		<>
			<HeaderTopbar />

			<NavbarWrapper inTop={inTop}>
				<ArabicPhone>
					{chosenLanguage === "Arabic" ? (
						<span
							className='phoneLanguage'
							style={{
								fontSize: "12px",
								fontWeight: "bold",
								textDecoration: "underline",
								color: "white",
							}}
							onClick={() => languageToggle("English")}
						>
							<i className='fa-solid fa-earth-americas'></i> En
						</span>
					) : (
						<span
							style={{
								fontSize: "12px",
								fontWeight: "bold",
								textDecoration: "underline",
								color: "white",
							}}
							onClick={() => languageToggle("Arabic")}
						>
							<i className='fa-solid fa-earth-americas'></i> Ar
						</span>
					)}
				</ArabicPhone>
				<LogoSection>
					<img
						src={
							homePage && homePage.janatLogo && homePage.janatLogo.url
								? homePage.janatLogo.url
								: "https://res.cloudinary.com/infiniteapps/image/upload/v1707282182/janat/1707282182070.png"
						}
						alt='jannatbooking umrah trips'
					/>
				</LogoSection>
				<NavLinks
					dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
					language={chosenLanguage === "Arabic"}
				>
					{chosenLanguage === "Arabic" ? (
						<>
							<li>
								<Link
									to='/'
									onClick={() =>
										window.scrollTo({ behavior: "smooth", top: 5 })
									}
								>
									الرئيسية
								</Link>
							</li>
							<li>
								<Link
									to='/our-hotels'
									onClick={() =>
										window.scrollTo({ behavior: "smooth", top: 8 })
									}
								>
									فنادقنا
								</Link>
							</li>
							<li>
								<Link
									to='/about'
									onClick={() =>
										window.scrollTo({ behavior: "smooth", top: 8 })
									}
								>
									معلومات عنا
								</Link>
							</li>
							<li>
								<Link
									to='/contact'
									onClick={() =>
										window.scrollTo({ behavior: "smooth", top: 8 })
									}
								>
									اتصل بنا
								</Link>
							</li>
						</>
					) : (
						<>
							<li>
								{" "}
								<Link
									to='/'
									onClick={() =>
										window.scrollTo({ behavior: "smooth", top: 5 })
									}
								>
									Home
								</Link>{" "}
							</li>
							<li>
								{" "}
								<Link
									to='/our-hotels'
									onClick={() =>
										window.scrollTo({ behavior: "smooth", top: 8 })
									}
								>
									Our Hotels
								</Link>{" "}
							</li>
							<li>
								{" "}
								<Link
									to='/about'
									onClick={() =>
										window.scrollTo({ behavior: "smooth", top: 8 })
									}
								>
									About Us
								</Link>{" "}
							</li>
							<li>
								{" "}
								<Link
									to='/contact'
									onClick={() =>
										window.scrollTo({ behavior: "smooth", top: 8 })
									}
								>
									Call Us
								</Link>{" "}
							</li>
						</>
					)}
				</NavLinks>

				<MobileIcon onClick={toggleDrawer}>☰</MobileIcon>
			</NavbarWrapper>
			<SideDrawer isOpen={isDrawerOpen} language={chosenLanguage === "Arabic"}>
				{chosenLanguage === "Arabic" ? (
					<>
						<li
							onClick={() => {
								setIsDrawerOpen(false);
								window.scrollTo({ top: 0, behavior: "smooth" });
							}}
						>
							<Link to='/'>الرئيسية</Link>
						</li>
						<li
							onClick={() => {
								setIsDrawerOpen(false);
								window.scrollTo({ top: 8, behavior: "smooth" });
							}}
						>
							<Link to='/our-hotels'>فنادقنا</Link>
						</li>
						<li
							onClick={() => {
								setIsDrawerOpen(false);
								window.scrollTo({ top: 8, behavior: "smooth" });
							}}
						>
							<Link to='/about'>معلومات عنا</Link>
						</li>
						<li
							onClick={() => {
								setIsDrawerOpen(false);
								window.scrollTo({ top: 8, behavior: "smooth" });
							}}
						>
							<Link to='/contact'>اتصل بنا</Link>
						</li>
					</>
				) : (
					<>
						<li
							onClick={() => {
								setIsDrawerOpen(false);
								window.scrollTo({ top: 0, behavior: "smooth" });
							}}
						>
							{" "}
							<Link to='/'>Home</Link>{" "}
						</li>
						<li
							onClick={() => {
								setIsDrawerOpen(false);
								window.scrollTo({ top: 8, behavior: "smooth" });
							}}
						>
							{" "}
							<Link to='/our-hotels'>Our Hotels</Link>{" "}
						</li>
						<li
							onClick={() => {
								setIsDrawerOpen(false);
								window.scrollTo({ top: 8, behavior: "smooth" });
							}}
						>
							{" "}
							<Link to='/about'>About Us</Link>{" "}
						</li>
						<li
							onClick={() => {
								setIsDrawerOpen(false);
								window.scrollTo({ top: 8, behavior: "smooth" });
							}}
						>
							{" "}
							<Link to='/contact'>Call Us</Link>{" "}
						</li>
					</>
				)}
			</SideDrawer>
			<Backdrop isOpen={isDrawerOpen} onClick={closeDrawer} />
		</>
	);
};

export default Navbar;

const NavbarWrapper = styled.div`
	top: 0;
	z-index: 40;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0% 10%;
	height: 80px;
	background-color: ${(props) => (props.inTop ? "" : "var(--primaryBlue)")};

	position: sticky; /* or 'fixed' */
	width: 100%; /* Ensure it spans the full width */
	left: 0; /* Align it to the left edge */

	@media (max-width: 1000px) {
		position: fixed; /* Keep it fixed on smaller screens */
	}
`;

const LogoSection = styled.div`
	object-fit: cover;

	/* Logo styling */
	img {
		width: 222px;
		height: 60px;
		object-fit: cover;
	}

	@media (max-width: 1000px) {
		img {
			width: 100%;
		}
	}
`;

const NavLinks = styled.ul`
	list-style: none;
	display: flex;
	gap: 30px;
	color: white;
	cursor: pointer;
	align-items: center;
	margin: auto 0px;

	a {
		color: white;
	}

	@media (max-width: 768px) {
		display: none;
	}

	& li {
		white-space: nowrap; // Prevent wrapping
		min-width: max-content; // Ensure enough width for each item
	}
`;

const MobileIcon = styled.div`
	display: none;
	color: white;
	font-size: 30px;

	@media (max-width: 768px) {
		display: block;
		cursor: pointer;
	}
`;

const ArabicPhone = styled.span`
	display: none;

	@media (max-width: 1000px) {
		display: block;
		font-size: 12px;
		margin-right: 5px;
		font-weight: bold;
		text-decoration: underline;
		color: white;
		cursor: pointer;
	}
`;

const SideDrawer = styled.div`
	position: fixed;
	top: 0;
	right: 0;
	width: 250px;
	height: 100%;
	background: white;
	transform: ${({ isOpen }) => (isOpen ? "translateX(0)" : "translateX(100%)")};
	transition: transform 0.3s ease-in-out;
	z-index: 50; // Higher than Backdrop
	background-color: var(--primaryBlue);

	a {
		color: white;
	}

	@media (min-width: 769px) {
		display: none;
	}

	& li {
		padding: 30px 20px;
		list-style: none;
		text-align: ${({ language }) => (language ? "right" : "")};
		font-weight: bold;
		color: white;
	}
`;

const Backdrop = styled.div`
	display: ${({ isOpen }) => (isOpen ? "block" : "none")};
	position: fixed;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	background: rgba(0, 0, 0, 0.5); // Darkened background
	backdrop-filter: blur(5px); // Blurry effect
	z-index: 40; // Ensure it's below the SideDrawer but above other content
`;
