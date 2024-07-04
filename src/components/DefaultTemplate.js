import React from "react";
import styled from "styled-components";

const DefaultTemplate = () => {
	return (
		<DefaultTemplateWrapper>
			<div>Hello From DefaultTemplate</div>
		</DefaultTemplateWrapper>
	);
};

export default DefaultTemplate;

const DefaultTemplateWrapper = styled.div`
	min-height: 800px;
`;
