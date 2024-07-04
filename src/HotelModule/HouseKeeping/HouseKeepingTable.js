import React, { useState } from "react";
import styled from "styled-components";
import { Table, Pagination } from "antd";
import moment from "moment";
import { EditOutlined } from "@ant-design/icons";
import { Modal, Select, Form, notification, Input, DatePicker } from "antd";
import { updatingHouseKeepingTask } from "../apiAdmin";

const { Option } = Select;

const HouseKeepingTable = ({
	houseKeepingTasks,
	totalTasksCount,
	handlePageChange,
	currentPage,
	recordsPerPage,
	chosenLanguage,
	houseKeepingStaff,
	hotelRooms,
}) => {
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [selectedTask, setSelectedTask] = useState(null);
	const [form] = Form.useForm();

	const columns = [
		{
			title: chosenLanguage === "Arabic" ? "التاريخ" : "Task Date",
			dataIndex: "taskDate",
			key: "taskDate",
			render: (taskDate) => moment(taskDate).format("dddd, DD/MM/YYYY"),
		},
		{
			title:
				chosenLanguage === "Arabic" ? "رقم التأكيد" : "Confirmation Number",
			dataIndex: "confirmation_number",
			key: "confirmation_number",
		},
		{
			title: chosenLanguage === "Arabic" ? "التعليق" : "Task Comment",
			dataIndex: "task_comment",
			key: "task_comment",
		},
		{
			title: chosenLanguage === "Arabic" ? "الحالة" : "Task Status",
			dataIndex: "task_status",
			key: "task_status",
			render: (task_status) => {
				let style = {};
				switch (task_status) {
					case "unfinished":
						style = {
							background: "red",
							color: "white",
							padding: "4px",
							textAlign: "center",
						};
						break;
					case "finished":
						style = {
							background: "darkgreen",
							color: "white",
							padding: "4px",
							textAlign: "center",
						};
						break;
					default:
						style = { padding: "4px", textAlign: "center" };
				}
				return <div style={style}>{task_status}</div>;
			},
		},
		{
			title: chosenLanguage === "Arabic" ? "تم التنظيف بواسطة" : "Cleaned By",
			dataIndex: "cleanedBy",
			key: "cleanedBy",
			render: (cleanedBy) =>
				cleanedBy
					? cleanedBy.name
					: chosenLanguage === "Arabic"
					  ? "لم يتم التنظيف"
					  : "Not Cleaned",
		},
		{
			title: chosenLanguage === "Arabic" ? "الموظف المكلف" : "Assigned To",
			dataIndex: "assignedTo",
			key: "assignedTo",
			render: (assignedTo) =>
				assignedTo
					? assignedTo.name
					: chosenLanguage === "Arabic"
					  ? "لم يتم التكليف"
					  : "Not Assigned",
		},
		{
			title: chosenLanguage === "Arabic" ? "رقم الغرفة" : "Room Number",
			dataIndex: "rooms",
			key: "room_number",
			render: (rooms) => rooms.map((room) => room.room_number).join(", "),
		},
		{
			title: chosenLanguage === "Arabic" ? "الطابق" : "Floor",
			dataIndex: "rooms",
			key: "floor",
			render: (rooms) => rooms.map((room) => room.floor).join(", "),
		},
		{
			title: chosenLanguage === "Arabic" ? "نوع الغرفة" : "Room Type",
			dataIndex: "rooms",
			key: "room_type",
			render: (rooms) => rooms.map((room) => room.room_type).join(", "),
		},
		{
			title: "Actions",
			key: "actions",
			render: (text, record) => (
				<EditOutlined onClick={() => showModal(record)} />
			),
		},
	];

	const showModal = (record) => {
		setSelectedTask(record);
		form.setFieldsValue({
			taskDate: moment(record.taskDate),
			assignedTo: record.assignedTo?._id,
			task_status: record.task_status,
			task_comment: record.task_comment,
			rooms: record.rooms.map((room) => room._id),
		});
		setIsModalVisible(true);
	};

	const handleOk = () => {
		form
			.validateFields()
			.then((values) => {
				updatingHouseKeepingTask(selectedTask._id, values)
					.then((response) => {
						if (response.error) {
							notification.error({
								message: "Update Failed",
								description: response.error,
							});
						} else {
							notification.success({
								message: "Update Successful",
								description: "The task has been updated.",
							});
							setIsModalVisible(false);
							// Refresh the data or update the state to reflect the changes
						}
					})
					.catch((err) => {
						notification.error({
							message: "Update Failed",
							description: "An error occurred while updating the task.",
						});
					});
			})
			.catch((info) => {
				console.log("Validate Failed:", info);
			});
	};

	const handleCancel = () => {
		setIsModalVisible(false);
	};

	return (
		<HouseKeepingTableWrapper isArabic={chosenLanguage === "Arabic"}>
			<Modal
				title='Edit Task'
				visible={isModalVisible}
				onOk={handleOk}
				onCancel={handleCancel}
			>
				<Form form={form} layout='vertical' onFinish={handleOk}>
					<Form.Item
						name='taskDate'
						label={chosenLanguage === "Arabic" ? "تاريخ التكليف" : "Task Date"}
						rules={[
							{
								required: true,
								message:
									chosenLanguage === "Arabic"
										? "يرجى اختيار تاريخ المهمة"
										: "Please select a task date",
							},
						]}
					>
						<DatePicker className='w-100' />
					</Form.Item>

					<Form.Item
						name='assignedTo'
						label={
							chosenLanguage === "Arabic" ? "الموظف المكلف" : "Assigned To"
						}
						rules={[
							{
								required: true,
								message:
									chosenLanguage === "Arabic"
										? "يرجى اختيار الموظف المكلف"
										: "Please select the assigned staff",
							},
						]}
					>
						<Select>
							{houseKeepingStaff.map((staff) => (
								<Option key={staff._id} value={staff._id}>
									{staff.name}
								</Option>
							))}
						</Select>
					</Form.Item>

					<Form.Item
						name='task_status'
						label={chosenLanguage === "Arabic" ? "الحالة" : "Task Status"}
						rules={[
							{
								required: true,
								message:
									chosenLanguage === "Arabic"
										? "يرجى اختيار حالة"
										: "Please select a task status",
							},
						]}
					>
						<Select>
							<Option value='unfinished'>
								{chosenLanguage === "Arabic" ? "غير منتهية" : "Unfinished"}
							</Option>
							<Option value='finished'>
								{chosenLanguage === "Arabic" ? "منتهية" : "Finished"}
							</Option>
						</Select>
					</Form.Item>

					<Form.Item
						name='task_comment'
						label={
							chosenLanguage === "Arabic" ? "تعليق للموظف" : "Task Comment"
						}
					>
						<Input.TextArea />
					</Form.Item>

					<Form.Item
						name='rooms'
						label={chosenLanguage === "Arabic" ? "الغرف" : "Rooms"}
						rules={[
							{
								required: true,
								message:
									chosenLanguage === "Arabic"
										? "يرجى اختيار الغرف"
										: "Please select rooms",
							},
						]}
					>
						<Select mode='multiple'>
							{hotelRooms.map((room) => (
								<Option key={room._id} value={room._id}>
									{room.room_number}
								</Option>
							))}
						</Select>
					</Form.Item>
				</Form>
			</Modal>
			<Table
				columns={columns}
				dataSource={houseKeepingTasks}
				rowKey='_id'
				pagination={false}
				scroll={{ y: 1000 }}
			/>
			<div
				className='my-3'
				onClick={() => window.scrollTo({ top: 20, behavior: "smooth" })}
			>
				<Pagination
					current={currentPage}
					pageSize={recordsPerPage}
					total={totalTasksCount}
					onChange={handlePageChange}
				/>
			</div>
		</HouseKeepingTableWrapper>
	);
};

export default HouseKeepingTable;

const HouseKeepingTableWrapper = styled.div`
	text-align: ${(props) => (props.isArabic ? "right" : "")};
	margin-top: 20px;

	td,
	tr,
	tbody {
		text-transform: capitalize !important;
	}

	.table thead th {
		position: sticky;
		top: 0;
		z-index: 10;
		background-color: white;
	}

	.table {
		border-collapse: collapse;
	}
`;
