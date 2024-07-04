import React from "react";
import styled from "styled-components";
import DropIn from "braintree-web-drop-in-react";

const PaymentForm = ({ data, setData, buy, user, chosenLanguage }) => {
	return (
		<PaymentFormWrapper>
			{data && data.loading ? null : (
				<div className=' col-md-12'>
					<DropIn
						options={{
							authorization: data && data.clientToken,
							// paypal: {
							// 	flow: "vault",
							// },
							// googlePay: {
							// 	flow: "vault",
							// },
							// applePay: {
							// 	flow: "vault",
							// },
						}}
						onInstance={(instance) => (data.instance = instance)}
					/>
					<button
						onClick={buy}
						className='btn btn-success btn-block my-2 col-md-8 mx-auto'
					>
						Pay Now
					</button>
				</div>
			)}
		</PaymentFormWrapper>
	);
};

export default PaymentForm;

const PaymentFormWrapper = styled.div``;
