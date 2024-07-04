import React, { useState } from "react";
import axios from "axios";
import { cloudinaryUpload1 } from "../apiAdmin";
import { isAuthenticated } from "../../auth";
import ImageCard from "./ImageCard";
import { toast } from "react-toastify";

const RoomPhotosUpload = ({ hotelDetails, hotelPhotos, setHotelPhotos }) => {
	// eslint-disable-next-line
	const [loading, setLoading] = useState(false);

	const { user, token } = isAuthenticated();

	const fileUploadAndResizeThumbNail = (e, roomType) => {
		let files = e.target.files;
		let validFiles = [];
		let invalidFileIndexes = [];

		// Check each file for size and separate valid and invalid files
		Array.from(files).forEach((file, index) => {
			if (file.size <= 1500000) {
				// 1.5 MB in bytes
				validFiles.push(file);
			} else {
				invalidFileIndexes.push(index + 1); // +1 for user-friendly indexing
			}
		});

		// Notify user if there are any invalid files
		if (invalidFileIndexes.length) {
			toast.error(
				`Image(s) at position ${invalidFileIndexes.join(
					", "
				)} are more than 1.5 MB. Please try another image.`
			);
		}

		if (validFiles.length) {
			setLoading(true);
			const uploadPromises = validFiles.map((file) => {
				const reader = new FileReader();
				reader.readAsDataURL(file);

				return new Promise((resolve, reject) => {
					reader.onload = () => {
						const base64EncodedImage = reader.result;
						cloudinaryUpload1(user._id, token, { image: base64EncodedImage })
							.then(resolve)
							.catch(reject);
					};
					reader.onerror = (error) => reject(error);
				});
			});

			Promise.all(uploadPromises)
				.then((results) => {
					const newPhotos = results.map((data) => ({
						public_id: data.public_id,
						url: data.url,
					}));

					setHotelPhotos((prevPhotos) => {
						const updatedPhotos = prevPhotos.map((photo) => {
							if (photo.room_type === roomType) {
								return {
									...photo,
									photos: [...photo.photos, ...newPhotos],
								};
							}
							return photo;
						});

						if (!prevPhotos.some((photo) => photo.room_type === roomType)) {
							updatedPhotos.push({ room_type: roomType, photos: newPhotos });
						}

						return updatedPhotos;
					});
				})
				.finally(() => setLoading(false));
		}
	};

	const handleImageRemove = (roomType, public_id) => {
		setLoading(true);
		axios
			.post(
				`${process.env.REACT_APP_API_URL}/admin/removeimage/${user._id}`,
				{ public_id },
				{ headers: { Authorization: `Bearer ${token}` } }
			)
			.then((res) => {
				if (res.data) {
					setHotelPhotos((prevPhotos) => {
						return prevPhotos.map((roomPhotos) => {
							// Check if the current roomPhotos matches the roomType
							if (roomPhotos.room_type === roomType) {
								// Filter out the image with the matching public_id
								const filteredImages = roomPhotos.photos.filter(
									(image) => image.public_id !== public_id
								);
								return { ...roomPhotos, photos: filteredImages };
							}
							return roomPhotos;
						});
					});
				}
			})
			.catch((err) => {
				console.error("Error removing image:", err);
			})
			.finally(() => {
				setLoading(false);
			});
	};

	const FileUploadThumbnail = (roomType) => {
		return (
			<ImageCard
				roomType={roomType}
				hotelPhotos={hotelPhotos}
				handleImageRemove={handleImageRemove}
				setHotelPhotos={setHotelPhotos}
				fileUploadAndResizeThumbNail={fileUploadAndResizeThumbNail}
			/>
		);
	};

	console.log(hotelPhotos, "hotelPhotos");

	return (
		<div>
			<div>
				<h4 style={{ textTransform: "capitalize" }}>Main Hotel Thumbnail</h4>
				{FileUploadThumbnail("mainThumbnail")}
			</div>
			{Object.entries(hotelDetails.roomCountDetails).map(
				([roomType, count]) => {
					if (count > 0) {
						return (
							<div key={roomType}>
								<h4 style={{ textTransform: "capitalize" }}>{roomType}</h4>
								{FileUploadThumbnail(roomType)}
							</div>
						);
					}
					return null;
				}
			)}
		</div>
	);
};

export default RoomPhotosUpload;
