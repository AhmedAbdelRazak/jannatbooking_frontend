import React, { useEffect } from "react";
import "./App.css";
import { Route, Switch, BrowserRouter, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-quill/dist/quill.snow.css";
import { useCartContext } from "./cart_context";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Home from "./pages/Home";
import OurHotels from "./pages/OurHotels";
import SingleHotelPage from "./pages/SingleHotelPage";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import ListProperty from "./pages/ListProperty";
import ChatIcon from "./Chat/ChatIcon";
import SingleHotelMain from "./pages/SingleHotelMain";
// eslint-disable-next-line
import OurHotelRooms from "./pages/OurHotelRooms";
import Checkout from "./pages/Checkout";
import ConfirmationPage from "./pages/ConfirmationPage";
import PrivateRoute from "./auth/PrivateRoute";
import UserDashboard from "./pages/UserDashboard";
import GeneratedLinkCheckout from "./pages/GeneratedLinkCheckout";
import About from "./pages/About";
import TermsAndConditions from "./pages/TermsAndConditions";
import ContactUs from "./pages/ContactUs";
import OurHotelRooms2 from "./pages/OurHotelRooms2";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import VerificationPage from "./pages/VerificationPage";

const App = () => {
	const { languageToggle, chosenLanguage } = useCartContext();

	const languageToggle2 = () => {
		localStorage.setItem("lang", JSON.stringify(chosenLanguage));
		// window.location.reload(false);
	};

	useEffect(() => {
		languageToggle2();
		languageToggle(chosenLanguage);
		// eslint-disable-next-line
	}, [chosenLanguage]);

	useEffect(() => {
		ReactGA.initialize(process.env.REACT_APP_GOOGLE_ANALYTICS_MEASUREMENTID);
		ReactGA.send(window.location.pathname + window.location.search);

		// eslint-disable-next-line
	}, [window.location.pathname]);

	useEffect(() => {
		const fetchCurrencyRates = async () => {
			try {
				const response = await fetch(
					`${process.env.REACT_APP_API_URL}/currency-rates`
				); // Backend API endpoint
				if (!response.ok) {
					throw new Error("Failed to fetch currency rates");
				}

				const rates = await response.json();
				// Store rates in localStorage
				localStorage.setItem("rates", JSON.stringify(rates));
			} catch (error) {
				console.error("Error fetching currency rates:", error);
			}
		};

		// Fetch rates when the app loads
		fetchCurrencyRates();
	}, []);

	const PixelRouteTracker = () => {
		const location = useLocation();

		useEffect(() => {
			// Trigger PageView event on route change
			ReactPixel.pageView(); // Logs the page view
			ReactPixel.track("PageView", { path: location.pathname }); // Optionally add path as a parameter
		}, [location]);

		return null;
	};

	useEffect(() => {
		// Initialize Facebook Pixel with ID from .env
		ReactPixel.init(process.env.REACT_APP_FACEBOOK_PIXEL_ID);

		// Trigger the initial page view when the app loads
		ReactPixel.pageView();
	}, []);

	return (
		<BrowserRouter>
			<PixelRouteTracker />
			<Navbar />
			<>
				<ToastContainer
					position='top-center'
					toastStyle={{ width: "auto", minWidth: "400px" }}
				/>

				<Switch>
					<Route path='/' exact component={Home} />
					<Route path='/our-hotels' exact component={OurHotels} />
					<Route path='/hotel/:hotelslug' exact component={SingleHotelPage} />
					<Route path='/signup' exact component={Signup} />
					<Route path='/signin' exact component={Signin} />
					<Route path='/about' exact component={About} />
					<Route path='/contact' exact component={ContactUs} />
					<Route
						path='/terms-conditions'
						exact
						component={TermsAndConditions}
					/>
					<Route path='/list-property' exact component={ListProperty} />
					<Route
						path='/single-hotel/:hotelNameSlug'
						exact
						component={SingleHotelMain}
					/>
					{/* <Route path='/our-hotels-rooms' exact component={OurHotelRooms} /> */}
					<Route path='/our-hotels-rooms' exact component={OurHotelRooms2} />
					<Route path='/checkout' exact component={Checkout} />
					<Route
						path='/generated-link'
						exact
						component={GeneratedLinkCheckout}
					/>
					<Route
						path='/reservation-confirmed'
						exact
						component={ConfirmationPage}
					/>
					<Route
						path='/reservation-verification'
						exact
						component={VerificationPage}
					/>

					<PrivateRoute path='/dashboard' exact component={UserDashboard} />
				</Switch>
			</>

			{window.location.pathname.includes("admin") ||
			window.location.pathname.includes("management") ? null : (
				<>
					<ChatIcon />
				</>
			)}

			<Footer />
		</BrowserRouter>
	);
};

export default App;
