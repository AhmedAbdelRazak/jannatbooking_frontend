import React from "react";
import styled from "styled-components";
import { Select } from "antd";
import { SortAscendingOutlined } from "@ant-design/icons";

const { Option } = Select;

const SortDropdown = ({ sortOption, setSortOption }) => {
	const handleSortChange = (value) => {
		setSortOption(value); // Update the selected sort option in parent component
	};

	return (
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
	);
};

export default SortDropdown;

// Styled Components
const SortWrapper = styled.div`
	margin-bottom: 20px;
	text-align: right; /* Align dropdown to the right */

	@media (max-width: 768px) {
		text-align: left; /* Align dropdown to the left on smaller screens */
	}
`;

const StyledSelect = styled(Select)`
	width: 200px;

	.ant-select-selector {
		display: flex;
		align-items: center;
		height: 40px; /* Ensure consistent height */
		padding: 0 15px;
	}

	.ant-select-selection-item {
		font-size: 14px;
	}
`;
