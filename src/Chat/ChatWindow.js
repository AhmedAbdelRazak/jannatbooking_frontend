import React, { useState, useEffect, useRef } from "react";
import { Button, Input, Select, Form, Upload, message } from "antd";
import { UploadOutlined, CloseOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { isAuthenticated } from "../auth";
import {
	createNewSupportCase,
	getSupportCaseById,
	updateSupportCase,
	updateSeenByCustomer,
} from "../apiCore";
import socket from "./socket";
import EmojiPicker from "emoji-picker-react";
import StarRatings from "react-star-ratings";
import ReactGA from "react-ga4";

const { Option } = Select;

const ChatWindow = ({ closeChatWindow }) => {
	const [customerName, setCustomerName] = useState("");
	const [customerEmail, setCustomerEmail] = useState("");
	const [inquiryAbout, setInquiryAbout] = useState("");
	const [orderNumber, setOrderNumber] = useState("");
	const [productName, setProductName] = useState("");
	const [otherInquiry, setOtherInquiry] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [messages, setMessages] = useState([]);
	const [newMessage, setNewMessage] = useState("");
	const [caseId, setCaseId] = useState("");
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [fileList, setFileList] = useState([]);
	const [isRatingVisible, setIsRatingVisible] = useState(false);
	const [rating, setRating] = useState(0);
	const [typingStatus, setTypingStatus] = useState("");
	// eslint-disable-next-line
	const [isMinimized, setIsMinimized] = useState(false);
	const messagesEndRef = useRef(null);

	useEffect(() => {
		if (isAuthenticated()) {
			const { user } = isAuthenticated();
			setCustomerName(user.name);
			setCustomerEmail(user.email || user.phone);
		}

		const savedChat = JSON.parse(localStorage.getItem("currentChat"));
		if (savedChat) {
			setCustomerName(savedChat.customerName || "");
			setCustomerEmail(savedChat.customerEmail || "");
			setInquiryAbout(savedChat.inquiryAbout || "");
			setOrderNumber(savedChat.orderNumber || "");
			setProductName(savedChat.productName || "");
			setOtherInquiry(savedChat.otherInquiry || "");
			setCaseId(savedChat.caseId || "");
			setSubmitted(savedChat.submitted || false);
			setMessages(savedChat.messages || []);
			fetchSupportCase(savedChat.caseId);
		}

		socket.on("receiveMessage", (message) => {
			if (message.caseId === caseId) {
				setMessages((prevMessages) => [...prevMessages, message]);
				markMessagesAsSeen(caseId);
			}
		});

		socket.on("closeCase", (data) => {
			if (data.case._id === caseId) {
				setIsRatingVisible(true);
			}
		});

		socket.on("typing", (data) => {
			if (data.caseId === caseId && data.name !== customerName) {
				setTypingStatus(`${data.name} is typing...`);
			}
		});

		socket.on("stopTyping", (data) => {
			if (data.caseId === caseId && data.name !== customerName) {
				setTypingStatus("");
			}
		});

		return () => {
			socket.off("receiveMessage");
			socket.off("closeCase");
			socket.off("typing");
			socket.off("stopTyping");
		};
		// eslint-disable-next-line
	}, [caseId, customerEmail]);

	useEffect(() => {
		if (caseId) {
			const saveChat = {
				customerName,
				customerEmail,
				inquiryAbout,
				orderNumber,
				productName,
				otherInquiry,
				caseId,
				messages,
				submitted,
			};
			localStorage.setItem("currentChat", JSON.stringify(saveChat));
			markMessagesAsSeen(caseId);
		}
	}, [
		customerName,
		customerEmail,
		inquiryAbout,
		orderNumber,
		productName,
		otherInquiry,
		messages,
		submitted,
		caseId,
	]);

	const fetchSupportCase = async (id) => {
		try {
			const supportCase = await getSupportCaseById(id);
			setMessages(supportCase.conversation);
		} catch (err) {
			console.error("Error fetching support case", err);
		}
	};

	const markMessagesAsSeen = async (caseId) => {
		try {
			await updateSeenByCustomer(caseId);
		} catch (err) {
			console.error("Error marking messages as seen", err);
		}
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const handleInputChange = (e) => {
		setNewMessage(e.target.value);
		socket.emit("typing", { name: customerName, caseId });
	};

	const handleInputBlur = () => {
		socket.emit("stopTyping", { name: customerName, caseId });
	};

	const handleInputKeyPress = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (newMessage.trim() === "") {
				message.error("Please add text to your message.");
			} else {
				handleSendMessage();
			}
		}
	};

	const handleSubmit = async () => {
		if (!customerName || !/\s/.test(customerName)) {
			message.error("Please enter your full name.");
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (customerEmail && !emailRegex.test(customerEmail)) {
			message.error("Please enter a valid email address.");
			return;
		}

		if (!inquiryAbout) {
			message.error("Please select an inquiry type.");
			return;
		}

		const inquiryDetails =
			inquiryAbout === "order"
				? orderNumber
				: inquiryAbout === "product"
					? productName
					: otherInquiry;

		if (!inquiryDetails) {
			message.error("Please provide details for your inquiry.");
			return;
		}

		const data = {
			customerName,
			customerEmail,
			inquiryAbout,
			inquiryDetails,
		};

		try {
			const response = await createNewSupportCase(data);
			console.log("Support case created with ID:", response._id); // Log the case ID
			setCaseId(response._id);
			setSubmitted(true);
			fetchSupportCase(response._id); // Fetch the created support case
		} catch (err) {
			console.error("Error creating support case", err);
		}
	};

	const handleSendMessage = async () => {
		const messageData = {
			messageBy: { customerName, customerEmail },
			message: newMessage,
			date: new Date(),
			caseId,
		};

		try {
			await updateSupportCase(caseId, { conversation: messageData });
			socket.emit("sendMessage", messageData);
			setNewMessage("");
			socket.emit("stopTyping", { name: customerName, caseId });
		} catch (err) {
			console.error("Error sending message", err);
		}
	};

	const handleCloseChat = () => {
		setIsRatingVisible(true);
	};

	const handleRateService = async (ratingValue) => {
		try {
			await updateSupportCase(caseId, {
				rating: ratingValue,
				caseStatus: "closed",
				closedBy: customerEmail,
			});
			localStorage.removeItem("currentChat");
			setIsRatingVisible(false);
			closeChatWindow();
			message.success("Thank you for your feedback!");
		} catch (err) {
			console.error("Error rating support case", err);
		}
	};

	const handleSkipRating = async () => {
		try {
			await updateSupportCase(caseId, {
				caseStatus: "closed",
				closedBy: customerEmail,
			});
			localStorage.removeItem("currentChat");
			setIsRatingVisible(false);
			closeChatWindow();
		} catch (err) {
			console.error("Error closing support case", err);
		}
	};

	const handleEmojiClick = (emojiObject) => {
		setNewMessage((prevMessage) => prevMessage + emojiObject.emoji);
		setShowEmojiPicker(false);
	};

	const handleFileChange = ({ fileList }) => {
		setFileList(fileList);
	};

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<ChatWindowWrapper isMinimized={isMinimized}>
			<ChatWindowHeader>
				<h3>Customer Support</h3>
				<Button
					type='text'
					icon={<CloseOutlined />}
					onClick={closeChatWindow}
				/>
			</ChatWindowHeader>
			{isRatingVisible ? (
				<RatingSection>
					<h4>Rate Our Service</h4>
					<StarRatings
						rating={rating}
						starRatedColor='var(--secondary-color)' // Using a color from :root
						changeRating={setRating}
						numberOfStars={5}
						name='rating'
						starDimension='20px' // Making the stars smaller
						starSpacing='2px'
					/>
					<RatingButtons>
						<Button
							type='primary'
							onClick={() => {
								ReactGA.event({
									category: "User Rated Chat",
									action: "User Rated Chat",
								});
								handleRateService(rating);
							}}
						>
							Submit Rating
						</Button>
						<Button onClick={handleSkipRating}>Skip</Button>
					</RatingButtons>
				</RatingSection>
			) : submitted && !isMinimized ? (
				<div>
					<p>A representative will be with you shortly.</p>
					<MessagesContainer>
						{messages &&
							messages.map((msg, index) => (
								<Message key={index}>
									<strong>{msg.messageBy.customerName}:</strong> {msg.message}
								</Message>
							))}
						<div ref={messagesEndRef} />
					</MessagesContainer>
					{typingStatus && <TypingStatus>{typingStatus}</TypingStatus>}
					<Form.Item>
						<ChatInputContainer>
							<Input
								placeholder='Type your message...'
								value={newMessage}
								onChange={handleInputChange}
								onBlur={handleInputBlur}
								onKeyPress={handleInputKeyPress}
								style={{ flexGrow: 1 }}
							/>
							<Button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
								😀
							</Button>
							{showEmojiPicker && (
								<EmojiPickerWrapper>
									<EmojiPicker
										onEmojiClick={handleEmojiClick}
										disableAutoFocus={true}
										// Adjusting the picker position and size
										pickerStyle={{ width: "100%" }}
									/>
								</EmojiPickerWrapper>
							)}
							<Upload
								fileList={fileList}
								onChange={handleFileChange}
								beforeUpload={() => false}
							>
								<Button icon={<UploadOutlined />} />
							</Upload>
						</ChatInputContainer>
						<SendButton type='primary' onClick={handleSendMessage}>
							Send
						</SendButton>
						<CloseButton type='danger' onClick={handleCloseChat}>
							<CloseOutlined /> Close Chat
						</CloseButton>
					</Form.Item>
				</div>
			) : !isMinimized ? (
				<Form layout='vertical' onFinish={handleSubmit}>
					<Form.Item label='Name' required>
						<Input
							value={customerName}
							onChange={(e) => setCustomerName(e.target.value)}
							disabled={isAuthenticated()}
						/>
					</Form.Item>
					<Form.Item label='Email'>
						<Input
							value={customerEmail}
							onChange={(e) => setCustomerEmail(e.target.value)}
							disabled={isAuthenticated()}
						/>
					</Form.Item>
					<Form.Item label='Inquiry About' required>
						<Select
							value={inquiryAbout}
							onChange={(value) => setInquiryAbout(value)}
						>
							<Option value='order'>Inquiry about an order</Option>
							<Option value='product'>Inquiry about a product</Option>
							<Option value='other'>Others</Option>
						</Select>
					</Form.Item>
					{inquiryAbout === "order" && (
						<Form.Item label='Order/Invoice Number' required>
							<Input
								value={orderNumber}
								onChange={(e) => setOrderNumber(e.target.value)}
							/>
						</Form.Item>
					)}
					{inquiryAbout === "product" && (
						<Form.Item label='Product Name' required>
							<Input
								value={productName}
								onChange={(e) => setProductName(e.target.value)}
							/>
						</Form.Item>
					)}
					{inquiryAbout === "other" && (
						<Form.Item label='Brief Description' required>
							<Input
								value={otherInquiry}
								onChange={(e) => setOtherInquiry(e.target.value)}
							/>
						</Form.Item>
					)}
					<Form.Item
						onClick={() => {
							ReactGA.event({
								category: "User Started Chat",
								action: "User Started Chat",
							});
						}}
					>
						<Button type='primary' htmlType='submit'>
							Start Chat
						</Button>
					</Form.Item>
				</Form>
			) : null}
		</ChatWindowWrapper>
	);
};

export default ChatWindow;

const ChatWindowWrapper = styled.div`
	position: fixed;
	bottom: ${({ isMinimized }) => (isMinimized ? "10px" : "70px")};
	right: 20px;
	width: ${({ isMinimized }) => (isMinimized ? "200px" : "350px")};
	max-width: ${({ isMinimized }) => (isMinimized ? "200px" : "350px")};
	height: ${({ isMinimized }) => (isMinimized ? "40px" : "70vh")};
	max-height: ${({ isMinimized }) => (isMinimized ? "40px" : "70vh")};
	background-color: var(--background-light);
	border: 1px solid var(--border-color-dark);
	border-radius: 8px;
	box-shadow: var(--box-shadow-dark);
	padding: ${({ isMinimized }) => (isMinimized ? "5px" : "20px")};
	z-index: 1001;
	overflow: hidden;

	@media (max-width: 768px) {
		width: ${({ isMinimized }) => (isMinimized ? "200px" : "90%")};
		right: 5%;
		bottom: 10px;
		max-height: ${({ isMinimized }) => (isMinimized ? "40px" : "80vh")};
	}
`;

const ChatWindowHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1px solid var(--border-color-light);
	padding-bottom: 10px;
	margin-bottom: 10px;
	background-color: var(--background-light);

	h3 {
		font-size: 1.2rem;
		font-weight: bold;
		color: var(--text-color-dark); /* Using one of the specified text colors */
	}
`;

const MessagesContainer = styled.div`
	max-height: 55vh;
	margin-bottom: 10px;
	overflow-x: hidden;
`;

const Message = styled.p`
	word-wrap: break-word;
	white-space: pre-wrap;
`;

const ChatInputContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 5px;

	input {
		flex-grow: 1;
	}

	button {
		width: auto;
	}
`;

const EmojiPickerWrapper = styled.div`
	position: absolute;
	bottom: 60px;
	right: 20px;
	z-index: 1002;
	width: 300px; /* Adjusting the width */
	height: 300px; /* Adjusting the height */
	overflow: hidden;
`;

const SendButton = styled(Button)`
	background-color: var(--button-bg-primary);
	color: var(--button-font-color);
	width: 100%;
	margin-top: 10px;
`;

const CloseButton = styled(Button)`
	background-color: var(--secondary-color-dark);
	color: var(--button-font-color);
	width: 100%;
	margin-top: 10px;
`;

const RatingSection = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 20px;
`;

const RatingButtons = styled.div`
	display: flex;
	gap: 10px;
	margin-top: 20px;
`;

const TypingStatus = styled.div`
	margin-top: -20px;
	margin-bottom: 10px;
	color: var(--text-color-dark);
	font-style: italic;
	font-size: 0.85rem;
`;
