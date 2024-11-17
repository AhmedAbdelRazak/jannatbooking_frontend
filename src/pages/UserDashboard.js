import React from "react";
import styled from "styled-components";
import DashboardContent from "../components/CustomerDashboard/DashboardContent";

const UserDashboard = () => {
	return (
		<UserDashboardWrapper>
			<DashboardContent />
		</UserDashboardWrapper>
	);
};

export default UserDashboard;

const UserDashboardWrapper = styled.div`
	min-height: 800px;
`;
