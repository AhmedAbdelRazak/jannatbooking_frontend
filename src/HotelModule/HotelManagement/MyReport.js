import React from "react";
import styled from "styled-components";
import { Table } from "antd";
import CountUp from "react-countup";

const MyReport = ({ reservations, chosenLanguage, fromTab, formattedDate }) => {
	const aggregateData = (reservations) => {
		const aggregation =
			reservations &&
			reservations.reduce((acc, reservation) => {
				const source = reservation.booking_source || "Unknown";
				if (!acc[source]) {
					acc[source] = { count: 0, total_amount: 0 };
				}
				acc[source].count += 1;
				acc[source].total_amount += reservation.total_amount;
				return acc;
			}, {});

		return Object.entries(aggregation).map(([source, data]) => ({
			source,
			...data,
		}));
	};

	const getMaxAmount = (data) => {
		return Math.max(...data.map((item) => item.total_amount));
	};

	const sourceToColorMap = (source) => {
		const baseColors = {
			"BOOKING.COM": "#edb67f", // A shade of orange-brown
			EXPEDIA: "#edaf6f", // A shade of dark peach
			AGODA: "#eda46f", // A shade of muted orange
			MANUAL: "#ed917f", // A shade of salmon
			// ...add more sources and shades as needed
		};
		return baseColors[source.toUpperCase()] || "#edb67f"; // Default color if not matched
	};

	const columns = [
		{
			title: chosenLanguage === "Arabic" ? "مصدر الحجز" : "Booking Source",
			dataIndex: "source",
			key: "source",
			render: (text) => (
				<span style={{ color: sourceToColorMap(text), fontWeight: "bold" }}>
					{text.toUpperCase()}
				</span>
			),
		},
		{
			title:
				chosenLanguage === "Arabic" ? "عدد الحجوزات" : "Reservations Count",
			dataIndex: "count",
			key: "count",
		},
		{
			title: chosenLanguage === "Arabic" ? "المبلغ الإجمالي" : "Total Amount",
			dataIndex: "total_amount",
			key: "total_amount",
			render: (amount, record, index) => {
				const maxAmount = getMaxAmount(aggregatedData); // Make sure you have this function implemented to get the max amount
				const barWidth = (amount / maxAmount) * 100;
				const barColor = sourceToColorMap(record.source);
				return (
					<div
						style={{ position: "relative", width: "100%", textAlign: "left" }}
					>
						<div
							style={{
								display: "inline-block",
								width: `${barWidth}%`,
								backgroundColor: barColor,
								height: "10px",
							}}
						/>
						<span style={{ marginRight: "10px", fontWeight: "bold" }}>
							{`${amount.toLocaleString(undefined, {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})} ${chosenLanguage === "Arabic" ? "ريال سعودي" : "SAR"}`}
						</span>
					</div>
				);
			},
		},
	];

	const aggregatedData = aggregateData(reservations);

	// After fetching the data...
	let today;
	if (fromTab === "Today") {
		today = new Date();
	} else if (fromTab === "Yesterday") {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		today = yesterday;
	}

	const aggregatedToday = aggregateData(
		reservations &&
			reservations.filter(
				(reservation) =>
					new Date(reservation.checkin_date).toDateString() ===
					today.toDateString()
			)
	);

	const aggregatedBookedToday = aggregateData(
		reservations &&
			reservations.filter(
				(reservation) =>
					new Date(reservation.booked_at).toDateString() ===
					today.toDateString()
			)
	);

	const summaryObject = {
		checkedInToday: {
			total_amount:
				aggregatedToday &&
				aggregatedToday.reduce((sum, item) => sum + item.total_amount, 0),
			total_reservations_count:
				aggregatedToday &&
				aggregatedToday.reduce((sum, item) => sum + item.count, 0),
		},
		booked_at_today: {
			total_amount:
				aggregatedBookedToday &&
				aggregatedBookedToday.reduce((sum, item) => sum + item.total_amount, 0),
			total_reservations_count:
				aggregatedBookedToday &&
				aggregatedBookedToday.reduce((sum, item) => sum + item.count, 0),
		},
	};

	const AggregatedTable = ({ data, title, theDay }) => {
		const dataSource = data.map((item, index) => ({
			key: index,
			...item,
		}));

		return (
			<div>
				<h3>{title}</h3>
				<div className='row px-5 py-3'>
					<div className='col-md-6 text-center my-2'>
						<div className='card' style={{ background: "#4f0909" }}>
							<div className='p-1'>
								<h5
									style={{
										fontWeight: "bolder",
										color: "white",
										fontSize: "1.2rem",
									}}
								>
									{fromTab === "Today"
										? "Reservation Count (Today)"
										: "Reservation Count (Yesterday)"}
								</h5>
								<CountUp
									style={{
										color: "white",
										fontSize: "1.5rem",
										fontWeight: "bolder",
									}}
									duration='4'
									delay={0.5}
									end={
										theDay === "CheckedIn"
											? summaryObject.checkedInToday.total_reservations_count
											: summaryObject.booked_at_today.total_reservations_count
									}
									separator=','
								/>
							</div>
						</div>
					</div>
					<div className='col-md-6 text-center my-2'>
						<div className='card' style={{ background: "#005ab3" }}>
							<div className='p-1'>
								<h5
									style={{
										color: "white",
										fontSize: "1.2rem",
										fontWeight: "bolder",
									}}
								>
									{fromTab === "Today"
										? "Total Amount (Today)"
										: "Total Amount (Yesterday)"}
								</h5>
								<CountUp
									style={{
										color: "white",
										fontSize: "1.5rem",
										fontWeight: "bolder",
									}}
									duration='4'
									delay={1.5}
									end={
										theDay === "CheckedIn"
											? summaryObject.checkedInToday.total_amount
											: summaryObject.booked_at_today.total_amount
									}
									separator=','
								/>{" "}
								<span
									style={{
										color: "white",
										fontSize: "1.5rem",
										fontWeight: "bolder",
									}}
								>
									{chosenLanguage === "Arabic" ? "ريال سعودي" : "SAR"}
								</span>
							</div>
						</div>
					</div>
				</div>
				<Table columns={columns} dataSource={dataSource} pagination={false} />
			</div>
		);
	};

	return (
		<MyReportWrapper>
			<div className='container'>
				<AggregatedTable
					data={aggregatedToday}
					theDay='CheckedIn'
					title={
						fromTab === "Today"
							? chosenLanguage === "Arabic"
								? "ملخص تسجيلات الدخول اليوم"
								: "Today's Check-ins Summary"
							: chosenLanguage === "Arabic"
							  ? "ملخص تسجيلات الدخول الأمس"
							  : "Yesterday's Check-ins Summary"
					}
				/>

				<div className='my-4'>
					<AggregatedTable
						data={aggregatedBookedToday}
						theDay='BookedAt'
						title={
							fromTab === "Today"
								? chosenLanguage === "Arabic"
									? "العملاء الذين حجزوا اليوم"
									: "Today's Bookings Summary"
								: chosenLanguage === "Arabic"
								  ? "ملخص حجوزات الأمس"
								  : "Yesterday's Bookings Summary"
						}
					/>
				</div>
			</div>
		</MyReportWrapper>
	);
};

export default MyReport;

const MyReportWrapper = styled.div``;
