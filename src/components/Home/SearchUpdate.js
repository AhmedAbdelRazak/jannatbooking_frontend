// SearchUpdate.js

import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { DatePicker, Select, InputNumber, Button, Input } from "antd";
import styled, { css } from "styled-components";
import { toast } from "react-toastify";
// eslint-disable-next-line
import { UserOutlined, TeamOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import { useCartContext } from "../../cart_context";
import { roomTypesWithTranslations } from "../../Assets";

// Grab the sub-components for convenience
const { Option } = Select;

const SearchUpdate = ({ distinctRoomTypes }) => {
	// ------------------- State -------------------
	const [searchParams, setSearchParams] = useState({
		destination: "",
		checkIn: null, // from (replacing dates[0])
		checkOut: null, // to (replacing dates[1])
		roomType: "",
		adults: "",
		children: "", // We'll keep children in the data, but not display in the screenshot layout
	});

	// Keep track of invalid fields for the red border
	const [invalidFields, setInvalidFields] = useState({});

	// Default calendar start date (used for the "from" date picker)
	// eslint-disable-next-line
	const [calendarStartDate, setCalendarStartDate] = useState(
		dayjs().add(1, "day")
	);

	const { chosenLanguage } = useCartContext(); // Access chosenLanguage from context
	const history = useHistory();

	// ------------------- Effects -------------------
	useEffect(() => {
		// By default: from = tomorrow, to = +7 days from tomorrow
		const startDate = dayjs().add(1, "day").startOf("day");
		const endDate = dayjs().add(7, "day").endOf("day");

		setSearchParams((prev) => ({
			...prev,
			checkIn: startDate,
			checkOut: endDate,
		}));

		setCalendarStartDate(startDate);
	}, []);

	// ------------------- Handlers -------------------
	// Handle the "COUNTRY" / "DESTINATION" change
	const handleSelectChange = (value, name) => {
		setSearchParams((prev) => ({
			...prev,
			[name]: value,
		}));
		setInvalidFields((prev) => ({
			...prev,
			[name]: false, // clear invalid highlight once user selects a value
		}));
	};

	// Handle the "FROM" date change
	const handleFromDateChange = (date) => {
		setSearchParams((prev) => ({
			...prev,
			checkIn: date ? date.clone() : null,
		}));
		setInvalidFields((prev) => ({
			...prev,
			checkIn: false,
		}));
		if (date) setCalendarStartDate(date);
	};

	// Handle the "TO" date change
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

	// ---- Date disabling logic ----
	const disabledDateCheckIn = (current) => {
		// Disallow any date before today's endOf("day")
		return current && current < dayjs().endOf("day");
	};

	const disabledDateCheckOut = (current) => {
		// If there's no checkIn, just disallow anything before today
		if (!searchParams.checkIn) {
			return current && current < dayjs().endOf("day");
		}
		// Must be at least 1 day after checkIn
		const minCheckOut = searchParams.checkIn.clone().add(1, "day");
		return current && current < minCheckOut;
	};

	// Validate required fields (destination, from, to, roomType, adults)
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

	// Handle final submission
	const handleSubmit = () => {
		// 1) Validate required fields (existing logic)
		if (!validateFields()) {
			toast.error(
				chosenLanguage === "Arabic"
					? "يرجى تعبئة جميع البيانات المطلوبة"
					: "Please fill in all required fields"
			);
			return;
		}

		// 2) Sanity check: checkIn must be strictly less than checkOut
		if (
			searchParams.checkIn &&
			searchParams.checkOut &&
			!searchParams.checkIn.isBefore(searchParams.checkOut)
		) {
			toast.error(
				chosenLanguage === "Arabic"
					? "يجب أن يكون تاريخ المغادرة بعد تاريخ الوصول. يرجى اختيار تاريخ مغادرة صالح."
					: "Your check-out date must be after your check-in date. Please choose a valid check-out date."
			);
			return;
		}

		// 3) Possibly map the chosen roomType to a backend-friendly version
		const selectedRoomType = roomTypesWithTranslations.find(
			(type) => type.roomType === searchParams.roomType
		);
		const roomTypeValue = selectedRoomType
			? selectedRoomType.roomType
			: searchParams.roomType;

		// 4) Build the query string
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
			category: "Search Submitted From Home Page Page",
			action: "Search Submitted From Home Page Page",
			label: `Search - ${searchParams.destination}`,
		});
		ReactPixel.track("Search Submitted From Home Page Page", {
			action: "User searched for rooms From Home Page Page",
			destination: `/our-hotels-rooms?${queryParams}`,
		});

		// Finally, navigate to the results page
		history.push(`/our-hotels-rooms?${queryParams}`);
	};

	// ------------------- Render -------------------
	return (
		<SearchWrapper
			dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
			isArabic={chosenLanguage === "Arabic"}
		>
			{/* Top heading exactly like the screenshot text */}
			<Heading>
				{chosenLanguage === "Arabic"
					? "دعنا نساعدك في إيجاد ما تحتاجه"
					: "Let us help you to find your perfect hotel!"}
			</Heading>

			{/* First row: COUNTRY, FROM, TO */}
			<RowWrapper>
				{/* COUNTRY field */}
				<FieldWrapper invalid={invalidFields.destination}>
					<Label>{chosenLanguage === "Arabic" ? "البلد" : "COUNTRY"}</Label>
					<Select
						style={{
							width: "100%",
							height: "40px",
							padding: "0px",
						}}
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
						// Use single DatePicker for "FROM"
						value={searchParams.checkIn}
						disabledDate={disabledDateCheckIn}
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
						// Use single DatePicker for "TO"
						value={searchParams.checkOut}
						disabledDate={disabledDateCheckOut}
						onChange={handleToDateChange}
						placeholder={
							chosenLanguage === "Arabic"
								? "اختر تاريخ المغادرة"
								: "Select date"
						}
					/>
				</FieldWrapper>
			</RowWrapper>

			{/* Second row: ROOM TYPE, GUESTS, SEARCH button */}
			<RowWrapper>
				{/* ROOM TYPE */}
				<FieldWrapper invalid={invalidFields.roomType}>
					<Label>
						{chosenLanguage === "Arabic" ? "نوع الغرفة" : "ROOM TYPE"}
					</Label>
					<Select
						style={{ width: "100%", height: "40px", fontSize: "10px" }}
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
						{distinctRoomTypes &&
							distinctRoomTypes.map((labelEn) => {
								const match = roomTypesWithTranslations.find(
									(item) => item.labelEn === labelEn
								);
								if (match) {
									return (
										<Option
											key={match.roomType}
											value={match.roomType}
											style={{
												fontSize: chosenLanguage === "Arabic" ? "13px" : "10px",
												fontWeight: "bold",
												textAlign: chosenLanguage === "Arabic" ? "right" : "",
											}}
										>
											{chosenLanguage === "Arabic"
												? match.roomTypeArabic
												: match.labelEn}
										</Option>
									);
								}
								// Fallback if distinctRoomTypes has an unexpected label
								return (
									<Option
										key={labelEn}
										value={labelEn}
										style={{
											fontSize: chosenLanguage === "Arabic" ? "13px" : "10px",
											fontWeight: "bold",
											textAlign: chosenLanguage === "Arabic" ? "right" : "",
										}}
									>
										{labelEn}
									</Option>
								);
							})}
					</Select>
				</FieldWrapper>

				{/* GUESTS (Adults) */}
				<FieldWrapper invalid={invalidFields.adults}>
					<Label>{chosenLanguage === "Arabic" ? "الضيوف" : "GUESTS"}</Label>
					<StyledNumericInput
						isArabic={chosenLanguage === "Arabic"}
						min='1'
						max='99'
						// To display the placeholder in Arabic/English
						placeholder={
							chosenLanguage === "Arabic" ? "عدد الضيوف" : "Number of guests"
						}
						prefix={<UserOutlined />}
						value={searchParams.adults}
						onChange={(e) => {
							// Convert to integer, store in state
							const numericValue = parseInt(e.target.value, 10);
							handleSelectChange(
								isNaN(numericValue) ? "" : numericValue,
								"adults"
							);
						}}
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
   Below are the styled-components that replicate the 
   screenshot's design: 2 rows, bluish background, 
   orange search button, etc. 
----------------------------------------------------------- */

const highlightBorder = css`
	border: 1px solid red !important;
`;

/**
 * The main wrapper that gives us the background color,
 * padding, and the overall look from the screenshot.
 * Now set to #166177 at 40% opacity via RGBA.
 */
export const SearchWrapper = styled.div`
	/* 40% opacity #166177 => rgba(22, 97, 119, 0.4) */
	/* background-color: rgba(22, 97, 119, 0.45); */

	/* Gradient from bottom (0.1) to top (0.45) of #166177 */
	background: linear-gradient(
		to top,
		rgba(22, 97, 119, 0.2) 0%,
		rgba(22, 97, 119, 0.5) 100%
	);

	padding: 20px;
	border-radius: 8px;
	max-width: 900px;
	margin: 0 auto; /* center it horizontally */
	display: flex;
	flex-direction: column;
	gap: 20px;
	margin-top: 450px !important;
	text-align: ${({ isArabic }) => (isArabic ? `right` : "")};

	/* If Arabic, apply the Arabic font you use */
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

	/* Example top margin if needed */
	margin-top: 40px;

	@media (max-width: 1000px) {
		padding: 10px;
	}
`;

/**
 * The heading text "Let us Help you Find your needs"
 * centered at the top, matching screenshot style.
 */
export const Heading = styled.h3`
	/* text-align: center; */
	margin: 0;
	font-size: 0.95rem;
	font-weight: 600;
	color: #000; /* black text, or adjust to match your preference */
`;

/**
 * Each row in the screenshot:
 * 1) COUNTRY, FROM, TO
 * 2) ROOM TYPE, GUESTS, SEARCH
 * We keep 3 columns; reduce gap to 10px as desired.
 * Remove or adjust media query if you want 3 columns on mobile as well.
 */
export const RowWrapper = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 10px;

	/* 
    If you'd like them to remain 3 columns on small screens,
    you can remove the media query below or comment it out.
  */
	@media (max-width: 768px) {
		/* grid-template-columns: 1fr; */
	}
`;

/**
 * Wrap a label + input/select together in one vertical stack
 * and highlight in red if invalid.
 * Also ensures everything lines up neatly.
 */
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
		font-size: 11px !important;
	}
`;

/**
 * The label "COUNTRY" / "FROM" / "TO" / "ROOM TYPE" / "GUESTS"
 * Now has smaller font size.
 */
export const Label = styled.label`
	font-size: 0.7rem; /* smaller label font */
	font-weight: 500;
	margin-bottom: 4px;
	color: #000; /* or #fff, depending on your preference */
`;

/**
 * Custom DatePicker that:
 * 1) Has smaller font so the chosen date is fully visible
 * 2) All placeholders are smaller
 * 3) The background inside the input is #166177 with 50% opacity
 * 4) The height is consistent (40px) across all fields
 * 5) We remove invalid from props to avoid passing unknown props to the DOM
 */
export const StyledDatePicker = styled((props) => (
	<DatePicker
		{...props}
		inputReadOnly
		popupClassName='centered-calendar2'
		getPopupContainer={() => document.body}
	/>
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

/**
 * Numeric input for GUESTS.
 * 1) Smaller placeholder font
 * 2) Force consistent 40px height
 * 3) Same #166177 with 50% background
 */
export const StyledInputNumber = styled(InputNumber)`
	width: 100%;
	height: 40px; /* consistent field height */
	padding: 0px !important;

	/* The wrapping container inside the InputNumber */
	.ant-input-number-input-wrap {
		display: flex;
		align-items: center;
		height: 100%;
		background-color: rgba(22, 97, 119, 0.15); /* #166177 @ 50% */
		border-radius: 4px;

		margin-left: ${({ isArabic }) => (isArabic ? `0px` : "-19px")};
		margin-right: ${({ isArabic }) => (isArabic ? `-19px` : "0px")};

		input {
			font-size: 0.8rem; /* smaller text */
			text-align: center;

			&::placeholder {
				font-size: 0.7rem;
				color: #555; /* or #fff, #ccc, etc. */
			}
		}
	}
`;

/**
 * For the last cell in the second row,
 * we place the search button in the center or right as in the screenshot.
 */
export const ButtonWrapper = styled.div`
	display: flex;
	align-items: center; /* vertically centered within the row */
	justify-content: center;
`;

/**
 * The orange Search button.
 * 1) Same 40px height to match the input fields
 * 2) Slightly smaller text if desired
 */
export const SearchButton = styled(Button)`
	background-color: #e98423;
	color: #fff;
	border: none;
	width: 120px;
	height: 40px; /* same height as fields */
	font-weight: bold;
	font-size: 0.8rem; /* if you want smaller text on button */
	border-radius: 4px;
	margin-top: 21px;

	&:hover {
		background-color: #e96e00 !important;
		color: #fff !important;
	}
`;

const StyledNumericInput = styled(Input).attrs(() => ({
	type: "number",
	inputMode: "numeric",
	pattern: "[0-9]*",
}))`
	width: 100%;
	height: 40px;

	/* Ensure text alignment matches the language direction, if needed */
	.ant-input {
		text-align: ${(props) => (props.isArabic ? "right" : "left")};
	}
`;
