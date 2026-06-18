// ChatIcon.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { useHistory, useLocation } from "react-router-dom";
import {
	mergeChatQueryParams,
	readChatQueryParams,
	replaceSearchWithoutReload,
} from "./chatQueryParams";

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

STATUS_I18N.Arabic = STATUS_I18N["Arabic (Fos7a)"];

const normalizeChatLanguage = (label) =>
	label === "Arabic (Fos7a)" || label === "Arabic (Egyptian)"
		? "Arabic"
		: label;

const ChatIcon = () => {
	const history = useHistory();
	const location = useLocation();
	const [isOpen, setIsOpen] = useState(
		() => readChatQueryParams(window.location.search).isOpen
	);
	const [unseenCount, setUnseenCount] = useState(0);
	const [hasInteracted, setHasInteracted] = useState(false);
	const [selectedHotel, setSelectedHotel] = useState(null);
	const seenIncomingRef = useRef(new Set());
	const { chosenLanguage } = useCartContext();
	const hotelNameSlugFromUrl = new URLSearchParams(location.search).get(
		"hotelNameSlug"
	);

	const writeChatOpenToUrl = useCallback(
		({ open, hotel } = {}) => {
			const hotelFields = hotel
				? {
						hotelId: hotel._id,
						hotelName: hotel.hotelName,
				  }
				: {};
			const nextSearch = mergeChatQueryParams(
				window.location.search,
				hotelFields,
				open
					? { open: true }
					: { close: true, clearFields: true }
			);
			replaceSearchWithoutReload(history, nextSearch);
		},
		[history]
	);

	const openChatWindow = useCallback(
		({ hotel } = {}) => {
			setIsOpen(true);
			setUnseenCount(0);
			writeChatOpenToUrl({ open: true, hotel: hotel || selectedHotel });
		},
		[selectedHotel, writeChatOpenToUrl]
	);

	const closeChatWindow = useCallback(() => {
		setIsOpen(false);
		writeChatOpenToUrl({ open: false });
	}, [writeChatOpenToUrl]);

	// Auto-detect hotel from URL
	useEffect(() => {
		const path = location.pathname;
		if (path.includes("/single-hotel/")) {
			const slug = path.split("/single-hotel/")[1];
			if (slug) fetchHotel(slug);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.pathname]);

	useEffect(() => {
		if (hotelNameSlugFromUrl) {
			fetchHotel(hotelNameSlugFromUrl);
			setIsOpen(true);
			setUnseenCount(0);
			writeChatOpenToUrl({ open: true }); // auto-open when slug is present
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hotelNameSlugFromUrl, writeChatOpenToUrl]);

	useEffect(() => {
		const shouldOpen = readChatQueryParams(location.search).isOpen;
		if (!shouldOpen && hotelNameSlugFromUrl) return;
		setIsOpen((current) => (current === shouldOpen ? current : shouldOpen));
		if (shouldOpen) setUnseenCount(0);
	}, [hotelNameSlugFromUrl, location.search]);

	useEffect(() => {
		const handleSearchChange = () => {
			const updatedParams = new URLSearchParams(window.location.search);
			const updatedSlug = updatedParams.get("hotelNameSlug");
			if (updatedSlug) {
				fetchHotel(updatedSlug);
				setIsOpen(true);
				setUnseenCount(0);
				writeChatOpenToUrl({ open: true });
			}
		};

		window.addEventListener("searchChange", handleSearchChange);
		return () => window.removeEventListener("searchChange", handleSearchChange);
	}, [writeChatOpenToUrl]);

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
		if (willOpen) {
			openChatWindow();
		} else {
			closeChatWindow();
		}
	};

	const fetchUnseenMessagesCount = useCallback(async () => {
		try {
			const caseId = JSON.parse(localStorage.getItem("currentChat"))?.caseId;
			if (caseId) {
				const response = await getUnseenMessagesCountByCustomer(caseId);
				setUnseenCount(Number(response?.count || 0));
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
				const key =
					payload.clientTag ||
					[
						payload.caseId,
						payload?.messageBy?.customerEmail || "",
						payload?.messageBy?.customerName || "",
						payload.message || "",
						payload.date ? new Date(payload.date).getTime() : "",
					].join("|");
				if (seenIncomingRef.current.has(key)) return;
				seenIncomingRef.current.add(key);
				if (seenIncomingRef.current.size > 500) {
					const first = seenIncomingRef.current.values().next().value;
					seenIncomingRef.current.delete(first);
				}
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

	const normalizedLanguage = normalizeChatLanguage(chosenLanguage);
	const isArabicUI = /Arabic/.test(normalizedLanguage || "");
	const statusText = STATUS_I18N[normalizedLanguage] || STATUS_I18N.English;

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
					closeChatWindow={closeChatWindow}
					selectedHotel={selectedHotel}
					chosenLanguage={chosenLanguage}
				/>
			)}
		</ChatIconWrapper>
	);
};

export default ChatIcon;
