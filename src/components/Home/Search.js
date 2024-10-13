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
		// Initialize with tomorrow and 7 days later as the default date range using Day.js
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
			searchParams.adults === ""
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		// Find the mapping that matches the selected room type label
		const selectedRoomType = roomTypesMapping.find(
			(type) => type.label === searchParams.roomType
		);

		const roomTypeValue = selectedRoomType
			? selectedRoomType.value
			: searchParams.roomType;

		const queryParams = new URLSearchParams({
			startDate: searchParams.dates[0].format("YYYY-MM-DD"),
			endDate: searchParams.dates[1].format("YYYY-MM-DD"),
			roomType: roomTypeValue, // Use the value, not the label
			adults: searchParams.adults,
			children: searchParams.children,
		}).toString();

		history.push(`/our-hotels-rooms?${queryParams}`);
	};

	// Restrict date selection to today and onwards
	const disabledDate = (current) => {
		return current && current < dayjs().endOf("day");
	};

	return (
		<SearchWrapper>
			<RangePicker
				format='YYYY-MM-DD'
				onChange={handleDateChange}
				value={searchParams.dates}
				disabledDate={disabledDate}
				defaultPickerValue={[calendarStartDate]}
				onCalendarChange={(dates) => {
					if (dates && dates[0]) {
						setCalendarStartDate(dates[0]); // Align calendar start date
					}
				}}
			/>
			<Select
				style={{ width: "20%" }}
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

			<Button className='w-25' onClick={handleSubmit}>
				Search
			</Button>
		</SearchWrapper>
	);
};

export default Search;

const SearchWrapper = styled.div`
	position: absolute;
	top: 96%;
	left: 50%;
	transform: translate(-50%, -50%);
	background-color: white;
	padding: 30px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	border-radius: 20px;
	width: 65%;

	.ant-select .ant-select-selector,
	.ant-input-number .ant-input-number-input {
		padding: 0 20px;
	}

	.ant-btn {
		flex-shrink: 0;
		background-color: var(--primaryBlue);
		color: white;
		border-radius: 10px;
		border: none;
	}

	.ant-btn:hover {
		background-color: var(--primaryBlueDarker) !important;
		color: white !important;
	}

	.ant-picker,
	.ant-select .ant-select-selector,
	.ant-input-number .ant-input-number-handler-wrap,
	.ant-input-number .ant-input-number-input,
	.ant-btn {
		height: 42px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ant-select .ant-select-selector {
		bottom: 4px;
	}

	.ant-picker-range .ant-picker-input input {
		text-align: center;
	}

	::placeholder {
		font-style: italic;
		font-size: 0.9rem;
		font-weight: bold;
		color: #d3d3d3 !important;
	}

	.ant-select-arrow {
		display: flex;
		align-items: center;
	}

	.ant-input-number-prefix {
		display: flex;
		align-items: center;
	}

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: stretch;
		width: 95%;
		top: 65%;

		.ant-picker,
		.ant-select,
		.ant-select .ant-select-selector,
		.ant-input-number,
		.ant-btn {
			margin-right: 0;
			margin-bottom: 6px;
			width: 100% !important;
		}

		.ant-btn {
			margin-bottom: 0;
		}
	}
`;

const InputNumberWrapper = styled.div`
	.ant-input-number {
		width: 100%;
		.ant-input-number-input {
			padding-left: 2px;
		}
	}

	@media (max-width: 768px) {
		.ant-input-number {
			width: auto;
		}
	}
`;
