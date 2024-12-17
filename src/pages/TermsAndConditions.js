import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useCartContext } from "../cart_context";
import { useLocation, useHistory } from "react-router-dom"; // Import hooks for routing
import { gettingJannatWebsiteData } from "../apiCore";
import TermsAndConditionsGuest from "../components/TermsAndConditions/TermsAndConditionsGuest";
import TermsAndConditionsHotels from "../components/TermsAndConditions/TermsAndConditionsHotels";
import PrivacyPolicy from "../components/TermsAndConditions/PrivacyPolicy";
import { Helmet } from "react-helmet";
import favicon from "../favicon.ico";

const TermsAndConditions = () => {
	const { chosenLanguage } = useCartContext();
	const location = useLocation();
	const history = useHistory();
	const [jannatBookingData, setJannatBookingData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState(1); // Tracks the currently active tab

	// Fetch the data
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const data = await gettingJannatWebsiteData();
				if (data && !data.error) {
					setJannatBookingData(data[data.length - 1]);
				}
			} catch (error) {
				console.error("Error fetching data:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	// Handle initial tab selection based on query parameters
	useEffect(() => {
		const queryParams = new URLSearchParams(location.search);
		const tab = queryParams.get("tab");

		switch (tab) {
			case "guest":
				setActiveTab(1);
				break;
			case "hotel":
				setActiveTab(2);
				break;
			case "privacy":
				setActiveTab(3);
				break;
			default:
				setActiveTab(1); // Default to "Terms & Conditions (Guests)"
		}
	}, [location.search]);

	// Update the query parameter when the tab changes
	const handleTabChange = (tabIndex) => {
		let tabQuery;
		switch (tabIndex) {
			case 1:
				tabQuery = "guest";
				break;
			case 2:
				tabQuery = "hotel";
				break;
			case 3:
				tabQuery = "privacy";
				break;
			default:
				tabQuery = "guest";
		}
		history.push(`/terms-conditions?tab=${tabQuery}`);
		setActiveTab(tabIndex);
	};

	const getTabDetails = (tabIndex) => {
		switch (tabIndex) {
			case 1:
				return {
					title: "Terms & Conditions for Guests | Jannat Booking",
					description:
						"Review the terms and conditions for guests booking Haj and Umrah hotels with Jannat Booking. Understand our policies for a seamless experience.",
					keywords:
						"Terms and Conditions, Guest Policies, Jannat Booking, Haj Hotels, Umrah Hotels, Booking Policies, Hotel Rules",
				};
			case 2:
				return {
					title: "Terms & Conditions for Hotels | Jannat Booking",
					description:
						"Explore the terms and conditions for hotels partnering with Jannat Booking for Haj and Umrah reservations. Learn about guidelines and agreements.",
					keywords:
						"Hotel Policies, Partner Terms, Jannat Booking, Haj Reservations, Umrah Hotels, Hotel Guidelines, Partner Agreements",
				};
			case 3:
				return {
					title: "Privacy Policy | Jannat Booking",
					description:
						"Understand Jannat Booking's privacy policy. We prioritize your data security and confidentiality during Haj and Umrah hotel bookings.",
					keywords:
						"Privacy Policy, Data Protection, Jannat Booking, Personal Information, Secure Bookings, Haj Hotels, Umrah Hotels",
				};
			default:
				return {
					title: "Terms & Conditions | Jannat Booking",
					description:
						"Explore the terms, conditions, and privacy policy for booking Haj and Umrah hotels with Jannat Booking. A reliable and trusted partner for your stay.",
					keywords:
						"Terms and Conditions, Privacy Policy, Jannat Booking, Haj Hotels, Umrah Hotels, Booking Guidelines, Secure Reservations",
				};
		}
	};

	// Render content based on the active tab
	const renderContent = () => {
		switch (activeTab) {
			case 1:
				return (
					<TermsAndConditionsGuest jannatBookingData={jannatBookingData} />
				);
			case 2:
				return (
					<TermsAndConditionsHotels jannatBookingData={jannatBookingData} />
				);
			case 3:
				return <PrivacyPolicy jannatBookingData={jannatBookingData} />;
			default:
				return null;
		}
	};

	return (
		<TermsAndConditionsWrapper
			isArabic={chosenLanguage === "Arabic"}
			dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
		>
			<Helmet>
				<title>{getTabDetails(activeTab).title}</title>
				<meta
					name='description'
					content={getTabDetails(activeTab).description}
				/>
				<meta name='keywords' content={getTabDetails(activeTab).keywords} />

				{/* Open Graph for Social Media */}
				<meta property='og:title' content={getTabDetails(activeTab).title} />
				<meta
					property='og:description'
					content={getTabDetails(activeTab).description}
				/>
				<meta
					property='og:image'
					content='https://res.cloudinary.com/infiniteapps/image/upload/v1734109751/janat/1734109751072.jpg'
				/>
				<meta
					property='og:url'
					content='https://jannatbooking.com/terms-conditions'
				/>
				<meta property='og:type' content='website' />

				{/* Twitter Card */}
				<meta name='twitter:card' content='summary_large_image' />
				<meta name='twitter:title' content={getTabDetails(activeTab).title} />
				<meta
					name='twitter:description'
					content={getTabDetails(activeTab).description}
				/>
				<meta
					name='twitter:image'
					content='https://res.cloudinary.com/infiniteapps/image/upload/v1734109751/janat/1734109751072.jpg'
				/>

				{/* Canonical URL */}
				<link
					rel='canonical'
					href={`https://jannatbooking.com/terms-conditions?tab=${activeTab}`}
				/>

				{/* Favicon */}
				<link rel='icon' href={favicon} />
			</Helmet>
			{window.scrollTo({ top: 10, behavior: "smooth" })}
			{loading ? (
				<p>Loading...</p>
			) : jannatBookingData ? (
				<ContentLayout isArabic={chosenLanguage === "Arabic"}>
					<TabsWrapper isArabic={chosenLanguage === "Arabic"}>
						<Tab active={activeTab === 1} onClick={() => handleTabChange(1)}>
							Terms & Conditions (Guests)
						</Tab>
						<Tab active={activeTab === 2} onClick={() => handleTabChange(2)}>
							Terms & Conditions (Hotels)
						</Tab>
						<Tab active={activeTab === 3} onClick={() => handleTabChange(3)}>
							Privacy Policy
						</Tab>
					</TabsWrapper>
					<ContentArea>{renderContent()}</ContentArea>
				</ContentLayout>
			) : (
				<p>No data available</p>
			)}
		</TermsAndConditionsWrapper>
	);
};

export default TermsAndConditions;

// Styled Components

const TermsAndConditionsWrapper = styled.div`
	min-height: 750px;
	padding: 50px 200px;
	background-color: #f9f9f9;

	@media (max-width: 800px) {
		margin-top: 95px;
		padding: 10px 25px;
	}
`;

const ContentLayout = styled.div`
	display: flex;
	flex-direction: ${({ isArabic }) => (isArabic ? "row-reverse" : "row")};
	gap: 20px;

	@media (max-width: 800px) {
		flex-direction: column;
	}
`;

const TabsWrapper = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 10px;

	@media (max-width: 800px) {
		flex-direction: row;
		justify-content: center;
		margin-bottom: 20px;
	}
`;

const Tab = styled.div`
	padding: 15px;
	background-color: ${({ active }) => (active ? "#333" : "#f0f0f0")};
	color: ${({ active }) => (active ? "white" : "#333")};
	text-align: center;
	cursor: pointer;
	border-radius: 8px;
	font-weight: bold;
	display: flex;

	align-items: center;

	:hover {
		background-color: ${({ active }) => (active ? "#333" : "#e0e0e0")};
	}

	@media (max-width: 800px) {
		padding: 5px;
		flex: 1;
		font-size: 12px;
	}
`;

const ContentArea = styled.div`
	flex: 4;
	padding: 20px;
	background-color: white;
	border-radius: 8px;

	@media (max-width: 800px) {
		padding: 10px;
	}
`;
