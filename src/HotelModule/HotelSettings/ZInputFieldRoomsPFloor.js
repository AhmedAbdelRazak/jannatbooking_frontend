import styled from "styled-components";

const ZInputFieldRoomsPFloor = ({
	Title,
	value,
	handleFloorRoomsCount,
	roomType,
}) => {
	return (
		<div className='col-md-1'>
			<InputFieldStyling className='form-group' style={{ marginTop: "10px" }}>
				<label
					htmlFor='name'
					style={{
						fontWeight: "bold",
						fontSize: "11px",
						textAlign: "center",
					}}
				>
					{Title}
				</label>
				<input
					type='number'
					value={value}
					onChange={(e) => handleFloorRoomsCount(roomType, e.target.value)}
					required
				/>
			</InputFieldStyling>
		</div>
	);
};

export default ZInputFieldRoomsPFloor;

const InputFieldStyling = styled.div`
	input[type="text"],
	input[type="email"],
	input[type="password"],
	input[type="date"],
	input[type="number"],
	select,
	textarea {
		display: block;
		width: 100%;
		padding: 0.5rem;
		font-size: 1rem;
		border: 1px solid #ccc;
	}
	input[type="text"]:focus,
	input[type="email"]:focus,
	input[type="password"]:focus,
	input[type="number"]:focus,
	input[type="date"]:focus,
	select:focus,
	textarea:focus,
	label:focus {
		outline: none;
		border: 1px solid var(--primaryColor);

		box-shadow: 5px 8px 3px 0px rgba(0, 0, 0, 0.3);
		transition: var(--mainTransition);
		font-weight: bold;
	}
`;
