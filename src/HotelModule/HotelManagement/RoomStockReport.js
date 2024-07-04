import React, { useState, useMemo } from "react";
import { Table, Button, Select } from "antd";
import styled from "styled-components";
import moment from "moment";

const { Option } = Select;

export const RoomStockReport = ({ dayOverDayInventory, chosenLanguage }) => {
	const [selectedRoomTypes, setSelectedRoomTypes] = useState([]);
	const [showDanger, setShowDanger] = useState(false);
	const [selectedDates, setSelectedDates] = useState([]);

	const filteredData = useMemo(() => {
		return dayOverDayInventory.filter((item) => {
			const matchesType =
				selectedRoomTypes.length > 0
					? selectedRoomTypes.includes(item.room_type)
					: true;
			const isDanger = showDanger ? item.total_rooms_available <= 1 : true;
			const matchesDate =
				selectedDates.length > 0 ? selectedDates.includes(item.date) : true;
			return matchesType && isDanger && matchesDate;
		});
	}, [dayOverDayInventory, selectedRoomTypes, showDanger, selectedDates]);

	const roomTypes = useMemo(() => {
		return [...new Set(dayOverDayInventory.map((item) => item.room_type))];
	}, [dayOverDayInventory]);

	const dates = useMemo(() => {
		return [...new Set(dayOverDayInventory.map((item) => item.date))];
	}, [dayOverDayInventory]);

	const columns = [
		{ title: "Date", dataIndex: "date", key: "date" },
		{
			title: "Room Type",
			dataIndex: "room_type",
			key: "room_type",
			render: (type) => (
				<span style={{ textTransform: "capitalize", fontWeight: "bold" }}>
					{type}
				</span>
			),
		},

		{
			title: "Total Rooms",
			dataIndex: "total_rooms",
			key: "total_rooms",
		},
		{
			title: "Total Rooms Available",
			dataIndex: "total_rooms_available",
			key: "total_rooms_available",
			render: (text) => (
				<span
					style={{
						color: text <= 1 ? "white" : "inherit",
						backgroundColor: text <= 1 ? "darkred" : "inherit",
					}}
				>
					{text}
				</span>
			),
		},
		{
			title: "Total Rooms Reserved",
			dataIndex: "total_rooms_reserved",
			key: "total_rooms_reserved",
		},
		{
			title: "Total Rooms Occupied",
			dataIndex: "total_rooms_occupied",
			key: "total_rooms_occupied",
		},
	];

	const handleRoomTypeChange = (value) => {
		setSelectedRoomTypes(value);
		// Reset other filters to avoid confusion
		setShowDanger(false);
	};

	const handleDateFilterChange = (value) => {
		setSelectedDates(value);
		// Reset other filters to avoid confusion
		setShowDanger(false);
	};

	return (
		<RoomStockReportWrapper>
			<FiltersWrapper>
				<Select
					mode='multiple'
					placeholder={
						chosenLanguage === "Arabic"
							? "تصفية حسب نوع الغرفة"
							: "Filter by Room Type"
					}
					onChange={handleRoomTypeChange}
					style={{ width: 200, marginRight: 16, textTransform: "capitalize" }}
					allowClear
				>
					{roomTypes.map((roomType) => (
						<Option key={roomType} value={roomType}>
							{roomType}
						</Option>
					))}
				</Select>
				<Select
					mode='multiple'
					placeholder={
						chosenLanguage === "Arabic"
							? "تصفية حسب التاريخ"
							: "Filter By A Date"
					}
					onChange={handleDateFilterChange}
					style={{ width: 200, marginRight: 16, textTransform: "capitalize" }}
					allowClear
				>
					{dates.map((date) => (
						<Option key={date} value={date}>
							{moment(date).format("YYYY-MM-DD")}
						</Option>
					))}
				</Select>
				<Button
					danger
					onClick={() => setShowDanger(!showDanger)}
					style={{ fontSize: "1rem", fontWeight: "bold" }}
				>
					{chosenLanguage === "Arabic"
						? showDanger
							? "عرض الكل"
							: "في خطر"
						: showDanger
						  ? "Show All"
						  : "Danger"}
				</Button>
			</FiltersWrapper>
			<Table
				dataSource={filteredData}
				columns={columns}
				rowKey='id'
				scroll={{ y: 800 }}
				pagination={false}
				sticky
			/>
		</RoomStockReportWrapper>
	);
};

const RoomStockReportWrapper = styled.div`
	max-height: 1000px;
	overflow: auto;
`;

const FiltersWrapper = styled.div`
	margin-bottom: 16px;
	display: flex;
	flex-wrap: wrap;
	gap: 16px; // Add some space between filter elements
`;
