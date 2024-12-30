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
	gettingActiveHotelList,
} from "../apiCore";
import socket from "./socket";
import EmojiPicker from "emoji-picker-react";
import StarRatings from "react-star-ratings";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";

const { Option } = Select;

const ChatWindow = ({ closeChatWindow, selectedHotel, chosenLanguage }) => {
	const [activeHotels, setActiveHotels] = useState([]);
	const [customerName, setCustomerName] = useState("");
	const [customerEmail, setCustomerEmail] = useState("");
	const [orderNumber, setOrderNumber] = useState("");
	const [productName, setProductName] = useState("");
	const [otherInquiry, setOtherInquiry] = useState("");
	const [reservationNumber, setReservationNumber] = useState("");
	// eslint-disable-next-line
	const [hotelName, setHotelName] = useState("");
	const [hotelId, setHotelId] = useState("674cf8997e3780f1f838d458"); // Default to Jannat Booking
	const [inquiryAbout, setInquiryAbout] = useState("");
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
		if (selectedHotel && selectedHotel.hotelName) {
			setHotelName(selectedHotel.hotelName);
			setInquiryAbout("reserve_room");
			setHotelId(selectedHotel._id);
		} else {
			// Set default values if no selectedHotel is provided
			setHotelName("Speak With Jannat Booking");
			setInquiryAbout("Speak With Jannat Booking");
			setHotelId("674cf8997e3780f1f838d458");
		}
	}, [selectedHotel]);

	useEffect(() => {
		// Set authenticated user details
		if (isAuthenticated()) {
			const { user } = isAuthenticated();
			setCustomerName(user.name);
			setCustomerEmail(user.email || user.phone);
		}

		// Restore chat from localStorage if it exists
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

		// Socket listener for new messages
		socket.on("receiveMessage", (message) => {
			if (message.caseId === caseId) {
				setMessages((prevMessages) => [...prevMessages, message]); // Add new message
				markMessagesAsSeen(caseId); // Mark messages as seen
			}
		});

		// Socket listener for closed cases
		socket.on("closeCase", (data) => {
			if (data.case._id === caseId) {
				setIsRatingVisible(true); // Show rating dialog
			}
		});

		// Socket listener for typing notifications
		socket.on("typing", (data) => {
			if (data.caseId === caseId && data.name !== customerName) {
				setTypingStatus(`${data.name} is typing...`); // Show typing status
			}
		});

		// Socket listener for stop typing notifications
		socket.on("stopTyping", (data) => {
			if (data.caseId === caseId && data.name !== customerName) {
				setTypingStatus(""); // Clear typing status
			}
		});

		// Socket listener for deleted messages
		socket.on("messageDeleted", (data) => {
			if (data.caseId === caseId) {
				setMessages((prevMessages) =>
					prevMessages.filter((msg) => msg._id !== data.messageId)
				); // Remove the deleted message from the state
			}
		});

		// Cleanup socket listeners on component unmount
		return () => {
			socket.off("receiveMessage");
			socket.off("closeCase");
			socket.off("typing");
			socket.off("stopTyping");
			socket.off("messageDeleted");
		};
	}, [caseId, customerEmail, customerName]);

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

	// Function to make URLs in a message clickable
	const renderMessageWithLinks = (text) => {
		const urlRegex = /(https?:\/\/[^\s]+)/g;
		return text.split(urlRegex).map((part, index) => {
			if (part.match(urlRegex)) {
				return (
					<a key={index} href={part} target='_blank' rel='noopener noreferrer'>
						{part}
					</a>
				);
			}
			return part;
		});
	};

	const fetchSupportCase = async (id) => {
		try {
			const supportCase = await getSupportCaseById(id);

			// Ensure conversation array includes `_id`
			if (supportCase.conversation && supportCase.conversation.length > 0) {
				setMessages(supportCase.conversation);
			} else {
				console.error("Conversation data is missing or malformed.");
			}
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

	// Fetch hotel details on component mount
	useEffect(() => {
		const fetchHotel = async () => {
			try {
				const hotelData = await gettingActiveHotelList(); // Fetch hotels
				setActiveHotels(hotelData); // Set response to activeHotels state
			} catch (error) {
				console.error("Error fetching hotels:", error);
			}
		};

		fetchHotel();
	}, []);

	const handleInputChange = (e) => {
		setNewMessage(e.target.value);
		socket.emit("typing", { name: customerName, caseId });
	};

	// eslint-disable-next-line
	const handleInputBlur = () => {
		socket.emit("stopTyping", { name: customerName, caseId });
	};

	// eslint-disable-next-line
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
		const phoneRegex = /^[0-9]{10,15}$/;

		// Validate either email or phone number
		if (
			!customerEmail ||
			(!emailRegex.test(customerEmail) && !phoneRegex.test(customerEmail))
		) {
			message.error(
				chosenLanguage === "Arabic"
					? "يرجى إدخال بريد إلكتروني أو رقم هاتف صالح."
					: "Please enter a valid email address or phone number."
			);
			return;
		}

		if (!hotelId) {
			message.error("Please select a hotel.");
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
					: inquiryAbout === "reservation"
						? reservationNumber
						: otherInquiry;

		if (
			inquiryAbout === "reservation" &&
			(!reservationNumber || reservationNumber.trim() === "")
		) {
			message.error("Please provide your reservation confirmation number.");
			return;
		}

		if (
			inquiryAbout === "others" &&
			(!otherInquiry || otherInquiry.trim() === "")
		) {
			message.error("Please provide details for your inquiry.");
			return;
		}

		const ownerId =
			(activeHotels &&
				activeHotels.filter((i) => i._id === hotelId) &&
				activeHotels.filter((i) => i._id === hotelId)[0] &&
				activeHotels.filter((i) => i._id === hotelId)[0].belongsTo) ||
			"6553f1c6d06c5cea2f98a838";

		const data = {
			customerName: customerName,
			displayName1: customerName,
			displayName2: "Fareda Elsheemy",
			role: 0,
			customerEmail,
			hotelId: hotelId || "674cf8997e3780f1f838d458", // Send hotelId along with other data
			inquiryAbout,
			inquiryDetails: inquiryDetails
				? inquiryDetails
				: `Inquiry To ${inquiryAbout}`,
			supporterId: "6553f1c6d06c5cea2f98a838",
			ownerId: ownerId,
		};

		try {
			const response = await createNewSupportCase(data);
			ReactGA.event({
				category: "User Started Chat",
				action: "User Started Chat",
			});

			ReactPixel.track("User Started Chat", {
				action: "User Started Chat",
				page: "Home Page",
			});

			setCaseId(response._id);
			setSubmitted(true);
			setMessages((prev) => [
				...prev,
				{
					messageBy: { customerName: "System" },
					message: "A representative will be with you in 3 to 5 minutes",
					date: new Date(), // Add the current date-time
				},
			]); // Add system message
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
			ReactGA.event({
				category: "User Rated Chat",
				action: "User Rated Chat",
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

	// Handle hotel selection and set hotelId
	const handleHotelChange = (value, option) => {
		setHotelName(option.children); // Set hotel name
		setHotelId(value); // Store the hotelId
	};

	const handleInquiryChange = (value) => {
		setInquiryAbout(value);
		if (value !== "others") {
			setOtherInquiry(""); // Reset other inquiry field if not selected
		}
		if (value !== "reservation") {
			setReservationNumber(""); // Reset reservation number field if not reservation
		}
	};

	return (
		<ChatWindowWrapper
			isMinimized={isMinimized}
			dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
		>
			<ChatWindowHeader>
				<h3>
					{chosenLanguage === "Arabic" ? "دعم العملاء" : "Customer Support"}
				</h3>
				<Button
					type='text'
					icon={<CloseOutlined />}
					onClick={closeChatWindow}
				/>
			</ChatWindowHeader>
			{isRatingVisible ? (
				<RatingSection>
					<h4>
						{chosenLanguage === "Arabic" ? "قيم خدمتنا" : "Rate Our Service"}
					</h4>
					<StarRatings
						rating={rating}
						starRatedColor='var(--secondary-color)'
						changeRating={setRating}
						numberOfStars={5}
						name='rating'
						starDimension='20px'
						starSpacing='2px'
					/>
					<RatingButtons>
						<Button
							type='primary'
							onClick={() => {
								handleRateService(rating);
							}}
						>
							{chosenLanguage === "Arabic" ? "إرسال التقييم" : "Submit Rating"}
						</Button>
						<Button onClick={handleSkipRating}>
							{chosenLanguage === "Arabic" ? "تخطي" : "Skip"}
						</Button>
					</RatingButtons>
				</RatingSection>
			) : submitted && !isMinimized ? (
				<div>
					<MessagesContainer>
						{messages &&
							messages.map((msg, index) => (
								<Message
									key={index}
									isAdminMessage={
										msg.messageBy.customerEmail ===
											"management@xhotelpro.com" ||
										msg.messageBy.customerName === "Admin"
									}
								>
									<strong>{msg.messageBy.customerName}:</strong>{" "}
									{renderMessageWithLinks(msg.message)}
								</Message>
							))}
						<div ref={messagesEndRef} />
					</MessagesContainer>

					{typingStatus && <TypingStatus>{typingStatus}</TypingStatus>}
					<Form.Item>
						<ChatInputContainer>
							<Input.TextArea
								placeholder={
									chosenLanguage === "Arabic"
										? "اكتب رسالتك..."
										: "Type your message..."
								}
								value={newMessage}
								onChange={handleInputChange}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault(); // Prevent default Enter behavior
										handleSendMessage(); // Send the message
									}
								}}
								autoSize={{ minRows: 1, maxRows: 5 }} // Allows dynamic resizing
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
							{chosenLanguage === "Arabic" ? "إرسال" : "Send"}
						</SendButton>
						<CloseButton type='danger' onClick={handleCloseChat}>
							<CloseOutlined />{" "}
							{chosenLanguage === "Arabic" ? "إغلاق المحادثة" : "Close Chat"}
						</CloseButton>
					</Form.Item>
				</div>
			) : !isMinimized ? (
				<Form layout='vertical' onFinish={handleSubmit}>
					<Form.Item
						label={chosenLanguage === "Arabic" ? "الاسم الكامل" : "Full Name"}
						required
					>
						<Input
							value={customerName}
							placeholder={
								chosenLanguage === "Arabic"
									? "الاسم الأول الاسم الأخير"
									: "FirstName LastName"
							}
							onChange={(e) => setCustomerName(e.target.value)}
							disabled={isAuthenticated()}
						/>
					</Form.Item>
					<Form.Item
						label={
							chosenLanguage === "Arabic"
								? "البريد الإلكتروني أو رقم الهاتف"
								: "Email or Phone Number"
						}
						required
						rules={[
							{
								required: true,
								message:
									chosenLanguage === "Arabic"
										? "يرجى إدخال بريد إلكتروني أو رقم هاتف صحيح"
										: "Please enter a valid email or phone number",
								validator: (_, value) => {
									if (!value) {
										return Promise.reject();
									}
									// Regex for validating email
									const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
									// Regex for validating phone number
									const phoneRegex = /^[0-9]{10,15}$/;
									if (emailRegex.test(value) || phoneRegex.test(value)) {
										return Promise.resolve();
									}
									return Promise.reject();
								},
							},
						]}
					>
						<Input
							value={customerEmail}
							placeholder={
								chosenLanguage === "Arabic"
									? "على سبيل المثال client@gmail.com أو 1234567890"
									: "e.g. client@gmail.com or 1234567890"
							}
							onChange={(e) => setCustomerEmail(e.target.value)}
							disabled={isAuthenticated()}
						/>
					</Form.Item>
					<Form.Item
						label={chosenLanguage === "Arabic" ? "اختر الفندق" : "Select Hotel"}
						required
					>
						<Select
							showSearch
							placeholder={
								chosenLanguage === "Arabic" ? "اختر فندقًا" : "Select a hotel"
							}
							optionFilterProp='children'
							value={hotelId || undefined}
							onChange={handleHotelChange}
							filterOption={(input, option) =>
								option.children.toLowerCase().includes(input.toLowerCase())
							}
							style={{
								textTransform: "capitalize",
								textAlign: chosenLanguage === "Arabic" ? "right" : "",
							}}
						>
							<Option
								key='674cf8997e3780f1f838d458'
								value='674cf8997e3780f1f838d458'
								style={{
									textTransform: "capitalize",
									fontWeight: "bold",
									color: "darkred",
								}}
							>
								{chosenLanguage === "Arabic"
									? "التحدث مع إدارة جنات"
									: "Speak With Jannat Booking"}
							</Option>
							{activeHotels &&
								activeHotels.map((hotel) => (
									<Option
										key={hotel._id}
										value={hotel._id}
										style={{ textTransform: "capitalize" }}
									>
										{hotel.hotelName}
									</Option>
								))}
						</Select>
					</Form.Item>
					<Form.Item
						label={
							chosenLanguage === "Arabic" ? "الاستفسار عن" : "Inquiry About"
						}
						required
					>
						<Select
							value={inquiryAbout}
							onChange={handleInquiryChange}
							style={{ textAlign: chosenLanguage === "Arabic" ? "right" : "" }}
						>
							{(selectedHotel && selectedHotel.hotelName) ||
							hotelName ||
							hotelId ? null : (
								<Option
									value='Speak With Jannat Booking'
									style={{
										textTransform: "capitalize",
										fontWeight: "bold",
										color: "darkred",
									}}
								>
									{chosenLanguage === "Arabic"
										? "التحدث مع حجز جنات"
										: "Speak With Jannat Booking"}
								</Option>
							)}

							<Option value='reserve_room'>
								{chosenLanguage === "Arabic" ? "حجز غرفة" : "Reserve A Room"}
							</Option>
							<Option value='reserve_bed'>
								{chosenLanguage === "Arabic" ? "حجز سرير" : "Reserve A Bed"}
							</Option>
							<Option value='payment_inquiry'>
								{chosenLanguage === "Arabic"
									? "استفسار عن الدفع"
									: "Payment Inquiry"}
							</Option>
							<Option value='reservation'>
								{chosenLanguage === "Arabic"
									? "استفسار عن الحجز"
									: "Reservation Inquiry"}
							</Option>
							<Option value='others'>
								{chosenLanguage === "Arabic" ? "أخرى" : "Others"}
							</Option>
						</Select>
					</Form.Item>

					{inquiryAbout === "others" && (
						<Form.Item
							label={
								chosenLanguage === "Arabic"
									? "يرجى تحديد استفسارك"
									: "Please specify your inquiry"
							}
							required
						>
							<Input
								value={otherInquiry}
								onChange={(e) => setOtherInquiry(e.target.value)}
							/>
						</Form.Item>
					)}

					{inquiryAbout === "reservation" && (
						<Form.Item
							label={
								chosenLanguage === "Arabic"
									? "رقم تأكيد الحجز"
									: "Reservation Confirmation Number"
							}
							required
						>
							<Input
								value={reservationNumber}
								onChange={(e) => setReservationNumber(e.target.value)}
							/>
						</Form.Item>
					)}

					<Form.Item>
						<Button type='primary' htmlType='submit'>
							{chosenLanguage === "Arabic" ? "بدء المحادثة" : "Start Chat"}
						</Button>
					</Form.Item>
				</Form>
			) : null}
		</ChatWindowWrapper>
	);
};

export default ChatWindow;

// Styled-components

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
		bottom: 85px;
		max-height: ${({ isMinimized }) => (isMinimized ? "40px" : "80vh")};
		height: ${({ isMinimized }) => (isMinimized ? "40px" : "80vh")};
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
		color: var(--text-color-dark);
	}
`;

const MessagesContainer = styled.div`
	max-height: 55vh;
	margin-bottom: 10px;
	overflow-x: hidden;
	overflow-y: auto; /* Added for y-axis scrolling */
	scroll-behavior: smooth;
`;

const Message = styled.p`
	word-wrap: break-word;
	white-space: pre-wrap; /* This preserves new lines */
	background-color: ${(props) =>
		props.isAdminMessage
			? "var(--admin-message-bg)"
			: "var(--user-message-bg)"};
	color: ${(props) =>
		props.isAdminMessage
			? "var(--admin-message-color)"
			: "var(--user-message-color)"};
	padding: 8px;
	border-radius: 5px;
	margin: 5px 0;
	line-height: 1.5;
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
	width: 300px;
	height: 300px;
	overflow: hidden;
`;

const SendButton = styled(Button)`
	background-color: var(--button-bg-primary);
	color: var(--button-font-color);
	width: 100%;
	margin-top: 10px;
	font-weight: bold;
`;

const CloseButton = styled(Button)`
	background-color: var(--secondary-color-dark);
	color: var(--button-font-color);
	width: 100%;
	margin-top: 10px;
	font-weight: bold;
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
