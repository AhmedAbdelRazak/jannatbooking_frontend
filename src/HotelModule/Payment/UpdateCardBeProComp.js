import React from "react";
import styled from "styled-components";
import DropIn from "braintree-web-drop-in-react";

const UpdateCardBeProComp = ({ data, updateUserCard }) => {
	return (
		<UpdateCardBeProCompWrapper>
			<h4>UPDATE YOUR CARD</h4>

			<div>
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
					onClick={updateUserCard}
					className='btn btn-success btn-block my-2 col-md-8 mx-auto'
				>
					Update Your Card
				</button>
			</div>
		</UpdateCardBeProCompWrapper>
	);
};

export default UpdateCardBeProComp;

const UpdateCardBeProCompWrapper = styled.div`
	min-height: 700px;
	h4 {
		font-weight: bolder;
		margin-top: 20px;
		text-align: center;
	}
`;
