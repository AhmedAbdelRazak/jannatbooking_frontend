// ChatIcon.jsx
import React, { useState, useEffect, useCallback } from "react";
import ChatWindow from "./ChatWindow";
import styled, { keyframes } from "styled-components";
import {
	gettingSingleHotel,
	getUnseenMessagesCountByCustomer,
} from "../apiCore";
import notificationSound from "./Notification.wav";
import socket from "./socket";
import ReactGA from "react-ga4";
import { useCartContext } from "../cart_context";
import ReactPixel from "react-facebook-pixel";

const ChatIconWrapper = styled.div`
	position: fixed;
	bottom: 20px;
	right: 20px;
	z-index: 1000;
	display: flex;
	align-items: center;
	padding-bottom: env(safe-area-inset-bottom, 0px);

	div,
	p,
	span,
	section,
	small,
	input,
	button,
	li,
	ul,
	select,
	option,
	label {
		font-family: ${({ isArabic }) =>
			isArabic ? `"Droid Arabic Kufi", sans-serif` : ""};
	}

	@media (max-width: 750px) {
		right: 12px;
		bottom: calc(16px + env(safe-area-inset-bottom, 0px));
	}
`;

const blink = keyframes`
  0%   { opacity: 1;   }
  50%  { opacity: 0.45;}
  100% { opacity: 1;   }
`;

const ChatMessage = styled.div`
	cursor: pointer;
	color: #fff;
	font-weight: bold;
	text-transform: capitalize;
	background-color: var(--primaryBlue);
	font-size: 15px;
	padding: 8px 10px;
	border-radius: 12px;
	text-align: left;
	display: flex;
	flex-direction: column;
	box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.25);

	.chat-name {
		font-size: 15px;
		font-weight: bold;
		color: white;
	}

	.chat-status {
		font-size: 12px;
		font-weight: normal;
		color: white;
		display: flex;
		align-items: center;
		gap: 6px;

		.status-dot {
			width: 8px;
			height: 8px;
			background-color: #00c853;
			border-radius: 50%;
			display: inline-block;
			animation: ${blink} 2.2s infinite;
		}
	}

	.unseen-count {
		background-color: red;
		color: white;
		border-radius: 999px;
		font-size: 11px;
		min-width: 22px;
		height: 18px;
		padding: 0 6px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-left: 6px;
		line-height: 18px;
	}

	&:hover {
		text-decoration: underline;
	}

	@media (max-width: 750px) {
		.chat-name {
			font-size: 13.5px;
		}
		.chat-status {
			font-size: 11px;
		}
	}
`;

const STATUS_I18N = {
	English: "Chat Available",
	"Arabic (Fos7a)": "الدردشة متاحة",
	"Arabic (Egyptian)": "الدردشة متاحة",
	Spanish: "Chat disponible",
	French: "Chat disponible",
	Urdu: "چیٹ دستیاب",
	Hindi: "चैट उपलब्ध",
};

const ChatIcon = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [unseenCount, setUnseenCount] = useState(0);
	const [hasInteracted, setHasInteracted] = useState(false);
	const [selectedHotel, setSelectedHotel] = useState(null);
	const { chosenLanguage } = useCartContext();

	// Auto-detect hotel from URL
	useEffect(() => {
		const path = window.location.pathname;
		if (path.includes("/single-hotel/")) {
			const slug = path.split("/single-hotel/")[1];
			if (slug) fetchHotel(slug);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const hotelNameSlug = params.get("hotelNameSlug");

		if (hotelNameSlug) {
			fetchHotel(hotelNameSlug);
			setIsOpen(true); // auto-open when slug is present
		}

		const handleSearchChange = () => {
			const updatedParams = new URLSearchParams(window.location.search);
			const updatedSlug = updatedParams.get("hotelNameSlug");
			if (updatedSlug) {
				fetchHotel(updatedSlug);
				setIsOpen(true);
			}
		};

		window.addEventListener("searchChange", handleSearchChange);
		return () => window.removeEventListener("searchChange", handleSearchChange);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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

		ReactPixel.track("Chat Window Opened_Main", {
			action: "User Opened Chat Window Main Icon",
			page: "Home Page",
		});

		const willOpen = !isOpen;
		setIsOpen(willOpen);
		if (willOpen) {
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
			audio.play().catch(() => {});
		}
	}, [hasInteracted]);

	const handleUserInteraction = useCallback(() => {
		setHasInteracted(true);
		document.removeEventListener("click", handleUserInteraction);
	}, []);

	// Periodic unseen count while collapsed
	useEffect(() => {
		if (!isOpen) {
			fetchUnseenMessagesCount();
			const interval = setInterval(fetchUnseenMessagesCount, 10000);
			return () => clearInterval(interval);
		}
	}, [isOpen, fetchUnseenMessagesCount]);

	// Live unseen updates only for our caseId and NOT from ourselves
	useEffect(() => {
		const onReceiveMessage = (payload) => {
			if (!payload) return;

			const saved = JSON.parse(localStorage.getItem("currentChat")) || {};
			const currentCaseId = saved.caseId;
			const myEmailOrPhone = saved.customerEmail;
			const fromSelf =
				payload?.messageBy?.customerEmail &&
				myEmailOrPhone &&
				payload.messageBy.customerEmail === myEmailOrPhone;

			if (!currentCaseId || payload.caseId !== currentCaseId) return;

			if (!isOpen && !fromSelf) {
				playNotificationSound();
				setUnseenCount((c) => c + 1);
			}
		};

		const onReconnect = () => {
			if (!isOpen) fetchUnseenMessagesCount();
		};

		socket.on("receiveMessage", onReceiveMessage);
		socket.on("connect", onReconnect);
		return () => {
			socket.off("receiveMessage", onReceiveMessage);
			socket.off("connect", onReconnect);
		};
	}, [isOpen, playNotificationSound, fetchUnseenMessagesCount]);

	useEffect(() => {
		document.addEventListener("click", handleUserInteraction);
		return () => document.removeEventListener("click", handleUserInteraction);
	}, [handleUserInteraction]);

	const isArabicUI = /Arabic/.test(chosenLanguage || "");
	const statusText = STATUS_I18N[chosenLanguage] || STATUS_I18N.English;

	return (
		<ChatIconWrapper isArabic={isArabicUI}>
			<ChatMessage
				onClick={toggleChatWindow}
				role='button'
				aria-label='Open chat'
			>
				<div className='chat-name'>
					{selectedHotel ? selectedHotel.hotelName : "Jannat Booking"}
				</div>
				<div className='chat-status'>
					<span className='status-dot' /> {statusText}
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
