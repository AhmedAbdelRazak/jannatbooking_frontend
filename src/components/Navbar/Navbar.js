import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { FaHeart } from "react-icons/fa";
import SidebarCartDrawer from "./SidebarCartDrawer";
import { Link } from "react-router-dom";
import { useCartContext } from "../../cart_context";
import HeaderTopbar from "./HeaderTopbar";
import { gettingJannatWebsiteData } from "../../apiCore";

const Navbar = () => {
	const { languageToggle, chosenLanguage, total_rooms, openSidebar2 } =
		useCartContext();
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

			<NavbarWrapper
				inTop={inTop}
				dir={chosenLanguage === "Arabic" ? "rtl" : ""}
			>
				<LogoSection onClick={() => (window.location.href = "/")}>
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
								<Link to='/' onClick={() => window.scrollTo({ top: 0 })}>
									الرئيسية
								</Link>
							</li>
							<li>
								<Link
									to='/our-hotels'
									onClick={() => window.scrollTo({ top: 8 })}
								>
									فنادقنا
								</Link>
							</li>
							<li>
								<Link to='/about' onClick={() => window.scrollTo({ top: 8 })}>
									معلومات عنا
								</Link>
							</li>
							<li>
								<Link to='/contact' onClick={() => window.scrollTo({ top: 8 })}>
									اتصل بنا
								</Link>
							</li>
						</>
					) : (
						<>
							<li>
								<Link to='/' onClick={() => window.scrollTo({ top: 0 })}>
									Home
								</Link>
							</li>
							<li>
								<Link
									to='/our-hotels'
									onClick={() => window.scrollTo({ top: 8 })}
								>
									Our Hotels
								</Link>
							</li>
							<li>
								<Link to='/about' onClick={() => window.scrollTo({ top: 8 })}>
									About Us
								</Link>
							</li>
							<li>
								<Link to='/contact' onClick={() => window.scrollTo({ top: 8 })}>
									Call Us
								</Link>
							</li>
						</>
					)}
				</NavLinks>

				<IconsWrapper>
					<LanguageToggle>
						{chosenLanguage === "Arabic" ? (
							<span onClick={() => languageToggle("English")}>
								<i className='fa-solid fa-earth-americas'></i> En
							</span>
						) : (
							<span onClick={() => languageToggle("Arabic")}>
								<i className='fa-solid fa-earth-americas'></i> Ar
							</span>
						)}
					</LanguageToggle>

					<WishlistIcon />
					<CartIconWrapper>
						<CartIcon onClick={openSidebar2} />
						{total_rooms > 0 && <Badge>{total_rooms}</Badge>}
					</CartIconWrapper>
				</IconsWrapper>

				<MobileIcon onClick={toggleDrawer}>☰</MobileIcon>
			</NavbarWrapper>
			<SideDrawer isOpen={isDrawerOpen} language={chosenLanguage === "Arabic"}>
				{chosenLanguage === "Arabic" ? (
					<>
						<li onClick={() => setIsDrawerOpen(false)}>
							<Link to='/'>الرئيسية</Link>
						</li>
						<li onClick={() => setIsDrawerOpen(false)}>
							<Link to='/our-hotels'>فنادقنا</Link>
						</li>
						<li onClick={() => setIsDrawerOpen(false)}>
							<Link to='/about'>معلومات عنا</Link>
						</li>
						<li onClick={() => setIsDrawerOpen(false)}>
							<Link to='/contact'>اتصل بنا</Link>
						</li>
					</>
				) : (
					<>
						<li onClick={() => setIsDrawerOpen(false)}>
							<Link to='/'>Home</Link>
						</li>
						<li onClick={() => setIsDrawerOpen(false)}>
							<Link to='/our-hotels'>Our Hotels</Link>
						</li>
						<li onClick={() => setIsDrawerOpen(false)}>
							<Link to='/about'>About Us</Link>
						</li>
						<li onClick={() => setIsDrawerOpen(false)}>
							<Link to='/contact'>Call Us</Link>
						</li>
					</>
				)}
			</SideDrawer>
			<Backdrop isOpen={isDrawerOpen} onClick={closeDrawer} />
			<SidebarCartDrawer from='Navbar' />
		</>
	);
};

export default Navbar;

// Styled-components for styling the Navbar and cart
const NavbarWrapper = styled.div`
	top: 0;
	z-index: 40;
	display: flex;
	align-items: center;
	padding: 0% 5%;
	height: 80px;
	background-color: ${(props) => (props.inTop ? "" : "var(--primaryBlue)")};
	position: sticky;
	width: 100%;
	justify-content: space-between;

	@media (max-width: 1000px) {
		position: fixed;
		padding: 0% 3%;
	}
`;

const LogoSection = styled.div`
	flex: 1;
	display: flex;
	justify-content: flex-start;

	img {
		width: 180px;
		height: 60px;
		object-fit: cover;
	}

	@media (max-width: 768px) {
		img {
			width: 130px;
			height: 55px;
			object-fit: cover;
		}
	}
`;

const NavLinks = styled.ul`
	flex: 5;
	list-style: none;
	display: flex;
	justify-content: center;
	gap: 40px;
	color: white;
	align-items: center;
	height: 100%;
	margin-top: 12px;

	a {
		color: white;
		text-decoration: none;
		font-size: 1rem;
		font-weight: bolder;
	}

	@media (max-width: 768px) {
		display: none;
	}
`;

const IconsWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 20px;

	@media (max-width: 768px) {
		gap: 10px;
		margin-right: 10px;
	}
`;

const CartIconWrapper = styled.div`
	position: relative;
	cursor: pointer;
`;

const WishlistIcon = styled(FaHeart)`
	color: var(--secondary-color-lighter);
	font-size: 1.5rem;
	cursor: pointer;
`;

const CartIcon = styled(AiOutlineShoppingCart)`
	color: var(--text-color-light);
	font-size: 1.5rem;
`;

const Badge = styled.span`
	position: absolute;
	top: -10px;
	right: -10px;
	background: var(--secondary-color);
	color: var(--mainWhite);
	border-radius: 50%;
	padding: 2px 6px;
	font-size: 0.8rem;
	font-weight: bold;
`;

const LanguageToggle = styled.div`
	display: none;

	@media (max-width: 768px) {
		display: block;
		color: white;
		cursor: pointer;
		font-size: 0.85rem;
	}
`;

const MobileIcon = styled.div`
	display: none;
	color: white;
	font-size: 1.5rem;

	@media (max-width: 768px) {
		display: block;
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
	z-index: 50;
	background-color: var(--primaryBlue);

	a {
		color: white;
	}

	@media (min-width: 769px) {
		display: none;
	}

	& li {
		padding: 20px;
		list-style: none;
		text-align: ${({ language }) => (language ? "right" : "left")};
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
	background: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(5px);
	z-index: 40;
`;
