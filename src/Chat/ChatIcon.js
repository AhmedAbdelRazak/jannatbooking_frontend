import React, { useState, useEffect, useCallback } from "react";
import { Badge, Button } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import ChatWindow from "./ChatWindow";
import styled from "styled-components";
import {
	gettingSingleHotel,
	getUnseenMessagesCountByCustomer,
} from "../apiCore"; // Import the function to fetch unseen messages count
import notificationSound from "./Notification.wav"; // Import the notification sound
import socket from "./socket"; // Ensure this is correctly imported
import ReactGA from "react-ga4";

const ChatIconWrapper = styled.div`
	position: fixed;
	bottom: 20px;
	right: 20px;
	z-index: 1000;
	display: flex;
	align-items: center;

	@media (max-width: 750px) {
		bottom: 70px;
	}
`;

const StyledButton = styled(Button)`
	background-color: var(--primary-color);
	border: none;
	margin-right: 10px; /* Add some spacing between the icon and the message */
`;

const ChatMessage = styled.div`
	cursor: pointer;
	/* color: var(--primary-color); */
	color: #1890ff;
	font-weight: bold;
	text-transform: capitalize;
	background-color: white;
	font-size: 15px;
	padding: 3px;
	border-radius: 10px;
	&:hover {
		text-decoration: underline;
	}
`;

const ChatIcon = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [unseenCount, setUnseenCount] = useState(0);
	const [hasInteracted, setHasInteracted] = useState(false); // Track user interaction
	const [selectedHotel, setSelectedHotel] = useState(null); // Track selected hotel

	// Extract the hotelNameSlug from window.location.pathname
	useEffect(() => {
		const path = window.location.pathname;
		if (path.includes("/single-hotel/")) {
			const slug = path.split("/single-hotel/")[1];
			if (slug) {
				fetchHotel(slug);
			}
		}
	}, []);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const hotelNameSlug = params.get("hotelNameSlug");

		if (hotelNameSlug) {
			fetchHotel(hotelNameSlug);
			setIsOpen(true); // Automatically open chat window if slug is present
		}

		// Listen for custom event when search changes
		const handleSearchChange = () => {
			const updatedParams = new URLSearchParams(window.location.search);
			const updatedSlug = updatedParams.get("hotelNameSlug");
			if (updatedSlug) {
				fetchHotel(updatedSlug);
				setIsOpen(true);
			}
		};

		window.addEventListener("searchChange", handleSearchChange);

		return () => {
			window.removeEventListener("searchChange", handleSearchChange);
		};
	}, []); // Only run on mount, no unnecessary dependencies

	const fetchHotel = async (slug) => {
		try {
			const hotelData = await gettingSingleHotel(slug);
			setSelectedHotel(hotelData);
		} catch (error) {
			console.error("Error fetching hotel:", error);
		}
	};

	const toggleChatWindow = () => {
		ReactGA.event({
			category: "User Open Chat Window",
			action: "User Open Chat Window",
		});
		setIsOpen(!isOpen);
		if (isOpen) {
			// Reset unseen count when chat window is opened
			setUnseenCount(0);
		}
	};

	const fetchUnseenMessagesCount = useCallback(async () => {
		try {
			const caseId = JSON.parse(localStorage.getItem("currentChat"))?.caseId;
			if (caseId) {
				const response = await getUnseenMessagesCountByCustomer(caseId);
				setUnseenCount(response.count);
			}
		} catch (error) {
			console.error("Error fetching unseen messages count", error);
		}
	}, []);

	const playNotificationSound = useCallback(() => {
		if (hasInteracted) {
			const audio = new Audio(notificationSound);
			audio.play();
		}
	}, [hasInteracted]);

	const handleUserInteraction = useCallback(() => {
		setHasInteracted(true);
		document.removeEventListener("click", handleUserInteraction);
	}, []);

	useEffect(() => {
		if (!isOpen) {
			// Fetch unseen messages count when the chat window is collapsed
			fetchUnseenMessagesCount();

			// Set an interval to periodically fetch unseen messages count
			const interval = setInterval(() => {
				fetchUnseenMessagesCount();
			}, 10000); // Fetch every 10 seconds

			return () => clearInterval(interval); // Clear interval on component unmount
		}
	}, [isOpen, fetchUnseenMessagesCount]);

	useEffect(() => {
		socket.on("receiveMessage", () => {
			if (!isOpen) {
				playNotificationSound();
				fetchUnseenMessagesCount();
			}
		});

		return () => {
			socket.off("receiveMessage");
		};
	}, [isOpen, playNotificationSound, fetchUnseenMessagesCount]);

	// Listen for user interaction to allow playing sound
	useEffect(() => {
		document.addEventListener("click", handleUserInteraction);
		return () => {
			document.removeEventListener("click", handleUserInteraction);
		};
	}, [handleUserInteraction]);

	return (
		<ChatIconWrapper>
			<Badge count={unseenCount} offset={[-5, 5]}>
				<StyledButton
					type='primary'
					shape='circle'
					icon={<MessageOutlined />}
					size='large'
					onClick={toggleChatWindow}
				/>
			</Badge>
			{selectedHotel && (
				<ChatMessage onClick={toggleChatWindow}>
					Speak with {selectedHotel.hotelName} reception
				</ChatMessage>
			)}
			{isOpen && (
				<ChatWindow
					closeChatWindow={toggleChatWindow}
					selectedHotel={selectedHotel}
				/>
			)}
		</ChatIconWrapper>
	);
};

export default ChatIcon;
