import React from "react";
import styled from "styled-components";
import ZHotelDetailsForm from "./ZHotelDetailsForm";
import RoomPhotosUpload from "./RoomPhotosUpload";

const ZHotelDetails = ({
	values,
	hotelDetails,
	setHotelDetails,
	submittingHotelDetails,
	chosenLanguage,
	hotelPhotos,
	setHotelPhotos,
}) => {
	return (
		<ZAddHotelSettingsWrapper>
			<h3 style={{ textTransform: "capitalize" }}>
				Build Hotel ({values && values.hotelName})
			</h3>{" "}
			<div>
				<ZHotelDetailsForm
					hotelDetails={hotelDetails}
					setHotelDetails={setHotelDetails}
					chosenLanguage={chosenLanguage}
				/>

				<div className='my-5 mx-auto text-center'>
					<RoomPhotosUpload
						hotelDetails={hotelDetails}
						hotelPhotos={hotelPhotos}
						setHotelPhotos={setHotelPhotos}
					/>
				</div>
				<div className='mx-auto text-center mt-4'>
					<button
						onClick={() => {
							submittingHotelDetails();
						}}
						className='btn btn-primary'
					>
						Update Hotel Details
					</button>
				</div>
			</div>
		</ZAddHotelSettingsWrapper>
	);
};

export default ZHotelDetails;

const ZAddHotelSettingsWrapper = styled.div`
	h3 {
		font-weight: bold;
		font-size: 2rem;
		text-align: center;
		color: #006ad1;
	}
`;
