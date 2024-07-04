import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { roomTypeColors } from "../../AdminModule/NewHotels/Assets";
import { Spin } from "antd";
import FloorsModal from "./FloorsModal";
import ZSingleRoomModal from "./ZSingleRoomModal";
import ZInheritRoomsModal from "./ZInheritRoomsModal";
import { toast } from "react-toastify";

const HotelOverview = ({
	hotelRooms,
	hotelDetails,
	values,
	addRooms,
	setHotelRooms,
	currentAddingRoom,
	alreadyAddedRooms,
	floorDetails,
	setFloorDetails,
	modalVisible,
	setModalVisible,
	modalVisible2,
	setModalVisible2,
	clickedFloor,
	setClickedFloor,
	clickedRoom,
	setClickedRoom,
	inheritModalVisible,
	setInheritModalVisible,
	baseFloor,
	setBaseFloor,
	roomsAlreadyExists,
}) => {
	const { hotelFloors, parkingLot, hotelName } = hotelDetails;
	const floors = Array.from(
		{ length: hotelFloors },
		(_, index) => hotelFloors - index
	);

	const [hideAddRooms, setHideAddRooms] = useState(false);

	const applyInheritance = (baseFloorNumber) => {
		const baseFloorRooms = hotelRooms.filter(
			(room) => Number(room.floor) === Number(baseFloorNumber)
		);

		if (baseFloorRooms.length === 0) {
			toast.error(
				`No rooms found on floor ${baseFloorNumber} to inherit from.`
			);
			return;
		}

		const newHotelRooms = floors.flatMap((floorNumber) => {
			// If the current floor is the base floor, return the rooms as is
			if (Number(floorNumber) === Number(baseFloorNumber)) {
				return baseFloorRooms;
			}

			// For other floors, map the base floor rooms to the current floor
			return baseFloorRooms.map((room) => {
				// Generate new room number based on the floor number
				const newRoomNumber = `${floorNumber}${room.room_number.substring(
					room.room_number.length - 2
				)}`;

				return {
					...room,
					floor: floorNumber,
					room_number: newRoomNumber, // Set the new room number here
					_id: undefined, // Reset room id if necessary to avoid duplicates
				};
			});
		});

		setHotelRooms(newHotelRooms);
		toast.success(
			`All floors updated based on floor ${baseFloorNumber} structure.`
		);
	};

	return (
		<HotelOverviewWrapper>
			<h3 style={{ textTransform: "capitalize" }}>
				Hotel Layout ({hotelName})
			</h3>
			<FloorsModal
				modalVisible={modalVisible}
				setModalVisible={setModalVisible}
				clickedFloor={clickedFloor}
				rooms={hotelRooms}
				setRooms={setHotelRooms}
				floorDetails={floorDetails}
				setFloorDetails={setFloorDetails}
				hotelDetails={hotelDetails}
				values={values}
				alreadyAddedRooms={alreadyAddedRooms}
			/>

			<ZSingleRoomModal
				modalVisible={modalVisible2}
				setModalVisible={setModalVisible2}
				clickedFloor={clickedFloor}
				clickedRoom={clickedRoom}
				setClickedRoom={setClickedRoom}
				rooms={hotelRooms}
				setRooms={setHotelRooms}
				setHelperRender={undefined}
				helperRender={undefined}
			/>

			<ZInheritRoomsModal
				inheritModalVisible={inheritModalVisible}
				setInheritModalVisible={setInheritModalVisible}
				baseFloor={baseFloor}
				setBaseFloor={setBaseFloor}
				applyInheritance={applyInheritance}
			/>
			<div className='mx-auto text-center my-4'>
				{hotelRooms && hotelRooms.length > 0 ? (
					<button
						className='btn btn-secondary w-25'
						onClick={() => setInheritModalVisible(true)}
						style={{
							fontWeight: "bold",
							letterSpacing: "2px",
							fontSize: "1.1rem",
						}}
					>
						Inherit
					</button>
				) : null}
			</div>
			<div className='colors-grid mt-3'>
				{Object.entries(roomTypeColors).map(([roomType, color], i) => (
					<div className='' key={i} style={{ textAlign: "center" }}>
						<div
							style={{
								width: "20px",
								height: "20px",
								backgroundColor: color,
								margin: "0 auto",
								marginBottom: "5px",
							}}
						></div>
						<span style={{ textTransform: "capitalize", fontSize: "13px" }}>
							{roomType.replace(/([A-Z])/g, " $1").trim()}
						</span>
					</div>
				))}
			</div>
			<FloorsContainer>
				{floors.map((floor, index) => {
					const roomsOnFloor =
						hotelRooms &&
						hotelRooms.filter((room) => room.floor === floor && !room._id);
					// Determine the floor number from the current adding room
					let currentAddingFloor = null;
					if (currentAddingRoom) {
						currentAddingFloor =
							currentAddingRoom.length === 4
								? parseInt(currentAddingRoom.substring(0, 2))
								: parseInt(currentAddingRoom.charAt(0));
					}

					return (
						<Floor key={index} delay={index * 0.3}>
							Floor {floor}{" "}
							<div style={{ display: "flex", flexWrap: "wrap" }}>
								{hotelRooms &&
									hotelRooms
										.filter((room) => room.floor === floor)
										.map((room, idx) => (
											<RoomSquare
												key={idx}
												color={room.roomColorCode}
												onClick={() => {
													setClickedRoom(room);
													setClickedFloor(floor);
													// if (room && room._id) {
													setModalVisible2(true);
													// }
												}}
											>
												{room.room_number}
											</RoomSquare>
										))}
							</div>
							<span
								className='mx-2'
								style={{ fontSize: "13px", textDecoration: "underline" }}
								onClick={() => {
									setClickedFloor(floor);
									setModalVisible(true);
								}}
							>
								(Please Click Here To Update The Rooms)
							</span>
							{roomsOnFloor.length > 0 && (
								<>
									<div className='mt-3'>
										{hideAddRooms ? null : (
											<button
												className='btn btn-success'
												onClick={() => {
													addRooms();
													setHideAddRooms(true);
												}}
											>
												Add Rooms...
											</button>
										)}

										{Number(currentAddingFloor) === Number(floor) && (
											<div style={{ textAlign: "center", margin: "20px" }}>
												<Spin />
												<p>Adding room #{currentAddingRoom}...</p>
											</div>
										)}
									</div>
								</>
							)}
							{/* Check if the current floor has any rooms */}
						</Floor>
					);
				})}
				{parkingLot && <ParkingLot>Parking Lot</ParkingLot>}
			</FloorsContainer>
		</HotelOverviewWrapper>
	);
};

export default HotelOverview;

// Styled components
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const HotelOverviewWrapper = styled.div`
	h3 {
		font-weight: bold;
		font-size: 2rem;
		text-align: center;
		color: #006ad1;
	}

	.colors-grid {
		display: grid;
		grid-template-columns: repeat(
			13,
			1fr
		); /* Creates four columns of equal width */
		gap: 2px; /* Optional: Adds some space between grid items */
	}
`;

const FloorsContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
`;

const Floor = styled.div`
	margin: 10px;
	padding: 50px;
	background-color: lightblue;
	border: 1px solid #ccc;
	width: 85%;
	text-align: center;
	font-weight: bold;
	cursor: pointer;
	animation: ${fadeIn} 0.5s ease forwards;
	animation-delay: ${({ delay }) => delay}s;
	opacity: 0;
	font-size: 1.1rem;
`;

const ParkingLot = styled.div`
	margin: 10px;
	padding: 40px;
	background-color: lightgreen;
	border: 1px solid #ccc;
	width: 70%;
	text-align: center;
	font-weight: bold;
`;

const RoomSquare = styled.div`
	width: 35px;
	height: 35px;
	background-color: ${({ color }) =>
		color || "#ddd"}; // Default to a light grey if no color is provided
	border: 1px solid #000;
	color: white;
	margin: 5px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.7rem;
`;
