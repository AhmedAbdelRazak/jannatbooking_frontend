import React, { useState, useEffect } from "react";
import moment from "moment";
import styled from "styled-components";

const ZPricingCalendarForm = ({
	hotelDetails,
	chosenLanguage,
	pricingData,
	setPricingData,
	submittingHotelDetails,
}) => {
	const [selectedMonth, setSelectedMonth] = useState(null);
	const [generalPrice, setGeneralPrice] = useState({});
	const [inheritPricesClicked, setInheritPricesClicked] = useState(true);
	const currentMonth = moment().month();
	const currentDate = moment().date();
	const months = moment.months().slice(currentMonth);

	useEffect(() => {
		if (selectedMonth === null) setSelectedMonth(currentMonth);
		// eslint-disable-next-line
	}, [currentMonth]);

	const handleMonthClick = (monthIndex) => {
		setSelectedMonth(monthIndex + currentMonth);
	};

	const handlePriceChange = (date, roomType, value) => {
		// Find the index of the object with the same date and roomType
		const dataIndex = pricingData.findIndex(
			(data) => data.calendarDate === date && data.room_type === roomType
		);

		// If found, update the price, otherwise add a new object
		if (dataIndex > -1) {
			const newData = [...pricingData];
			newData[dataIndex].price = value;
			setPricingData(newData);
		} else {
			setPricingData(
				pricingData.concat({
					calendarDate: date,
					room_type: roomType,
					price: value,
				})
			);
		}
	};

	const handleGeneralPriceChange = (roomType, value) => {
		setGeneralPrice({
			...generalPrice,
			[roomType]: value,
		});
	};

	const inheritPrices = () => {
		const daysInMonth = moment().month(selectedMonth).daysInMonth();
		const newPricingArray = [];
		setInheritPricesClicked(true);

		Object.entries(hotelDetails.roomCountDetails).forEach(
			([roomType, count]) => {
				if (Number(count) > 0) {
					for (let dayIndex = 0; dayIndex < daysInMonth; dayIndex++) {
						const date = moment()
							.startOf("day")
							.month(selectedMonth)
							.date(dayIndex + 1);
						const dateString = date
							.utcOffset(moment().utcOffset())
							.format("YYYY-MM-DD");

						if (
							selectedMonth > currentMonth ||
							date.isSameOrAfter(moment().startOf("day"))
						) {
							const price = generalPrice[roomType] || "";
							newPricingArray.push({
								calendarDate: dateString,
								room_type: roomType,
								price: price,
							});
						}
					}
				}
			}
		);

		// Use the spread operator to combine the old and new pricing data
		setPricingData([...pricingData, ...newPricingArray]);
	};

	const generateDaysInputs = (monthIndex) => {
		const daysInMonth = moment().month(monthIndex).daysInMonth();
		const roomTypes = Object.entries(hotelDetails.roomCountDetails).filter(
			([key, value]) => Number(value) > 0
		);

		return Array.from({ length: daysInMonth }, (_, dayIndex) => {
			const day = dayIndex + 1;
			// Check if the day is in the future for the current month
			if (monthIndex > currentMonth || day >= currentDate) {
				const date = moment().month(monthIndex).date(day);
				const dateString = date.format("YYYY-MM-DD");

				return (
					<div key={dateString} className='mt-4'>
						<h4 style={{ fontWeight: "bold", color: "#545454" }}>
							{dateString} ({date.format("dddd")})
						</h4>
						<div className='row'>
							{roomTypes.map(([roomType]) => {
								// Find the price for the current date and room type
								const priceEntry = pricingData.find(
									(data) =>
										data.calendarDate === dateString &&
										data.room_type === roomType
								);

								return (
									<div key={roomType} className='col-md-4'>
										<label style={{ textTransform: "capitalize" }}>
											{roomType}
										</label>
										<input
											type='number'
											value={priceEntry ? priceEntry.price : ""}
											onChange={(e) =>
												handlePriceChange(dateString, roomType, e.target.value)
											}
										/>
									</div>
								);
							})}
						</div>
					</div>
				);
			}
			return null; // Do not return anything for past days
		});
	};

	const generateGeneralPriceInputs = () => {
		const roomTypesWithCount = Object.entries(
			hotelDetails.roomCountDetails
		).filter(([_, count]) => Number(count) > 0);

		return (
			<GeneralPriceInputContainer>
				{roomTypesWithCount.map(([roomType, _]) => (
					<GeneralPriceField key={roomType}>
						<label style={{ textTransform: "capitalize" }}>{roomType} </label>
						<input
							type='number'
							value={generalPrice[roomType] || ""}
							onChange={(e) =>
								handleGeneralPriceChange(roomType, e.target.value)
							}
						/>
					</GeneralPriceField>
				))}
			</GeneralPriceInputContainer>
		);
	};

	return (
		<ZPricingCalendarFormWrapper
			isArabic={chosenLanguage === "Arabic"}
			className='container my-5'
		>
			<MonthButtonContainer>
				{months.map((month, index) => (
					<MonthButton
						key={month}
						onClick={() => {
							handleMonthClick(index);
						}}
						active={index + currentMonth === selectedMonth}
					>
						{month}
					</MonthButton>
				))}
			</MonthButtonContainer>
			{generateGeneralPriceInputs()}
			<div className='text-center'>
				<InheritPricesButton onClick={inheritPrices}>
					<>Inherit Prices</>
				</InheritPricesButton>
			</div>

			{selectedMonth != null && inheritPricesClicked && (
				<div>{generateDaysInputs(selectedMonth)}</div>
			)}

			<div className='mx-auto text-center mt-5'>
				<button
					onClick={() => {
						submittingHotelDetails();
					}}
					className='btn btn-primary'
				>
					Update Hotel Pricing Calendar
				</button>
			</div>
		</ZPricingCalendarFormWrapper>
	);
};

export default ZPricingCalendarForm;

const ZPricingCalendarFormWrapper = styled.div`
	h3 {
		font-weight: bold;
		font-size: 2rem;
		text-align: center;
		color: #006ad1;
	}

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

	.col-md-2 {
		font-weight: bold;
	}

	text-align: ${(props) => (props.isArabic ? "right" : "")};
`;

const MonthButton = styled.button`
	margin: 0 5px;
	padding: 5px 10px;
	border: none;
	background-color: ${(props) => (props.active ? "#007bff" : "#f0f0f0")};
	color: ${(props) => (props.active ? "white" : "black")};
	border-radius: 4px;
	cursor: pointer;
	transition:
		background-color 0.3s,
		color 0.3s;

	&:hover {
		background-color: #0056b3;
		color: white;
	}
`;

const MonthButtonContainer = styled.div`
	display: flex;
	justify-content: center;
	margin-bottom: 20px;
`;

const GeneralPriceInputContainer = styled.div`
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 10px;
	margin-bottom: 20px;
`;

const GeneralPriceField = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
`;

// Styled component for the "Inherit Prices" button
const InheritPricesButton = styled.button`
	padding: 10px 20px;
	border: 2px solid #28a745; /* Green border */
	background-color: white;
	color: #28a745; /* Green text */
	font-weight: bold;
	border-radius: 5px;
	cursor: pointer;
	text-align: center;
	transition:
		background-color 0.3s,
		color 0.3s;

	&:hover {
		background-color: #28a745; /* Green background on hover */
		color: white;
	}

	&:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.5); /* Green glow effect on focus */
	}
`;
