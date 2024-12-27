import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CartProvider } from "./cart_context";
import ReactPixel from "react-facebook-pixel";

// Initialize Facebook Pixel with the .env variable
const pixelId = process.env.REACT_APP_FACEBOOK_PIXEL_ID; // Get Pixel ID from .env
ReactPixel.init(pixelId); // Initialize Pixel
ReactPixel.pageView(); // Trigger initial PageView event

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<CartProvider>
		<App />
	</CartProvider>
);
