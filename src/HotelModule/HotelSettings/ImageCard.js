import React from "react";
import styled from "styled-components";
import imageImage from "../../GeneralImages/UploadImageImage.jpg";

const ImageCard = ({
	handleImageRemove,
	fileUploadAndResizeThumbNail,
	hotelPhotos,
	roomType,
}) => {
	const roomPhotos =
		hotelPhotos.find((photo) => photo.room_type === roomType) || {};

	const handleFileChange = (e) => {
		fileUploadAndResizeThumbNail(e, roomType);
	};

	return (
		<ImageCardWrapper>
			<div className='card card-flush py-4'>
				<div className='card-body text-center pt-0'>
					<div className='image-input image-input-empty image-input-outline image-input-placeholder mb-3'>
						<div className='image-input-wrapper'></div>
						{roomPhotos &&
							roomPhotos.photos &&
							roomPhotos.photos.map((image, index) => (
								<ImageContainer key={index}>
									<CloseButton
										onClick={() => handleImageRemove(roomType, image.public_id)}
										aria-label='Close'
									>
										&times;
									</CloseButton>
									<img
										src={image.url}
										alt='Room'
										style={{
											width: "150px",
											height: "150px",
											boxShadow: "1px 1px 1px 1px rgba(0,0,0,0.2)",
										}}
									/>
								</ImageContainer>
							))}
					</div>
					<div>
						<label style={{ cursor: "pointer", fontSize: "0.95rem" }}>
							<img
								src={imageImage}
								alt='imageUpload'
								style={{ width: "200px", height: "200px" }}
							/>
							<input
								type='file'
								multiple
								hidden
								accept='images/*'
								onChange={handleFileChange}
								required
							/>
						</label>
					</div>
					<div className='text-muted fs-7'>
						Width: 800px, Height: 954px;
						<br />
						Set the room thumbnail image. Only *.png, *.jpg and *.jpeg image
						files are accepted
					</div>
				</div>
			</div>
		</ImageCardWrapper>
	);
};

export default ImageCard;

const ImageCardWrapper = styled.div`
	.card {
		border: 1px white solid !important;
		max-width: 90%;
	}
`;

const ImageContainer = styled.div`
	position: relative;
	display: inline-block;
	margin: 5px;
`;

const CloseButton = styled.button`
	position: absolute;
	top: -10px;
	right: 0px;
	background-color: black;
	color: white;
	border: none;
	border-radius: 50%;
	cursor: pointer;
	font-size: 20px;
	line-height: 20px;
	padding: 5px;
`;
