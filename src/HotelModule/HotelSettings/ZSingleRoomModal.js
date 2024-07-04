/** @format */

import React from "react";
import styled from "styled-components";
import { Modal } from "antd";
import {
	BedSizes,
	Views,
	roomTypeColors,
	roomTypes,
} from "../../AdminModule/NewHotels/Assets";
import { toast } from "react-toastify";
import { isAuthenticated } from "../../auth";
import { updateSingleRoom } from "../apiAdmin";

const ZSingleRoomModal = ({
	modalVisible,
	setModalVisible,
	clickedRoom,
	setClickedRoom,
	clickedFloor,
	rooms,
	setRooms,
	setHelperRender,
	helperRender,
}) => {
	const { user, token } = isAuthenticated();

	console.log(clickedRoom, "clickedRoom");
	console.log(rooms, "rooms");

	const updatingSingleRoom = () => {
		updateSingleRoom(clickedRoom._id, user._id, token, clickedRoom)
			.then((data) => {
				if (data && data.error) {
					console.error(data.error, "Error Updating A Room");
				} else {
					toast.success(
						`Room #${clickedRoom.room_number} Was Successfully Updated`
					);
					setTimeout(() => {
						setModalVisible(false);
					}, 1000);
					setTimeout(() => {
						window.location.reload(false);
					}, 1500);
				}
			})
			.catch((error) => {
				console.error("Error occurred:", error);
			});
	};

	const updateRoomState = () => {
		// Close the modal
		setModalVisible(false);

		// Check if clickedRoom has an _id, if not use the combination of room_number and floor
		const roomIdentifier = clickedRoom._id
			? clickedRoom._id
			: `${clickedRoom.floor}-${clickedRoom.room_number}`;

		// Map over the rooms and update the state for the matching room
		const updatedRooms = rooms.map((room) => {
			const currentRoomIdentifier = room._id
				? room._id
				: `${room.floor}-${room.room_number}`;
			if (currentRoomIdentifier === roomIdentifier) {
				return { ...room, ...clickedRoom }; // Spread the existing room and overwrite with clickedRoom
			}
			return room; // Return the room unchanged if it doesn't match
		});

		// Update the rooms state with the new array
		setRooms(updatedRooms);

		setClickedRoom("");

		// Optionally, if you need to trigger some re-render or additional effects
		// after updating the rooms, you can call setHelperRender or other state setters here.
	};

	// console.log(clickedRoom, "clickedRoom");

	const mainForm = () => {
		// Find the current floor data

		return (
			<InputFieldStylingWrapper className='mx-auto text-center'>
				<h3
					style={{
						fontSize: "1.1rem",
						textDecoration: "underline",
						textAlign: "left",
						fontWeight: "bold",
					}}
				>
					Edit Room #{clickedRoom.room_number} Floor #{clickedFloor}
				</h3>

				<div className='row'>
					<div className=' col-md-2 form-group' style={{ marginTop: "10px" }}>
						<label
							htmlFor='name'
							style={{
								fontWeight: "bold",
								fontSize: "11px",
								textAlign: "center",
							}}
						>
							Room Type
						</label>
						<select
							style={{ textTransform: "capitalize" }}
							onChange={(e) => {
								const newRoomType = e.target.value;
								const newColorCode = roomTypeColors[newRoomType];
								setClickedRoom({
									...clickedRoom,
									room_type: newRoomType,
									roomColorCode: newColorCode,
								});
							}}
						>
							{clickedRoom && clickedRoom.room_type ? (
								<option value={clickedRoom.room_type}>
									{clickedRoom.room_type}
								</option>
							) : (
								<option value=''>Please Select</option>
							)}
							{roomTypes.map((t, i) => (
								<option key={i} value={t}>
									{t}
								</option>
							))}
						</select>
					</div>

					<div className=' col-md-2 form-group' style={{ marginTop: "10px" }}>
						<label
							htmlFor='name'
							style={{
								fontWeight: "bold",
								fontSize: "11px",
								textAlign: "center",
							}}
						>
							Bed Size
						</label>
						<select
							style={{ textTransform: "capitalize" }}
							onChange={(e) => {
								setClickedRoom({
									...clickedRoom,
									room_features: Array.isArray(clickedRoom.room_features)
										? clickedRoom.room_features.map((feature, index) =>
												index === 0
													? { ...feature, bedSize: e.target.value }
													: feature
										  )
										: [{ bedSize: e.target.value }], // If it's not an array, create a new array with the bedSize
								});
							}}
						>
							{clickedRoom &&
							clickedRoom.room_features &&
							clickedRoom.room_features[0] &&
							clickedRoom.room_features[0].bedSize ? (
								<option value=''>{clickedRoom.room_features[0].bedSize}</option>
							) : (
								<option value=''>Please Select</option>
							)}
							{BedSizes &&
								BedSizes.map((b, i) => {
									return (
										<option key={i} value={b}>
											{b}
										</option>
									);
								})}
						</select>
					</div>
					<div className=' col-md-2 form-group' style={{ marginTop: "10px" }}>
						<label
							htmlFor='name'
							style={{
								fontWeight: "bold",
								fontSize: "11px",
								textAlign: "center",
							}}
						>
							Bed View
						</label>
						<select
							style={{ textTransform: "capitalize" }}
							onChange={(e) => {
								setClickedRoom({
									...clickedRoom,
									room_features: clickedRoom.room_features.map(
										(feature, index) =>
											index === 0
												? { ...feature, view: e.target.value }
												: feature
									),
								});
							}}
						>
							{clickedRoom &&
							clickedRoom.room_features &&
							clickedRoom.room_features[0] &&
							clickedRoom.room_features[0].view ? (
								<option value=''>{clickedRoom.room_features[0].view}</option>
							) : (
								<option value=''>Please Select</option>
							)}
							{Views &&
								Views.map((b, i) => {
									return (
										<option key={i} value={b}>
											{b}
										</option>
									);
								})}
						</select>
					</div>
					<div className=' col-md-2 form-group' style={{ marginTop: "10px" }}>
						<label
							htmlFor='name'
							style={{
								fontWeight: "bold",
								fontSize: "11px",
								textAlign: "center",
							}}
						>
							Smoking
						</label>
						<select
							style={{ textTransform: "capitalize" }}
							onChange={(e) => {
								setClickedRoom({
									...clickedRoom,
									room_features: clickedRoom.room_features.map(
										(feature, index) =>
											index === 0
												? { ...feature, smoking: e.target.value }
												: feature
									),
								});
							}}
						>
							{clickedRoom &&
							clickedRoom.room_features &&
							clickedRoom.room_features[0] &&
							clickedRoom.room_features[0].smoking === false ? (
								<option value=''>No Smoking</option>
							) : (
								<option value=''>Please Select</option>
							)}
							<option value={false}>No Smoking</option>
							<option value={true}>For Smokers</option>
						</select>
					</div>
				</div>
				<h3
					style={{
						fontSize: "1rem",
						textDecoration: "underline",
						textAlign: "left",
						fontWeight: "bold",
						marginTop: "25px",
					}}
				>
					Price Rates Room #{clickedRoom.room_number} Floor #{clickedFloor}
				</h3>

				<div className='row'>
					<div className=' col-md-2 form-group' style={{ marginTop: "10px" }}>
						<label
							style={{
								fontWeight: "bold",
								fontSize: "11px",
								textAlign: "center",
							}}
						>
							Base Price
						</label>
						<input
							type='number'
							value={
								clickedRoom.room_pricing && clickedRoom.room_pricing.basePrice
							}
							onChange={(e) =>
								setClickedRoom({
									...clickedRoom,
									room_pricing: {
										...clickedRoom.room_pricing,
										basePrice: e.target.value,
									},
								})
							}
							required
						/>
					</div>
					<div className=' col-md-2 form-group' style={{ marginTop: "10px" }}>
						<label
							style={{
								fontWeight: "bold",
								fontSize: "11px",
								textAlign: "center",
							}}
						>
							Seasonal Price
						</label>
						<input
							type='number'
							value={
								clickedRoom.room_pricing && clickedRoom.room_pricing.seasonPrice
							}
							onChange={(e) =>
								setClickedRoom({
									...clickedRoom,
									room_pricing: {
										...clickedRoom.room_pricing,
										seasonPrice: e.target.value,
									},
								})
							}
							required
						/>
					</div>

					<div className=' col-md-2 form-group' style={{ marginTop: "10px" }}>
						<label
							style={{
								fontWeight: "bold",
								fontSize: "11px",
								textAlign: "center",
							}}
						>
							Weekend Price
						</label>
						<input
							type='number'
							value={
								clickedRoom.room_pricing &&
								clickedRoom.room_pricing.weekendPrice
							}
							onChange={(e) =>
								setClickedRoom({
									...clickedRoom,
									room_pricing: {
										...clickedRoom.room_pricing,
										weekendPrice: e.target.value,
									},
								})
							}
							required
						/>
					</div>

					<div className=' col-md-2 form-group' style={{ marginTop: "10px" }}>
						<label
							style={{
								fontWeight: "bold",
								fontSize: "11px",
								textAlign: "center",
							}}
						>
							Last Minute Book Price
						</label>
						<input
							type='number'
							value={
								clickedRoom.room_pricing &&
								clickedRoom.room_pricing.lastMinuteDealPrice
							}
							onChange={(e) =>
								setClickedRoom({
									...clickedRoom,
									room_pricing: {
										...clickedRoom.room_pricing,
										lastMinuteDealPrice: e.target.value,
									},
								})
							}
							required
						/>
					</div>
				</div>
				{clickedRoom && clickedRoom._id && (
					<div>
						<button
							className='btn btn-outline-success'
							onClick={updatingSingleRoom}
						>
							Update Room #{clickedRoom.room_number}
						</button>
					</div>
				)}
			</InputFieldStylingWrapper>
		);
	};

	return (
		<ZSingleRoomModalWrapper>
			<Modal
				width='70%'
				title={
					<div
						style={{
							textAlign: "center",
							fontWeight: "bold",
							fontSize: "1.3rem",
						}}
					>{`Edit Room #${clickedRoom.room_number}`}</div>
				}
				open={modalVisible}
				onOk={updateRoomState}
				// okButtonProps={{ style: { display: "none" } }}
				cancelButtonProps={{ style: { display: "none" } }}
				onCancel={() => {
					setModalVisible(false);
				}}
			>
				{!clickedRoom && !clickedRoom._id ? setModalVisible(false) : mainForm()}
			</Modal>
		</ZSingleRoomModalWrapper>
	);
};

export default ZSingleRoomModal;

const ZSingleRoomModalWrapper = styled.div`
	z-index: 18000 !important;
`;

const InputFieldStylingWrapper = styled.div`
	input[type="text"],
	input[type="email"],
	input[type="password"],
	input[type="date"],
	input[type="number"],
	select,
	textarea {
		display: block;
		width: 100%;
		padding: 0.5rem;
		font-size: 1rem;
		border: 1px solid #ccc;
	}
	input[type="text"]:focus,
	input[type="email"]:focus,
	input[type="password"]:focus,
	input[type="number"]:focus,
	input[type="date"]:focus,
	select:focus,
	textarea:focus,
	label:focus {
		outline: none;
		border: 1px solid var(--primaryColor);

		box-shadow: 5px 8px 3px 0px rgba(0, 0, 0, 0.3);
		transition: var(--mainTransition);
		font-weight: bold;
	}
`;
