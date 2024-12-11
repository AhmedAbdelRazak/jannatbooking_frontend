import React from "react";
import styled from "styled-components";
import { Select } from "antd";
import { SortAscendingOutlined } from "@ant-design/icons";

const { Option } = Select;

const SortDropdown = ({ sortOption, setSortOption, currency, setCurrency }) => {
	const handleSortChange = (value) => {
		setSortOption(value); // Update the selected sort option in parent component
	};

	const handleCurrencyChange = (value) => {
		setCurrency(value); // Update the selected currency option in parent component
		localStorage.setItem("selectedCurrency", value); // Save the selected currency to localStorage
	};

	return (
		<DropdownRow>
			{/* Sort Dropdown */}
			<SortWrapper>
				<StyledSelect
					value={sortOption}
					onChange={handleSortChange}
					suffixIcon={<SortAscendingOutlined />}
					placeholder='Sort by'
				>
					<Option value='closest'>Closest To El Haram</Option>
					<Option value='price'>Price (Cheapest To Expensive)</Option>
				</StyledSelect>
			</SortWrapper>

			{/* Currency Dropdown */}
			<CurrencyWrapper>
				<StyledSelect
					value={currency}
					onChange={handleCurrencyChange}
					placeholder='Currency'
				>
					<Option value='sar'>SAR</Option>
					<Option value='usd'>US Dollars</Option>
					<Option value='eur'>Euro</Option>
				</StyledSelect>
			</CurrencyWrapper>
		</DropdownRow>
	);
};

export default SortDropdown;

// Styled Components
const DropdownRow = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 20px; /* Adjust gap between dropdowns */
	margin-bottom: 20px;

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: flex-start;
		gap: 10px; /* Smaller gap for mobile */
		margin-left: 10px;
	}
`;

const SortWrapper = styled.div`
	text-align: right;

	@media (max-width: 768px) {
		text-align: left;
	}
`;

const CurrencyWrapper = styled.div`
	text-align: right;

	@media (max-width: 768px) {
		text-align: left;
	}
`;

const StyledSelect = styled(Select)`
	width: 250px; /* Increased width to fit longer text */

	.ant-select-selector {
		display: flex;
		align-items: center;
		height: 40px; /* Ensure consistent height */
		padding: 0 15px;
	}

	.ant-select-selection-item {
		font-size: 14px;
	}

	.ant-select-dropdown {
		min-width: 250px; /* Ensure the dropdown menu is wide enough */
	}
`;
