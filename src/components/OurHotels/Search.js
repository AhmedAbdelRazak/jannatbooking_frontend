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
		destination: initialSearchParams.destination || "",
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
		if (!searchParams.dates.length) {
			const startDate = dayjs().add(1, "day").startOf("day");
			const endDate = dayjs().add(7, "day").endOf("day");

			setSearchParams((prevParams) => ({
				...prevParams,
				dates: [startDate, endDate],
			}));
			setCalendarStartDate(startDate);
		}
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

	const handleSelectChange = (value, field) => {
		setSearchParams((prevParams) => ({
			...prevParams,
			[field]: value,
		}));
	};

	const handleSubmit = () => {
		if (
			!searchParams.destination ||
			!searchParams.dates.length ||
			!searchParams.roomType ||
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

// Styled-components for styling

const SearchWrapper = styled.div`
	position: absolute;
	top: 31%;
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
	text-transform: capitalize;

	.ant-select-selector {
		padding-top: 7px !important;
		padding-bottom: 7px !important;
		height: auto !important;
		display: flex;
		align-items: center;
	}

	@media (min-width: 1024px) {
		padding: 50px;
	}

	@media (max-width: 768px) {
		width: 95%;
		top: 36%;
	}
`;

const DestinationWrapper = styled.div`
	width: 100%;
	margin-bottom: 10px;

	.ant-select-selector {
		padding-top: 7px !important;
		padding-bottom: 7px !important;
		height: auto !important;
		display: flex;
		align-items: center;
	}
`;

const InputsWrapper = styled.div`
	display: grid;
	width: 100%;
	grid-template-columns: repeat(4, 1fr);
	gap: 10px;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`;

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
		width: 75%;
		max-width: 450px;
		padding: 20px;
		display: flex;
		align-items: center;
		justify-content: center;

		@media (max-width: 768px) {
			width: 100%;
		}
	}

	.search-button:hover {
		background-color: var(--primaryBlueDarker) !important;
		color: white !important;
	}
`;

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

const RangeDatePicker = styled(RangePicker)`
	width: 100%;

	.ant-picker-input {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 7px;
		padding-bottom: 7px;
	}
`;

const InputNumberWrapper = styled.div`
	width: 100%;

	.ant-input-number {
		width: 100%;

		.ant-input-number-input-wrap {
			padding-top: 7px;
			padding-bottom: 7px;
		}
	}
`;
