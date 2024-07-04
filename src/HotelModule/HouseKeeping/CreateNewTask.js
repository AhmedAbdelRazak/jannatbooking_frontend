import React from "react";
import styled from "styled-components";
import { Form, Input, DatePicker, Select, Button } from "antd";
import { createNewHouseKeepingTask } from "../apiAdmin";
import { toast } from "react-toastify";

const { Option } = Select;

const CreateNewTask = ({
	hotelRooms,
	hotelDetails,
	chosenLanguage,
	houseKeepingStaff,
}) => {
	const [form] = Form.useForm();

	const submitNewTask = (values) => {
		const housekeeping = { ...values, hotelId: hotelDetails._id };
		createNewHouseKeepingTask(hotelDetails._id, housekeeping)
			.then((response) => {
				if (response.error) {
					console.error(
						"Error creating new housekeeping task:",
						response.error
					);
				} else {
					console.log("New housekeeping task created successfully:", response);
					toast.success("New House Keeping Task Was Successfully Created");

					form.resetFields();

					setTimeout(() => {
						window.location.reload(false);
					}, 1500);
				}
			})
			.catch((err) =>
				console.error("Error creating new housekeeping task:", err)
			);
	};

	return (
		<CreateNewTaskWrapper isArabic={chosenLanguage === "Arabic"}>
			<Form form={form} onFinish={submitNewTask} layout='vertical'>
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
					label={chosenLanguage === "Arabic" ? "الموظف المكلف" : "Assigned To"}
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
						{houseKeepingStaff &&
							houseKeepingStaff.map((staff) => (
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
					label={chosenLanguage === "Arabic" ? "تعليق للموظف" : "Task Comment"}
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

				<Form.Item>
					<Button type='primary' htmlType='submit'>
						{chosenLanguage === "Arabic" ? "إنشاء مهمة" : "Create Task"}
					</Button>
				</Form.Item>
			</Form>
		</CreateNewTaskWrapper>
	);
};

export default CreateNewTask;

const CreateNewTaskWrapper = styled.div`
	padding: 20px;
	background-color: white;
	border-radius: 5px;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	max-width: 800px;
	margin: 0 auto;
	text-align: ${(props) => (props.isArabic ? "right" : "")};
`;
