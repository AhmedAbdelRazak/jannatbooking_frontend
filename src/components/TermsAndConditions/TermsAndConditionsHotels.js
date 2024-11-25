import React from "react";
import styled from "styled-components";
import { useCartContext } from "../../cart_context";

const TermsAndConditionsHotels = ({ jannatBookingData }) => {
	const { chosenLanguage } = useCartContext();

	return (
		<TermsAndConditionsHotelsWrapper
			isArabic={chosenLanguage === "Arabic"}
			dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
		>
			<>
				{/* Display the terms and conditions */}
				<DescriptionWrapper>
					<div
						style={{ textAlign: chosenLanguage === "Arabic" ? "right" : "" }}
						dangerouslySetInnerHTML={{
							__html:
								chosenLanguage === "Arabic"
									? jannatBookingData.termsAndConditionArabic_B2B
									: jannatBookingData.termsAndConditionEnglish_B2B,
						}}
					/>
				</DescriptionWrapper>
			</>
		</TermsAndConditionsHotelsWrapper>
	);
};

export default TermsAndConditionsHotels;

const TermsAndConditionsHotelsWrapper = styled.div`
	ul,
	ol {
		margin-left: ${(props) => (props.isArabic ? "" : "1.5em")};
		padding-left: ${(props) => (props.isArabic ? "" : "1.5em")};

		margin-right: ${(props) => (props.isArabic ? "1.5em" : "")};
		padding-right: ${(props) => (props.isArabic ? "1.5em" : "")};
	}

	h2 {
		font-weight: bold;
	}

	@media (max-width: 800px) {
		h1 > strong {
			font-size: 1.5rem !important;
		}

		h2 {
			font-size: 1.3rem;
			font-weight: bold;
		}

		ul,
		ol {
			margin-left: ${(props) => (props.isArabic ? "" : "1em")};
			padding-left: ${(props) => (props.isArabic ? "" : "1em")};
			margin-right: ${(props) => (props.isArabic ? "1em" : "")};
			padding-right: ${(props) => (props.isArabic ? "1em" : "")};
		}
	}
`;

// eslint-disable-next-line
const BannerWrapper = styled.div`
	margin-bottom: 30px;
	img {
		width: 100%;
		height: auto;
		border-radius: 10px;
	}
`;

const DescriptionWrapper = styled.div`
	font-size: 1rem;
	line-height: 1.3;
	color: #333;

	img {
		width: 100%;
		height: auto;
		border-radius: 5px;
		max-height: 600px;
		object-fit: cover;
		padding: 0px !important;
		margin: 0px !important;
	}
`;
