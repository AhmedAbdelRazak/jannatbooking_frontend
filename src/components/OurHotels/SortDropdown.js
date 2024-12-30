import React from "react";
import styled from "styled-components";
import { Select } from "antd";
import { SortAscendingOutlined } from "@ant-design/icons";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";

const { Option } = Select;

const SortDropdown = ({
	sortOption,
	setSortOption,
	currency,
	setCurrency,
	chosenLanguage,
}) => {
	const handleSortChange = (value) => {
		setSortOption(value); // Update the selected sort option in parent component
	};

	const handleCurrencyChange = (value) => {
		ReactPixel.track("CurrencyChanged_OurHotels", {
			action: "User Changed Currency",
			page: "Our Hotels",
		});

		ReactGA.event({
			category: "User Changed Currency From Our Hotels Page",
			action: "User Changed Currency From Our Hotels Page",
			label: `User Changed Currency From Our Hotels Page`,
		});
		setCurrency(value); // Update the selected currency option in parent component
		localStorage.setItem("selectedCurrency", value); // Save the selected currency to localStorage
	};

	// Translations
	const translations = {
		English: {
			sortBy: "Sort by",
			closest: "Closest To El Haram",
			cheapest: "Cheapest To Expensive",
			currency: "Currency",
			sar: "SAR",
			usd: "US Dollars",
			eur: "Euro",
		},
		Arabic: {
			sortBy: "ترتيب حسب",
			closest: "الأقرب إلى الحرم",
			cheapest: "من الأرخص إلى الأغلى",
			currency: "العملة",
			sar: "ريال",
			usd: "الدولار الأمريكي",
			eur: "اليورو",
		},
	};

	const t = translations[chosenLanguage] || translations.English;

	return (
		<DropdownRow
			style={{
				marginRight: chosenLanguage === "Arabic" ? "10px" : "",
			}}
		>
			{/* Sort Dropdown */}
			<SortWrapper>
				<StyledSelect
					value={sortOption}
					onChange={handleSortChange}
					suffixIcon={<SortAscendingOutlined />}
					placeholder={t.sortBy}
					style={{
						direction: chosenLanguage === "Arabic" ? "rtl" : "ltr",
						textAlign: chosenLanguage === "Arabic" ? "right" : "left",
						marginRight: chosenLanguage === "Arabic" ? "10px" : "",
					}}
				>
					<Option value='closest' style={{ fontSize: "0.75rem" }}>
						{t.closest}
					</Option>
					<Option value='price' style={{ fontSize: "0.75rem" }}>
						{t.cheapest}
					</Option>
				</StyledSelect>
			</SortWrapper>

			{/* Currency Dropdown */}
			<CurrencyWrapper
				style={{
					textAlign: chosenLanguage === "Arabic" ? "right" : "",
				}}
			>
				<StyledSelect
					value={currency}
					onChange={handleCurrencyChange}
					placeholder={t.currency}
				>
					<Option
						style={{
							textAlign: chosenLanguage === "Arabic" ? "right" : "",
						}}
						value='sar'
					>
						{t.sar}
					</Option>
					<Option
						style={{
							textAlign: chosenLanguage === "Arabic" ? "right" : "",
						}}
						value='usd'
					>
						{t.usd}
					</Option>
					<Option
						style={{
							textAlign: chosenLanguage === "Arabic" ? "right" : "",
						}}
						value='eur'
					>
						{t.eur}
					</Option>
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
	margin-bottom: 10px;

	@media (max-width: 768px) {
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
	font-size: 0.85rem !important;
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

	@media (max-width: 750px) {
		width: 170px; /* Adjusted width for smaller screens */
		font-size: 0.85rem !important;

		.ant-select-selector > span {
			font-size: 0.85rem !important;
		}
	}
`;
