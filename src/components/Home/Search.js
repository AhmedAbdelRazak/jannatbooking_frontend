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
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import { useCartContext } from "../../cart_context";
import { roomTypesWithTranslations } from "../../Assets";

const { RangePicker } = DatePicker;
const { Option } = Select;

const Search = () => {
	const [searchParams, setSearchParams] = useState({
		destination: "",
		dates: [],
		roomType: "",
		adults: "",
		children: "",
	});
	const [invalidFields, setInvalidFields] = useState({});
	const [calendarStartDate, setCalendarStartDate] = useState(
		dayjs().add(1, "day")
	);
	const { chosenLanguage } = useCartContext(); // Access chosenLanguage
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
			toast.error(
				chosenLanguage === "Arabic"
					? "يرجى تعبئة جميع بيانات المطلوبة"
					: "Please fill in all required fields"
			);
			return;
		}

		const selectedRoomType = roomTypesWithTranslations.find(
			(type) => type.roomType === searchParams.roomType
		);

		const roomTypeValue = selectedRoomType
			? selectedRoomType.roomType
			: searchParams.roomType;

		const queryParams = new URLSearchParams({
			destination: searchParams.destination,
			startDate: searchParams.dates[0].format("YYYY-MM-DD"),
			endDate: searchParams.dates[1].format("YYYY-MM-DD"),
			roomType: roomTypeValue,
			adults: searchParams.adults,
			children: searchParams.children,
		}).toString();

		// Track events with ReactGA and ReactPixel
		ReactGA.event({
			category: "Search",
			action: "User submitted a search",
			label: `Search - ${searchParams.destination}`,
		});
		ReactPixel.track("Search Submitted", {
			action: "User searched for rooms",
			destination: searchParams.destination,
		});

		history.push(`/our-hotels-rooms?${queryParams}`);
	};

	const disabledDate = (current) => {
		return current && current < dayjs().endOf("day");
	};

	const panelRender = (panelNode) => (
		<StyledRangePickerContainer>{panelNode}</StyledRangePickerContainer>
	);

	return (
		<SearchWrapper
			dir={chosenLanguage === "Arabic" ? "rtl" : ""}
			style={{ textAlign: chosenLanguage === "Arabic" ? "right" : "" }}
		>
			<DestinationWrapper invalid={invalidFields.destination}>
				<Select
					style={{
						width: "100%",
						fontSize: chosenLanguage === "Arabic" ? "16px" : "14px",
						textAlign: chosenLanguage === "Arabic" ? "right" : "",
					}}
					placeholder={
						chosenLanguage === "Arabic"
							? "إلى أين ترغب في الذهاب؟"
							: "Where would you like to go?"
					}
					onChange={(value) => handleSelectChange(value, "destination")}
					value={searchParams.destination}
				>
					<Option
						value=''
						style={{
							textAlign: chosenLanguage === "Arabic" ? "right" : "",
						}}
					>
						{chosenLanguage === "Arabic"
							? "إلى أين ترغب في الذهاب؟"
							: "Where would you like to go?"}
					</Option>
					<Option
						value='Makkah'
						style={{
							textAlign: chosenLanguage === "Arabic" ? "right" : "",
						}}
					>
						{chosenLanguage === "Arabic" ? "مكة" : "Makkah"}
					</Option>
					<Option
						value='Madinah'
						style={{
							textAlign: chosenLanguage === "Arabic" ? "right" : "",
						}}
					>
						{chosenLanguage === "Arabic" ? "المدينة المنورة" : "Madinah"}
					</Option>
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
					style={{
						fontSize: chosenLanguage === "Arabic" ? "16px" : "14px",
					}}
				/>

				<SelectWrapper invalid={invalidFields.roomType}>
					<Select
						style={{
							width: "100%",
							fontSize: chosenLanguage === "Arabic" ? "16px" : "14px",
						}}
						suffixIcon={<CalendarOutlined />}
						placeholder={
							chosenLanguage === "Arabic"
								? "اختر نوع الغرفة"
								: "Select room type"
						}
						className='mb-3'
						onChange={(value) => handleSelectChange(value, "roomType")}
						value={searchParams.roomType}
					>
						<Option
							value=''
							style={{
								textAlign: chosenLanguage === "Arabic" ? "right" : "",
							}}
						>
							{chosenLanguage === "Arabic" ? "نوع الغرفة" : "Room Type"}
						</Option>
						{roomTypesWithTranslations.map(({ roomType, roomTypeArabic }) => (
							<Option
								key={roomType}
								value={roomType}
								style={{
									textAlign: chosenLanguage === "Arabic" ? "right" : "",
								}}
							>
								{chosenLanguage === "Arabic" ? roomTypeArabic : roomType}
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
							placeholder={
								chosenLanguage === "Arabic" ? "عدد البالغين" : "Adults"
							}
							onChange={(value) => handleSelectChange(value, "adults")}
							value={searchParams.adults}
							style={{
								fontSize: chosenLanguage === "Arabic" ? "16px" : "14px",
							}}
						/>
					</InputNumberWrapper>
					<InputNumberWrapper>
						<InputNumber
							className='w-100'
							prefix={<TeamOutlined />}
							min={0}
							max={10}
							placeholder={chosenLanguage === "Arabic" ? "الأطفال" : "Children"}
							onChange={(value) => handleSelectChange(value, "children")}
							value={searchParams.children}
							style={{
								fontSize: chosenLanguage === "Arabic" ? "16px" : "14px",
							}}
						/>
					</InputNumberWrapper>
				</AdultsChildrenWrapper>
			</InputsWrapper>

			<SearchButtonWrapper isArabic={chosenLanguage === "Arabic"}>
				<Button
					className='search-button'
					onClick={handleSubmit}
					style={{
						fontSize: chosenLanguage === "Arabic" ? "16px" : "14px",
					}}
				>
					{chosenLanguage === "Arabic" ? "بحث" : "Search"}
				</Button>
			</SearchButtonWrapper>
		</SearchWrapper>
	);
};

export default Search;

// Styled components
const highlightBorder = css`
	border: 1px solid red;
`;

// Wrapper for the entire search component
const SearchWrapper = styled.div`
	position: absolute;
	top: 95%; /* Overlaps the bottom of the Hero by 5% */
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

	// Maintain the current look for larger screens
	@media (min-width: 1024px) {
		padding: 50px;
		top: 96%; /* Restore to the current position for larger screens */
	}

	// Responsive styling for smaller screens
	@media (max-width: 768px) {
		width: 95%;
		padding: 20px; /* Reduce padding for better fit */
		border-radius: 15px;
	}

	@media (max-width: 480px) {
		top: 68%; /* Adjust top value for very small screens */
		width: 100%; /* Full width for better fit */
		padding: 15px; /* Further reduce padding for compact layout */
		border-radius: 10px;
	}
`;

// Wrapper specifically for the destination selection dropdown
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
		border: 1px solid #7d7d7d !important;
	}
`;

// Wrapper for inputs to arrange them in a grid format
const InputsWrapper = styled.div`
	display: grid;
	width: 100%;
	grid-template-columns: repeat(
		4,
		1fr
	); /* Four equal columns on larger screens */
	gap: 10px;
	${(props) => props.invalid && highlightBorder};

	@media (max-width: 768px) {
		grid-template-columns: 1fr; /* Single column layout for smaller screens */
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
		font-size: ${({ isArabic }) => (isArabic ? "1.3rem" : "")};

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
	@media (max-width: 576px) {
		.ant-picker-panels {
			flex-direction: column !important;
		}
	}
`;

// Wrapper specifically for the RangePicker component
const RangeDatePicker = styled(RangePicker)`
	width: 100%;
	${(props) => props.invalid && highlightBorder};
	border: 1px #7d7d7d solid !important;

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
	${(props) => props.invalid && highlightBorder};
	border: 1px #7d7d7d solid !important;
	border-radius: 5px;

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
		border: 1px #7d7d7d solid !important;
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
