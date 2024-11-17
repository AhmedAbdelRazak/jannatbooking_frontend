import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { DatePicker, Select, Collapse, message } from "antd";
import { useLocation } from "react-router-dom";
import { gettingHotelDetailsById } from "../apiCore";
import dayjs from "dayjs";
import PaymentDetails from "../components/checkout/PaymentDetails";
import { CaretRightOutlined, InfoCircleOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Panel } = Collapse;

// Helper function to calculate pricing by day
const calculatePricingByDay = (pricingRate, startDate, endDate, basePrice) => {
	const start = dayjs(startDate).startOf("day");
	const end = dayjs(endDate).subtract(1, "day").startOf("day"); // Exclude the checkout day
	const dateArray = [];
	let currentDate = start;

	while (currentDate.isBefore(end) || currentDate.isSame(end, "day")) {
		const formattedDate = currentDate.format("YYYY-MM-DD");
		const rateForDate = pricingRate.find(
			(rate) => dayjs(rate.date).format("YYYY-MM-DD") === formattedDate
		);

		dateArray.push({
			date: formattedDate,
			price: rateForDate ? rateForDate.price : basePrice,
		});

		currentDate = currentDate.add(1, "day");
	}

	return dateArray;
};

const GeneratedLinkCheckout = () => {
	const location = useLocation();
	const [formData, setFormData] = useState({
		roomType: "",
		displayName: "",
		hotelId: "",
		name: "",
		email: "",
		checkInDate: null,
		checkOutDate: null,
		pricePerNight: 0,
		numberOfNights: 0,
		totalAmount: 0,
		adults: 1,
		children: 0,
		nationality: "",
		phone: "",
	});
	const [hotelDetails, setHotelDetails] = useState(null);
	const [selectedRoomImage, setSelectedRoomImage] = useState("");
	const [priceByDay, setPriceByDay] = useState([]);

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const hotelId = params.get("hotelId");
		window.scrollTo({ top: 8, behavior: "smooth" });
		setFormData({
			roomType: params.get("roomType") || "",
			displayName: params.get("displayName") || "",
			hotelId: hotelId || "",
			name: params.get("name") || "",
			email: params.get("email") || "",
			checkInDate: params.get("checkInDate")
				? dayjs(params.get("checkInDate"))
				: null,
			checkOutDate: params.get("checkOutDate")
				? dayjs(params.get("checkOutDate"))
				: null,
			pricePerNight: parseFloat(params.get("pricePerNight")) || 0,
			numberOfNights: parseInt(params.get("numberOfNights"), 10) || 0,
			totalAmount: parseFloat(params.get("totalAmount")) || 0,
			adults: parseInt(params.get("adults"), 10) || 1,
			children: parseInt(params.get("children"), 10) || 0,
			nationality: params.get("nationality") || "",
			phone: params.get("phone") || "",
		});

		if (hotelId) {
			gettingHotelDetailsById(hotelId).then((data) => {
				if (data) {
					setHotelDetails(data);

					const matchingRoom = data.roomCountDetails.find(
						(room) =>
							room.roomType === params.get("roomType") &&
							room.displayName === params.get("displayName")
					);

					if (matchingRoom) {
						setSelectedRoomImage(
							matchingRoom.photos[0]?.url || "/default-room.jpg"
						);
						const calculatedPricing = calculatePricingByDay(
							matchingRoom.pricingByDay || [],
							params.get("checkInDate"),
							params.get("checkOutDate"),
							formData.pricePerNight // This line uses formData.pricePerNight
						);
						setPriceByDay(calculatedPricing);
					} else {
						message.error("Selected room details not found in hotel data.");
					}
				} else {
					message.error("Failed to fetch hotel details.");
				}
			});
		}
	}, [location.search, formData.pricePerNight]); // Add formData.pricePerNight here

	return (
		<GeneratedLinkCheckoutWrapper>
			<DesktopWrapper>
				<LeftSection>
					<h1
						style={{
							fontSize: "1.5rem",
							fontWeight: "bolder",
							textAlign: "center",
						}}
					>
						Hotel: {hotelDetails && hotelDetails.hotelName}
					</h1>

					<h2>Customer Details</h2>
					<form>
						<InputGroup>
							<label>Name</label>
							<input type='text' value={formData.name} readOnly />
						</InputGroup>
						<InputGroup>
							<label>Phone</label>
							<input type='text' value={formData.phone} readOnly />
						</InputGroup>
						<InputGroup>
							<label>Email</label>
							<input type='email' value={formData.email} readOnly />
						</InputGroup>
						<InputGroup>
							<label>Nationality</label>
							<Select value={formData.nationality} disabled>
								<Option value={formData.nationality}>
									{formData.nationality}
								</Option>
							</Select>
						</InputGroup>
					</form>
					<PaymentDetails />
				</LeftSection>

				<RightSection>
					<h2>Your Reservation</h2>
					{hotelDetails && (
						<>
							<RangePicker
								value={[formData.checkInDate, formData.checkOutDate]}
								disabled
								style={{ width: "100%", marginBottom: "10px" }}
							/>
							<RoomItem>
								<RoomImage src={selectedRoomImage} alt='Room' />
								<RoomDetails>
									<h3>{formData.displayName}</h3>
									<p>
										{formData.adults} Adult(s), {formData.children} Children
									</p>
									<p>{formData.numberOfNights} Nights</p>
									<p>
										Dates: {formData.checkInDate?.format("YYYY-MM-DD")} to{" "}
										{formData.checkOutDate?.format("YYYY-MM-DD")}
									</p>
									<h4>{formData.pricePerNight} SAR per night</h4>
									<h4>Total: {formData.totalAmount} SAR</h4>
								</RoomDetails>
								{priceByDay.length > 0 && (
									<Collapse
										accordion
										expandIcon={({ isActive }) => (
											<CaretRightOutlined rotate={isActive ? 90 : 0} />
										)}
									>
										<Panel
											header={
												<PriceDetailsHeader>
													<InfoCircleOutlined /> Price Breakdown
												</PriceDetailsHeader>
											}
											key='1'
										>
											<PricingList>
												{priceByDay.map(({ date, price }, index) => (
													<li key={index}>
														{dayjs(date).format("YYYY-MM-DD")}: {price} SAR
													</li>
												))}
											</PricingList>
										</Panel>
									</Collapse>
								)}
							</RoomItem>
						</>
					)}
				</RightSection>
			</DesktopWrapper>
		</GeneratedLinkCheckoutWrapper>
	);
};

export default GeneratedLinkCheckout;

const GeneratedLinkCheckoutWrapper = styled.div`
	display: flex;
	flex-direction: column;
	padding: 20px;
	text-transform: capitalize;
	padding: 20px 150px;

	@media (max-width: 800px) {
		padding: 25px 0px;
	}

	@media (max-width: 800px) {
		padding: 10px;
	}
`;

const DesktopWrapper = styled.div`
	display: flex;
	gap: 20px;
	@media (max-width: 768px) {
		flex-direction: column;
	}
`;

const LeftSection = styled.div`
	flex: 2;
	background: #f5f5f5;
	padding: 20px;
	border-radius: 10px;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	@media (max-width: 768px) {
		padding: 15px;
	}
`;

const RightSection = styled.div`
	flex: 1;
	padding: 20px;
	background: #ffffff;
	border-radius: 10px;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	position: sticky;
	top: 20px;
	@media (max-width: 768px) {
		padding: 15px;
	}
`;

const RoomItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	border-bottom: 1px solid #ddd;
	padding-bottom: 10px;
`;

const RoomImage = styled.img`
	width: 100%;
	height: 200px;
	object-fit: cover;
	border-radius: 8px;
`;

const RoomDetails = styled.div`
	text-align: center;
	h3 {
		font-size: 1.2rem;
	}
	h4 {
		font-size: 1.1rem;
		color: #555;
	}
`;

const InputGroup = styled.div`
	margin-bottom: 10px;
	label {
		display: block;
		font-size: 0.9rem;
		margin-bottom: 5px;
	}
	input,
	select {
		width: 100%;
		padding: 8px;
		border-radius: 5px;
		border: 1px solid #ddd;
	}
`;

const PriceDetailsHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
`;

const PricingList = styled.ul`
	list-style-type: none;
	padding: 0;
	margin-top: 10px;
`;
