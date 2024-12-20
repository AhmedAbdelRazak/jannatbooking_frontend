import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { DatePicker, Select, InputNumber, Button } from "antd";
import styled, { css } from "styled-components";
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

	const [invalidFields, setInvalidFields] = useState({});

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

	const handleSelectChange = (value, name) => {
		setSearchParams((prevParams) => ({
			...prevParams,
			[name]: value,
		}));
		setInvalidFields((prevInvalidFields) => ({
			...prevInvalidFields,
			[name]: false, // Clear error state for the field when it's updated
		}));
	};

	const validateFields = () => {
		const invalid = {};

		if (!searchParams.dates.length) invalid.dates = true;
		if (!searchParams.roomType) invalid.roomType = true;
		if (!searchParams.destination) invalid.destination = true;
		if (searchParams.adults === "") invalid.adults = true;

		setInvalidFields(invalid);
		return Object.keys(invalid).length === 0;
	};

	const handleSubmit = () => {
		if (!validateFields()) {
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
			<DestinationWrapper invalid={invalidFields.destination}>
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
					invalid={invalidFields.dates}
					inputReadOnly
				/>

				<SelectWrapper invalid={invalidFields.roomType}>
					<Select
						style={{ width: "100%" }}
						suffixIcon={<CalendarOutlined />}
						placeholder='Select room type'
						className='mb-3'
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
				</SelectWrapper>

				<AdultsChildrenWrapper>
					<InputNumberWrapper invalid={invalidFields.adults}>
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
				</AdultsChildrenWrapper>
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

const highlightBorder = css`
	border: 1px solid red;
`;

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
	${(props) => props.invalid && highlightBorder};

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
	${(props) => props.invalid && highlightBorder};

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
	@media (max-width: 576px) {
		.ant-picker-panels {
			flex-direction: column !important;
		}
	}
`;

const RangeDatePicker = styled(RangePicker)`
	width: 100%;
	${(props) => props.invalid && highlightBorder};

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
	${(props) => props.invalid && highlightBorder};

	.ant-input-number {
		width: 100%;

		.ant-input-number-input-wrap {
			padding-top: 7px;
			padding-bottom: 7px;
		}
	}
`;

const SelectWrapper = styled.div`
	width: 100%;
	${(props) => props.invalid && highlightBorder};

	.ant-select-selector {
		padding-top: 7px !important;
		padding-bottom: 7px !important;
		height: auto !important;
		display: flex;
		align-items: center;
	}
`;

const AdultsChildrenWrapper = styled.div`
	display: grid;
	grid-template-columns: repeat(
		2,
		1fr
	); /* Two equal columns for Adults and Children */
	gap: 10px;
	width: 100%;
	${(props) => props.invalid && highlightBorder};

	@media (min-width: 768px) {
		grid-column: span 2; /* Ensure Adults and Children span two columns together */
	}
`;
