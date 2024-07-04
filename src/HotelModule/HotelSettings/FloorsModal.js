/** @format */

import React from "react";
import styled from "styled-components";
import { Modal } from "antd";
import ZInputFieldRoomsPFloor from "./ZInputFieldRoomsPFloor";
import { roomTypeColors } from "../../AdminModule/NewHotels/Assets";

const FloorsModal = ({
	modalVisible,
	setModalVisible,
	clickedFloor,
	floorDetails,
	setFloorDetails,
	hotelDetails,
	rooms,
	setRooms,
	values,
}) => {
	const getRoomCountTotal = (roomCountDetails) => {
		return Object.values(roomCountDetails).reduce((total, count) => {
			// Convert count to a number and validate it
			const numericCount = Number(count);
			if (isNaN(numericCount)) {
				console.warn(`Invalid count value: ${count}`);
				return total;
			}
			return total + numericCount;
		}, 0);
	};

	// Usage
	const totalRooms = getRoomCountTotal(floorDetails.roomCountDetails);

	const handleRoomCountChange = (roomType, value) => {
		const newRoomCount = Number(value);
		const newFloorDetails = {
			...floorDetails,
			roomCountDetails: {
				...floorDetails.roomCountDetails,
				[roomType]: newRoomCount,
			},
		};

		// Automatically update pricing if room count is changed
		if (newRoomCount > 0 && hotelDetails.roomCountDetails[`${roomType}Price`]) {
			newFloorDetails.roomCountDetails[`${roomType}Price`] =
				hotelDetails.roomCountDetails[`${roomType}Price`];
		}

		setFloorDetails(newFloorDetails);
	};

	const populateAllRooms = () => {
		const newRoomsForCurrentFloor = [];
		const roomTypes = Object.keys(floorDetails.roomCountDetails);

		let currentRoomNumber = 1;

		roomTypes.forEach((type) => {
			if (type.endsWith("Price")) return;

			const count = floorDetails.roomCountDetails[type];
			const priceObject = floorDetails.roomCountDetails[`${type}Price`];

			for (let i = 0; i < count; i++) {
				const roomNumber = `${clickedFloor}${String(currentRoomNumber).padStart(
					2,
					"0"
				)}`;
				newRoomsForCurrentFloor.push({
					room_number: roomNumber,
					room_type: type,
					room_pricing: priceObject,
					roomColorCode: roomTypeColors[type] || "#000", // Default to black if no color is found
					floor: clickedFloor,
					hotelId: hotelDetails._id,
					belongsTo: values._id,
				});
				currentRoomNumber++;
			}
		});

		// Remove old rooms for the current floor
		const updatedRooms = rooms.filter((room) => room.floor !== clickedFloor);

		// Add new rooms for the current floor
		setRooms([...updatedRooms, ...newRoomsForCurrentFloor]);
	};

	// console.log(floorDetails, "From Modal Floor Details");

	const mainForm = () => {
		// Find the current floor data

		return (
			<div className='mx-auto text-center'>
				<h3
					style={{
						fontSize: "1.1rem",
						textDecoration: "underline",
						textAlign: "left",
						fontWeight: "bold",
					}}
				>
					Room Types & Count In Floor #{clickedFloor}
				</h3>
				<div className='row'>
					<ZInputFieldRoomsPFloor
						Title={"Standard Room"}
						value={floorDetails.roomCountDetails.standardRooms}
						handleFloorRoomsCount={handleRoomCountChange}
						roomType='standardRooms'
					/>

					<ZInputFieldRoomsPFloor
						Title={"Single Rooms"}
						value={floorDetails.roomCountDetails.singleRooms}
						handleFloorRoomsCount={handleRoomCountChange}
						roomType='singleRooms'
					/>
					<ZInputFieldRoomsPFloor
						Title={"Double Rooms"}
						value={floorDetails.roomCountDetails.doubleRooms}
						handleFloorRoomsCount={handleRoomCountChange}
						roomType='doubleRooms'
					/>

					<ZInputFieldRoomsPFloor
						Title={"Twin Rooms"}
						value={floorDetails.roomCountDetails.twinRooms}
						handleFloorRoomsCount={handleRoomCountChange}
						roomType='twinRooms'
					/>

					<ZInputFieldRoomsPFloor
						Title={"Queen Rooms"}
						value={floorDetails.roomCountDetails.queenRooms}
						handleFloorRoomsCount={handleRoomCountChange}
						roomType='queenRooms'
					/>

					<ZInputFieldRoomsPFloor
						Title={"King Rooms"}
						value={floorDetails.roomCountDetails.kingRooms}
						handleFloorRoomsCount={handleRoomCountChange}
						roomType='kingRooms'
					/>

					<ZInputFieldRoomsPFloor
						Title={"Triple Rooms"}
						value={floorDetails.roomCountDetails.tripleRooms}
						handleFloorRoomsCount={handleRoomCountChange}
						roomType='tripleRooms'
					/>

					<ZInputFieldRoomsPFloor
						Title={"Quad Rooms"}
						value={floorDetails.roomCountDetails.quadRooms}
						handleFloorRoomsCount={handleRoomCountChange}
						roomType='quadRooms'
					/>

					<ZInputFieldRoomsPFloor
						Title={"Suites"}
						value={floorDetails.roomCountDetails.suite}
						handleFloorRoomsCount={handleRoomCountChange}
						roomType='suite'
					/>

					<ZInputFieldRoomsPFloor
						Title={"Family Rooms"}
						value={floorDetails.roomCountDetails.familyRooms}
						handleFloorRoomsCount={handleRoomCountChange}
						roomType='familyRooms'
					/>

					<div
						className='col-md-2 my-auto'
						style={{
							marginTop: "10px",
							fontWeight: "bold",
							fontSize: "1.2rem",
						}}
					>
						Total: {totalRooms ? totalRooms : 0} Rooms In Floor #{clickedFloor}
					</div>
				</div>

				<div>
					<button className='btn btn-primary' onClick={populateAllRooms}>
						Generate Floor #{clickedFloor} Rooms
					</button>
				</div>
			</div>
		);
	};

	return (
		<FloorsModalWrapper>
			<Modal
				width='70%'
				title={
					<div
						style={{
							textAlign: "center",
							fontWeight: "bold",
							fontSize: "1.3rem",
						}}
					>{`Floor ${clickedFloor} Rooms Builder`}</div>
				}
				open={modalVisible}
				onOk={() => {
					setModalVisible(false);
				}}
				// okButtonProps={{ style: { display: "none" } }}
				cancelButtonProps={{ style: { display: "none" } }}
				onCancel={() => {
					setModalVisible(false);
				}}
			>
				{mainForm()}
			</Modal>
		</FloorsModalWrapper>
	);
};

export default FloorsModal;

const FloorsModalWrapper = styled.div`
	z-index: 18000 !important;
`;
