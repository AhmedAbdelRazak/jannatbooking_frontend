import React, { useState, useEffect, useCallback } from "react";
// eslint-disable-next-line
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
import { useCartContext } from "../cart_context";

const ChatIconWrapper = styled.div`
	position: fixed;
	bottom: 20px;
	right: 20px;
	z-index: 1000;
	display: flex;
	align-items: center;

	@media (max-width: 750px) {
		bottom: 30px;
	}
`;

const ChatMessage = styled.div`
	cursor: pointer;
	color: #1890ff;
	font-weight: bold;
	text-transform: capitalize;
	background-color: var(--primaryBlue);
	font-size: 15px;
	padding: 5px;
	border-radius: 10px;
	text-align: left; /* Align text to the left */
	display: flex;
	flex-direction: column;
	box-shadow: 5px 5px 5px 5px rgba(0, 0, 0, 0.25);

	.chat-name {
		font-size: 15px;
		font-weight: bold;
		color: white;
	}

	.chat-status {
		font-size: 12px; /* Adjust font size for the status text */
		font-weight: normal; /* Normal font weight for the text */
		color: white; /* White color for the text */

		.status-dot {
			width: 8px; /* Set the width of the dot */
			height: 8px; /* Set the height of the dot */
			background-color: #00ff00; /* Green color for the dot */
			border-radius: 50%; /* Make the dot circular */
			display: inline-block; /* Inline block for inline positioning */
			margin-right: 5px; /* Add space between the dot and text */

			/* Animation for blinking effect */
			animation: blink 3s infinite; /* Apply the 'blink' animation, repeating infinitely */
		}
	}

	.unseen-count {
		background-color: red;
		color: white;
		border-radius: 50%;
		font-size: 10px;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: 10px;
	}

	&:hover {
		text-decoration: underline;
	}

	@media (max-width: 750px) {
		.chat-name {
			font-size: 12.5px;
		}

		.chat-status {
			font-size: 10px;
		}
	}
`;

const ChatIcon = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [unseenCount, setUnseenCount] = useState(0);
	const [hasInteracted, setHasInteracted] = useState(false); // Track user interaction
	const [selectedHotel, setSelectedHotel] = useState(null); // Track selected hotel
	const { chosenLanguage } = useCartContext();

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
			category: "User Opened Chat Window",
			action: "User Opened Chat Window",
			label: `User Opened Chat Window`,
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
			<ChatMessage onClick={toggleChatWindow}>
				<div className='chat-name'>
					{selectedHotel ? selectedHotel.hotelName : "Jannat Booking"}
				</div>
				<div className='chat-status'>
					<span className='status-dot'></span> Chat Available
					{unseenCount > 0 && (
						<span className='unseen-count'>{unseenCount}</span>
					)}
				</div>
			</ChatMessage>
			{isOpen && (
				<ChatWindow
					closeChatWindow={toggleChatWindow}
					selectedHotel={selectedHotel}
					chosenLanguage={chosenLanguage}
				/>
			)}
		</ChatIconWrapper>
	);
};

export default ChatIcon;
