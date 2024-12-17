import React, { useEffect } from "react";
import styled from "styled-components";
import CheckoutContent from "../components/checkout/CheckoutContent";
import { useCartContext } from "../cart_context";
import { Helmet } from "react-helmet";

const Checkout = () => {
	const { roomCart } = useCartContext();

	useEffect(() => {
		if (window.innerWidth > 768) {
			window.scrollTo({ top: 50, behavior: "smooth" });
		} else {
			window.scrollTo({ top: 5, behavior: "smooth" });
		}
	}, []);

	if (roomCart.length === 0) {
		return (
			<>
				<Helmet>
					<title>Checkout | Jannat Booking - Haj & Omrah Hotels</title>
					<meta
						name='description'
						content='Your cart is empty. Browse our wide range of Haj and Omrah hotels and complete your booking with ease. Jannat Booking offers the best accommodations for pilgrims.'
					/>
					<meta
						name='keywords'
						content='Jannat Booking, checkout, Haj hotels, Omrah hotels, pilgrim reservations, cart empty, hotel booking'
					/>
					<meta property='og:title' content='Empty Cart | Jannat Booking' />
					<meta
						property='og:description'
						content='Your cart is empty. Start your Haj and Omrah journey with Jannat Booking - trusted hotel reservations for pilgrims.'
					/>
					<meta
						property='og:url'
						content='https://jannatbooking.com/checkout'
					/>
					<meta property='og:type' content='website' />
					<meta
						property='og:image'
						content='https://jannatbooking.com/default_checkout.jpg'
					/>
					<link rel='canonical' href='https://jannatbooking.com/checkout' />
				</Helmet>
				<EmptyCartWrapper>
					<Message>No rooms in your cart at the moment.</Message>
					<Button onClick={() => (window.location.href = "/our-hotels")}>
						Browse Our Hotels
					</Button>
				</EmptyCartWrapper>
			</>
		);
	}

	return (
		<>
			<Helmet>
				<title>
					Checkout | Jannat Booking - Complete Your Haj & Omrah Booking
				</title>
				<meta
					name='description'
					content='Complete your booking for Haj and Omrah hotels at Jannat Booking. Secure your accommodations for a smooth and stress-free pilgrimage experience.'
				/>
				<meta
					name='keywords'
					content='Jannat Booking, checkout, Haj hotel booking, Omrah hotel reservations, pilgrim accommodations, secure hotel booking'
				/>
				<meta property='og:title' content='Checkout | Jannat Booking' />
				<meta
					property='og:description'
					content='Complete your Haj and Omrah hotel booking easily with Jannat Booking. Secure accommodations for your pilgrimage journey.'
				/>
				<meta property='og:url' content='https://jannatbooking.com/checkout' />
				<meta property='og:type' content='website' />
				<meta
					property='og:image'
					content='https://jannatbooking.com/checkout_banner.jpg'
				/>
				<link rel='canonical' href='https://jannatbooking.com/checkout' />
			</Helmet>
			<CheckoutWrapper>
				<CheckoutContent />
			</CheckoutWrapper>
		</>
	);
};

export default Checkout;

// Styled components
const CheckoutWrapper = styled.div`
	min-height: 800px;
	padding: 20px;
`;

const EmptyCartWrapper = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	min-height: 800px;
	padding: 20px;
	text-align: center;
`;

const Message = styled.h2`
	margin-bottom: 20px;
	font-size: 1.5rem;
	color: #333;
`;

const Button = styled.button`
	padding: 10px 20px;
	background-color: var(--primary-color);
	color: white;
	border: none;
	border-radius: 5px;
	font-size: 1rem;
	cursor: pointer;

	&:hover {
		background-color: var(--primary-color-dark);
	}
`;
