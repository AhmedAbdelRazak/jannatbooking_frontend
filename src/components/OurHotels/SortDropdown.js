import React from "react";
import styled from "styled-components";
import { Select } from "antd";
import { SortAscendingOutlined } from "@ant-design/icons";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import { useCartContext } from "../../cart_context";

const { Option } = Select;

const SortDropdown = ({ sortOption, setSortOption, currency, setCurrency }) => {
	const { chosenLanguage } = useCartContext();

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

	// Handlers
	const handleSortChange = (value) => {
		setSortOption(value);
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
		setCurrency(value);
		localStorage.setItem("selectedCurrency", value);
	};

	return (
		<DropdownRow
			isArabic={chosenLanguage === "Arabic"}
			dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
		>
			{/* Sort Dropdown */}
			<SortWrapper isArabic={chosenLanguage === "Arabic"}>
				<StyledSelect
					value={sortOption}
					onChange={handleSortChange}
					suffixIcon={<SortAscendingOutlined />}
					placeholder={t.sortBy}
					style={{
						direction: chosenLanguage === "Arabic" ? "rtl" : "ltr",
						textAlign: chosenLanguage === "Arabic" ? "right" : "left",
					}}
				>
					<Option
						value='closest'
						style={{
							direction: chosenLanguage === "Arabic" ? "rtl" : "ltr",
							textAlign: chosenLanguage === "Arabic" ? "right" : "left",
						}}
					>
						{t.closest}
					</Option>
					<Option
						value='price'
						style={{
							direction: chosenLanguage === "Arabic" ? "rtl" : "ltr",
							textAlign: chosenLanguage === "Arabic" ? "right" : "left",
						}}
					>
						{t.cheapest}
					</Option>
				</StyledSelect>
			</SortWrapper>

			{/* Currency Dropdown */}
			<CurrencyWrapper
				isArabic={chosenLanguage === "Arabic"}
				style={{
					direction: chosenLanguage === "Arabic" ? "rtl" : "ltr",
					textAlign: chosenLanguage === "Arabic" ? "right" : "left",
				}}
			>
				<StyledSelect
					value={currency}
					onChange={handleCurrencyChange}
					placeholder={t.currency}
					style={{
						direction: chosenLanguage === "Arabic" ? "rtl" : "ltr",
						textAlign: chosenLanguage === "Arabic" ? "right" : "left",
					}}
				>
					<Option
						value='sar'
						style={{
							direction: chosenLanguage === "Arabic" ? "rtl" : "ltr",
							textAlign: chosenLanguage === "Arabic" ? "right" : "left",
						}}
					>
						{t.sar}
					</Option>
					<Option
						value='usd'
						style={{
							direction: chosenLanguage === "Arabic" ? "rtl" : "ltr",
							textAlign: chosenLanguage === "Arabic" ? "right" : "left",
						}}
					>
						{t.usd}
					</Option>
					<Option
						value='eur'
						style={{
							direction: chosenLanguage === "Arabic" ? "rtl" : "ltr",
							textAlign: chosenLanguage === "Arabic" ? "right" : "left",
						}}
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
	justify-content: ${({ isArabic }) => (isArabic ? "flex-end" : "flex-start")};
	gap: 20px;
	margin-bottom: 10px;

	@media (max-width: 768px) {
		align-items: flex-start;
		gap: 10px;
		margin-left: ${({ isArabic }) => (isArabic ? "" : "30px")};
		margin-left: ${({ isArabic }) => (isArabic ? "30px" : "")};
	}
`;

const SortWrapper = styled.div`
	text-align: ${({ isArabic }) => (isArabic ? "right" : "left")};

	@media (max-width: 768px) {
		text-align: ${({ isArabic }) => (isArabic ? "right" : "left")};
	}
`;

const CurrencyWrapper = styled.div`
	text-align: ${({ isArabic }) => (isArabic ? "right" : "left")};

	@media (max-width: 768px) {
		text-align: ${({ isArabic }) => (isArabic ? "right" : "left")};
	}
`;

const StyledSelect = styled(Select)`
	width: 250px;
	font-size: 0.85rem !important;

	.ant-select-selector {
		display: flex;
		align-items: center;
		height: 40px;
		padding: 0 15px;
		text-align: ${({ isArabic }) => (isArabic ? "right" : "left")};
	}

	.ant-select-selection-item {
		font-size: 14px;
		text-align: ${({ isArabic }) => (isArabic ? "right" : "left")};
	}

	.ant-select-dropdown {
		min-width: 250px;
		text-align: ${({ isArabic }) => (isArabic ? "right" : "left")};
	}

	@media (max-width: 750px) {
		width: 170px;
		font-size: 0.85rem !important;

		.ant-select-selector > span {
			font-size: 0.85rem !important;
		}
	}
`;
