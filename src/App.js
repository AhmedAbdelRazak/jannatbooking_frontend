import React, { useEffect } from "react";
import "./App.css";
import { Route, Switch, BrowserRouter } from "react-router-dom";
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

	return (
		<BrowserRouter>
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
