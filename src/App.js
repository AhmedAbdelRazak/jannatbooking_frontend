import React, { useEffect } from "react";
import "./App.css";
import { Route, Switch, BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCartContext } from "./cart_context";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Home from "./pages/Home";
import OurHotels from "./pages/OurHotels";
import SingleHotelPage from "./pages/SingleHotelPage";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import ListProperty from "./pages/ListProperty";

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

	// user must see under review
	// separate rooms count from the photos
	// Drop down to choose new room type and then some data about this
	// Gallery button for all uploaded photos
	// Instead of Main Hotel Thumbnail, Make the user upload all of his/her photos
	// Every picture description (room view, towels, bathrooms, building)
	// Global components for all tables.
	// Default pricing of every room type

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
					<Route path='/list-property' exact component={ListProperty} />
				</Switch>
			</>

			<Footer />
		</BrowserRouter>
	);
};

export default App;
