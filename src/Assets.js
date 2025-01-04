import { WifiOutlined, CarOutlined, CoffeeOutlined } from "@ant-design/icons";
import {
	FaAirFreshener,
	FaBed,
	FaSmoking,
	FaBan,
	FaSwimmingPool,
	FaDumbbell,
	FaUtensils,
	FaSpa,
	FaConciergeBell,
	FaTshirt,
	FaDog,
	FaBriefcase,
	FaRunning,
	FaCoffee,
	FaWheelchair,
	FaBicycle,
	FaHotTub,
	FaGolfBall,
	FaTableTennis,
	FaChild,
	FaUmbrellaBeach,
	FaWater,
	FaRoad,
	FaTree,
	FaCity,
	FaMountain,
	FaMosque,
	FaPrayingHands,
	FaQuran, // Replacement for FaBookQuran
	FaTv,
	FaShoppingCart,
	FaMapMarked,
	FaHiking,
	FaKaaba,
	FaPray,
	FaShuttleVan,
} from "react-icons/fa";

export const defaultHotelDetails = {
	hotelAmenities: ["WiFi", "Pool", "Gym"],
	hotelFloors: 0,
	overallRoomsCount: 0,
	roomCountDetails: {
		standardRooms: 0,
		standardRoomsPrice: {
			basePrice: 0,
			seasonPrice: 0,
			weekendPrice: 0,
			lastMinuteDealPrice: 0,
		},
		singleRooms: 0,
		singleRoomsPrice: {
			basePrice: 0,
			seasonPrice: 0,
			weekendPrice: 0,
			lastMinuteDealPrice: 0,
		},
		doubleRooms: 0,
		doubleRoomsPrice: {
			basePrice: 0,
			seasonPrice: 0,
			weekendPrice: 0,
			lastMinuteDealPrice: 0,
		},
		twinRooms: 0,
		twinRoomsPrice: {
			basePrice: 0,
			seasonPrice: 0,
			weekendPrice: 0,
			lastMinuteDealPrice: 0,
		},
		queenRooms: 0,
		queenRoomsPrice: {
			basePrice: 0,
			seasonPrice: 0,
			weekendPrice: 0,
			lastMinuteDealPrice: 0,
		},
		kingRooms: 0,
		kingRoomsPrice: {
			basePrice: 0,
			seasonPrice: 0,
			weekendPrice: 0,
			lastMinuteDealPrice: 0,
		},
		tripleRooms: 0,
		tripleRoomsPrice: {
			basePrice: 0,
			seasonPrice: 0,
			weekendPrice: 0,
			lastMinuteDealPrice: 0,
		},
		quadRooms: 0,
		quadRoomsPrice: {
			basePrice: 0,
			seasonPrice: 0,
			weekendPrice: 0,
			lastMinuteDealPrice: 0,
		},
		studioRooms: 0,
		studioRoomsPrice: {
			basePrice: 0,
			seasonPrice: 0,
			weekendPrice: 0,
			lastMinuteDealPrice: 0,
		},
		suite: 0,
		suitePrice: {
			basePrice: 0,
			seasonPrice: 0,
			weekendPrice: 0,
			lastMinuteDealPrice: 0,
		},
		masterSuite: 0,
		masterSuitePrice: {
			basePrice: 0,
			seasonPrice: 0,
			weekendPrice: 0,
			lastMinuteDealPrice: 0,
		},
		familyRooms: 0,
		familyRoomsPrice: {
			basePrice: 0,
			seasonPrice: 0,
			weekendPrice: 0,
			lastMinuteDealPrice: 0,
		},
	},
	hotelRating: 3.5,
	parkingLot: true,
};

export const defaultUserValues = {
	name: "",
	email: "",
	password: "",
	password2: "",
	phone: "",
	hotelName: "",
	hotelCountry: "KSA",
	hotelState: "",
	hotelCity: "",
	hotelAddress: "",
	error: "",
	success: false,
	misMatch: false,
	redirectToReferrer: "",
	loading: false,
	propertyType: "Hotel",
	hotelFloors: 1,
};

export const defaultRoomValues = {
	room_number: "000",
	room_type: "",
	room_features: [
		{
			bedSize: "Double",
			view: "city view",
			bathroom: ["bathtub", "jacuzzi"],
			airConditiong: "climate control features",
			television: "Smart TV",
			internet: ["WiFi", "Ethernet Connection"],
			Minibar: ["Refrigerator with drinks & snacks"],
			smoking: false,
		},
	],
	room_pricing: {
		basePrice: 0,
		seasonPrice: 0,
		weekendPrice: 0,
		lastMinuteDealPrice: 0,
	},
	floor: 0,
	roomColorCode: "#000",
};

export const BedSizes = ["Single", "Double", "Queen", "King", "Twin"];
export const Views = [
	"City View",
	"Sea View",
	"Garden View",
	"Mountain View",
	"Pool View",
];
export const roomTypes = [
	"standardRooms",
	"singleRooms",
	"doubleRooms",
	"twinRooms",
	"queenRooms",
	"kingRooms",
	"tripleRooms",
	"quadRooms",
	"studioRooms",
	"suite",
	"masterSuite",
	"familyRooms",
];

export const roomTypeColors = {
	standardRooms: "#003366", // Dark Blue
	singleRooms: "#8B0000", // Dark Red
	doubleRooms: "#004d00", // Dark Green
	twinRooms: "#800080", // Dark Purple
	queenRooms: "#FF8C00", // Dark Orange
	kingRooms: "#2F4F4F", // Dark Slate Gray
	tripleRooms: "#8B4513", // Saddle Brown
	quadRooms: "#00008B", // Navy
	studioRooms: "#696969", // Dim Gray
	suite: "#483D8B", // Dark Slate Blue
	masterSuite: "#556B2F", // Dark Olive Green
	familyRooms: "#A52A2A", // Brown
};

export const amenitiesList = [
	// Basic Amenities
	{ name: "WiFi", icon: <WifiOutlined /> },
	{ name: "TV", icon: <FaTv /> }, // Replaced TvOutlined with FaTv
	{ name: "Air Conditioning", icon: <FaAirFreshener /> },
	{ name: "Mini Bar", icon: <FaBed /> },
	{ name: "Smoking", icon: <FaSmoking /> },
	{ name: "Non-Smoking", icon: <FaBan /> },
	{ name: "Pool", icon: <FaSwimmingPool /> },
	{ name: "Gym", icon: <FaDumbbell /> },
	{ name: "Restaurant", icon: <FaUtensils /> },
	{ name: "Bar", icon: <CoffeeOutlined /> },
	{ name: "Spa", icon: <FaSpa /> },
	{ name: "Room Service", icon: <FaConciergeBell /> },
	{ name: "Laundry Service", icon: <FaTshirt /> },
	{ name: "Free Parking", icon: <CarOutlined /> },
	{ name: "Pet Friendly", icon: <FaDog /> },
	{ name: "Business Center", icon: <FaBriefcase /> },
	{ name: "Airport Shuttle", icon: <FaShuttleVan /> },
	{ name: "Fitness Center", icon: <FaRunning /> },
	{ name: "Breakfast Included", icon: <FaCoffee /> },
	{ name: "Accessible Rooms", icon: <FaWheelchair /> },
	{ name: "Bicycle Rental", icon: <FaBicycle /> },
	{ name: "Sauna", icon: <FaHotTub /> },
	{ name: "Hot Tub", icon: <FaHotTub /> },
	{ name: "Golf Course", icon: <FaGolfBall /> },
	{ name: "Tennis Court", icon: <FaTableTennis /> },
	{ name: "Kids' Club", icon: <FaChild /> },
	{ name: "Beachfront", icon: <FaUmbrellaBeach /> },
];

export const viewsList = [
	// Views
	{ name: "Sea View", icon: <FaWater /> },
	{ name: "Street View", icon: <FaRoad /> },
	{ name: "Garden View", icon: <FaTree /> },
	{ name: "City View", icon: <FaCity /> },
	{ name: "Mountain View", icon: <FaMountain /> },
	{ name: "Holy Haram View", icon: <FaMosque /> },
];

export const extraAmenitiesList = [
	// Additional Amenities for Makkah, KSA
	{ name: "Prayer Mat", icon: <FaPrayingHands /> },
	{ name: "Holy Quran", icon: <FaQuran /> }, // Replaced FaBookQuran with FaQuran
	{ name: "Islamic Television Channels", icon: <FaTv /> },
	{ name: "Shuttle Service to Haram", icon: <FaShuttleVan /> },
	{ name: "Nearby Souks/Markets", icon: <FaShoppingCart /> },
	{ name: "Arabic Coffee & Dates Service", icon: <FaCoffee /> },
	{ name: "Cultural Tours/Guides", icon: <FaMapMarked /> },
	{ name: "Private Pilgrimage Services", icon: <FaHiking /> },
	{ name: "Complimentary Zamzam Water", icon: <FaWater /> },
	{ name: "Halal-certified Restaurant", icon: <FaUtensils /> },
	{ name: "Hajj & Umrah Booking Assistance", icon: <FaKaaba /> },
	{ name: "Dedicated Prayer Room", icon: <FaPray /> },
];

export const countryList = [
	"Afghanistan",
	"Albania",
	"Algeria",
	"American Samoa",
	"Andorra",
	"Angola",
	"Anguilla",
	"Antarctica",
	"Antigua and Barbuda",
	"Argentina",
	"Armenia",
	"Aruba",
	"Australia",
	"Austria",
	"Azerbaijan",
	"Bahamas",
	"Bahrain",
	"Bangladesh",
	"Barbados",
	"Belarus",
	"Belgium",
	"Belize",
	"Benin",
	"Bermuda",
	"Bhutan",
	"Bolivia (Plurinational State of)",
	"Bonaire, Sint Eustatius and Saba",
	"Bosnia and Herzegovina",
	"Botswana",
	"Bouvet Island",
	"Brazil",
	"British Indian Ocean Territory",
	"Brunei Darussalam",
	"Bulgaria",
	"Burkina Faso",
	"Burundi",
	"Cabo Verde",
	"Cambodia",
	"Cameroon",
	"Canada",
	"Cayman Islands",
	"Central African Republic",
	"Chad",
	"Chile",
	"China",
	"Christmas Island",
	"Cocos (Keeling) Islands",
	"Colombia",
	"Comoros",
	"Congo (the Democratic Republic of the)",
	"Congo",
	"Cook Islands",
	"Costa Rica",
	"Croatia",
	"Cuba",
	"Curaçao",
	"Cyprus",
	"Czechia",
	"Côte d'Ivoire",
	"Denmark",
	"Djibouti",
	"Dominica",
	"Dominican Republic",
	"Ecuador",
	"Egypt",
	"El Salvador",
	"Equatorial Guinea",
	"Eritrea",
	"Estonia",
	"Eswatini",
	"Ethiopia",
	"Falkland Islands [Malvinas]",
	"Faroe Islands",
	"Fiji",
	"Finland",
	"France",
	"French Guiana",
	"French Polynesia",
	"French Southern Territories",
	"Gabon",
	"Gambia",
	"Georgia",
	"Germany",
	"Ghana",
	"Gibraltar",
	"Greece",
	"Greenland",
	"Grenada",
	"Guadeloupe",
	"Guam",
	"Guatemala",
	"Guernsey",
	"Guinea",
	"Guinea-Bissau",
	"Guyana",
	"Haiti",
	"Heard Island and McDonald Islands",
	"Holy See",
	"Honduras",
	"Hong Kong",
	"Hungary",
	"Iceland",
	"India",
	"Indonesia",
	"Iran (Islamic Republic of)",
	"Iraq",
	"Ireland",
	"Isle of Man",
	"Israel",
	"Italy",
	"Jamaica",
	"Japan",
	"Jersey",
	"Jordan",
	"Kazakhstan",
	"Kenya",
	"Kiribati",
	"Korea (the Democratic People's Republic of)",
	"Korea (the Republic of)",
	"Kuwait",
	"Kyrgyzstan",
	"Lao People's Democratic Republic",
	"Latvia",
	"Lebanon",
	"Lesotho",
	"Liberia",
	"Libya",
	"Liechtenstein",
	"Lithuania",
	"Luxembourg",
	"Macao",
	"Madagascar",
	"Malawi",
	"Malaysia",
	"Maldives",
	"Mali",
	"Malta",
	"Marshall Islands",
	"Martinique",
	"Mauritania",
	"Mauritius",
	"Mayotte",
	"Mexico",
	"Micronesia (Federated States of)",
	"Moldova (the Republic of)",
	"Monaco",
	"Mongolia",
	"Montenegro",
	"Montserrat",
	"Morocco",
	"Mozambique",
	"Myanmar",
	"Namibia",
	"Nauru",
	"Nepal",
	"Netherlands",
	"New Caledonia",
	"New Zealand",
	"Nicaragua",
	"Niger",
	"Nigeria",
	"Niue",
	"Norfolk Island",
	"Northern Mariana Islands",
	"Norway",
	"Oman",
	"Pakistan",
	"Palau",
	"Palestine, State of",
	"Panama",
	"Papua New Guinea",
	"Paraguay",
	"Peru",
	"Philippines",
	"Pitcairn",
	"Poland",
	"Portugal",
	"Puerto Rico",
	"Qatar",
	"Republic of North Macedonia",
	"Romania",
	"Russian Federation",
	"Rwanda",
	"Réunion",
	"Saint Barthélemy",
	"Saint Helena, Ascension and Tristan da Cunha",
	"Saint Kitts and Nevis",
	"Saint Lucia",
	"Saint Martin (French part)",
	"Saint Pierre and Miquelon",
	"Saint Vincent and the Grenadines",
	"Samoa",
	"San Marino",
	"Sao Tome and Principe",
	"Saudi Arabia",
	"Senegal",
	"Serbia",
	"Seychelles",
	"Sierra Leone",
	"Singapore",
	"Sint Maarten (Dutch part)",
	"Slovakia",
	"Slovenia",
	"Solomon Islands",
	"Somalia",
	"South Africa",
	"South Georgia and the South Sandwich Islands",
	"South Sudan",
	"Spain",
	"Sri Lanka",
	"Sudan",
	"Suriname",
	"Svalbard and Jan Mayen",
	"Sweden",
	"Switzerland",
	"Syrian Arab Republic",
	"Taiwan",
	"Tajikistan",
	"Tanzania, United Republic of",
	"Thailand",
	"Timor-Leste",
	"Togo",
	"Tokelau",
	"Tonga",
	"Trinidad and Tobago",
	"Tunisia",
	"Turkey",
	"Turkmenistan",
	"Turks and Caicos Islands",
	"Tuvalu",
	"Uganda",
	"Ukraine",
	"United Arab Emirates",
	"United Kingdom of Great Britain and Northern Ireland",
	"United States Minor Outlying Islands",
	"United States of America",
	"Uruguay",
	"Uzbekistan",
	"Vanuatu",
	"Venezuela (Bolivarian Republic of)",
	"Viet Nam",
	"Virgin Islands (British)",
	"Virgin Islands (U.S.)",
	"Wallis and Futuna",
	"Western Sahara",
	"Yemen",
	"Zambia",
	"Zimbabwe",
	"Åland Islands",
];

export const countryListWithAbbreviations = [
	{ name: "Afghanistan", code: "AF" },
	{ name: "Albania", code: "AL" },
	{ name: "Algeria", code: "DZ" },
	{ name: "American Samoa", code: "AS" },
	{ name: "Andorra", code: "AD" },
	{ name: "Angola", code: "AO" },
	{ name: "Anguilla", code: "AI" },
	{ name: "Antarctica", code: "AQ" },
	{ name: "Antigua and Barbuda", code: "AG" },
	{ name: "Argentina", code: "AR" },
	{ name: "Armenia", code: "AM" },
	{ name: "Aruba", code: "AW" },
	{ name: "Australia", code: "AU" },
	{ name: "Austria", code: "AT" },
	{ name: "Azerbaijan", code: "AZ" },
	{ name: "Bahamas", code: "BS" },
	{ name: "Bahrain", code: "BH" },
	{ name: "Bangladesh", code: "BD" },
	{ name: "Barbados", code: "BB" },
	{ name: "Belarus", code: "BY" },
	{ name: "Belgium", code: "BE" },
	{ name: "Belize", code: "BZ" },
	{ name: "Benin", code: "BJ" },
	{ name: "Bermuda", code: "BM" },
	{ name: "Bhutan", code: "BT" },
	{ name: "Bolivia (Plurinational State of)", code: "BO" },
	{ name: "Bonaire, Sint Eustatius and Saba", code: "BQ" },
	{ name: "Bosnia and Herzegovina", code: "BA" },
	{ name: "Botswana", code: "BW" },
	{ name: "Bouvet Island", code: "BV" },
	{ name: "Brazil", code: "BR" },
	{ name: "British Indian Ocean Territory", code: "IO" },
	{ name: "Brunei Darussalam", code: "BN" },
	{ name: "Bulgaria", code: "BG" },
	{ name: "Burkina Faso", code: "BF" },
	{ name: "Burundi", code: "BI" },
	{ name: "Cabo Verde", code: "CV" },
	{ name: "Cambodia", code: "KH" },
	{ name: "Cameroon", code: "CM" },
	{ name: "Canada", code: "CA" },
	{ name: "Cayman Islands", code: "KY" },
	{ name: "Central African Republic", code: "CF" },
	{ name: "Chad", code: "TD" },
	{ name: "Chile", code: "CL" },
	{ name: "China", code: "CN" },
	{ name: "Christmas Island", code: "CX" },
	{ name: "Cocos (Keeling) Islands", code: "CC" },
	{ name: "Colombia", code: "CO" },
	{ name: "Comoros", code: "KM" },
	{ name: "Congo (the Democratic Republic of the)", code: "CD" },
	{ name: "Congo", code: "CG" },
	{ name: "Cook Islands", code: "CK" },
	{ name: "Costa Rica", code: "CR" },
	{ name: "Croatia", code: "HR" },
	{ name: "Cuba", code: "CU" },
	{ name: "Curaçao", code: "CW" },
	{ name: "Cyprus", code: "CY" },
	{ name: "Czechia", code: "CZ" },
	{ name: "Côte d'Ivoire", code: "CI" },
	{ name: "Denmark", code: "DK" },
	{ name: "Djibouti", code: "DJ" },
	{ name: "Dominica", code: "DM" },
	{ name: "Dominican Republic", code: "DO" },
	{ name: "Ecuador", code: "EC" },
	{ name: "Egypt", code: "EG" },
	{ name: "El Salvador", code: "SV" },
	{ name: "Equatorial Guinea", code: "GQ" },
	{ name: "Eritrea", code: "ER" },
	{ name: "Estonia", code: "EE" },
	{ name: "Eswatini", code: "SZ" },
	{ name: "Ethiopia", code: "ET" },
	{ name: "Falkland Islands [Malvinas]", code: "FK" },
	{ name: "Faroe Islands", code: "FO" },
	{ name: "Fiji", code: "FJ" },
	{ name: "Finland", code: "FI" },
	{ name: "France", code: "FR" },
	{ name: "French Guiana", code: "GF" },
	{ name: "French Polynesia", code: "PF" },
	{ name: "French Southern Territories", code: "TF" },
	{ name: "Gabon", code: "GA" },
	{ name: "Gambia", code: "GM" },
	{ name: "Georgia", code: "GE" },
	{ name: "Germany", code: "DE" },
	{ name: "Ghana", code: "GH" },
	{ name: "Gibraltar", code: "GI" },
	{ name: "Greece", code: "GR" },
	{ name: "Greenland", code: "GL" },
	{ name: "Grenada", code: "GD" },
	{ name: "Guadeloupe", code: "GP" },
	{ name: "Guam", code: "GU" },
	{ name: "Guatemala", code: "GT" },
	{ name: "Guernsey", code: "GG" },
	{ name: "Guinea", code: "GN" },
	{ name: "Guinea-Bissau", code: "GW" },
	{ name: "Guyana", code: "GY" },
	{ name: "Haiti", code: "HT" },
	{ name: "Heard Island and McDonald Islands", code: "HM" },
	{ name: "Holy See", code: "VA" },
	{ name: "Honduras", code: "HN" },
	{ name: "Hong Kong", code: "HK" },
	{ name: "Hungary", code: "HU" },
	{ name: "Iceland", code: "IS" },
	{ name: "India", code: "IN" },
	{ name: "Indonesia", code: "ID" },
	{ name: "Iran (Islamic Republic of)", code: "IR" },
	{ name: "Iraq", code: "IQ" },
	{ name: "Ireland", code: "IE" },
	{ name: "Isle of Man", code: "IM" },
	{ name: "Israel", code: "IL" },
	{ name: "Italy", code: "IT" },
	{ name: "Jamaica", code: "JM" },
	{ name: "Japan", code: "JP" },
	{ name: "Jersey", code: "JE" },
	{ name: "Jordan", code: "JO" },
	{ name: "Kazakhstan", code: "KZ" },
	{ name: "Kenya", code: "KE" },
	{ name: "Kiribati", code: "KI" },
	{ name: "Korea (the Democratic People's Republic of)", code: "KP" },
	{ name: "Korea (the Republic of)", code: "KR" },
	{ name: "Kuwait", code: "KW" },
	{ name: "Kyrgyzstan", code: "KG" },
	{ name: "Lao People's Democratic Republic", code: "LA" },
	{ name: "Latvia", code: "LV" },
	{ name: "Lebanon", code: "LB" },
	{ name: "Lesotho", code: "LS" },
	{ name: "Liberia", code: "LR" },
	{ name: "Libya", code: "LY" },
	{ name: "Liechtenstein", code: "LI" },
	{ name: "Lithuania", code: "LT" },
	{ name: "Luxembourg", code: "LU" },
	{ name: "Macao", code: "MO" },
	{ name: "Madagascar", code: "MG" },
	{ name: "Malawi", code: "MW" },
	{ name: "Malaysia", code: "MY" },
	{ name: "Maldives", code: "MV" },
	{ name: "Mali", code: "ML" },
	{ name: "Malta", code: "MT" },
	{ name: "Marshall Islands", code: "MH" },
	{ name: "Martinique", code: "MQ" },
	{ name: "Mauritania", code: "MR" },
	{ name: "Mauritius", code: "MU" },
	{ name: "Mayotte", code: "YT" },
	{ name: "Mexico", code: "MX" },
	{ name: "Micronesia (Federated States of)", code: "FM" },
	{ name: "Moldova (the Republic of)", code: "MD" },
	{ name: "Monaco", code: "MC" },
	{ name: "Mongolia", code: "MN" },
	{ name: "Montenegro", code: "ME" },
	{ name: "Montserrat", code: "MS" },
	{ name: "Morocco", code: "MA" },
	{ name: "Mozambique", code: "MZ" },
	{ name: "Myanmar", code: "MM" },
	{ name: "Namibia", code: "NA" },
	{ name: "Nauru", code: "NR" },
	{ name: "Nepal", code: "NP" },
	{ name: "Netherlands", code: "NL" },
	{ name: "New Caledonia", code: "NC" },
	{ name: "New Zealand", code: "NZ" },
	{ name: "Nicaragua", code: "NI" },
	{ name: "Niger", code: "NE" },
	{ name: "Nigeria", code: "NG" },
	{ name: "Niue", code: "NU" },
	{ name: "Norfolk Island", code: "NF" },
	{ name: "Northern Mariana Islands", code: "MP" },
	{ name: "Norway", code: "NO" },
	{ name: "Oman", code: "OM" },
	{ name: "Pakistan", code: "PK" },
	{ name: "Palau", code: "PW" },
	{ name: "Palestine, State of", code: "PS" },
	{ name: "Panama", code: "PA" },
	{ name: "Papua New Guinea", code: "PG" },
	{ name: "Paraguay", code: "PY" },
	{ name: "Peru", code: "PE" },
	{ name: "Philippines", code: "PH" },
	{ name: "Pitcairn", code: "PN" },
	{ name: "Poland", code: "PL" },
	{ name: "Portugal", code: "PT" },
	{ name: "Puerto Rico", code: "PR" },
	{ name: "Qatar", code: "QA" },
	{ name: "Republic of North Macedonia", code: "MK" },
	{ name: "Romania", code: "RO" },
	{ name: "Russian Federation", code: "RU" },
	{ name: "Rwanda", code: "RW" },
	{ name: "Réunion", code: "RE" },
	{ name: "Saint Barthélemy", code: "BL" },
	{ name: "Saint Helena, Ascension and Tristan da Cunha", code: "SH" },
	{ name: "Saint Kitts and Nevis", code: "KN" },
	{ name: "Saint Lucia", code: "LC" },
	{ name: "Saint Martin (French part)", code: "MF" },
	{ name: "Saint Pierre and Miquelon", code: "PM" },
	{ name: "Saint Vincent and the Grenadines", code: "VC" },
	{ name: "Samoa", code: "WS" },
	{ name: "San Marino", code: "SM" },
	{ name: "Sao Tome and Principe", code: "ST" },
	{ name: "Saudi Arabia", code: "SA" },
	{ name: "Senegal", code: "SN" },
	{ name: "Serbia", code: "RS" },
	{ name: "Seychelles", code: "SC" },
	{ name: "Sierra Leone", code: "SL" },
	{ name: "Singapore", code: "SG" },
	{ name: "Sint Maarten (Dutch part)", code: "SX" },
	{ name: "Slovakia", code: "SK" },
	{ name: "Slovenia", code: "SI" },
	{ name: "Solomon Islands", code: "SB" },
	{ name: "Somalia", code: "SO" },
	{ name: "South Africa", code: "ZA" },
	{ name: "South Georgia and the South Sandwich Islands", code: "GS" },
	{ name: "South Sudan", code: "SS" },
	{ name: "Spain", code: "ES" },
	{ name: "Sri Lanka", code: "LK" },
	{ name: "Sudan", code: "SD" },
	{ name: "Suriname", code: "SR" },
	{ name: "Svalbard and Jan Mayen", code: "SJ" },
	{ name: "Sweden", code: "SE" },
	{ name: "Switzerland", code: "CH" },
	{ name: "Syrian Arab Republic", code: "SY" },
	{ name: "Taiwan", code: "TW" },
	{ name: "Tajikistan", code: "TJ" },
	{ name: "Tanzania, United Republic of", code: "TZ" },
	{ name: "Thailand", code: "TH" },
	{ name: "Timor-Leste", code: "TL" },
	{ name: "Togo", code: "TG" },
	{ name: "Tokelau", code: "TK" },
	{ name: "Tonga", code: "TO" },
	{ name: "Trinidad and Tobago", code: "TT" },
	{ name: "Tunisia", code: "TN" },
	{ name: "Turkey", code: "TR" },
	{ name: "Turkmenistan", code: "TM" },
	{ name: "Turks and Caicos Islands", code: "TC" },
	{ name: "Tuvalu", code: "TV" },
	{ name: "Uganda", code: "UG" },
	{ name: "Ukraine", code: "UA" },
	{ name: "United Arab Emirates", code: "AE" },
	{ name: "United Kingdom of Great Britain and Northern Ireland", code: "GB" },
	{ name: "United States Minor Outlying Islands", code: "UM" },
	{ name: "United States of America", code: "US" },
	{ name: "Uruguay", code: "UY" },
	{ name: "Uzbekistan", code: "UZ" },
	{ name: "Vanuatu", code: "VU" },
	{ name: "Venezuela (Bolivarian Republic of)", code: "VE" },
	{ name: "Viet Nam", code: "VN" },
	{ name: "Virgin Islands (British)", code: "VG" },
	{ name: "Virgin Islands (U.S.)", code: "VI" },
	{ name: "Wallis and Futuna", code: "WF" },
	{ name: "Western Sahara", code: "EH" },
	{ name: "Yemen", code: "YE" },
	{ name: "Zambia", code: "ZM" },
	{ name: "Zimbabwe", code: "ZW" },
	{ name: "Åland Islands", code: "AX" },
];

// Assets/roomTypesWithTranslations.js

export const roomTypesWithTranslations = [
	{
		roomType: "standardRooms",
		labelEn: "Standard Rooms",
		roomTypeArabic: "غرف ستاندارد",
	},
	{
		roomType: "singleRooms",
		labelEn: "Single Rooms",
		roomTypeArabic: "غرف فردية",
	},
	{
		roomType: "doubleRooms",
		labelEn: "Double Rooms",
		roomTypeArabic: "غرف مزدوجة",
	},
	{
		roomType: "twinRooms",
		labelEn: "Twin Rooms",
		roomTypeArabic: "غرف توين",
	},
	{
		roomType: "queenRooms",
		labelEn: "Queen Rooms",
		roomTypeArabic: "غرف كوين",
	},
	{
		roomType: "kingRooms",
		labelEn: "King Rooms",
		roomTypeArabic: "غرف كينج",
	},
	{
		roomType: "tripleRooms",
		labelEn: "Triple Rooms",
		roomTypeArabic: "غرف ثلاثية",
	},
	{
		roomType: "quadRooms",
		labelEn: "Quad Rooms",
		roomTypeArabic: "غرف رباعية",
	},
	{
		roomType: "studioRooms",
		labelEn: "Studio Rooms",
		roomTypeArabic: "استوديوهات",
	},
	{
		roomType: "suite",
		labelEn: "Suite",
		roomTypeArabic: "أجنحة",
	},
	{
		roomType: "masterSuite",
		labelEn: "Master Suite",
		roomTypeArabic: "الأجنحة الرئيسية",
	},
	{
		roomType: "familyRooms",
		labelEn: "Family Rooms",
		roomTypeArabic: "غرف عائلية",
	},
	{
		roomType: "individualBed",
		labelEn: "Rooms With Individual Beds",
		roomTypeArabic: "غرف بأسرة فردية (غرف مشتركة)",
	},
];

export const translations = {
	English: {
		reservationSummary: "Your Reservation Summary",
		yourReservation: "Your Reservation",
		noRoomsSelected: "No rooms selected.",
		totalRooms: "Total Rooms",
		totalPrice: "Total Price",
		customerDetails: "Customer Details",
		name: "Name",
		phone: "Phone",
		email: "Email",
		password: "Password",
		confirmPassword: "Confirm Password",
		alreadyHaveAccount: "Already Have An Account?",
		clickToSignIn: "Please Click Here To Signin",
		nationality: "Nationality",
		selectCountry: "Select a country",
		acceptTerms: "Accept Terms & Conditions",
		checkTerms:
			"It's highly recommended to check our terms & conditions, especially for refund and cancellation sections 4 & 5.",
		payDeposit: "Pay",
		depositPercent: "Deposit",
		totalAmount: "Pay the whole Total Amount",
		priceBreakdown: "Price Breakdown",
		remove: "Remove",
		dates: "Dates",
		rooms: "room(s)",
		nights: "nights",
		perNight: "per night",
		proceed: "Proceed",
		payNow: "Pay Now",
		requiredField: "This field is required.",
		invalidPhone: "Please provide a valid phone number.",
		invalidEmail: "Please provide a valid email address.",
		invalidName: "Please provide your full name (first and last name).",
		termsRequired: "You must accept the Terms & Conditions before proceeding.",
		SAR: "SAR",
		USD: "USD",
		EUR: "EUR",
		payTotalAmount: "Pay Whole Amount",
	},
	Arabic: {
		reservationSummary: "ملخص الحجز الخاص بك",
		yourReservation: "حجزك",
		noRoomsSelected: "لم يتم اختيار أي غرف.",
		totalRooms: "إجمالي الغرف",
		totalPrice: "إجمالي السعر",
		customerDetails: "تفاصيل العميل",
		name: "الاسم",
		phone: "رقم الهاتف",
		email: "البريد الإلكتروني",
		password: "كلمة المرور",
		confirmPassword: "تأكيد كلمة المرور",
		alreadyHaveAccount: "هل لديك حساب بالفعل؟",
		clickToSignIn: "انقر هنا لتسجيل الدخول",
		nationality: "الجنسية",
		selectCountry: "اختر دولة",
		acceptTerms: "قبول الشروط والأحكام",
		checkTerms:
			"يوصى بشدة بمراجعة الشروط والأحكام خاصةً الأقسام 4 و 5 الخاصة بالاسترداد والإلغاء.",
		payDeposit: "ادفع",
		depositPercent: "الوديعة",
		totalAmount: "ادفع المبلغ الإجمالي",
		priceBreakdown: "تفاصيل السعر",
		remove: "إزالة",
		dates: "التواريخ",
		rooms: "غرفة/غرف",
		nights: "ليالٍ",
		perNight: "لكل ليلة",
		proceed: "تابع",
		payNow: "ادفع الآن",
		requiredField: "هذا الحقل مطلوب.",
		invalidPhone: "يرجى تقديم رقم هاتف صالح.",
		invalidEmail: "يرجى تقديم بريد إلكتروني صالح.",
		invalidName: "يرجى تقديم اسمك الكامل (الاسم الأول واسم العائلة).",
		termsRequired: "يجب قبول الشروط والأحكام قبل المتابعة.",
		SAR: "ريال",
		USD: "دولار",
		EUR: "يورو",
		payTotalAmount: "ادفع المبلغ كاملا",
	},
};
