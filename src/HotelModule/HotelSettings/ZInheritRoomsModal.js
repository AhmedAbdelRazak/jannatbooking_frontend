import React from "react";
import { Modal } from "antd";

const ZInheritRoomsModal = ({
	inheritModalVisible,
	setInheritModalVisible,
	baseFloor,
	setBaseFloor,
	applyInheritance,
}) => {
	return (
		<Modal
			title='Inherit Rooms Structure'
			open={inheritModalVisible}
			onOk={() => {
				applyInheritance(baseFloor);
				setInheritModalVisible(false);
			}}
			onCancel={() => setInheritModalVisible(false)}
		>
			<p>Based on which floor?</p>
			<input
				type='number'
				value={baseFloor}
				onChange={(e) => setBaseFloor(e.target.value)}
				placeholder='Enter floor number'
			/>
		</Modal>
	);
};

export default ZInheritRoomsModal;
