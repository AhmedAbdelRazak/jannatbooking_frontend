import React from "react";
import styled from "styled-components";
import CheckoutContent from "../components/checkout/CheckoutContent";

const Checkout = () => {
	return (
		<CheckoutWrapper>
			<CheckoutContent />
		</CheckoutWrapper>
	);
};

export default Checkout;

const CheckoutWrapper = styled.div`
	min-height: 800px;
	padding: 20px;
`;
