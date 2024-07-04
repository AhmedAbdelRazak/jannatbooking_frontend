import React from "react";
import styled from "styled-components";
import { Spin } from "antd";

const LoadingSpinner = () => (
	<SpinnerWrapper>
		<Spin size='large' />
	</SpinnerWrapper>
);

export default LoadingSpinner;

const SpinnerWrapper = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
`;
