import React, { useEffect, useState } from "react";
import styled from "styled-components";

const Tabs = ({ sections, onTabClick }) => {
	const [activeTab, setActiveTab] = useState("overview");

	// Observe sections and update the active tab based on scroll position
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setActiveTab(entry.target.id);
					}
				});
			},
			{ threshold: 0.6 }
		);

		// Observe each section using the passed `sections` prop
		sections.forEach(({ ref }) => {
			if (ref && ref.current) {
				observer.observe(ref.current);
			}
		});

		return () => observer.disconnect();
	}, [sections]);

	return (
		<TabsWrapper>
			{sections.map((section) => (
				<TabItem
					key={section.id}
					active={activeTab === section.id}
					onClick={() => onTabClick(section.id)}
				>
					{section.label}
				</TabItem>
			))}
		</TabsWrapper>
	);
};

export default Tabs;

const TabsWrapper = styled.div`
	display: flex;
	border-bottom: 2px solid #e0e0e0;
	background-color: #fff;
	position: sticky;
	top: -10px; /* Adjust for your layout */
	z-index: 10;
	margin-top: -20px;
	min-width: 1200px;
	justify-content: center;
	text-align: center;

	@media (max-width: 500px) {
		min-width: 430px;
	}
`;

const TabItem = styled.div`
	padding: 10px 20px;
	cursor: pointer;
	font-size: 1rem;
	color: ${(props) => (props.active ? "#0071c2" : "#333")};
	border-bottom: ${(props) => (props.active ? "3px solid #0071c2" : "none")};
	font-weight: ${(props) => (props.active ? "bold" : "normal")};
	font-weight: 500;

	&:hover {
		color: #0071c2;
	}

	@media (max-width: 700px) {
		font-size: 0.85rem;
		padding: 10px 12px;
	}
`;
