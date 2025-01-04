// SearchUpdate.js

import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { DatePicker, Select, InputNumber, Button } from "antd";
import styled, { css } from "styled-components";
import { toast } from "react-toastify";
// eslint-disable-next-line
import { UserOutlined, TeamOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import { useCartContext } from "../../cart_context";
import { roomTypesWithTranslations } from "../../Assets";

const { Option } = Select;

const SearchUpdate = ({
	distinctRoomTypes,
	roomTypesMapping,
	initialSearchParams = {},
}) => {
	// ----------------- Default Dates -----------------
	// By default, checkIn = tomorrow; checkOut = +7 days from tomorrow
	const defaultCheckIn = dayjs().add(1, "day").startOf("day");
	const defaultCheckOut = dayjs().add(7, "day").endOf("day");

	// If the parent gave us initial date range, use it; otherwise, use defaults
	const hasInitialDates =
		Array.isArray(initialSearchParams.dates) &&
		initialSearchParams.dates.length === 2;

	// ----------------- State -----------------
	const [searchParams, setSearchParams] = useState(() => ({
		destination: initialSearchParams.destination || "",
		checkIn: hasInitialDates ? initialSearchParams.dates[0] : defaultCheckIn,
		checkOut: hasInitialDates ? initialSearchParams.dates[1] : defaultCheckOut,
		roomType: initialSearchParams.roomType || "",
		adults: initialSearchParams.adults || "",
		children: initialSearchParams.children || "",
	}));

	// Keep track of invalid fields for the red border
	const [invalidFields, setInvalidFields] = useState({});

	// We'll track this so the "TO" date can't be before the "FROM" date, etc.
	// eslint-disable-next-line
	const [calendarStartDate, setCalendarStartDate] = useState(defaultCheckIn);

	const { chosenLanguage } = useCartContext();
	const history = useHistory();

	// Whenever checkIn changes, adjust the calendar start date to keep it consistent
	useEffect(() => {
		if (searchParams.checkIn) {
			setCalendarStartDate(searchParams.checkIn);
		}
	}, [searchParams.checkIn]);

	// ----------------- Handlers -----------------
	const handleSelectChange = (value, name) => {
		setSearchParams((prev) => ({
			...prev,
			[name]: value,
		}));
		setInvalidFields((prev) => ({
			...prev,
			[name]: false, // clear the red border once user selects/changes a valid value
		}));
	};

	const handleFromDateChange = (date) => {
		setSearchParams((prev) => ({
			...prev,
			checkIn: date ? date.clone() : null,
		}));
		setInvalidFields((prev) => ({
			...prev,
			checkIn: false,
		}));
	};

	const handleToDateChange = (date) => {
		setSearchParams((prev) => ({
			...prev,
			checkOut: date ? date.clone() : null,
		}));
		setInvalidFields((prev) => ({
			...prev,
			checkOut: false,
		}));
	};

	// Disable past dates in the pickers
	const disabledDate = (current) => {
		return current && current < dayjs().endOf("day");
	};

	// Validate required fields (destination, checkIn, checkOut, roomType, adults)
	const validateFields = () => {
		const invalid = {};

		if (!searchParams.destination) invalid.destination = true;
		if (!searchParams.checkIn) invalid.checkIn = true;
		if (!searchParams.checkOut) invalid.checkOut = true;
		if (!searchParams.roomType) invalid.roomType = true;
		if (searchParams.adults === "") invalid.adults = true;

		setInvalidFields(invalid);
		return Object.keys(invalid).length === 0;
	};

	const handleSubmit = () => {
		if (!validateFields()) {
			toast.error(
				chosenLanguage === "Arabic"
					? "يرجى تعبئة جميع البيانات المطلوبة"
					: "Please fill in all required fields"
			);
			return;
		}

		// Possibly map the chosen roomType to a backend-friendly version
		const selectedRoomType = roomTypesWithTranslations.find(
			(type) => type.roomType === searchParams.roomType
		);
		const roomTypeValue = selectedRoomType
			? selectedRoomType.roomType
			: searchParams.roomType;

		// Build the query string
		const queryParams = new URLSearchParams({
			destination: searchParams.destination,
			startDate: searchParams.checkIn.format("YYYY-MM-DD"),
			endDate: searchParams.checkOut.format("YYYY-MM-DD"),
			roomType: roomTypeValue,
			adults: searchParams.adults,
			children: searchParams.children || "",
		}).toString();

		// Track events
		ReactGA.event({
			category: "Search",
			action: "User submitted a search",
			label: `Search - ${searchParams.destination}`,
		});
		ReactPixel.track("Search Submitted", {
			action: "User searched for rooms",
			destination: searchParams.destination,
		});

		// Finally, navigate to the results page
		history.push(`/our-hotels-rooms?${queryParams}`);
	};

	// ----------------- Render -----------------
	return (
		<SearchWrapper
			dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
			isArabic={chosenLanguage === "Arabic"}
		>
			{/* Heading */}
			<Heading>
				{chosenLanguage === "Arabic"
					? "دعنا نساعدك في إيجاد ما تحتاجه"
					: "Let us Help you Find your needs"}
			</Heading>

			<RowWrapper>
				{/* Destination / Country */}
				<FieldWrapper invalid={invalidFields.destination}>
					<Label>{chosenLanguage === "Arabic" ? "البلد" : "COUNTRY"}</Label>
					<Select
						style={{ width: "100%", height: "40px" }}
						placeholder={
							chosenLanguage === "Arabic"
								? "إلى أين ترغب في الذهاب؟"
								: "Where would you like to go?"
						}
						onChange={(value) => handleSelectChange(value, "destination")}
						value={searchParams.destination}
					>
						<Option value=''>
							{chosenLanguage === "Arabic" ? "اختر وجهتك" : "Destination"}
						</Option>
						<Option value='Makkah'>
							{chosenLanguage === "Arabic" ? "مكة" : "Makkah"}
						</Option>
						<Option value='Madinah'>
							{chosenLanguage === "Arabic" ? "المدينة المنورة" : "Madinah"}
						</Option>
					</Select>
				</FieldWrapper>

				{/* FROM (CheckIn) */}
				<FieldWrapper invalid={invalidFields.checkIn}>
					<Label>{chosenLanguage === "Arabic" ? "من" : "FROM"}</Label>
					<StyledDatePicker
						value={searchParams.checkIn}
						disabledDate={disabledDate}
						onChange={handleFromDateChange}
						placeholder={
							chosenLanguage === "Arabic" ? "اختر تاريخ الوصول" : "Select date"
						}
					/>
				</FieldWrapper>

				{/* TO (CheckOut) */}
				<FieldWrapper invalid={invalidFields.checkOut}>
					<Label>{chosenLanguage === "Arabic" ? "إلى" : "TO"}</Label>
					<StyledDatePicker
						value={searchParams.checkOut}
						disabledDate={disabledDate}
						onChange={handleToDateChange}
						placeholder={
							chosenLanguage === "Arabic"
								? "اختر تاريخ المغادرة"
								: "Select date"
						}
					/>
				</FieldWrapper>
			</RowWrapper>

			<RowWrapper>
				{/* ROOM TYPE */}
				<FieldWrapper invalid={invalidFields.roomType}>
					<Label>
						{chosenLanguage === "Arabic" ? "نوع الغرفة" : "ROOM TYPE"}
					</Label>
					<Select
						style={{
							width: "100%",
							height: "40px",
							fontSize: "10px",
						}}
						placeholder={
							chosenLanguage === "Arabic"
								? "اختر نوع الغرفة"
								: "Select room type"
						}
						onChange={(value) => handleSelectChange(value, "roomType")}
						value={searchParams.roomType}
					>
						<Option
							value=''
							style={{
								fontSize: chosenLanguage === "Arabic" ? "13px" : "10px",
								fontWeight: "bold",
								textAlign: chosenLanguage === "Arabic" ? "right" : "",
							}}
						>
							{chosenLanguage === "Arabic" ? "نوع الغرفة" : "Room Type"}
						</Option>
						{roomTypesWithTranslations.map(({ roomType, roomTypeArabic }) => (
							<Option
								key={roomType}
								style={{
									fontSize: chosenLanguage === "Arabic" ? "13px" : "10px",
									fontWeight: "bold",
									textAlign: chosenLanguage === "Arabic" ? "right" : "",
								}}
								value={roomType}
							>
								{chosenLanguage === "Arabic" ? roomTypeArabic : roomType}
							</Option>
						))}
					</Select>
				</FieldWrapper>

				{/* GUESTS (Adults) */}
				<FieldWrapper invalid={invalidFields.adults}>
					<Label>{chosenLanguage === "Arabic" ? "الضيوف" : "GUESTS"}</Label>
					<StyledInputNumber
						isArabic={chosenLanguage === "Arabic"}
						prefix={<UserOutlined />}
						min={1}
						max={99}
						placeholder={
							chosenLanguage === "Arabic" ? "عدد الضيوف" : "Number of guests"
						}
						onChange={(value) => handleSelectChange(value, "adults")}
						value={searchParams.adults}
					/>
				</FieldWrapper>

				{/* SEARCH Button */}
				<ButtonWrapper>
					<SearchButton onClick={handleSubmit}>
						{chosenLanguage === "Arabic" ? "بحث" : "SEARCH"}
					</SearchButton>
				</ButtonWrapper>
			</RowWrapper>
		</SearchWrapper>
	);
};

export default SearchUpdate;

/* ----------------------------------------------------------
   STYLED COMPONENTS (same as your original with minor tweaks)
----------------------------------------------------------- */

const highlightBorder = css`
	border: 1px solid red !important;
`;

export const SearchWrapper = styled.div`
	background: linear-gradient(
		to top,
		rgba(22, 97, 119, 0.2) 0%,
		rgba(22, 97, 119, 0.5) 100%
	);
	padding: 20px;
	border-radius: 8px;
	max-width: 900px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: 20px;
	text-align: ${({ isArabic }) => (isArabic ? `right` : "")};

	div,
	p,
	span,
	section,
	small,
	input,
	button,
	li,
	ul,
	label {
		font-family: ${({ isArabic }) =>
			isArabic ? `"Droid Arabic Kufi", sans-serif` : "inherit"};
	}

	@media (max-width: 1000px) {
		padding: 10px;
	}
`;

export const Heading = styled.h3`
	margin: 0;
	font-size: 1rem;
	font-weight: 600;
	color: #000;
`;

export const RowWrapper = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 10px;
	@media (max-width: 768px) {
		/* If you want them stacked, uncomment:
       grid-template-columns: 1fr;
    */
	}
`;

export const FieldWrapper = styled.div`
	display: flex;
	flex-direction: column;
	${({ invalid }) => invalid && highlightBorder};
	.ant-select,
	.ant-select-outlined {
		padding: 0px !important;
	}
	.ant-select-selection-search {
		background: rgba(22, 97, 119, 0.15) !important;
		position: absolute !important;
		margin-left: -11px !important;
		margin-right: -11px !important;
	}
	.ant-select-selector {
		padding: 3px !important;
		text-transform: capitalize !important;
	}
	.ant-select-selection-item {
		font-size: 13px !important;
	}
`;

export const Label = styled.label`
	font-size: 0.7rem;
	font-weight: 500;
	margin-bottom: 4px;
	color: #000;
`;

export const StyledDatePicker = styled(({ invalid, ...props }) => (
	<DatePicker {...props} />
))`
	width: 100%;
	height: 40px;
	padding: 0px !important;

	.ant-picker-input {
		display: flex;
		align-items: center;
		height: 100%;
		width: 100%;
		border-radius: 4px;
		padding: 20px 10px !important;
		font-size: 12px !important;
		background-color: rgba(22, 97, 119, 0.15);
		input {
			font-size: 0.75rem !important;
			color: #000;
			&::placeholder {
				font-size: 0.75rem !important;
				color: #555;
			}
		}
	}
`;

export const StyledInputNumber = styled(InputNumber)`
	width: 100%;
	height: 40px;
	padding: 0px !important;

	.ant-input-number-input-wrap {
		display: flex;
		align-items: center;
		height: 100%;
		background-color: rgba(22, 97, 119, 0.15);
		border-radius: 4px;
		margin-left: ${({ isArabic }) => (isArabic ? `0px` : "-19px")};
		margin-right: ${({ isArabic }) => (isArabic ? `-19px` : "0px")};

		input {
			font-size: 0.8rem;
			text-align: center;
			&::placeholder {
				font-size: 0.7rem;
				color: #555;
			}
		}
	}
`;

export const ButtonWrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
`;

export const SearchButton = styled(Button)`
	background-color: #e98423;
	color: #fff;
	border: none;
	width: 120px;
	height: 40px;
	font-weight: bold;
	font-size: 0.8rem;
	border-radius: 4px;
	margin-top: 21px;

	&:hover {
		background-color: #e96e00 !important;
		color: #fff !important;
	}
`;
