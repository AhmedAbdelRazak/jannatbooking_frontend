import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { DatePicker, Select, InputNumber, Button } from "antd";
import styled from "styled-components";
import { toast } from "react-toastify";
import {
	UserOutlined,
	CalendarOutlined,
	TeamOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

const Search = ({ distinctRoomTypes, roomTypesMapping }) => {
	const [searchParams, setSearchParams] = useState({
		destination: "",
		dates: [],
		roomType: "",
		adults: "",
		children: "",
	});
	const [calendarStartDate, setCalendarStartDate] = useState(
		dayjs().add(1, "day")
	);
	const history = useHistory();

	useEffect(() => {
		const startDate = dayjs().add(1, "day").startOf("day");
		const endDate = dayjs().add(7, "day").endOf("day");

		setSearchParams((prevParams) => ({
			...prevParams,
			dates: [startDate, endDate],
		}));
		setCalendarStartDate(startDate);
	}, []);

	const handleDateChange = (dates) => {
		if (dates && dates[0] && dates[1]) {
			setSearchParams((prevParams) => ({
				...prevParams,
				dates: [dates[0].clone(), dates[1].clone()],
			}));
			setCalendarStartDate(dates[0]);
		} else {
			setSearchParams((prevParams) => ({
				...prevParams,
				dates: [],
			}));
		}
	};

	const handleSelectChange = (value, name) => {
		setSearchParams((prevParams) => ({
			...prevParams,
			[name]: value,
		}));
	};

	const handleSubmit = () => {
		if (
			!searchParams.dates.length ||
			!searchParams.roomType ||
			!searchParams.destination ||
			searchParams.adults === ""
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		const selectedRoomType = roomTypesMapping.find(
			(type) => type.label === searchParams.roomType
		);

		const roomTypeValue = selectedRoomType
			? selectedRoomType.value
			: searchParams.roomType;

		const queryParams = new URLSearchParams({
			destination: searchParams.destination,
			startDate: searchParams.dates[0].format("YYYY-MM-DD"),
			endDate: searchParams.dates[1].format("YYYY-MM-DD"),
			roomType: roomTypeValue,
			adults: searchParams.adults,
			children: searchParams.children,
		}).toString();

		history.push(`/our-hotels-rooms?${queryParams}`);
	};

	const disabledDate = (current) => {
		return current && current < dayjs().endOf("day");
	};

	const panelRender = (panelNode) => (
		<StyledRangePickerContainer>{panelNode}</StyledRangePickerContainer>
	);

	return (
		<SearchWrapper>
			<DestinationWrapper>
				<Select
					style={{ width: "100%" }}
					placeholder='Where would you like to go?'
					onChange={(value) => handleSelectChange(value, "destination")}
					value={searchParams.destination}
				>
					<Option value=''>Where would you like to go?</Option>
					<Option value='Makkah'>Makkah</Option>
					<Option value='Madinah'>Madinah</Option>
				</Select>
			</DestinationWrapper>

			<InputsWrapper>
				<RangeDatePicker
					format='YYYY-MM-DD'
					onChange={handleDateChange}
					value={searchParams.dates}
					disabledDate={disabledDate}
					defaultPickerValue={[calendarStartDate]}
					picker='date'
					panelRender={panelRender}
				/>

				<Select
					style={{ width: "100%" }}
					suffixIcon={<CalendarOutlined />}
					placeholder='Select room type'
					onChange={(value) => handleSelectChange(value, "roomType")}
					value={searchParams.roomType}
				>
					<Option value=''>Room Type</Option>
					<Option value='all'>All Rooms</Option>
					{distinctRoomTypes.map((roomType) => (
						<Option key={roomType} value={roomType}>
							{roomType}
						</Option>
					))}
				</Select>

				<InputNumberWrapper>
					<InputNumber
						className='w-100'
						prefix={<UserOutlined />}
						min={1}
						max={10}
						placeholder='Adults'
						onChange={(value) => handleSelectChange(value, "adults")}
						value={searchParams.adults}
					/>
				</InputNumberWrapper>

				<InputNumberWrapper>
					<InputNumber
						className='w-100'
						prefix={<TeamOutlined />}
						min={0}
						max={10}
						placeholder='Children'
						onChange={(value) => handleSelectChange(value, "children")}
						value={searchParams.children}
					/>
				</InputNumberWrapper>
			</InputsWrapper>

			<SearchButtonWrapper>
				<Button className='search-button' onClick={handleSubmit}>
					Search
				</Button>
			</SearchButtonWrapper>
		</SearchWrapper>
	);
};

export default Search;

// Styled components

// Wrapper for the entire search component
const SearchWrapper = styled.div`
	position: absolute;
	top: 96%;
	left: 50%;
	transform: translate(-50%, -50%);
	background-color: white;
	padding: 40px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	border-radius: 20px;
	width: 68%;

	.ant-select-selector {
		padding-top: 7px !important;
		padding-bottom: 7px !important;
		height: auto !important;
		display: flex;
		align-items: center;
	}

	// Increase the height of the container on larger screens for a spacious layout
	@media (min-width: 1024px) {
		padding: 50px;
	}

	@media (max-width: 768px) {
		width: 95%;
		top: 65%;
	}
`;

// Wrapper specifically for the destination selection dropdown
const DestinationWrapper = styled.div`
	width: 100%;
	margin-bottom: 10px;

	// Adjust styling for the select input
	.ant-select-selector {
		padding-top: 7px !important;
		padding-bottom: 7px !important;
		height: auto !important;
		display: flex;
		align-items: center;
	}
`;

// Wrapper for inputs to arrange them in a grid format
const InputsWrapper = styled.div`
	display: grid;
	width: 100%;
	grid-template-columns: repeat(
		4,
		1fr
	); // Reduced to 4 columns to leave room for the search button row
	gap: 10px;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`;

// Wrapper to center the search button in a row by itself on larger screens
const SearchButtonWrapper = styled.div`
	width: 100%;
	display: flex;
	justify-content: center;
	margin-top: 10px;

	.search-button {
		background-color: var(--primaryBlue);
		color: white;
		border-radius: 10px;
		border: none;
		width: 75%; // Set to 75% width on larger screens
		max-width: 450px; // Limit the max width for larger screens
		padding: 20px;
		display: flex;
		align-items: center;
		justify-content: center;

		@media (max-width: 768px) {
			width: 100%; // Full width on mobile screens
		}
	}

	.search-button:hover {
		background-color: var(--primaryBlueDarker) !important;
		color: white !important;
	}
`;

// Custom styling for the RangePicker
const StyledRangePickerContainer = styled.div`
	@media (max-width: 768px) {
		.ant-picker-panel:last-child {
			width: 0;
			overflow: hidden;

			.ant-picker-header,
			.ant-picker-body {
				display: none;
			}
		}
	}
`;

// Wrapper specifically for the RangePicker component
const RangeDatePicker = styled(RangePicker)`
	width: 100%;

	// Center input text and add padding for height consistency
	.ant-picker-input {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 7px;
		padding-bottom: 7px;
	}
`;

// Wrapper for the input number fields (Adults, Children)
const InputNumberWrapper = styled.div`
	width: 100%;

	.ant-input-number {
		width: 100%;

		// Add padding for height consistency across inputs
		.ant-input-number-input-wrap {
			padding-top: 7px;
			padding-bottom: 7px;
		}
	}
`;
