import React, { useEffect, useState } from "react";
import AdminNavbar from "../AdminNavbar/AdminNavbar";
import AdminNavbarArabic from "../AdminNavbar/AdminNavbarArabic";
import styled from "styled-components";
import { useHistory } from "react-router-dom";
import { useCartContext } from "../../cart_context";
import {
	createRooms,
	getHotelDetails,
	getHotelRooms,
	hotelAccount,
	updateHotelDetails,
} from "../apiAdmin";
import { isAuthenticated } from "../../auth";
import ZHotelDetails from "./ZHotelDetails";
import ZPricingCalendarForm from "./ZPricingCalendarForm";
import { toast } from "react-toastify";
import HotelOverview from "./HotelOverview";
import { defaultHotelDetails } from "../../AdminModule/NewHotels/Assets";

const HotelSettingsMain = () => {
	const history = useHistory();
	const [AdminMenuStatus, setAdminMenuStatus] = useState(false);
	const [collapsed, setCollapsed] = useState(false);
	const [hotelDetails, setHotelDetails] = useState("");
	const [values, setValues] = useState("");
	const { languageToggle, chosenLanguage } = useCartContext();
	const { user, token } = isAuthenticated();
	const [activeTab, setActiveTab] = useState("HotelDetails");
	const [pricingData, setPricingData] = useState([]);
	const [hotelPhotos, setHotelPhotos] = useState([]);

	//For Rooms
	const [floorDetails, setFloorDetails] = useState(defaultHotelDetails);
	const [modalVisible, setModalVisible] = useState(false);
	const [modalVisible2, setModalVisible2] = useState(false);
	const [clickedFloor, setClickedFloor] = useState("");
	const [clickedRoom, setClickedRoom] = useState({
		_id: "",
		room_number: "",
		room_type: "",
		room_features: [
			{
				bedSize: "",
				view: "",
			},
		],
		bathroom: ["bathtub", "jacuzzi"],
		airConditioning: "",
		television: "",
		internet: ["WiFi", "Ethernet Connection"],
		Minibar: [""],
		smoking: false,
		room_pricing: {
			// Assuming there are pricing details here
		},
		floor: 15,
		roomColorCode: "",
		belongsTo: "",
		hotelId: "",
	});
	const [currentAddingRoom, setCurrentAddingRoom] = useState("");
	const [hotelRooms, setHotelRooms] = useState("");
	const [inheritModalVisible, setInheritModalVisible] = useState(false);
	const [baseFloor, setBaseFloor] = useState("");
	const [roomsAlreadyExists, setRoomsAlreadyExists] = useState(false);

	useEffect(() => {
		if (window.innerWidth <= 1000) {
			setCollapsed(true);
		}

		if (window.location.search.includes("hoteldetails")) {
			setActiveTab("HotelDetails");
		} else if (window.location.search.includes("roomdetails")) {
			setActiveTab("RoomDetails");
		} else if (window.location.search.includes("pricing")) {
			setActiveTab("PricingCalendar");
		} else {
			setActiveTab("HotelDetails");
		}
		// eslint-disable-next-line
	}, [activeTab]);

	const gettingHotelData = () => {
		hotelAccount(user._id, token, user._id).then((data) => {
			if (data && data.error) {
				console.log(data.error, "Error rendering");
			} else {
				setValues(data);

				getHotelDetails(data._id).then((data2) => {
					if (data2 && data2.error) {
						console.log(data2.error, "Error rendering");
					} else {
						if (data && data.name && data._id && data2 && data2.length > 0) {
							setHotelDetails(data2[0]);
							console.log(data2[0], "data2[0]");
							// other state updates...
							setHotelPhotos(
								data2[0] &&
									data2[0].hotelPhotos &&
									data2[0].hotelPhotos.length > 0
									? data2[0].hotelPhotos
									: []
							);

							setPricingData(
								data2[0] &&
									data2[0].pricingCalendar &&
									data2[0].pricingCalendar.length > 0
									? data2[0].pricingCalendar
									: []
							);

							getHotelRooms(data2[0]._id, user._id).then((data4) => {
								if (data4 && data4.error) {
									console.log(data4.error);
								} else {
									if (data4.length > 0) {
										setRoomsAlreadyExists(true);
									}
									if (hotelRooms.length === 0) {
										setHotelRooms(data4);
									}
									// setHotelRooms([]);

									if (clickedFloor && modalVisible) {
										// Aggregate room types for the clicked floor
										const aggregatedRoomData = aggregateRoomDataForFloor(
											clickedFloor,
											data4
										);
										setFloorDetails({
											...defaultHotelDetails,
											roomCountDetails: aggregatedRoomData,
										});
									}
								}
							});
						}
					}
				});
			}
		});
	};

	const aggregateRoomDataForFloor = (floor, rooms) => {
		const roomTypes = Object.keys(defaultHotelDetails.roomCountDetails).filter(
			(rt) => !rt.includes("Price")
		);
		const filteredRooms = rooms.filter((room) => room.floor === floor);

		return roomTypes.reduce((acc, type) => {
			acc[type] = filteredRooms.filter(
				(room) => room.room_type === type
			).length;
			return acc;
		}, {});
	};

	useEffect(() => {
		gettingHotelData();
		// eslint-disable-next-line
	}, [clickedFloor]);

	const hotelDetailsUpdate = () => {
		const updatedDetails = {
			...hotelDetails,
			pricingCalendar: pricingData,
			hotelPhotos: hotelPhotos,
		};

		// Call the API to update the hotel details
		const { user, token } = isAuthenticated(); // Assuming you have a user and token
		const hotelId = hotelDetails._id; // Assuming your hotelDetails object has an _id field

		// Using the API function from your API admin file
		updateHotelDetails(hotelId, user._id, token, updatedDetails)
			.then((response) => {
				window.scrollTo({ top: 0, behavior: "smooth" });
				if (response.error) {
					console.log("Error updating hotel details:", response.error);
				} else {
					toast.success("Hotel Was Successfully Updated");
					console.log("Hotel details updated successfully.");
					setHotelDetails(updatedDetails); // Update the state with the new details
				}
			})
			.catch((err) => console.log("Error:", err));
	};

	const addRooms = () => {
		if (!hotelRooms || hotelRooms.length === 0) {
			return toast.error("Please Add Rooms");
		}

		// Remove duplicate rooms based on room_number
		const uniqueRooms = Array.from(
			new Map(hotelRooms.map((room) => [room["room_number"], room])).values()
		);

		getHotelRooms(user._id, hotelDetails._id).then((existingRoomsData) => {
			if (existingRoomsData && existingRoomsData.error) {
				console.error(existingRoomsData.error, "Error rendering");
			} else {
				// Filter out rooms that have already been added
				const roomsToAdd = uniqueRooms.filter(
					(newRoom) =>
						!existingRoomsData.some(
							(existingRoom) => existingRoom.room_number === newRoom.room_number
						)
				);

				roomsToAdd.forEach((room, index) => {
					setTimeout(() => {
						setCurrentAddingRoom(room.room_number);
						createRooms(user._id, token, room).then((data) => {
							if (data && data.error) {
								console.error(data.error);
							} else {
								if (index === roomsToAdd.length - 1) {
									// Reset after the last room addition
									setCurrentAddingRoom(null);
									window.location.reload(false);
								}
							}
						});
					}, 2500 * index); // Delay each creation by 2.5 seconds
				});
			}
		});
	};

	console.log(hotelRooms, "hotelRooms");
	return (
		<HotelSettingsMainWrapper
			dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
			show={collapsed}
			isArabic={chosenLanguage === "Arabic"}
		>
			<div className='grid-container-main'>
				<div className='navcontent'>
					{chosenLanguage === "Arabic" ? (
						<AdminNavbarArabic
							fromPage='HotelSettings'
							AdminMenuStatus={AdminMenuStatus}
							setAdminMenuStatus={setAdminMenuStatus}
							collapsed={collapsed}
							setCollapsed={setCollapsed}
							chosenLanguage={chosenLanguage}
						/>
					) : (
						<AdminNavbar
							fromPage='HotelSettings'
							AdminMenuStatus={AdminMenuStatus}
							setAdminMenuStatus={setAdminMenuStatus}
							collapsed={collapsed}
							setCollapsed={setCollapsed}
							chosenLanguage={chosenLanguage}
						/>
					)}
				</div>

				<div className='otherContentWrapper'>
					<div
						style={{
							textAlign: chosenLanguage === "Arabic" ? "left" : "right",
							fontWeight: "bold",
							textDecoration: "underline",
							cursor: "pointer",
						}}
						onClick={() => {
							if (chosenLanguage === "English") {
								languageToggle("Arabic");
							} else {
								languageToggle("English");
							}
						}}
					>
						{chosenLanguage === "English" ? "ARABIC" : "English"}
					</div>

					<div style={{ background: "#8a8a8a", padding: "1px" }}>
						<div className='my-2 tab-grid col-md-8'>
							<Tab
								isActive={activeTab === "HotelDetails"}
								onClick={() => {
									setActiveTab("HotelDetails");
									history.push("/hotel-management/settings?hoteldetails"); // Programmatic navigation
								}}
							>
								{chosenLanguage === "Arabic"
									? "تفاصيل الفندق"
									: "Hotel Details"}
							</Tab>
							<Tab
								isActive={activeTab === "PricingCalendar"}
								onClick={() => {
									setActiveTab("PricingCalendar");
									history.push("/hotel-management/settings?pricing"); // Programmatic navigation
								}}
							>
								{chosenLanguage === "Arabic"
									? "تقويم التسعير"
									: "Pricing Calendar"}
							</Tab>

							<Tab
								isActive={activeTab === "RoomDetails"}
								onClick={() => {
									setActiveTab("RoomDetails");
									history.push("/hotel-management/settings?roomdetails"); // Programmatic navigation
								}}
							>
								{chosenLanguage === "Arabic"
									? "توزيع الغرف على الطوابق"
									: "Room Details"}
							</Tab>
						</div>
					</div>

					<div className='container-wrapper'>
						{activeTab === "HotelDetails" &&
						hotelDetails &&
						hotelDetails.hotelName ? (
							<div>
								<ZHotelDetails
									values={values}
									setHotelDetails={setHotelDetails}
									hotelDetails={hotelDetails}
									submittingHotelDetails={hotelDetailsUpdate}
									chosenLanguage={chosenLanguage}
									hotelPhotos={hotelPhotos}
									setHotelPhotos={setHotelPhotos}
								/>
							</div>
						) : activeTab === "RoomDetails" ? (
							// && hotelRooms.length > 0
							<HotelOverview
								hotelRooms={hotelRooms}
								hotelDetails={hotelDetails}
								values={values}
								addRooms={addRooms}
								setHotelRooms={setHotelRooms}
								currentAddingRoom={currentAddingRoom}
								floorDetails={floorDetails}
								setFloorDetails={setFloorDetails}
								modalVisible={modalVisible}
								setModalVisible={setModalVisible}
								modalVisible2={modalVisible2}
								setModalVisible2={setModalVisible2}
								clickedFloor={clickedFloor}
								setClickedFloor={setClickedFloor}
								clickedRoom={clickedRoom}
								setClickedRoom={setClickedRoom}
								inheritModalVisible={inheritModalVisible}
								setInheritModalVisible={setInheritModalVisible}
								baseFloor={baseFloor}
								setBaseFloor={setBaseFloor}
								roomsAlreadyExists={roomsAlreadyExists}
							/>
						) : activeTab === "PricingCalendar" &&
						  hotelDetails &&
						  hotelDetails.hotelName ? (
							<div>
								<ZPricingCalendarForm
									hotelDetails={hotelDetails}
									chosenLanguage={chosenLanguage}
									pricingData={pricingData}
									setPricingData={setPricingData}
									submittingHotelDetails={hotelDetailsUpdate}
								/>{" "}
							</div>
						) : null}
					</div>
				</div>
			</div>
		</HotelSettingsMainWrapper>
	);
};

export default HotelSettingsMain;

const HotelSettingsMainWrapper = styled.div`
	overflow-x: hidden;
	/* background: #ededed; */
	margin-top: 20px;
	min-height: 715px;

	.grid-container-main {
		display: grid;
		grid-template-columns: ${(props) => (props.show ? "5% 85%" : "15% 84%")};
	}

	.container-wrapper {
		border: 2px solid lightgrey;
		padding: 20px;
		border-radius: 20px;
		background: white;
		margin: 0px 10px;
	}

	tr {
		text-align: ${(props) => (props.isArabic ? "right" : "")};
	}

	.tab-grid {
		display: flex;
		/* Additional styling for grid layout */
	}

	@media (max-width: 1400px) {
		background: white;
	}
`;

const Tab = styled.div`
	cursor: pointer;
	margin: 0 3px; /* 3px margin between tabs */
	padding: 15px 5px; /* Adjust padding as needed */
	font-weight: ${(props) => (props.isActive ? "bold" : "bold")};
	background-color: ${(props) =>
		props.isActive
			? "transparent"
			: "#bbbbbb"}; /* Light grey for unselected tabs */
	box-shadow: ${(props) =>
		props.isActive ? "inset 5px 5px 5px rgba(0, 0, 0, 0.3)" : "none"};
	transition: all 0.3s ease; /* Smooth transition for changes */
	min-width: 25px; /* Minimum width of the tab */
	width: 100%; /* Full width within the container */
	text-align: center; /* Center the text inside the tab */
	/* Additional styling for tabs */
	z-index: 100;
	font-size: 1.2rem;

	color: ${(props) => (props.isActive ? "white" : "black !important")};
`;
