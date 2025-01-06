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
import { roomTypesWithTranslations } from "../../Assets";
import { useCartContext } from "../../cart_context";

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

	const { chosenLanguage } = useCartContext();

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
		<SearchWrapper
			dir={chosenLanguage === "Arabic" ? "rtl" : ""}
			style={{ textAlign: chosenLanguage === "Arabic" ? "right" : "" }}
			isArabic={chosenLanguage === "Arabic"}
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
						<Option
							value='all'
							style={{
								fontSize: chosenLanguage === "Arabic" ? "13px" : "10px",
								fontWeight: "bold",
								textAlign: chosenLanguage === "Arabic" ? "right" : "",
							}}
						>
							{chosenLanguage === "Arabic" ? "الكل" : "All"}
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

			<SearchButtonWrapper
				isArabic={chosenLanguage === "Arabic"}
				onClick={() => {
					ReactPixel.track("SearchClicked_OurHotels", {
						action: "User searched for a room",
						page: "Our Hotels",
					});

					ReactGA.event({
						category: "User Searched For A Room From Our Hotels Page",
						action: "User Searched For A Room From Our Hotels Page",
						label: `User Searched For A Room From Our Hotels Page`,
					});
				}}
			>
				<Button className='search-button' onClick={handleSubmit}>
					{chosenLanguage === "Arabic" ? "بحث" : "Search"}
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

	div,
	p,
	span,
	section,
	small,
	input,
	button,
	li,
	ul {
		font-family: ${({ isArabic }) =>
			isArabic ? `"Droid Arabic Kufi", sans-serif` : ""};
	}

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
		padding: 15px !important;
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
		border: 1px solid #7d7d7d !important;
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
		font-size: ${({ isArabic }) => (isArabic ? "1.3rem" : "")};

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
	border: 1px #7d7d7d solid !important;

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
