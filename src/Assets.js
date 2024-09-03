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
