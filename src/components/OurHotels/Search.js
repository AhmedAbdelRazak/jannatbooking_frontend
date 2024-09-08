import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { DatePicker, Select, InputNumber, Button } from "antd";
import styled from "styled-components";
import { toast } from "react-toastify";
import {
	UserOutlined,
	CalendarOutlined,
	TeamOutlined,
} from "@ant-design/icons";

const { RangePicker } = DatePicker;
const { Option } = Select;

const Search = () => {
	const [searchParams, setSearchParams] = useState({
		dates: [],
		roomType: "",
		adults: "",
		children: "",
	});

	const history = useHistory();

	const handleDateChange = (dates) => {
		setSearchParams((prevParams) => ({
			...prevParams,
			dates,
		}));
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
			searchParams.adults === "" ||
			searchParams.children === ""
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		const queryParams = new URLSearchParams({
			startDate: searchParams.dates[0].format("YYYY-MM-DD"),
			endDate: searchParams.dates[1].format("YYYY-MM-DD"),
			roomType: searchParams.roomType,
			adults: searchParams.adults,
			children: searchParams.children,
		}).toString();
		history.push(`/our-hotels?${queryParams}`);
	};

	return (
		<SearchWrapper>
			<RangePicker
				format='YYYY-MM-DD'
				onChange={handleDateChange}
				value={searchParams.dates}
			/>
			<Select
				style={{ width: "20%" }}
				suffixIcon={<CalendarOutlined />} // This adds the calendar icon to the Select
				placeholder='Select room type'
				onChange={(value) => handleSelectChange(value, "roomType")}
				value={searchParams.roomType}
			>
				<Option value=''>Room Type</Option>
				<Option value='single'>Single</Option>
				<Option value='double'>Double</Option>
				<Option value='suite'>Suite</Option>
			</Select>

			<InputNumberWrapper>
				<InputNumber
					className='w-100'
					prefix={<UserOutlined />} // This adds the user icon to the InputNumber
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
					prefix={<TeamOutlined />} // This adds the team icon to the InputNumber
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
	left: 50%;
	transform: translate(-50%, -50%);
	background-color: white;
	padding: 30px; // Adjust padding as needed
	display: flex;
	align-items: center;
	justify-content: center; // This will help with horizontal centering of children
	gap: 6px; // This creates a gap between each child element
	border-radius: 20px;
	width: 65%;

	.ant-select .ant-select-selector,
	.ant-input-number .ant-input-number-input {
		padding: 0 20px; // Ant Design's default padding for input and select is 11px
	}

	.ant-btn {
		flex-shrink: 0; // Preventing button from shrinking
		background-color: var(--primaryBlue);
		color: white;
		border-radius: 10px; // Adjust if necessary
		border: none; // Removing border might be necessary to maintain height
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
		height: 42px; // Ensuring consistent height; adjust as necessary
		display: flex;
		align-items: center; // This will vertically center the text or content
		justify-content: center; // This will horizontally center the text for the button
	}

	.ant-select .ant-select-selector {
		bottom: 4px;
	}

	// Specific adjustments to the RangePicker
	.ant-picker-range .ant-picker-input {
		input {
			text-align: center;
		}
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

	// Styles for the InputNumber prefix icon
	.ant-input-number-prefix {
		display: flex;
		align-items: center;
	}

	@media (max-width: 768px) {
		flex-direction: column; // Stack children vertically
		align-items: stretch; // Stretch children to fill the width
		width: 95%; // Adjust width to your preference on smaller screens
		top: 65%; // Adjust top position if needed

		.ant-picker,
		.ant-select,
		.ant-select .ant-select-selector,
		.ant-input-number,
		.ant-btn {
			margin-right: 0;
			margin-bottom: 6px; // Add a bottom margin for spacing
			width: 100% !important; // Full width for all elements
		}

		// Reset margin-bottom for the last element
		.ant-btn {
			margin-bottom: 0;
		}
	}
`;

// Additional wrapper for InputNumber to control width
const InputNumberWrapper = styled.div`
	.ant-input-number {
		width: 100%; // Ensuring input number takes the full width of its parent
		// Add padding to make space for the prefix icon if necessary
		.ant-input-number-input {
			padding-left: 2px; // Adjust this value based on your icon size
		}
	}

	// Media query for smaller screens
	@media (max-width: 768px) {
		// On smaller screens, you may want to remove any specific width settings
		// so that the input number takes the full width of its parent
		.ant-input-number {
			width: auto;
		}
	}
`;
