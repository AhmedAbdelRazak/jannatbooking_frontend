import React, { useEffect } from "react";
import styled from "styled-components";
import CheckoutContent from "../components/checkout/CheckoutContent";
import { useCartContext } from "../cart_context"; // Make sure to import useCartContext

const Checkout = () => {
	const { roomCart } = useCartContext(); // Access roomCart from the context

	useEffect(() => {
		if (window.innerWidth > 768) {
			// Only scroll to top if the screen width is larger than 768px (tablet or larger)
			window.scrollTo({ top: 50, behavior: "smooth" });
		} else {
			window.scrollTo({ top: 5, behavior: "smooth" });
		}
	}, []); // Empty dependency array to run on mount

	// If roomCart is empty, show the message and button
	if (roomCart.length === 0) {
		return (
			<EmptyCartWrapper>
				<Message>No rooms in your cart at the moment.</Message>
				<Button onClick={() => (window.location.href = "/our-hotels")}>
					Browse Our Hotels
				</Button>
			</EmptyCartWrapper>
		);
	}

	return (
		<CheckoutWrapper>
			<CheckoutContent />
		</CheckoutWrapper>
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
