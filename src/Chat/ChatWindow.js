// ChatWindow.jsx
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Button, Input, Select, Form, Upload, message } from "antd";
import { UploadOutlined, CloseOutlined, SmileOutlined } from "@ant-design/icons";
import styled, { keyframes } from "styled-components";
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

/** ---------------- Language helpers ---------------- */
const LANGUAGES = [
	{ label: "English", code: "en", rtl: false },
	{ label: "Arabic (Fos7a)", code: "ar", rtl: true },
	{ label: "Arabic (Egyptian)", code: "ar-eg", rtl: true },
	{ label: "Spanish", code: "es", rtl: false },
	{ label: "French", code: "fr", rtl: false },
	{ label: "Urdu", code: "ur", rtl: true },
	{ label: "Hindi", code: "hi", rtl: false },
];
const LANG_BY_LABEL = Object.fromEntries(LANGUAGES.map((l) => [l.label, l]));
const isRTL = (label) => LANG_BY_LABEL[label]?.rtl ?? false;
const langCodeOf = (label) => LANG_BY_LABEL[label]?.code ?? "en";
const RTL_MESSAGE_LANGUAGE_PATTERN = /(arabic|urdu|\bar\b|\bur\b|العربية|اردو)/i;
const RTL_SCRIPT_PATTERN = /[\u0590-\u08FF]/;

const isRtlMessage = (message = {}, fallbackLanguage = "") => {
	const languageText = [
		message.preferredLanguage,
		message.preferredLanguageCode,
		fallbackLanguage,
	]
		.filter(Boolean)
		.join(" ");
	if (RTL_MESSAGE_LANGUAGE_PATTERN.test(languageText)) return true;
	return RTL_SCRIPT_PATTERN.test(String(message.message || ""));
};

/** ---------------- i18n (UI strings) ---------------- */
// For brevity: reuse Arabic UI text for both "Arabic (Fos7a)" and "Arabic (Egyptian)"
const I18N = {
	English: {
		customerSupport: "Customer Support",
		rateOurService: "Rate Our Service",
		submitRating: "Submit Rating",
		skip: "Skip",
		typeMessage: "Type your message...",
		send: "Send",
		closeChat: "Close Chat",
		fullName: "Full Name",
		emailOrPhone: "Email or Phone Number",
		selectHotel: "Select Hotel",
		selectAHotel: "Select a hotel",
		inquiryAbout: "Inquiry About",
		speakWithJB: "Speak With Jannat Booking",
		reserveRoom: "Room pricing / availability",
		reserveBed: "Bed pricing / availability",
		paymentInquiry: "Payment Inquiry",
		reservationInquiry: "Update / questions about reservation",
		others: "Others",
		specifyInquiry: "Please specify your inquiry",
		reservationNumber: "Reservation Confirmation Number",
		startChat: "Start Chat",
		preferredLanguage: "Preferred Language",
		systemHold: "Jannat Booking support is reviewing your message now.",
		isTyping: "is typing…",
		aiPaused:
			"We’re temporarily away. A representative will assist you shortly.",
		v_fullName: "Please enter your full name.",
		v_emailPhone: "Please enter a valid email address or phone number.",
		v_hotel: "Please select a hotel.",
		v_inquiryType: "Please select an inquiry type.",
		v_reservation: "Please provide your reservation confirmation number.",
		v_others: "Please provide details for your inquiry.",
		v_addText: "Please add text to your message.",
		thanksFeedback: "Thank you for your feedback!",
	},
	"Arabic (Fos7a)": {
		customerSupport: "دعم العملاء",
		rateOurService: "قيّم خدمتنا",
		submitRating: "إرسال التقييم",
		skip: "تخطي",
		typeMessage: "اكتب رسالتك...",
		send: "إرسال",
		closeChat: "إغلاق المحادثة",
		fullName: "الاسم الكامل",
		emailOrPhone: "البريد الإلكتروني أو رقم الهاتف",
		selectHotel: "اختر الفندق",
		selectAHotel: "اختر فندقًا",
		inquiryAbout: "الاستفسار عن",
		speakWithJB: "التحدث مع حجز جنات",
		reserveRoom: "حجز غرفة",
		reserveBed: "حجز سرير",
		paymentInquiry: "استفسار عن الدفع",
		reservationInquiry: "استفسار عن الحجز",
		others: "أخرى",
		specifyInquiry: "يرجى تحديد استفسارك",
		reservationNumber: "رقم تأكيد الحجز",
		startChat: "بدء المحادثة",
		preferredLanguage: "اللغة المفضلة",
		systemHold: "فريق Jannat Booking يراجع رسالتك الآن.",
		isTyping: "يكتب…",
		aiPaused: "نحن غير متاحين مؤقتًا. سيتواصل معك ممثل قريبًا.",
		v_fullName: "يرجى إدخال اسمك الكامل.",
		v_emailPhone: "يرجى إدخال بريد إلكتروني أو رقم هاتف صالح.",
		v_hotel: "يرجى اختيار فندق.",
		v_inquiryType: "يرجى اختيار نوع الاستفسار.",
		v_reservation: "يرجى إدخال رقم تأكيد الحجز.",
		v_others: "يرجى توضيح تفاصيل الاستفسار.",
		v_addText: "يرجى إضافة نص إلى رسالتك.",
		thanksFeedback: "شكرًا لملاحظاتك!",
	},
	"Arabic (Egyptian)": {
		customerSupport: "دعم العملاء",
		rateOurService: "قيّم خدمتنا",
		submitRating: "إرسال التقييم",
		skip: "تخطي",
		typeMessage: "اكتب رسالتك...",
		send: "إرسال",
		closeChat: "إغلاق المحادثة",
		fullName: "الاسم الكامل",
		emailOrPhone: "البريد الإلكتروني أو رقم الهاتف",
		selectHotel: "اختر الفندق",
		selectAHotel: "اختر فندقًا",
		inquiryAbout: "الاستفسار عن",
		speakWithJB: "التحدث مع حجز جنات",
		reserveRoom: "حجز غرفة",
		reserveBed: "حجز سرير",
		paymentInquiry: "استفسار عن الدفع",
		reservationInquiry: "استفسار عن الحجز",
		others: "أخرى",
		specifyInquiry: "يرجى تحديد استفسارك",
		reservationNumber: "رقم تأكيد الحجز",
		startChat: "بدء المحادثة",
		preferredLanguage: "اللغة المفضلة",
		systemHold: "فريق Jannat Booking يراجع رسالتك الآن.",
		isTyping: "يكتب…",
		aiPaused: "نحن غير متاحين مؤقتًا. سيتواصل معك ممثل قريبًا.",
		v_fullName: "يرجى إدخال اسمك الكامل.",
		v_emailPhone: "يرجى إدخال بريد إلكتروني أو رقم هاتف صالح.",
		v_hotel: "يرجى اختيار فندق.",
		v_inquiryType: "يرجى اختيار نوع الاستفسار.",
		v_reservation: "يرجى إدخال رقم تأكيد الحجز.",
		v_others: "يرجى توضيح تفاصيل الاستفسار.",
		v_addText: "يرجى إضافة نص إلى رسالتك.",
		thanksFeedback: "شكرًا لملاحظاتك!",
	},
	Spanish: {
		customerSupport: "Atención al Cliente",
		rateOurService: "Califica nuestro servicio",
		submitRating: "Enviar calificación",
		skip: "Omitir",
		typeMessage: "Escribe tu mensaje...",
		send: "Enviar",
		closeChat: "Cerrar chat",
		fullName: "Nombre completo",
		emailOrPhone: "Correo electrónico o número de teléfono",
		selectHotel: "Seleccionar hotel",
		selectAHotel: "Selecciona un hotel",
		inquiryAbout: "Consulta sobre",
		speakWithJB: "Hablar con Jannat Booking",
		reserveRoom: "Reservar una habitación",
		reserveBed: "Reservar una cama",
		paymentInquiry: "Consulta de pago",
		reservationInquiry: "Consulta de reserva",
		others: "Otros",
		specifyInquiry: "Por favor, especifica tu consulta",
		reservationNumber: "Número de confirmación de reserva",
		startChat: "Iniciar chat",
		preferredLanguage: "Idioma preferido",
		systemHold: "Un representante te atenderá en 3 a 5 minutos",
		isTyping: "está escribiendo…",
		aiPaused: "Estamos temporalmente ausentes. Un agente te atenderá en breve.",
		v_fullName: "Por favor, introduce tu nombre completo.",
		v_emailPhone: "Introduce un correo o teléfono válido.",
		v_hotel: "Por favor, selecciona un hotel.",
		v_inquiryType: "Por favor, selecciona el tipo de consulta.",
		v_reservation: "Introduce tu número de confirmación de reserva.",
		v_others: "Especifica los detalles de tu consulta.",
		v_addText: "Por favor, escribe tu mensaje.",
		thanksFeedback: "¡Gracias por tus comentarios!",
	},
	French: {
		customerSupport: "Service Client",
		rateOurService: "Évaluer notre service",
		submitRating: "Envoyer l’évaluation",
		skip: "Ignorer",
		typeMessage: "Écrivez votre message...",
		send: "Envoyer",
		closeChat: "Fermer le chat",
		fullName: "Nom complet",
		emailOrPhone: "E-mail ou numéro de téléphone",
		selectHotel: "Sélectionner un hôtel",
		selectAHotel: "Sélectionnez un hôtel",
		inquiryAbout: "Sujet de la demande",
		speakWithJB: "Parler avec Jannat Booking",
		reserveRoom: "Réserver une chambre",
		reserveBed: "Réserver un lit",
		paymentInquiry: "Question de paiement",
		reservationInquiry: "Question de réservation",
		others: "Autres",
		specifyInquiry: "Veuillez préciser votre demande",
		reservationNumber: "Numéro de confirmation de réservation",
		startChat: "Démarrer le chat",
		preferredLanguage: "Langue préférée",
		systemHold: "Un agent sera avec vous dans 3 à 5 minutes",
		isTyping: "est en train d’écrire…",
		aiPaused: "Nous sommes momentanément indisponibles. Un agent arrive.",
		v_fullName: "Veuillez saisir votre nom complet.",
		v_emailPhone: "Veuillez saisir un e-mail ou un téléphone valide.",
		v_hotel: "Veuillez sélectionner un hôtel.",
		v_inquiryType: "Veuillez sélectionner le type de demande.",
		v_reservation: "Veuillez saisir votre numéro de confirmation.",
		v_others: "Veuillez préciser votre demande.",
		v_addText: "Veuillez saisir un message.",
		thanksFeedback: "Merci pour votre retour !",
	},
	Urdu: {
		customerSupport: "خدمتِ صارفین",
		rateOurService: "ہماری خدمت کی درجہ بندی کریں",
		submitRating: "درجہ بندی بھیجیں",
		skip: "نظر انداز کریں",
		typeMessage: "اپنا پیغام لکھیں...",
		send: "بھیجیں",
		closeChat: "چیٹ بند کریں",
		fullName: "پورا نام",
		emailOrPhone: "ای میل یا فون نمبر",
		selectHotel: "ہوٹل منتخب کریں",
		selectAHotel: "ایک ہوٹل منتخب کریں",
		inquiryAbout: "استفسار",
		speakWithJB: "جنّت بُکنگ سے بات کریں",
		reserveRoom: "کمرہ بُک کریں",
		reserveBed: "بستر بُک کریں",
		paymentInquiry: "ادائیگی سے متعلق سوال",
		reservationInquiry: "بکنگ سے متعلق سوال",
		others: "دیگر",
		specifyInquiry: "براہِ کرم اپنی استفسار کی وضاحت کریں",
		reservationNumber: "بکنگ کنفرمیشن نمبر",
		startChat: "چیٹ شروع کریں",
		preferredLanguage: "پسندیدہ زبان",
		systemHold: "ایک نمائندہ 3 سے 5 منٹ میں آپ سے رابطہ کرے گا",
		isTyping: "لکھ رہے ہیں…",
		aiPaused: "ہم عارضی طور پر دستیاب نہیں۔ نمائندہ جلد رابطہ کرے گا۔",
		v_fullName: "براہِ کرم اپنا پورا نام درج کریں.",
		v_emailPhone: "براہِ کرم درست ای میل یا فون نمبر درج کریں.",
		v_hotel: "براہِ کرم ہوٹل منتخب کریں.",
		v_inquiryType: "براہِ کرم استفسار کی قسم منتخب کریں.",
		v_reservation: "براہِ کرم اپنی بکنگ کا کنفرمیشن نمبر درج کریں.",
		v_others: "براہِ کرم اپنی استفسار کی تفصیل درج کریں.",
		v_addText: "براہِ کرم پیغام لکھیں.",
		thanksFeedback: "آپ کی رائے کا شکریہ!",
	},
	Hindi: {
		customerSupport: "ग्राहक सहायता",
		rateOurService: "हमारी सेवा को रेट करें",
		submitRating: "रेटिंग भेजें",
		skip: "छोड़ें",
		typeMessage: "अपना संदेश लिखें...",
		send: "भेजें",
		closeChat: "चैट बंद करें",
		fullName: "पूरा नाम",
		emailOrPhone: "ईमेल या फ़ोन नंबर",
		selectHotel: "होटल चुनें",
		selectAHotel: "एक होटल चुनें",
		inquiryAbout: "किस बारे में पूछताछ",
		speakWithJB: "जन्नत बुकिंग से बात करें",
		reserveRoom: "कमरा बुक करें",
		reserveBed: "बिस्तर बुक करें",
		paymentInquiry: "भुगतान संबंधी पूछताछ",
		reservationInquiry: "आरक्षण संबंधी पूछताछ",
		others: "अन्य",
		specifyInquiry: "कृपया अपनी पूछताछ लिखें",
		reservationNumber: "आरक्षण पुष्टि संख्या",
		startChat: "चैट शुरू करें",
		preferredLanguage: "पसंदीदा भाषा",
		systemHold: "एक प्रतिनिधि 3 से 5 मिनट में आपसे जुड़ेगा",
		isTyping: "टाइप कर रहे हैं…",
		aiPaused: "हम अस्थायी रूप से उपलब्ध नहीं हैं। प्रतिनिधि शीघ्र ही जोड़ेगा।",
		v_fullName: "कृपया अपना पूरा नाम दर्ज करें.",
		v_emailPhone: "कृपया मान्य ईमेल पता या फ़ोन नंबर दर्ज करें.",
		v_hotel: "कृपया एक होटल चुनें.",
		v_inquiryType: "कृपया पूछताछ का प्रकार चुनें.",
		v_reservation: "कृपया अपनी बुकिंग का पुष्टि नंबर दर्ज करें.",
		v_others: "कृपया अपनी पूछताछ का विवरण दें.",
		v_addText: "कृपया संदेश लिखें.",
		thanksFeedback: "आपकी प्रतिक्रिया के लिए धन्यवाद!",
	},
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(2px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const hasCorruptedEncoding = (value = "") =>
	/\uFFFD|\?{3,}/.test(String(value || ""));

const cleanDisplayText = (value = "", fallback = "") => {
	const text = String(value || "").trim();
	if (!text || hasCorruptedEncoding(text)) return fallback;
	return text;
};

const typingAnim = keyframes`
  0% { opacity: .2; transform: translateY(0); }
  20% { opacity: 1; transform: translateY(-1px); }
  40% { opacity: .2; transform: translateY(0); }
`;

const ChatWindowWrapper = styled.div`
	position: fixed;
	display: flex;
	flex-direction: column;
	right: 20px;
	bottom: 70px;
	width: 360px;
	max-width: 92vw;
	height: calc(var(--app-vh, 1vh) * 70);
	max-height: calc(var(--app-vh, 1vh) * 80);
	background-color: var(--background-light);
	border: 1px solid var(--border-color-dark);
	border-radius: 12px;
	box-shadow: var(--box-shadow-dark);
	padding: 16px;
	z-index: 1001;
	overflow: hidden;
	touch-action: manipulation;
	-webkit-overflow-scrolling: touch;
	padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));

	> form {
		min-height: 0;
		overflow-y: auto;
		padding: 2px 2px 4px;
		-webkit-overflow-scrolling: touch;
	}

	.ant-form-item {
		margin-bottom: 14px;
	}

	.ant-input,
	.ant-select-selector {
		min-height: 42px;
	}

	.ant-select-selection-item,
	.ant-select-selection-placeholder {
		line-height: 40px !important;
	}

	.ant-form-item:last-child .ant-btn {
		min-height: 44px;
		font-weight: 800;
	}

	@media (max-width: 768px) {
		right: 0;
		left: 0;
		bottom: 0;
		width: 100%;
		max-width: 100%;
		height: calc((var(--app-vh, 1vh) * 100) - 8px);
		max-height: calc((var(--app-vh, 1vh) * 100) - 8px);
		border-radius: 14px 14px 0 0;
		padding: 10px 10px calc(10px + env(safe-area-inset-bottom, 0px)) 10px;

		.ant-form-item {
			margin-bottom: 12px;
		}

		.ant-form-item-label {
			padding-bottom: 3px;
		}

		.ant-input,
		.ant-select-selector {
			min-height: 44px;
			font-size: 16px;
		}
	}

	@media (max-width: 480px) {
		height: calc(var(--app-vh, 1vh) * 100);
		max-height: calc(var(--app-vh, 1vh) * 100);
		border-radius: 0;
		padding: 8px 8px calc(8px + env(safe-area-inset-bottom, 0px)) 8px;
	}
`;

const ChatWindowHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 10px;
	border-bottom: 1px solid var(--border-color-light);
	padding-bottom: 8px;
	margin-bottom: 8px;
	background-color: var(--background-light);
	flex: 0 0 auto;

	h3 {
		margin: 0;
		min-width: 0;
		font-size: 1.2rem;
		font-weight: bold;
		color: var(--text-color-dark);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	button {
		flex: 0 0 auto;
		width: 38px;
		height: 38px;
	}

	@media (max-width: 768px) {
		padding-bottom: 7px;
		margin-bottom: 7px;

		h3 {
			font-size: 1.05rem;
		}
	}
`;

const ChatBody = styled.div`
	display: flex;
	flex-direction: column;
	min-height: 0;
	flex: 1 1 auto;
`;

const MessagesContainer = styled.div`
	flex: 1 1 auto;
	min-height: 0;
	display: flex;
	flex-direction: column;
	gap: 8px;
	overflow-x: hidden;
	overflow-y: auto;
	scroll-behavior: smooth;
	padding: 2px 2px 8px 2px;

	@media (max-width: 768px) {
		gap: 7px;
		margin-bottom: 4px;
		padding-bottom: 10px;
	}
`;

const Message = styled.p`
	word-wrap: break-word;
	white-space: pre-wrap;
	align-self: ${(props) => (props.isAdminMessage ? "flex-start" : "flex-end")};
	width: fit-content;
	max-width: min(86%, 620px);
	background-color: ${(props) =>
		props.isAdminMessage
			? "var(--admin-message-bg)"
			: "var(--user-message-bg)"};
	color: ${(props) =>
		props.isAdminMessage
			? "var(--admin-message-color)"
			: "var(--user-message-color)"};
	padding: 9px 11px;
	border-radius: ${(props) =>
		props.isAdminMessage ? "12px 12px 12px 4px" : "12px 12px 4px 12px"};
	margin: 0;
	line-height: 1.5;
	font-size: 0.95rem;
	box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
	animation: ${fadeIn} 120ms ease-out both;
	text-align: ${(props) => (props.$isRtl ? "right" : "left")};
	direction: ${(props) => (props.$isRtl ? "rtl" : "ltr")};
	unicode-bidi: plaintext;

	@media (max-width: 768px) {
		max-width: 88%;
		padding: 10px 12px;
		font-size: 0.96rem;
	}
`;

const MessageSender = styled.strong`
	display: block;
	margin-bottom: 3px;
	font-weight: 800;
	line-height: 1.35;
`;

const MessageBody = styled.span`
	display: block;
	line-height: 1.55;
	overflow-wrap: anywhere;
`;

const TypingStatus = styled.div`
	margin: 6px 2px 8px 2px;
	color: var(--text-color-dark);
	font-style: italic;
	font-size: 0.85rem;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	gap: 8px;
	text-align: ${(props) => (props.$isRtl ? "right" : "left")};
	direction: ${(props) => (props.$isRtl ? "rtl" : "ltr")};

	.dots {
		display: inline-flex;
		gap: 4px;
	}
	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--text-color-dark);
		animation: ${typingAnim} 1.2s infinite ease-in-out;
	}
	.dot:nth-child(2) {
		animation-delay: 0.15s;
	}
	.dot:nth-child(3) {
		animation-delay: 0.3s;
	}
`;

const ComposerWrapper = styled.div`
	position: sticky;
	bottom: 0;
	background: var(--background-light);
	padding-top: 8px;
	border-top: 1px solid var(--border-color-light);
	flex: 0 0 auto;

	@media (max-width: 768px) {
		padding-top: 7px;
	}
`;

const ChatInputContainer = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) 40px 40px;
	align-items: center;
	gap: 6px;

	textarea {
		min-height: 42px !important;
		max-height: 126px;
		resize: none;
	}

	button {
		width: 40px;
		height: 40px;
		padding: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.ant-upload {
		display: block;
	}

	@media (max-width: 768px) {
		grid-template-columns: minmax(0, 1fr) 42px 42px;
		gap: 7px;

		button {
			width: 42px;
			height: 42px;
		}
	}
`;

const EmojiPickerWrapper = styled.div`
	position: absolute;
	bottom: 120px;
	right: 20px;
	z-index: 1002;
	width: 300px;
	max-width: 90vw;
	max-height: 50vh;
	overflow: hidden;

	@media (max-width: 768px) {
		right: 10px;
		left: 10px;
		bottom: 150px;
		width: auto;
		max-width: none;
		max-height: min(360px, 48vh);
	}
`;

const SendButton = styled(Button)`
	background-color: var(--button-bg-primary);
	color: var(--button-font-color);
	width: 100%;
	margin-top: 8px;
	font-weight: bold;
	height: 40px;

	@media (max-width: 768px) {
		height: 44px;
		margin-top: 7px;
		font-size: 0.98rem;
	}
`;

const CloseButton = styled(Button)`
	background-color: var(--secondary-color-dark);
	color: var(--button-font-color);
	width: 100%;
	margin-top: 8px;
	font-weight: bold;
	height: 40px;

	@media (max-width: 768px) {
		height: 42px;
		margin-top: 7px;
	}
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

/* ===== Component ===== */
const ChatWindow = ({ closeChatWindow, selectedHotel, chosenLanguage }) => {
	/** ---------------- State ---------------- */
	const [activeHotels, setActiveHotels] = useState([]);
	const [customerName, setCustomerName] = useState("");
	const [customerEmail, setCustomerEmail] = useState("");
	const [orderNumber, setOrderNumber] = useState("");
	const [productName, setProductName] = useState("");
	const [otherInquiry, setOtherInquiry] = useState("");
	const [reservationNumber, setReservationNumber] = useState("");
	const [hotelId, setHotelId] = useState("674cf8997e3780f1f838d458");
	const [inquiryAbout, setInquiryAbout] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [messages, setMessages] = useState([]);
	const [newMessage, setNewMessage] = useState("");
	const [caseId, setCaseId] = useState("");
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [fileList, setFileList] = useState([]);
	const [isRatingVisible, setIsRatingVisible] = useState(false);
	const [rating, setRating] = useState(0);
	const [typingStatus, setTypingStatus] = useState(""); // display text "X is typing…"
	const [isMinimized] = useState(false);

	// local guard to suppress showing counterpart typing while user is typing
	const [isUserTypingLocal, setIsUserTypingLocal] = useState(false);

	// refs
	const agentTypingTimeoutRef = useRef(null);
	const selfStopTypingRef = useRef(null);
	const userTypingLocalTimeoutRef = useRef(null);
	const messagesEndRef = useRef(null);

	const caseIdRef = useRef(caseId);
	const nameRef = useRef(customerName);
	const isUserTypingLocalRef = useRef(false);
	const TRef = useRef(I18N.English);
	const lastAgentNameRef = useRef(""); // remember latest agent display name

	// Dedup for optimistic echo
	const seenTagsRef = useRef(new Set());

	// i18n
	const defaultLang = I18N[chosenLanguage] ? chosenLanguage : "English";
	const [preferredLanguage, setPreferredLanguage] = useState(defaultLang);
	const T = I18N[preferredLanguage] || I18N.English;

	useEffect(() => {
		TRef.current = T;
	}, [T]);

	useEffect(() => {
		caseIdRef.current = caseId;
	}, [caseId]);

	useEffect(() => {
		nameRef.current = customerName;
	}, [customerName]);

	useEffect(() => {
		isUserTypingLocalRef.current = isUserTypingLocal;
	}, [isUserTypingLocal]);

	/** ---------------- Mobile viewport/keyboard handling ---------------- */
	useLayoutEffect(() => {
		const setVh = () => {
			const vh =
				(window.visualViewport
					? window.visualViewport.height
					: window.innerHeight) * 0.01;
			document.documentElement.style.setProperty("--app-vh", `${vh}px`);
			scrollToBottom();
		};
		setVh();

		window.addEventListener("resize", setVh);
		window.addEventListener("orientationchange", setVh);
		if (window.visualViewport) {
			window.visualViewport.addEventListener("resize", setVh);
			window.visualViewport.addEventListener("scroll", setVh);
		}
		return () => {
			window.removeEventListener("resize", setVh);
			window.removeEventListener("orientationchange", setVh);
			if (window.visualViewport) {
				window.visualViewport.removeEventListener("resize", setVh);
				window.visualViewport.removeEventListener("scroll", setVh);
			}
		};
	}, []);

	/** ---------------- Prefill selected hotel ---------------- */
	useEffect(() => {
		if (selectedHotel && selectedHotel.hotelName) {
			setHotelId(selectedHotel._id);
			setInquiryAbout("reserve_room");
		} else {
			setHotelId("674cf8997e3780f1f838d458");
			setInquiryAbout("reserve_room");
		}
	}, [selectedHotel]);

	/** ---------------- Prefill user & restore chat ---------------- */
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
			if (savedChat.preferredLanguage)
				setPreferredLanguage(savedChat.preferredLanguage);
			fetchSupportCase(savedChat.caseId);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	/** ---------------- Socket handlers (register once) ---------------- */
	useEffect(() => {
		const pushMessageIfNew = (msg) => {
			const tag =
				msg.clientTag ||
				`${msg.messageBy?.customerName || ""}|${msg.message || ""}|${
					msg.date ? new Date(msg.date).getTime() : Date.now()
				}`;
			if (seenTagsRef.current.has(tag)) return;
			seenTagsRef.current.add(tag);
			if (seenTagsRef.current.size > 500) {
				const first = seenTagsRef.current.values().next().value;
				seenTagsRef.current.delete(first);
			}
			setMessages((prev) => [...prev, msg]);
			setTypingStatus(""); // ensure any typing indicator is cleared when a message lands
			markMessagesAsSeen(caseIdRef.current);
			setTimeout(scrollToBottom, 20);
		};

		const onReceiveMessage = (messageData) => {
			if (!messageData) return;
			if (messageData.caseId && messageData.caseId !== caseIdRef.current)
				return;
			pushMessageIfNew(messageData);
		};

		const onCloseCase = (data) => {
			if (data.case?._id === caseIdRef.current) setIsRatingVisible(true);
		};

		const onCaseClosed = (data) => {
			if (data.caseId === caseIdRef.current) setIsRatingVisible(true);
		};

		const onTyping = (data) => {
			if (!data || data.caseId !== caseIdRef.current) return;

			// Use server-sent name (AI agent or human agent)
			const otherName = data.name || "";
			if (otherName) lastAgentNameRef.current = otherName;

			// Do not show "typing…" if we're locally typing (no overlap)
			if (isUserTypingLocalRef.current) return;

			// Prevent echoing our own typing status
			if (otherName && otherName === nameRef.current) return;

			const label = otherName || "Agent";
			setTypingStatus(`${label} ${TRef.current.isTyping}`);

			// Auto-clear typing indicator if server didn't send stopTyping
			if (agentTypingTimeoutRef.current)
				clearTimeout(agentTypingTimeoutRef.current);
			agentTypingTimeoutRef.current = setTimeout(() => {
				setTypingStatus("");
			}, 5000);
		};

		// Clear instantly on stop
		const onStopTyping = (data) => {
			if (!data || data.caseId !== caseIdRef.current) return;
			setTypingStatus("");
			if (agentTypingTimeoutRef.current) {
				clearTimeout(agentTypingTimeoutRef.current);
				agentTypingTimeoutRef.current = null;
			}
		};

		const onConnected = () => {
			if (caseIdRef.current) {
				socket.emit("joinRoom", { caseId: caseIdRef.current });
				setTimeout(() => fetchSupportCase(caseIdRef.current), 800);
			}
		};

		const onAiPaused = (data) => {
			if (data.caseId === caseIdRef.current) {
				pushMessageIfNew({
					messageBy: { customerName: "System" },
					message: TRef.current.aiPaused,
					date: new Date(),
					caseId: caseIdRef.current,
					isAi: true,
				});
			}
		};

		const onNewChat = (payload) => {
			// case inserted—backend watcher may emit this; optional
			if (payload?.caseId && payload.caseId === caseIdRef.current) {
				setTimeout(() => fetchSupportCase(caseIdRef.current), 400);
			}
		};

		socket.on("connect", onConnected);
		socket.on("receiveMessage", onReceiveMessage);
		socket.on("closeCase", onCloseCase);
		socket.on("caseClosed", onCaseClosed);
		socket.on("typing", onTyping);
		socket.on("stopTyping", onStopTyping);
		socket.on("aiPaused", onAiPaused);
		socket.on("newChat", onNewChat);

		const onVisibility = () => {
			if (document.visibilityState === "visible" && caseIdRef.current) {
				fetchSupportCase(caseIdRef.current);
			}
		};
		document.addEventListener("visibilitychange", onVisibility);

		return () => {
			socket.off("connect", onConnected);
			socket.off("receiveMessage", onReceiveMessage);
			socket.off("closeCase", onCloseCase);
			socket.off("caseClosed", onCaseClosed);
			socket.off("typing", onTyping);
			socket.off("stopTyping", onStopTyping);
			socket.off("aiPaused", onAiPaused);
			socket.off("newChat", onNewChat);
			document.removeEventListener("visibilitychange", onVisibility);

			if (agentTypingTimeoutRef.current)
				clearTimeout(agentTypingTimeoutRef.current);
			if (selfStopTypingRef.current) clearTimeout(selfStopTypingRef.current);
			if (userTypingLocalTimeoutRef.current)
				clearTimeout(userTypingLocalTimeoutRef.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // register once

	/** ---------------- Join/leave room per case ---------------- */
	useEffect(() => {
		if (caseId) {
			socket.emit("joinRoom", { caseId });
			setTimeout(() => fetchSupportCase(caseId), 700);
			return () => socket.emit("leaveRoom", { caseId });
		}
	}, [caseId]);

	/** ---------------- Persist + seen ---------------- */
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
				preferredLanguage,
			};
			localStorage.setItem("currentChat", JSON.stringify(saveChat));
			markMessagesAsSeen(caseId);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
		preferredLanguage,
	]);

	/** ---------------- Helpers ---------------- */
	const renderMessageWithLinks = (text) => {
		const safeText = typeof text === "string" ? text : "";
		if (!safeText) return null;
		const linkRegex = /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s]+)/g;
		return safeText.split(linkRegex).map((part, index) => {
			const markdown = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
			if (markdown) {
				return (
					<a
						key={index}
						href={markdown[2]}
						target='_blank'
						rel='noopener noreferrer'
					>
						{markdown[1]}
					</a>
				);
			}
			return /^https?:\/\//.test(part) ? (
				<a key={index} href={part} target='_blank' rel='noopener noreferrer'>
					{part}
				</a>
			) : (
				part
			);
		});
	};

	const fetchSupportCase = async (id) => {
		try {
			if (!id) return;
			const supportCase = await getSupportCaseById(id);
			if (Array.isArray(supportCase.conversation)) {
				setMessages(supportCase.conversation);
				seenTagsRef.current = new Set();
			}
		} catch (err) {
			console.error("Error fetching support case", err);
		}
	};

	const markMessagesAsSeen = async (cid) => {
		try {
			if (!cid) return;
			await updateSeenByCustomer(cid);
		} catch (err) {
			console.error("Error marking messages as seen", err);
		}
	};

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "end",
		});
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages, typingStatus]);

	useEffect(() => {
		const fetchHotel = async () => {
			try {
				const hotelData = await gettingActiveHotelList();
				setActiveHotels(hotelData);
			} catch (error) {
				console.error("Error fetching hotels:", error);
			}
		};
		fetchHotel();
	}, []);

	const handleInputChange = (e) => {
		setNewMessage(e.target.value);

		// local typing guard (do not show agent typing while guest is typing)
		setIsUserTypingLocal(true);
		if (userTypingLocalTimeoutRef.current)
			clearTimeout(userTypingLocalTimeoutRef.current);
		userTypingLocalTimeoutRef.current = setTimeout(
			() => setIsUserTypingLocal(false),
			1200
		);

		// notify server (guest typing)
		socket.emit("typing", { name: customerName, caseId });

		// schedule stopTyping
		if (selfStopTypingRef.current) clearTimeout(selfStopTypingRef.current);
		selfStopTypingRef.current = setTimeout(() => {
			socket.emit("stopTyping", { name: customerName, caseId });
		}, 1500);
	};

	const handleSubmit = async () => {
		if (!customerName || !/\s/.test(customerName)) {
			message.error(T.v_fullName);
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const phoneRegex = /^[0-9]{10,15}$/;

		if (
			!customerEmail ||
			(!emailRegex.test(customerEmail) && !phoneRegex.test(customerEmail))
		) {
			message.error(T.v_emailPhone);
			return;
		}

		if (!hotelId) {
			message.error(T.v_hotel);
			return;
		}

		if (!inquiryAbout) {
			message.error(T.v_inquiryType);
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
			message.error(T.v_reservation);
			return;
		}

		if (
			inquiryAbout === "others" &&
			(!otherInquiry || otherInquiry.trim() === "")
		) {
			message.error(T.v_others);
			return;
		}

		const ownerId =
			(activeHotels &&
				activeHotels.filter((i) => i._id === hotelId) &&
				activeHotels.filter((i) => i._id === hotelId)[0] &&
				activeHotels.filter((i) => i._id === hotelId)[0].belongsTo) ||
			"6553f1c6d06c5cea2f98a838";

		const langCode = langCodeOf(preferredLanguage);
		const inquiryDetailsWithLanguage = `[Preferred Language: ${preferredLanguage} (${langCode})] ${
			inquiryDetails ? inquiryDetails : `Inquiry To ${inquiryAbout}`
		}`;

		const data = {
			customerName: customerName,
			displayName1: customerName,
			displayName2: "Fareda Elsheemy",
			role: 0,
			customerEmail,
			hotelId: hotelId || "674cf8997e3780f1f838d458",
			inquiryAbout,
			inquiryDetails: inquiryDetailsWithLanguage,
			supporterId: "6553f1c6d06c5cea2f98a838",
			ownerId: ownerId,
			preferredLanguage: preferredLanguage,
			preferredLanguageCode: langCode,
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

			// Join the room right away for real-time greeting
			socket.emit("joinRoom", { caseId: response._id });

			setMessages((prev) => [
				...prev,
				{
					messageBy: { customerName: "System" },
					message: T.systemHold,
					date: new Date(),
					caseId: response._id,
				},
			]);

			setTimeout(() => fetchSupportCase(response._id), 1200);
			setTimeout(() => fetchSupportCase(response._id), 3500);
		} catch (err) {
			console.error("Error creating support case", err);
		}
	};

	const handleSendMessage = async () => {
		if (!newMessage || !newMessage.trim()) {
			message.error(T.v_addText);
			return;
		}

		const clientTag = `${Date.now()}_${Math.random().toString(36).slice(2)}`;

		const messageData = {
			messageBy: { customerName, customerEmail },
			message: newMessage,
			date: new Date(),
			caseId,
			preferredLanguage,
			preferredLanguageCode: langCodeOf(preferredLanguage),
			clientTag, // for dedup on echo
		};

		// Optimistic UI
		setMessages((prev) => [...prev, messageData]);
		seenTagsRef.current.add(clientTag);
		scrollToBottom();

		try {
			await updateSupportCase(caseId, { conversation: messageData });
			socket.emit("sendMessage", messageData);
			setNewMessage("");
			socket.emit("stopTyping", { name: customerName, caseId });

			setTimeout(() => fetchSupportCase(caseId), 1200);
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
			ReactGA.event({ category: "User Rated Chat", action: "User Rated Chat" });
			localStorage.removeItem("currentChat");
			setIsRatingVisible(false);
			closeChatWindow();
			message.success(T.thanksFeedback);
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
		setNewMessage((prevMessage) => (prevMessage || "") + emojiObject.emoji);
		setShowEmojiPicker(false);
	};

	const handleFileChange = ({ fileList: files }) => {
		setFileList(files);
	};

	const onComposerFocus = () => {
		setTimeout(scrollToBottom, 50);
	};

	// Heuristics: mark message as "admin/agent"
	const isAgentMessage = (msg) => {
		const senderEmail = msg?.messageBy?.customerEmail || "";
		const senderName = msg?.messageBy?.customerName || "";
		const sys = senderName === "System";
		const fromSelf = senderEmail && senderEmail === (customerEmail || "");
		if (msg?.isSystem) return true;
		if (sys || fromSelf) return false;
		if (msg?.isAi) return true; // backend flag for AI agent
		if (senderEmail === "support@jannatbooking.com") return true;
		if (senderEmail === "management@xhotelpro.com") return true;
		if (senderName === "Admin") return true;
		// If there is no senderEmail but there's a name different than the guest, assume agent
		if (!senderEmail && senderName && senderName !== customerName) return true;
		return false;
	};

	const typingName = () => {
		return lastAgentNameRef.current || "Agent";
	};

	return (
		<ChatWindowWrapper
			isMinimized={isMinimized}
			dir={isRTL(preferredLanguage) ? "rtl" : "ltr"}
			aria-live='polite'
			aria-relevant='additions'
		>
			<ChatWindowHeader>
				<h3>{T.customerSupport}</h3>
				<Button
					type='text'
					icon={<CloseOutlined />}
					onClick={closeChatWindow}
				/>
			</ChatWindowHeader>

			{isRatingVisible ? (
				<RatingSection>
					<h4>{T.rateOurService}</h4>
					<StarRatings
						rating={rating}
						starRatedColor='var(--secondary-color)'
						changeRating={setRating}
						numberOfStars={5}
						name='rating'
						starDimension='22px'
						starSpacing='4px'
					/>
					<RatingButtons>
						<Button type='primary' onClick={() => handleRateService(rating)}>
							{T.submitRating}
						</Button>
						<Button onClick={handleSkipRating}>{T.skip}</Button>
					</RatingButtons>
				</RatingSection>
			) : submitted && !isMinimized ? (
				<ChatBody>
					<MessagesContainer role='log' aria-live='polite'>
						{Array.isArray(messages) &&
							messages
								.filter(
									(msg) =>
										typeof msg?.message === "string" &&
										msg.message.trim() !== ""
								)
								.map((msg, index) => {
									const messageRtl = isRtlMessage(msg, preferredLanguage);
									const senderName = cleanDisplayText(
										msg.messageBy?.customerName,
										isAgentMessage(msg) ? "Jannat Booking" : customerName
									);
									const messageText = cleanDisplayText(
										msg.message,
										isRTL(preferredLanguage)
											? "تعذر عرض هذا النص بسبب مشكلة في الترميز."
											: "This text could not be displayed because of an encoding issue."
									);
									return (
										<Message
											key={`${index}-${msg.clientTag || ""}`}
											isAdminMessage={isAgentMessage(msg)}
											$isRtl={messageRtl}
											dir={messageRtl ? "rtl" : "ltr"}
										>
											<MessageSender dir='auto'>
												{senderName}
											</MessageSender>
											<MessageBody dir={messageRtl ? "rtl" : "auto"}>
												{renderMessageWithLinks(messageText)}
											</MessageBody>
										</Message>
									);
								})}

						{/* Agent typing indicator (animated dots). Suppressed while the user is typing locally. */}
						{!!typingStatus && !isUserTypingLocal && (
							<TypingStatus
								$isRtl={isRTL(preferredLanguage)}
								dir={isRTL(preferredLanguage) ? "rtl" : "ltr"}
								aria-live='polite'
								aria-label={typingStatus}
							>
								<strong dir='auto'>{typingName()}</strong>
								<span>{T.isTyping}</span>
								<span className='dots' aria-hidden='true'>
									<span className='dot' />
									<span className='dot' />
									<span className='dot' />
								</span>
							</TypingStatus>
						)}

						<div ref={messagesEndRef} />
					</MessagesContainer>

					<ComposerWrapper>
						<ChatInputContainer>
							<Input.TextArea
								placeholder={T.typeMessage}
								value={newMessage}
								onChange={handleInputChange}
								onFocus={onComposerFocus}
								onBlur={() =>
									socket.emit("stopTyping", { name: customerName, caseId })
								}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleSendMessage();
									}
								}}
								autoSize={{ minRows: 1, maxRows: 6 }}
								style={{
									flexGrow: 1,
									textAlign: isRTL(preferredLanguage) ? "right" : "left",
									direction: isRTL(preferredLanguage) ? "rtl" : "ltr",
								}}
							/>
							<Button
								aria-label='Emoji'
								icon={<SmileOutlined />}
								onClick={() => setShowEmojiPicker(!showEmojiPicker)}
							/>
							{showEmojiPicker && (
								<EmojiPickerWrapper>
									<EmojiPicker
										onEmojiClick={handleEmojiClick}
										disableAutoFocus={true}
									/>
								</EmojiPickerWrapper>
							)}
							<Upload
								fileList={fileList}
								onChange={handleFileChange}
								beforeUpload={() => false}
							>
								<Button icon={<UploadOutlined />} aria-label='Attach file' />
							</Upload>
						</ChatInputContainer>
						<SendButton type='primary' onClick={handleSendMessage}>
							{T.send}
						</SendButton>
						<CloseButton danger onClick={handleCloseChat}>
							<CloseOutlined /> {T.closeChat}
						</CloseButton>
					</ComposerWrapper>
				</ChatBody>
			) : (
				<Form layout='vertical' onFinish={handleSubmit}>
					{/* Preferred Language */}
					<Form.Item label={T.preferredLanguage} required>
						<Select
							value={preferredLanguage}
							onChange={(val) => setPreferredLanguage(val)}
							dropdownMatchSelectWidth
							style={{ textAlign: isRTL(preferredLanguage) ? "right" : "left" }}
						>
							{LANGUAGES.map((l) => (
								<Option key={l.label} value={l.label}>
									{l.label}
								</Option>
							))}
						</Select>
					</Form.Item>

					<Form.Item label={T.fullName} required>
						<Input
							value={customerName}
							placeholder={
								/Arabic/.test(preferredLanguage)
									? "الاسم الأول الاسم الأخير"
									: "FirstName LastName"
							}
							onChange={(e) => setCustomerName(e.target.value)}
							disabled={isAuthenticated()}
						/>
					</Form.Item>

					<Form.Item
						label={T.emailOrPhone}
						required
						rules={[
							{
								required: true,
								message: T.v_emailPhone,
								validator: (_, value) => {
									if (!value) return Promise.reject();
									const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
									const phoneRegex = /^[0-9]{10,15}$/;
									return emailRegex.test(value) || phoneRegex.test(value)
										? Promise.resolve()
										: Promise.reject();
								},
							},
						]}
					>
						<Input
							value={customerEmail}
							placeholder={
								/Arabic/.test(preferredLanguage)
									? "مثال: client@gmail.com أو 1234567890"
									: "e.g. client@gmail.com or 1234567890"
							}
							onChange={(e) => setCustomerEmail(e.target.value)}
							disabled={isAuthenticated()}
						/>
					</Form.Item>

					<Form.Item label={T.selectHotel} required>
						<Select
							showSearch
							placeholder={T.selectAHotel}
							optionFilterProp='children'
							value={hotelId || undefined}
							onChange={(value) => setHotelId(value)}
							filterOption={(input, option) =>
								typeof option?.children === "string"
									? option.children.toLowerCase().includes(input.toLowerCase())
									: false
							}
							style={{
								textTransform: "capitalize",
								textAlign: isRTL(preferredLanguage) ? "right" : "left",
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
								{T.speakWithJB}
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

					<Form.Item label={T.inquiryAbout} required>
						<Select
							value={inquiryAbout}
							onChange={(value) => {
								setInquiryAbout(value);
								if (value !== "others") setOtherInquiry("");
								if (value !== "reservation") setReservationNumber("");
							}}
							style={{ textAlign: isRTL(preferredLanguage) ? "right" : "left" }}
						>
							<Option value='reserve_room'>{T.reserveRoom}</Option>
							<Option value='reserve_bed'>{T.reserveBed}</Option>
							<Option value='payment_inquiry'>{T.paymentInquiry}</Option>
							<Option value='reservation'>{T.reservationInquiry}</Option>
							<Option value='others'>{T.others}</Option>
						</Select>
					</Form.Item>

					{inquiryAbout === "others" && (
						<Form.Item label={T.specifyInquiry} required>
							<Input
								value={otherInquiry}
								onChange={(e) => setOtherInquiry(e.target.value)}
							/>
						</Form.Item>
					)}

					{inquiryAbout === "reservation" && (
						<Form.Item label={T.reservationNumber} required>
							<Input
								value={reservationNumber}
								onChange={(e) => setReservationNumber(e.target.value)}
							/>
						</Form.Item>
					)}

					<Form.Item>
						<Button type='primary' htmlType='submit' block>
							{T.startChat}
						</Button>
					</Form.Item>
				</Form>
			)}
		</ChatWindowWrapper>
	);
};

export default ChatWindow;
