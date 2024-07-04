// eslint-disable-next-line
import React, { useState } from "react";
import styled from "styled-components";
import { Redirect, Link } from "react-router-dom";
import {
	AreaChartOutlined,
	BankTwoTone,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
	PieChartOutlined,
	SettingOutlined,
	ImportOutlined,
	CustomerServiceOutlined,
	CreditCardOutlined,
	DollarCircleOutlined,
	ShopOutlined,
	TeamOutlined,
} from "@ant-design/icons";
import { Button, Menu } from "antd";
import LastAddedLogoImage from "./LastAddedLogoImage";
import { useCartContext } from "../../cart_context";
import { signout } from "../../auth";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

function getItem(label, key, icon, children, type, className) {
	return {
		key,
		icon,
		children,
		label,
		type,
		className,
	};
}

const handleSignout = (history) => {
	signout(() => {
		history.push("/");
	});
};

const items = [
	getItem(
		<div className='logoClass'></div>,
		"StoreLogo",
		<>
			<LastAddedLogoImage />
		</>
	),
	getItem(
		<div className='logoClass '></div>,
		"StoreLogo",
		<div
			className='logoClass no-background'
			style={{
				width: "100%",
			}}
		>
			<hr />
		</div>
	),
	getItem(
		<Link to='/hotel-management/dashboard'>Admin Dashboard</Link>,
		"sub1",
		<PieChartOutlined />
	),
	getItem(
		<Link to='/hotel-management/reservation-history'>Reservations</Link>,
		"sub2",
		<AreaChartOutlined />
	),
	getItem(
		<Link to='/hotel-management/new-reservation'>Make A New Reservation</Link>,
		"sub3",
		<ShopOutlined />
	),
	getItem(<Link to='#'>Hotel Reports</Link>, "sub4", <AreaChartOutlined />),

	getItem(
		<Link to='/hotel-management/settings'>Hotel Settings</Link>,
		"sub6",
		<SettingOutlined />
	),

	getItem(
		<Link to='/hotel-management/house-keeping'>House Keeping</Link>,
		"sub7",
		<BankTwoTone />
	),

	getItem(
		<Link to='/hotel-management/staff'>Hotel Staff</Link>,
		"sub8",
		<>
			<TeamOutlined />
		</>
	),

	getItem(
		<Link to='#'>Hotel Website Builder</Link>,
		"sub10",
		<>
			<DollarCircleOutlined />
		</>
	),

	getItem(
		<div className='margin-divider'></div>,
		"divider1",
		null,
		null,
		"divider"
	),
	getItem(
		"Inbound Management",
		"sub13",
		<ImportOutlined />,
		null,
		null,
		"black-bg"
	),
	getItem("CRM", "sub14", <CustomerServiceOutlined />, null, null, "black-bg"),
	getItem("POS & Products", "sub15", <ShopOutlined />, null, null, "black-bg"),
	getItem(
		"Financials",
		"sub16",
		<DollarCircleOutlined />,
		null,
		null,
		"black-bg"
	),
	getItem(
		"Employee Accounts",
		"sub17",
		<TeamOutlined />,
		null,
		null,
		"black-bg"
	),
	getItem(
		<div className='margin-divider'></div>,
		"divider2",
		null,
		null,
		"divider2"
	),
	getItem(
		<Link to='/hotel-management-payment'>Payment</Link>,
		"sub18",
		<CreditCardOutlined />,
		null,
		null,
		"red-bg"
	),
	getItem(
		<div style={{ fontWeight: "bold", textDecoration: "underline" }}>
			Signout
		</div>,
		"signout", // The key used in the Menu's onClick handler
		<CreditCardOutlined />,
		null,
		null,
		"reddish-bg"
	),

	// getItem("Option 3", "4", <ContainerOutlined />),
];

const AdminNavbar = ({
	fromPage,
	setAdminMenuStatus,
	collapsed,
	setCollapsed,
}) => {
	const [clickedOn, setClickedOn] = useState(false);
	const { chosenLanguage } = useCartContext();

	const toggleCollapsed = () => {
		setCollapsed(!collapsed);
		setAdminMenuStatus(!collapsed);
	};

	const history = useHistory();

	return (
		<AdminNavbarWrapper
			show={collapsed}
			show2={clickedOn}
			style={{
				width: 285,
			}}
			dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
		>
			<Button
				type='primary'
				onClick={toggleCollapsed}
				style={{
					marginBottom: 8,
					textAlign: "center",
					marginLeft: chosenLanguage === "Arabic" ? 200 : 5,
					marginTop: chosenLanguage === "Arabic" ? 10 : 10,
				}}
			>
				{collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
			</Button>
			<Menu
				dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
				defaultSelectedKeys={
					fromPage === "AdminDasboard"
						? "sub1"
						: fromPage === "Reservations"
						  ? "sub2"
						  : fromPage === "NewReservation"
						    ? "sub3"
						    : fromPage === "AddCategories"
						      ? "sub4"
						      : fromPage === "StoreBilling"
						        ? "sub5"
						        : fromPage === "HotelSettings"
						          ? "sub6"
						          : fromPage === "HouseKeeping"
						            ? "sub7"
						            : fromPage === "HotelStaff"
						              ? "sub8"
						              : fromPage === "Payment"
						                ? "sub18"
						                : fromPage === "CouponManagement"
						                  ? "sub12"
						                  : "sub1"
				}
				defaultOpenKeys={[
					"sub1",

					// fromPage === "AddGender" ||
					// fromPage === "UpdateGender" ||
					// fromPage === "DeleteGender"
					// 	? "sub2"
					// 	: null,

					// "sub4",

					// "sub6",
				]}
				mode='inline'
				theme='dark'
				inlineCollapsed={collapsed}
				items={items}
				onClick={(e) => {
					if (e.key === "signout") {
						handleSignout(history);
					}

					if (e.key === "StoreLogo") {
						setClickedOn(true);
					} else {
						setClickedOn(false);
					}

					return <Redirect to={e.key} />;
				}}
			/>
		</AdminNavbarWrapper>
	);
};

export default AdminNavbar;

const AdminNavbarWrapper = styled.div`
	margin-bottom: 15px;
	background: ${(props) => (props.show ? "" : "#1e1e2d")};
	top: 0px !important;
	z-index: 20000;
	overflow: auto;
	position: absolute;
	padding: 0px !important;

	position: fixed; // Add this line
	top: 0; // Adjust as needed
	left: 0; // Since the menu is on the right hand side
	height: 100vh; // Make it full height

	ul {
		height: 90vh !important;
	}

	.logoClass {
		display: ${(props) => (props.show ? "none " : "block")} !important;
	}

	li {
		/* margin: 20px auto; */
		font-size: 0.9rem;
		margin-bottom: ${(props) => (props.show ? "20px " : "15px")};
	}

	hr {
		color: white !important;
		background: white !important;
	}

	.ant-menu.ant-menu-inline-collapsed {
		min-height: 850px;
		/* position: fixed; */
	}

	.ant-menu.ant-menu-dark,
	.ant-menu-dark .ant-menu-sub,
	.ant-menu.ant-menu-dark .ant-menu-sub {
		color: rgba(255, 255, 255, 0.65);
		background: #1e1e2d !important;
	}

	.ant-menu.ant-menu-dark,
	.ant-menu-dark {
	}

	.ant-menu-item-selected {
		background: ${(props) => (props.show2 ? "none !important" : "")};
	}

	.black-bg {
		background-color: #0e0e15 !important;

		&:hover {
			background-color: #001427 !important; // Or any other color for hover state
		}
	}

	.red-bg {
		background-color: #270000 !important;

		&:hover {
			background-color: #270000 !important; // Or any other color for hover state
		}
	}

	.ant-menu-item-selected {
		background: black !important;
	}

	@media (max-width: 1650px) {
		background: ${(props) => (props.show ? "" : "transparent")};

		ul {
			width: 250px;
			padding: 0px !important;
			margin: 0px !important;
		}

		ul > li {
			font-size: 0.8rem !important;
		}
	}

	@media (max-width: 1200px) {
		width: ${(props) => (props.show ? "20%" : "60%")} !important;

		ul {
			display: ${(props) => (props.show ? "none" : "")};
			margin-top: 0px !important;
			top: 0px !important;
		}

		.ant-menu.ant-menu-dark {
			/* position: fixed; */
		}

		button {
			margin-top: 5px !important;
		}
	}
`;
