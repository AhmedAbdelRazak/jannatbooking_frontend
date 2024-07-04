import React, { useState } from "react";
import { Modal } from "antd";
import { toast } from "react-toastify";

const PasscodeModal = ({ setModalVisiblePasscode, modalVisiblePasscode }) => {
	const [passcode, setPasscode] = useState("");

	return (
		<Modal
			title='Pass code'
			open={modalVisiblePasscode}
			onOk={() => {
				if (passcode === process.env.REACT_APP_PASSCODE) {
					// Get current boss status from local storage
					const currentIsBoss = localStorage.getItem("boss") === "true";

					// Toggle the boss status
					const newIsBossStatus = !currentIsBoss;

					// Set the new boss status in local storage
					localStorage.setItem("boss", newIsBossStatus.toString());

					// Show a success toast with the new status
					toast.success(
						newIsBossStatus
							? "Boss mode activated. Now, you can see more!"
							: "Boss mode deactivated."
					);

					// Close the modal after a delay to allow the toast to be read
					setTimeout(() => {
						setModalVisiblePasscode(false);
					}, 500); // Adjust this delay as needed
				} else {
					// Optionally, handle incorrect passcode case
					setModalVisiblePasscode(false);
				}
			}}
			onCancel={() => setModalVisiblePasscode(false)}
		>
			<input
				type='password'
				className='form-control'
				value={passcode}
				onChange={(e) => setPasscode(e.target.value)}
				placeholder='Password'
			/>
		</Modal>
	);
};

export default PasscodeModal;
