import React, { useEffect, useState } from "react";
import styled from "styled-components";
import CheckoutContent from "../components/checkout/CheckoutContent";
import { useCartContext } from "../cart_context";
import { Helmet } from "react-helmet";
import { Modal, Spin } from "antd";
import { useHistory } from "react-router-dom";

const Checkout = () => {
	const { roomCart, chosenLanguage, clearRoomCart } = useCartContext();
	const [verificationModalVisible, setVerificationModalVisible] =
		useState(false);
	const [isBuffering, setIsBuffering] = useState(false); // New state for buffering
	const history = useHistory();

	// Show the modal if there's a "Not Paid" reservation after buffering
	const handleNotPaidReservation = () => {
		setIsBuffering(true);
		setTimeout(() => {
			setIsBuffering(false); // Stop buffering after 2 seconds
			setVerificationModalVisible(true); // Show modal
		}, 2000);
	};

	// Handle modal close (ok or cancel)
	const handleModalClose = () => {
		clearRoomCart(); // Clear the cart
		history.push("/"); // Redirect to the home page
	};

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

			{/* Buffering state */}
			{isBuffering ? (
				<BufferingWrapper>
					<Spin size='large' />
					<p>
						{chosenLanguage === "Arabic"
							? "الرجاء الانتظار، يتم التحقق من الحجز..."
							: "Please wait, verifying your reservation..."}
					</p>
				</BufferingWrapper>
			) : (
				<CheckoutWrapper isArabic={chosenLanguage === "Arabic"}>
					<CheckoutContent
						verificationEmailSent={verificationModalVisible}
						setVerificationEmailSent={setVerificationModalVisible}
						onNotPaidReservation={handleNotPaidReservation}
					/>
				</CheckoutWrapper>
			)}

			{/* Verification Modal */}
			<Modal
				title={
					chosenLanguage === "Arabic"
						? "يرجى التحقق من بريدك الإلكتروني"
						: "Please Check Your Email"
				}
				open={verificationModalVisible}
				onOk={handleModalClose}
				onCancel={handleModalClose}
				okText={chosenLanguage === "Arabic" ? "موافق" : "OK"}
				cancelText={chosenLanguage === "Arabic" ? "إلغاء" : "Cancel"}
			>
				<p>
					{chosenLanguage === "Arabic"
						? "يرجى التحقق من بريدك الإلكتروني للتحقق من حجزك. إذا لم تتمكن من العثور على البريد الإلكتروني، يرجى التحقق من صندوق البريد العشوائي أو التواصل مع الدعم."
						: "Please check your email to verify your reservation. If you can't find the email, please check your spam folder or contact support."}
				</p>
			</Modal>
		</>
	);
};

export default Checkout;

// Styled Components
const CheckoutWrapper = styled.div`
	min-height: 800px;
	padding: 20px;

	div,
	p,
	span,
	section,
	small,
	input,
	button,
	li,
	ul {
		font-family: ${({ isArabic }) =>
			isArabic ? `"Droid Arabic Kufi", sans-serif` : ""};
	}
`;

const BufferingWrapper = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	min-height: 800px;
	padding: 20px;
	text-align: center;

	p {
		margin-top: 20px;
		font-size: 1.2rem;
		color: #555;
		text-align: center;
	}
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
