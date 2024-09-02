import React, { useState, useEffect, useCallback } from "react";
import { Badge, Button } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import ChatWindow from "./ChatWindow";
import styled from "styled-components";
import { getUnseenMessagesCountByCustomer } from "../apiCore"; // Import the function to fetch unseen messages count
import notificationSound from "./Notification.wav"; // Import the notification sound
import socket from "./socket"; // Ensure this is correctly imported
import ReactGA from "react-ga4";

const ChatIconWrapper = styled.div`
	position: fixed;
	bottom: 20px;
	right: 20px;
	z-index: 1000;

	@media (max-width: 750px) {
		bottom: 70px;
	}
`;

const StyledButton = styled(Button)`
	background-color: var(--primary-color);
	border: none;
`;

const ChatIcon = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [unseenCount, setUnseenCount] = useState(0);
	const [hasInteracted, setHasInteracted] = useState(false); // Track user interaction

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
			{isOpen && <ChatWindow closeChatWindow={toggleChatWindow} />}
		</ChatIconWrapper>
	);
};

export default ChatIcon;
