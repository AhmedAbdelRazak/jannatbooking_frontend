import React from "react";
import styled from "styled-components";

const PopularHotels = () => {
	return (
		<PopularHotelsWrapper>
			<div className='container'>
				<div className='wpo-section-title-s2'>
					<h2>OUR MOST POPULAR HOTELS!</h2>
					<p>
						Enjoy Your Major & Minor Pilgrimage With The Best Rates ONLY WITH
						JANAT BOOKING!{" "}
					</p>
				</div>

				<div className='room-wrapper mt-5'>Hello Here is my rooms yaba</div>
			</div>
		</PopularHotelsWrapper>
	);
};

export default PopularHotels;

const PopularHotelsWrapper = styled.div`
	position: absolute;
	top: 112%;
	left: 50%;
	transform: translate(-50%, -50%);
	padding: 30px; // Adjust padding as needed
	width: 70%;
	margin-top: 70px;

	.wpo-section-title span,
	.wpo-section-title-s2 span {
		text-transform: uppercase;
		font-size: 20px;
		color: #fc4c4c;
		font-family: "Futura PT";
	}

	.wpo-section-title h2,
	.wpo-section-title-s2 h2 {
		font-size: 45px;
		line-height: 55px;
		margin: 0;
		position: relative;
		text-transform: capitalize;
		font-family: "Futura PT";
		font-weight: 600;
		margin-top: 0;
		margin-bottom: 20px;
	}

	.wpo-section-title p,
	.wpo-section-title-s2 p {
		font-size: 18px;
		max-width: 540px;
		margin-bottom: 0;
	}

	.wpo-section-title .btns,
	.wpo-section-title-s2 .btns {
		display: -webkit-box;
		display: -ms-flexbox;
		display: flex;
		-webkit-box-pack: end;
		-ms-flex-pack: end;
		justify-content: flex-end;
	}

	.wpo-section-title .btns a,
	.wpo-section-title-s2 .btns a {
		border: 1px solid #fc4c4c;
		width: 180px;
		height: 50px;
		display: block;
		text-align: center;
		line-height: 50px;
		font-size: 22px;
		font-weight: 600;
		color: #fc4c4c;
		border-radius: 10px;
	}

	.wpo-section-title .btns a:hover,
	.wpo-section-title-s2 .btns a:hover {
		background: #fc4c4c;
		color: #fff;
	}

	.wpo-section-title-s2 {
		text-align: center;
	}

	.wpo-section-title-s2 p {
		margin: 0 auto;
	}

	@media (max-width: 767px) {
		top: 92%;
		left: 50%;
		transform: translate(-50%, -50%);
		padding: 5px; // Adjust padding as needed
		width: 100%;
		margin-top: 50px;

		.wpo-section-title h2,
		.wpo-section-title-s2 h2 {
			font-size: 1.5rem;
			line-height: 35px;
			font-weight: 600;
		}

		.wpo-section-title p,
		.wpo-section-title-s2 p {
			font-size: 16px;
			max-width: 540px;
			margin-bottom: 0;
		}
	}
`;
