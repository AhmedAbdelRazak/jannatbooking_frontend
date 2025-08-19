import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { useParams } from "react-router-dom";

const SingleReservationInvoice = () => {
	const { confirmation } = useParams();
	const [data, setData] = useState({ reservation: null, hotel: null });
	const [loading, setLoading] = useState(true);
	const [err, setErr] = useState("");

	// Fetch reservation once
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setLoading(true);
				setErr("");
				const res = await axios.get(
					`${process.env.REACT_APP_API_URL}/single-reservations/${confirmation}`
				);
				if (!mounted) return;
				setData({ reservation: res.data.reservation, hotel: res.data.hotel });
			} catch (e) {
				if (!mounted) return;
				setErr(
					e?.response?.data?.message ||
						"Failed to load reservation. Please try again."
				);
			} finally {
				if (mounted) setLoading(false);
			}
		})();

		return () => {
			mounted = false;
		};
	}, [confirmation]);

	// Helpers
	const safeNumber = (v) => {
		const n = Number(v);
		return Number.isFinite(n) ? n : 0;
	};
	const calculateNights = (checkin, checkout) => {
		if (!checkin || !checkout) return 1;
		const start = new Date(checkin);
		const end = new Date(checkout);
		const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
		return nights < 1 ? 1 : nights;
	};

	const reservation = data.reservation;
	const hotel = data.hotel;

	const bookingDate = useMemo(() => {
		if (!reservation?.createdAt) return "N/A";
		return new Date(reservation.createdAt).toLocaleDateString();
	}, [reservation]);

	const nights = useMemo(() => {
		return calculateNights(
			reservation?.checkin_date,
			reservation?.checkout_date
		);
	}, [reservation]);

	const totalAmount = safeNumber(reservation?.total_amount);
	const paidAmount = safeNumber(reservation?.paid_amount);
	const onsitePaid = safeNumber(
		reservation?.payment_details?.onsite_paid_amount
	);
	const hasCardNumber = !!reservation?.customer_details?.cardNumber; // NOTE: this is sanitized out by API; we treat public page as no card
	const isNotPaid =
		reservation?.payment?.toLowerCase?.() === "not paid" || !hasCardNumber;
	const isFullyPaid = totalAmount.toFixed(0) === paidAmount.toFixed(0);
	const finalDeposit = hasCardNumber ? paidAmount : 0;
	const depositPercentage =
		hasCardNumber && totalAmount > 0
			? ((finalDeposit / totalAmount) * 100).toFixed(0)
			: 0;

	const supplierName =
		reservation?.supplierData?.supplierName || hotel?.suppliedBy || "N/A";
	const supplierBookingNo =
		reservation?.supplierData?.suppliedBookingNo ||
		reservation?.confirmation_number ||
		"N/A";

	const handleDownloadPdf = async () => {
		try {
			const url = `${process.env.REACT_APP_API_URL}/single-reservations/${confirmation}/pdf`;
			const res = await axios.get(url, { responseType: "blob" });
			const blob = new Blob([res.data], { type: "application/pdf" });
			const dlUrl = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = dlUrl;
			a.download = `Jannat_Invoice_${confirmation}.pdf`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(dlUrl);
		} catch (e) {
			console.error(e);
			alert("Could not download PDF. Please try again.");
		}
	};

	if (loading) {
		return (
			<SingleReservationInvoiceWrapper>
				<div className='loading'>Loading reservation…</div>
			</SingleReservationInvoiceWrapper>
		);
	}

	if (err || !reservation) {
		return (
			<SingleReservationInvoiceWrapper>
				<div className='error'>{err || "Reservation not found."}</div>
			</SingleReservationInvoiceWrapper>
		);
	}

	return (
		<SingleReservationInvoiceWrapper>
			{/* Top actions (hidden in print) */}
			<div className='actions no-print'>
				<button onClick={handleDownloadPdf} className='btn btn-primary'>
					Download PDF
				</button>
			</div>

			{/* Header */}
			<div className='header1'>
				<div className='left'></div>
				<div className='center logo'>
					JANNAT <span>Booking.com</span>
				</div>
				<div className='right'>Booking Receipt</div>
			</div>
			<div className='header2'>
				<div className='hotel-name'>Hotel: {hotel?.hotelName || "N/A"}</div>
			</div>

			<div className='header3'>
				<div className='booking-info'>
					<div>
						<strong>Booking No:</strong> {reservation.confirmation_number}{" "}
						{reservation.confirmation_number === supplierBookingNo
							? null
							: `/ ${supplierBookingNo}`}
					</div>
					<div>
						<strong>Booking Date:</strong> {bookingDate}
					</div>
				</div>
			</div>

			{/* Guest & Payment Details */}
			<div className='info-boxes'>
				<div className='info-box'>
					<strong>Guest Name</strong>
					<div>{reservation?.customer_details?.name || "N/A"}</div>
					<div>{reservation?.customer_details?.nationality || "N/A"}</div>
				</div>
				<div className='info-box'>
					<strong>
						{onsitePaid > 0
							? "Paid Offline"
							: isFullyPaid
								? "Paid Amount"
								: isNotPaid
									? "Not Paid"
									: `${depositPercentage}% Deposit`}
					</strong>
					<div>
						{onsitePaid > 0 ? (
							<>{Number((onsitePaid / totalAmount) * 100).toFixed(2)}%</>
						) : isFullyPaid ? (
							`${paidAmount.toFixed(2)} SAR`
						) : isNotPaid ? (
							"Not Paid"
						) : (
							`${depositPercentage}% Deposit`
						)}
					</div>
				</div>
			</div>

			{/* Supplier Info */}
			<div className='supplier-info mt-2'>
				<div className='editable-supplier'>
					<strong>Supplied By:</strong> {supplierName}
				</div>
				<div>
					<strong>Supplier Booking No:</strong> {supplierBookingNo}
				</div>
			</div>

			{/* Reservation Details */}
			<table className='details-table'>
				<thead>
					<tr>
						<th>Check In</th>
						<th>Check Out</th>
						<th>Booking Status</th>
						<th>Guests</th>
						<th>Booking Source</th>
						<th>Payment Method</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>{new Date(reservation.checkin_date).toLocaleDateString()}</td>
						<td>{new Date(reservation.checkout_date).toLocaleDateString()}</td>
						<td>{reservation.reservation_status || "Confirmed"}</td>
						<td>{reservation.total_guests}</td>
						<td>{reservation.booking_source || "Jannatbooking.com"}</td>
						<td>
							{isFullyPaid
								? "Paid in Full"
								: isNotPaid
									? "Not Paid"
									: `${depositPercentage}% Deposit`}
						</td>
					</tr>
				</tbody>
			</table>

			{/* Room Details */}
			<table className='room-details-table'>
				<thead>
					<tr>
						<th>Hotel</th>
						<th>Room Type</th>
						<th>Qty</th>
						<th>Extras</th>
						<th>Nights</th>
						<th>Rate</th>
						<th>Total</th>
					</tr>
				</thead>
				<tbody>
					{(reservation.pickedRoomsType || []).map((room, index) => {
						const chosenPrice = safeNumber(room.chosenPrice);
						const firstDay = room.pricingByDay && room.pricingByDay[0];
						const rootPrice = firstDay ? safeNumber(firstDay.rootPrice) : 0;
						const rate = chosenPrice > 0 ? chosenPrice : rootPrice;
						const totalPrice = rate * safeNumber(room.count) * nights;

						return (
							<tr key={index}>
								<td>{hotel?.hotelName || "N/A"}</td>
								<td>{room.displayName || "N/A"}</td>
								<td>{room.count}</td>
								<td>N/T</td>
								<td>{nights}</td>
								<td>{rate > 0 ? `${rate} SAR` : "N/A"}</td>
								<td>
									{totalPrice > 0 ? `${totalPrice.toFixed(2)} SAR` : "N/A"}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>

			{/* Payment Summary */}
			<div className='summary'>
				<div>
					<strong>Net Accommodation Charge:</strong> {totalAmount.toFixed(2)}{" "}
					SAR
				</div>
				{isFullyPaid ? (
					<div>
						<strong>Paid Amount:</strong> {paidAmount.toFixed(2)} SAR
					</div>
				) : onsitePaid > 0 ? (
					<div>
						<strong>Paid Amount Onsite:</strong> {onsitePaid.toFixed(2)} SAR
					</div>
				) : isNotPaid ? (
					<div>
						<strong>Payment Status:</strong> Not Paid
					</div>
				) : (
					<div>
						<strong>Final Deposit ({depositPercentage}% of Total):</strong>{" "}
						{finalDeposit.toFixed(2)} SAR
					</div>
				)}
				<div>
					<strong>Total To Be Collected:</strong>{" "}
					{onsitePaid > 0
						? (Number(totalAmount) - Number(onsitePaid)).toFixed(2)
						: (Number(totalAmount) - paidAmount).toFixed(2)}{" "}
					SAR
				</div>
			</div>

			{/* Footer */}
			<div className='footer'>
				Many Thanks for staying with us at{" "}
				<strong>{hotel?.hotelName || "N/A"}</strong> Hotel.
				<br />
				For better rates next time, please check{" "}
				<a href='https://jannatbooking.com' target='_blank' rel='noreferrer'>
					jannatbooking.com
				</a>
			</div>
		</SingleReservationInvoiceWrapper>
	);
};

export default SingleReservationInvoice;

const SingleReservationInvoiceWrapper = styled.div`
	font-family: Arial, Helvetica, sans-serif;
	padding: 20px;
	border: 1px solid #ccc;
	max-width: 800px;
	margin: 20px auto;
	text-transform: capitalize;

	.actions {
		display: flex;
		gap: 10px;
		justify-content: flex-end;
		margin-bottom: 15px;
	}

	.loading,
	.error {
		text-align: center;
		padding: 40px 0;
	}

	/* Header Styling */
	.header1 {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 0;
		background-color: #d9d9d9;
	}
	.header1 .left {
		flex: 1;
	}
	.header1 .center {
		flex: 1;
		text-align: center;
	}
	.header1 .right {
		color: #777;
		flex: 1;
		text-align: right;
		font-size: 20px;
		font-weight: bold;
		padding-right: 7px;
		align-self: flex-end;
		padding-top: 35px;
	}

	.header2,
	.header3 {
		text-align: center;
		padding: 8px 0;
	}
	.header2 {
		background-color: rgb(243, 195, 146);
	}
	.header3 {
		background-color: #ccc;
		margin-top: 10px;
	}

	.logo {
		font-size: 32px;
		font-weight: bold;
		color: #777;
	}
	.logo span {
		font-size: 14px;
		color: rgb(241, 131, 21);
	}

	.info-boxes {
		display: flex;
		justify-content: space-between;
		margin-top: 20px;
	}
	.info-box {
		border: 1px solid #000;
		padding: 10px;
		width: 48%;
		text-align: center;
	}
	.supplier-info .editable-supplier {
		font-style: italic;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 20px;
	}
	.room-details-table td {
		font-size: 11px;
	}
	th,
	td {
		border: 1px solid #000;
		padding: 8px;
		text-align: center;
	}
	td {
		font-size: 11.5px;
	}
	th {
		background-color: rgb(243, 195, 146);
		color: #fff;
	}

	.summary {
		border: 1px solid #000;
		padding: 10px;
		text-align: right;
	}
	.footer {
		text-align: center;
		margin-top: 30px;
	}

	a {
		color: #007bff;
		text-decoration: none;
	}

	/* Print styles: hide buttons; ensure page size fits A4 nicely */
	@media print {
		.no-print {
			display: none !important;
		}
		body {
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}
		@page {
			size: A4;
			margin: 12mm;
		}
	}
`;
