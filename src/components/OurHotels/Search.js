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

const Search = ({
	distinctRoomTypes,
	roomTypesMapping,
	initialSearchParams = {},
}) => {
	const [searchParams, setSearchParams] = useState({
		dates: initialSearchParams.dates || [],
		roomType: initialSearchParams.roomType || "",
		adults: initialSearchParams.adults || "",
		children: initialSearchParams.children || "",
	});
	const [calendarStartDate, setCalendarStartDate] = useState(
		initialSearchParams.dates?.[0] || dayjs().add(1, "day")
	);

	const history = useHistory();

	useEffect(() => {
		// Set default date range if none is provided in the initialSearchParams
		if (!searchParams.dates.length) {
			const startDate = dayjs().add(1, "day").startOf("day");
			const endDate = dayjs().add(7, "day").endOf("day");

			setSearchParams((prevParams) => ({
				...prevParams,
				dates: [startDate, endDate],
			}));
			setCalendarStartDate(startDate);
		}
		// Add searchParams.dates.length to the dependency array
	}, [searchParams.dates.length]);

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

	const handleSelectChange = (label) => {
		setSearchParams((prevParams) => ({
			...prevParams,
			roomType: label,
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

		// Convert label back to its corresponding value before sending to the backend
		const selectedRoomType = roomTypesMapping.find(
			(type) => type.label === searchParams.roomType
		);

		const roomTypeValue = selectedRoomType
			? selectedRoomType.value
			: searchParams.roomType;

		const queryParams = new URLSearchParams({
			startDate: searchParams.dates[0].format("YYYY-MM-DD"),
			endDate: searchParams.dates[1].format("YYYY-MM-DD"),
			roomType: roomTypeValue,
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
			/>
			<Select
				style={{ width: "20%", textTransform: "capitalize" }}
				suffixIcon={<CalendarOutlined />}
				placeholder='Select room type'
				onChange={handleSelectChange}
				value={searchParams.roomType}
				className='mb-2'
			>
				<Option value=''>Room Type</Option>
				<Option value='all'>All Rooms</Option>
				{distinctRoomTypes &&
					distinctRoomTypes.map((roomType) => (
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
					onChange={(value) =>
						setSearchParams({ ...searchParams, adults: value })
					}
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
					onChange={(value) =>
						setSearchParams({ ...searchParams, children: value })
					}
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

// Styled-components for styling
const SearchWrapper = styled.div`
	position: absolute;
	left: 50%;
	transform: translate(-50%, -50%);
	background-color: white;
	padding: 30px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
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
		width: auto;
	}

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: stretch;
		width: 95%;
		top: 28%;

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
