import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import styled from "styled-components";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import StarRatings from "react-star-ratings";
import { amenitiesList, extraAmenitiesList, viewsList } from "../../Assets";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useCartContext } from "../../cart_context";
import { DatePicker, Button } from "antd";
import Tabs from "./Tabs";
import dayjs from "dayjs";
import StaticRating from "./StaticRating";
import { FaCar, FaWalking } from "react-icons/fa";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import SingleHotelOffers from "./SingleHotelOffers";
import { useHistory, useLocation } from "react-router-dom";

const { RangePicker } = DatePicker;

/* ---------- helpers ---------- */
const getIcon = (item) => {
	const amenity = amenitiesList.find((x) => x.name === item);
	if (amenity) return amenity.icon;
	const view = viewsList.find((x) => x.name === item);
	if (view) return view.icon;
	const extra = extraAmenitiesList.find((x) => x.name === item);
	if (extra) return extra.icon;
	return null;
};

const generateDateRange = (startDate, endDate) => {
	const start = dayjs(startDate);
	const end = dayjs(endDate);
	const out = [];
	let cur = start;
	while (cur < end) {
		out.push(cur.format("YYYY-MM-DD")); // end-exclusive
		cur = cur.add(1, "day");
	}
	return out;
};

const calculatePricingByDay = (
	pricingRate,
	startDate,
	endDate,
	basePrice,
	defaultCost,
	roomCommission
) => {
	const dateRange = generateDateRange(startDate, endDate);
	return dateRange.map((date) => {
		const rate = pricingRate.find((r) => r.calendarDate === date);
		const cRate = rate?.commissionRate
			? rate.commissionRate / 100
			: roomCommission
				? roomCommission / 100
				: parseFloat(process.env.REACT_APP_COMMISSIONRATE) - 1;
		return {
			date,
			price: rate ? parseFloat(rate.price) || 0 : parseFloat(basePrice || 0),
			rootPrice: rate
				? parseFloat(rate.rootPrice) ||
					parseFloat(defaultCost || basePrice || 0)
				: parseFloat(defaultCost || basePrice || 0),
			commissionRate: cRate,
		};
	});
};

const translations = {
	English: {
		overview: "Overview",
		about: "About",
		rooms: "Rooms",
		policies: "Policies",
		comparisons: "Comparisons",
		amenities: "Amenities",
		showMore: "Show more...",
		showLess: "Show less...",
		hide: "Hide",
		addRoom: "Add Room To Reservation",
		notAvailable: "Not Available",
		available: "Available",
		nights: "nights",
		drivingToHaram: "Driving to El Haram",
		walkingToHaram: "Walking to El Haram",
		perNight: "/ Night",
		addToReservation: "Add to Reservation",
		currentPrice: "Current Price",
		freeCancellation: "Free Cancellation",
		SAR: "SAR",
		USD: "USD",
		EUR: "EUR",
		packages: "Packages",
	},
	Arabic: {
		overview: "نظرة عامة",
		about: "حول الفندق",
		rooms: "اختر غرفتك",
		policies: "السياسات",
		comparisons: "مقارنات",
		amenities: "وسائل الراحة",
		showMore: "عرض المزيد...",
		showLess: "عرض أقل...",
		hide: "إخفاء",
		addRoom: "إضافة غرفة إلى الحجز",
		notAvailable: "غير متوفر",
		available: "متاح",
		nights: "ليالٍ",
		drivingToHaram: "بالسيارة إلى الحرم",
		walkingToHaram: "مشياً إلى الحرم",
		perNight: "لكل ليلة",
		addToReservation: "إضافة إلى الحجز",
		currentPrice: "السعر الحالي",
		freeCancellation: "إلغاء مجاني",
		SAR: "ريال",
		USD: "دولار",
		EUR: "يورو",
		packages: "العروض والباقات",
	},
};

const calculatePricingByDayWithCommission = (
	pricingRate,
	startDate,
	endDate,
	basePrice,
	defaultCost,
	commissionRate
) => {
	const days = calculatePricingByDay(
		pricingRate,
		startDate,
		endDate,
		basePrice,
		defaultCost,
		commissionRate
	);
	return days.map((d) => ({
		...d,
		totalPriceWithCommission: Number(
			(
				Number(d.price) +
				Number(d.rootPrice) * Number(d.commissionRate)
			).toFixed(2)
		),
		totalPriceWithoutCommission: Number(d.price),
	}));
};

const getCommissionRate = (roomCommission, hotelCommission) => {
	if (roomCommission) return parseFloat(roomCommission) / 100;
	if (hotelCommission) return parseFloat(hotelCommission) / 100;
	const env = parseFloat(process.env.REACT_APP_COMMISSIONRATE);
	return isNaN(env) ? 0.1 : env - 1;
};
/* ---------- /helpers ---------- */

const SingleHotel = ({ selectedHotel }) => {
	const history = useHistory();
	const location = useLocation();

	const [dateRange, setDateRange] = useState([
		dayjs().add(1, "day"),
		dayjs().add(6, "day"),
	]);
	const [showAllAmenities, setShowAllAmenities] = useState(false);
	const [showAllAmenities2, setShowAllAmenities2] = useState(false);
	const [showFullDescription, setShowFullDescription] = useState(false);

	const [selectedCurrency, setSelectedCurrency] = useState("sar");
	const [currencyRates, setCurrencyRates] = useState({});

	const { addRoomToCart, openSidebar2, chosenLanguage } = useCartContext();
	const t = translations[chosenLanguage] || translations.English;

	// Refs for sections (hooks must run on every render, before any early return)
	const overviewRef = useRef(null);
	const aboutRef = useRef(null);
	const roomsRef = useRef(null);
	const packagesRef = useRef(null);
	const policiesRef = useRef(null);
	const comparisonsRef = useRef(null);

	// Stable map id -> ref
	const refById = useMemo(
		() => ({
			overview: overviewRef,
			about: aboutRef,
			rooms: roomsRef,
			packages: packagesRef,
			policies: policiesRef,
			comparisons: comparisonsRef,
		}),
		[]
	);

	// Sections for Tabs
	const sections = useMemo(
		() => [
			{ id: "overview", label: t.overview, ref: overviewRef },
			{ id: "about", label: t.about, ref: aboutRef },
			{ id: "rooms", label: t.rooms, ref: roomsRef },
			{ id: "packages", label: t.packages, ref: packagesRef },
			{ id: "policies", label: t.policies, ref: policiesRef },
			{ id: "comparisons", label: t.comparisons, ref: comparisonsRef },
		],
		[
			t,
			overviewRef,
			aboutRef,
			roomsRef,
			packagesRef,
			policiesRef,
			comparisonsRef,
		]
	);

	useEffect(() => {
		const currency = (
			localStorage.getItem("selectedCurrency") || "sar"
		).toLowerCase();
		const rates = JSON.parse(localStorage.getItem("rates")) || {
			SAR_USD: 0.27,
			SAR_EUR: 0.25,
		};
		setSelectedCurrency(currency);
		setCurrencyRates(rates);
	}, []);

	// Redirect if hotel is deactivated (side-effect; not during render)
	// useEffect(() => {
	// 	if (selectedHotel && selectedHotel.activateHotel === false) {
	// 		history.replace("/our-hotels");
	// 	}
	// }, [selectedHotel, history]);

	const updateSectionInURL = useCallback(
		(sectionId, replace = true) => {
			const params = new URLSearchParams(location.search);
			params.set("section", sectionId);
			["tab", "goto", "offers", "deals"].forEach((k) => params.delete(k));
			const search = `?${params.toString()}`;
			const dest = { pathname: location.pathname, search };
			if (replace) history.replace(dest);
			else history.push(dest);
		},
		[history, location.pathname, location.search]
	);

	const handleTabClick = useCallback(
		(sectionId) => {
			const el = refById[sectionId]?.current;
			if (!el) return;
			const headerOffset = 80;
			const targetTop =
				el.getBoundingClientRect().top + window.scrollY - headerOffset;
			window.scrollTo({ top: targetTop, behavior: "smooth" });
			updateSectionInURL(sectionId, false);
		},
		[refById, updateSectionInURL]
	);

	// Auto-scroll from URL on load
	const lastScrolledRef = useRef(null);
	const scrollFromURL = useCallback(() => {
		const params = new URLSearchParams(location.search);
		let section = params.get("section") || params.get("tab") || "";
		if (!section) {
			if (
				params.get("pkgId") ||
				params.get("packageId") ||
				params.get("roomId")
			)
				section = "packages";
		}
		if (section === "offers" || section === "deals") section = "packages";
		if (!section) return;

		if (lastScrolledRef.current === section) return;
		lastScrolledRef.current = section;

		const doScroll = () => {
			const el = refById[section]?.current;
			if (!el) return;
			const headerOffset = 80;
			const targetTop =
				el.getBoundingClientRect().top + window.scrollY - headerOffset;
			window.scrollTo({ top: targetTop, behavior: "smooth" });
			updateSectionInURL(section, true);
		};

		const run = () => setTimeout(() => requestAnimationFrame(doScroll), 320);

		if (document.readyState === "complete") run();
		else {
			const onLoad = () => {
				run();
				window.removeEventListener("load", onLoad);
			};
			window.addEventListener("load", onLoad);
		}
	}, [location.search, refById, updateSectionInURL]);

	useEffect(() => {
		scrollFromURL();
	}, [scrollFromURL]);

	const handleDateChange = (dates) => {
		if (dates && dates.length === 2) setDateRange(dates);
		else setDateRange([dayjs().add(1, "day"), dayjs().add(6, "day")]);
	};

	const handleAmenitiesToggle = () => setShowAllAmenities((prev) => !prev);

	const formatAddress = (address = "") => {
		const parts = address.split(",");
		return parts.slice(1).join(", ").trim();
	};

	const handleAddRoomToCart = (room) => {
		const startDate = dateRange[0].format("YYYY-MM-DD");
		const endDate = dateRange[1].format("YYYY-MM-DD");
		const commissionRate = getCommissionRate(
			room.roomCommission,
			selectedHotel.commission
		);
		const pricingByDay = calculatePricingByDay(
			room.pricingRate || [],
			startDate,
			endDate,
			room.price.basePrice,
			room.defaultCost,
			commissionRate * 100
		);

		// Keep for parity (not used directly in UI)
		// eslint purposefully satisfied (const used)
		const pricingByDayWithCommission = calculatePricingByDayWithCommission(
			room.pricingRate || [],
			startDate,
			endDate,
			room.price.basePrice,
			room.defaultCost,
			commissionRate * 100
		);
		void pricingByDayWithCommission; // prevent unused var warning

		const nights = pricingByDay.length;
		const totalPrice = pricingByDay.reduce((s, d) => s + d.price, 0);
		const totalCommission = pricingByDay.reduce(
			(s, d) => s + d.rootPrice * (d.commissionRate || 0),
			0
		);
		const pricePerNight = (totalPrice + totalCommission) / nights;

		const details = {
			id: room._id,
			name: room.displayName,
			nameOtherLanguage: room.displayName_OtherLanguage || room.displayName,
			roomType: room.roomType,
			price: parseFloat(pricePerNight.toFixed(2)),
			defaultCost: room.defaultCost || room.price.basePrice,
			photos: room.photos || [],
			hotelName: selectedHotel.hotelName,
			hotelAddress: selectedHotel.hotelAddress,
		};

		addRoomToCart(
			room._id,
			details,
			startDate,
			endDate,
			selectedHotel._id,
			selectedHotel.belongsTo,
			pricingByDay,
			room.roomColor,
			1,
			0,
			commissionRate
		);

		openSidebar2();
		ReactGA.event({
			category: "User Added Reservation To Cart From Single Hotel",
			action: "User Added Reservation To Cart From Single Hotel",
			label: `User Added Reservation To Cart From Single Hotel`,
		});
		ReactPixel.track("Add_To_Reservation", {
			action: "User Added A Room To The Cart",
			page: "Single Hotel Page",
		});
	};

	const convertCurrency = (amount) => {
		if (selectedCurrency === "usd")
			return (amount * currencyRates.SAR_USD).toFixed(2);
		if (selectedCurrency === "eur")
			return (amount * currencyRates.SAR_EUR).toFixed(2);
		return amount.toFixed(2); // sar
	};

	// ---------- RENDER ----------
	return (
		<SingleHotelWrapper>
			{/* Guard the main content; no early return before hooks */}
			{selectedHotel ? (
				<>
					{/* Hero */}
					<HeroSection dir='ltr'>
						<Swiper
							modules={[Pagination, Autoplay, Thumbs]}
							spaceBetween={10}
							slidesPerView={1}
							pagination={{ clickable: true }}
							autoplay={{ delay: 4000, disableOnInteraction: false }}
							loop
							className='main-swiper'
						>
							{selectedHotel.hotelPhotos.map((photo, i) => (
								<SwiperSlide key={i}>
									<img
										src={photo.url}
										alt={`${selectedHotel.hotelName} - ${i + 1}`}
										className='hotel-image'
									/>
								</SwiperSlide>
							))}
						</Swiper>
					</HeroSection>

					{/* Tabs */}
					<div dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}>
						<Tabs
							sections={sections.map(({ id }) => ({
								id,
								label:
									id === "overview"
										? t.overview
										: id === "about"
											? t.about
											: id === "rooms"
												? t.rooms
												: id === "packages"
													? t.packages
													: id === "policies"
														? t.policies
														: null,
							}))}
							onTabClick={handleTabClick}
							onActiveTabChange={(id) => updateSectionInURL(id, true)}
							chosenLanguage={chosenLanguage}
						/>
					</div>

					{/* Overview */}
					<HotelInfo
						ref={overviewRef}
						id='overview'
						isArabic={chosenLanguage === "Arabic"}
						dir='ltr'
						style={{
							textAlign: chosenLanguage === "Arabic" ? "right" : "left",
							marginRight: chosenLanguage === "Arabic" ? "10px" : "",
						}}
					>
						<h1>
							{chosenLanguage === "Arabic"
								? selectedHotel.hotelName_OtherLanguage ||
									selectedHotel.hotelName
								: selectedHotel.hotelName}
						</h1>
						<p>
							{formatAddress(selectedHotel.hotelAddress)
								.split(",")
								.slice(0, 2)
								.join(", ")}
						</p>
						<Distances isArabic={chosenLanguage === "Arabic"}>
							<FaCar />
							{` ${selectedHotel.distances?.drivingToElHaram} ${t.drivingToHaram}`}
						</Distances>
						<Distances>
							<FaWalking />
							{` ${selectedHotel.distances?.walkingToElHaram} ${t.walkingToHaram}`}
						</Distances>
						<StarRatings
							rating={selectedHotel.hotelRating || 0}
							starRatedColor='orange'
							numberOfStars={5}
							name='rating'
							starDimension='15px'
							starSpacing='1px'
						/>
						<div>
							<StaticRating
								selectedHotel={selectedHotel}
								chosenLanguage={chosenLanguage}
							/>
						</div>
					</HotelInfo>

					{/* About + Map */}
					<HotelOverview
						isArabic={chosenLanguage === "Arabic"}
						ref={aboutRef}
						id='about'
						style={{
							textAlign: chosenLanguage === "Arabic" ? "right" : "",
							marginRight: chosenLanguage === "Arabic" ? "10px" : "",
						}}
						dir='rtl'
					>
						<h2>{t.about}</h2>
						<p>
							{chosenLanguage === "Arabic"
								? selectedHotel.aboutHotelArabic || selectedHotel.aboutHotel
								: selectedHotel.aboutHotel || "About Hotel"}
						</p>

						{(() => {
							const combinedFeatures = [
								...new Set([
									...selectedHotel.roomCountDetails.flatMap(
										(r) => r.amenities || []
									),
									...selectedHotel.roomCountDetails.flatMap(
										(r) => r.views || []
									),
									...selectedHotel.roomCountDetails.flatMap(
										(r) => r.extraAmenities || []
									),
								]),
							];
							const visibleFeatures = showAllAmenities
								? combinedFeatures
								: combinedFeatures.slice(0, 4);
							return (
								<>
									<AmenitiesWrapper>
										{visibleFeatures.map((feature, idx) => (
											<AmenityItem key={idx}>
												{getIcon(feature)} <span>{feature}</span>
											</AmenityItem>
										))}
									</AmenitiesWrapper>

									{combinedFeatures.length > 4 && (
										<ToggleText onClick={handleAmenitiesToggle}>
											{showAllAmenities
												? chosenLanguage === "Arabic"
													? "إخفاء..."
													: "Hide..."
												: chosenLanguage === "Arabic"
													? "عرض المزيد..."
													: "Show More..."}
										</ToggleText>
									)}
								</>
							);
						})()}

						<LoadScript googleMapsApiKey={process.env.REACT_APP_MAPS_API_KEY}>
							<MapContainer>
								<GoogleMap
									mapContainerStyle={{ width: "100%", height: "100%" }}
									center={{
										lat: parseFloat(selectedHotel.location.coordinates[1]),
										lng: parseFloat(selectedHotel.location.coordinates[0]),
									}}
									zoom={14}
								>
									<Marker
										position={{
											lat: parseFloat(selectedHotel.location.coordinates[1]),
											lng: parseFloat(selectedHotel.location.coordinates[0]),
										}}
										draggable={false}
									/>
								</GoogleMap>
							</MapContainer>
						</LoadScript>
					</HotelOverview>

					{/* Rooms */}
					<RoomsSection
						ref={roomsRef}
						id='rooms'
						isArabic={chosenLanguage === "Arabic"}
					>
						<h2
							style={{ textAlign: chosenLanguage === "Arabic" ? "center" : "" }}
						>
							{t.rooms}
						</h2>

						<DateRangeWrapper>
							<ResponsiveRangePicker
								format='YYYY-MM-DD'
								value={dateRange}
								onChange={handleDateChange}
								disabledDate={(current) =>
									current && current < dayjs().endOf("day")
								}
								panelRender={panelRender}
								inputReadOnly
							/>
						</DateRangeWrapper>

						{selectedHotel.roomCountDetails.map((room, index) => {
							const all = [
								...new Set([
									...(room.amenities || []),
									...(room.views || []),
									...(room.extraAmenities || []),
								]),
							];
							const vis = showAllAmenities2 ? all : all.slice(0, 3);

							const start = dateRange[0].format("YYYY-MM-DD");
							const end = dateRange[1].format("YYYY-MM-DD");

							const pbd = calculatePricingByDay(
								room.pricingRate || [],
								start,
								end,
								room.price.basePrice,
								room.defaultCost,
								room.roomCommission || selectedHotel.commission
							);

							const nights = pbd.length;
							const isAvailable = !pbd.some((d) => d.price <= 0);

							const total = pbd.reduce(
								(s, d) => s + (d.price + (d.rootPrice * d.commissionRate || 0)),
								0
							);
							const pricePerNight = total / nights;

							return (
								<RoomCardWrapper key={room._id || index}>
									<RoomImageWrapper dir='ltr'>
										<Swiper
											modules={[Pagination, Autoplay, Thumbs]}
											spaceBetween={10}
											slidesPerView={1}
											pagination={{ clickable: true }}
											autoplay={{ delay: 4000, disableOnInteraction: false }}
											loop
											className='room-swiper'
										>
											{room.photos.map((photo, idx) => (
												<SwiperSlide key={idx}>
													<RoomImage
														src={photo.url}
														alt={`${room.displayName} - ${idx + 1}`}
													/>
												</SwiperSlide>
											))}
										</Swiper>
									</RoomImageWrapper>

									<RoomDetails
										dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
										style={{
											textAlign: chosenLanguage === "Arabic" ? "right" : "",
										}}
									>
										<h3
											style={{
												textAlign: chosenLanguage === "Arabic" ? "right" : "",
											}}
										>
											{chosenLanguage === "Arabic"
												? room.displayName_OtherLanguage || room.displayName
												: room.displayName}
										</h3>

										<p className='m-0'>
											{chosenLanguage === "Arabic"
												? showFullDescription
													? room.description_OtherLanguage || room.description
													: (room.description_OtherLanguage || room.description)
															.split(" ")
															.slice(0, 8)
															.join(" ")
												: showFullDescription
													? room.description
													: room.description.split(" ").slice(0, 9).join(" ")}
											...
											{!showFullDescription && (
												<div
													onClick={() => setShowFullDescription(true)}
													style={{
														color: "var(--primaryBlue)",
														cursor: "pointer",
														fontWeight: "bold",
														textDecoration: "underline",
													}}
												>
													{chosenLanguage === "Arabic"
														? "إظهار المزيد..."
														: "show more..."}
												</div>
											)}
										</p>

										{showFullDescription && (
											<span
												onClick={() => setShowFullDescription(false)}
												style={{
													color: "var(--primaryBlue)",
													cursor: "pointer",
													fontWeight: "bold",
													textDecoration: "underline",
												}}
											>
												{chosenLanguage === "Arabic"
													? "إظهار أقل"
													: "show less..."}
											</span>
										)}

										<AmenitiesWrapper>
											<h4>
												{chosenLanguage === "Arabic"
													? "وسائل الراحة:"
													: "Amenities:"}
											</h4>
											{vis.map((f, idx) => (
												<AmenityItem key={idx}>
													{getIcon(f)} <span>{f}</span>
												</AmenityItem>
											))}
											{all.length > 4 && (
												<ToggleText
													onClick={() =>
														setShowAllAmenities2(!showAllAmenities2)
													}
												>
													{showAllAmenities2
														? chosenLanguage === "Arabic"
															? "إخفاء"
															: "Hide"
														: chosenLanguage === "Arabic"
															? "عرض المزيد..."
															: "Show More..."}
												</ToggleText>
											)}
										</AmenitiesWrapper>
									</RoomDetails>

									<PriceSection
										dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
									>
										<FinalPrice>
											<span className='original-price'>
												<s>
													{convertCurrency(pricePerNight * 1.1)}{" "}
													{t[selectedCurrency.toUpperCase()]}{" "}
													{chosenLanguage === "Arabic" ? "لكل ليلة" : "/ Night"}
												</s>
											</span>
											<span className='current-price'>
												{convertCurrency(pricePerNight)}{" "}
												{t[selectedCurrency.toUpperCase()]}{" "}
												{chosenLanguage === "Arabic" ? "لكل ليلة" : "/ Night"}
											</span>
											<div className='nights'>
												{nights}{" "}
												{chosenLanguage === "Arabic" ? "ليالٍ" : "nights"}
											</div>
										</FinalPrice>
									</PriceSection>

									<div
										onClick={() => {
											ReactGA.event({
												category:
													"User Added Reservation To Cart From Single Hotel",
												action:
													"User Added Reservation To Cart From Single Hotel",
												label: `User Added Reservation To Cart From Single Hotel`,
											});
											ReactPixel.track("Add_To_Reservation", {
												action: "User Added A Room To The Cart",
												page: "Single Hotel Page",
											});
										}}
										style={{
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
										}}
									>
										<StyledButton
											disabled={!isAvailable}
											style={{
												backgroundColor: !isAvailable
													? "#ccc"
													: "var(--primaryBlue)",
												cursor: !isAvailable ? "not-allowed" : "pointer",
											}}
											onClick={() => isAvailable && handleAddRoomToCart(room)}
										>
											{chosenLanguage === "Arabic"
												? "إضافة الغرفة إلى الحجز"
												: "Add Room To Reservation"}
										</StyledButton>
										{!isAvailable && (
											<UnavailableBadge>
												{chosenLanguage === "Arabic"
													? "غير متوفر"
													: "Not Available"}
											</UnavailableBadge>
										)}
									</div>
								</RoomCardWrapper>
							);
						})}
					</RoomsSection>

					{/* Packages & Offers */}
					<OffersSection
						ref={packagesRef}
						id='packages'
						isArabic={chosenLanguage === "Arabic"}
					>
						<SingleHotelOffers
							selectedHotel={selectedHotel}
							chosenLanguage={chosenLanguage}
							selectedCurrency={selectedCurrency}
							currencyRates={currencyRates}
						/>
					</OffersSection>
				</>
			) : null}
		</SingleHotelWrapper>
	);
};

export default SingleHotel;

/* ---------- styled ---------- */
const SingleHotelWrapper = styled.div`
	padding: 20px;
	display: flex;
	flex-direction: column;
	align-items: center;
	overflow: hidden;
	@media (max-width: 800px) {
		margin-top: 40px;
		padding: 10px;
	}
`;

const HeroSection = styled.div`
	width: 100%;
	max-width: 1200px;
	margin: 20px 0;
	.hotel-image {
		width: 100%;
		height: 700px;
		border-radius: 10px;
		object-fit: cover;
	}
	@media (max-width: 800px) {
		padding: 0 !important;
		width: 430px;
		.hotel-image {
			height: 420px;
		}
	}
`;

const HotelInfo = styled.div`
	margin: 20px 0;
	text-align: left;
	text-transform: capitalize;
	width: 100%;
	max-width: 1200px;
	margin-left: 0;
	font-family: ${({ isArabic }) =>
		isArabic ? `"Droid Arabic Kufi", sans-serif` : ""};
	h1 {
		font-size: 36px;
		color: var(--primaryBlue);
		margin-bottom: 10px;
		font-weight: bold;
	}
	p {
		margin: 5px 0;
		font-size: 18px;
		color: var(--darkGrey);
		white-space: pre-wrap;
		line-height: 1.5;
	}
	@media (max-width: 768px) {
		text-align: left;
		width: 100%;
		margin: 5px 0;
		h1 {
			font-size: 28px;
			padding: 0;
			margin: 0;
		}
		p {
			font-size: 16px;
			padding: 0;
			margin: 0;
		}
	}
`;

const HotelOverview = styled.div`
	text-align: left;
	text-transform: capitalize;
	width: 100%;
	max-width: 1200px;
	margin-left: 0;
	font-family: ${({ isArabic }) =>
		isArabic ? `"Droid Arabic Kufi", sans-serif` : ""};
	h2 {
		font-size: 30px;
		color: var(--primaryBlue);
		margin-bottom: 10px;
		font-weight: bold;
		font-family: ${({ isArabic }) =>
			isArabic ? `"Droid Arabic Kufi", sans-serif` : ""};
	}
	p {
		margin: 5px 0;
		font-size: 18px;
		color: var(--darkGrey);
		white-space: pre-wrap;
		line-height: 1.5;
		font-family: ${({ isArabic }) =>
			isArabic ? `"Droid Arabic Kufi", sans-serif` : ""};
	}
	@media (max-width: 768px) {
		margin-left: auto;
		margin-right: auto;
		padding: 0 !important;
		h2 {
			font-size: 25px;
		}
		p {
			font-size: 14px;
		}
	}
`;

const ToggleText = styled.span`
	display: inline-block;
	margin-top: 10px;
	color: var(--primaryBlue);
	cursor: pointer;
	font-weight: bold;
	text-decoration: underline;
	font-size: 13px;
	&:hover {
		color: var(--primaryBlueDarker);
	}
`;

const MapContainer = styled.div`
	width: 100%;
	height: 300px;
	border-radius: 10px;
	margin-top: 15px;
	@media (min-width: 1024px) {
		width: 600px;
	}
	@media (min-width: 1440px) {
		width: 1000px;
	}
`;

const Distances = styled.div`
	font-size: 1rem;
	color: #555;
	margin-bottom: 2px;
	text-transform: capitalize;
	font-weight: bold;
	font-family: ${({ isArabic }) =>
		isArabic ? `"Droid Arabic Kufi", sans-serif` : ""};
	@media (max-width: 700px) {
		font-size: 0.7rem;
	}
`;

const RoomsSection = styled.div`
	width: 100%;
	padding: 20px;
	background-color: var(--neutral-light);
	border-radius: 10px;
	margin-top: 20px;
	max-width: 1200px;
	font-family: ${({ isArabic }) =>
		isArabic ? `"Droid Arabic Kufi", sans-serif` : ""};
	h2 {
		color: var(--primaryBlue);
		margin-bottom: 20px;
		text-transform: capitalize;
		margin-left: 5px;
		margin-right: 5px;
		font-weight: bold;
	}
	@media (max-width: 750px) {
		width: 100%;
		padding: 5px;
		h2 {
			font-size: 1.35rem;
		}
	}
`;

const RoomCardWrapper = styled.div`
	display: grid;
	grid-template-columns: 35% 45% 20%;
	background: var(--mainWhite);
	border: 1px solid var(--border-color-light);
	border-radius: 10px;
	box-shadow: var(--box-shadow-light);
	padding: 20px;
	margin-bottom: 20px;
	transition: var(--main-transition);
	@media (max-width: 768px) {
		display: block;
		padding: 5px;
	}
`;

const RoomImageWrapper = styled.div`
	.room-swiper {
		border-radius: 10px;
		overflow: hidden;
	}
`;

const RoomImage = styled.img`
	width: 100%;
	height: 300px;
	object-fit: cover;
	border-radius: 10px;
	@media (max-width: 750px) {
		height: 220px;
	}
`;

const RoomDetails = styled.div`
	padding: 0 15px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	h3 {
		font-size: 1.5rem;
		color: var(--primaryBlue);
		margin-bottom: 10px;
		text-transform: capitalize;
		text-align: left;
	}
	p {
		font-size: 1rem;
		margin-bottom: 10px;
	}
	@media (max-width: 750px) {
		padding: 0;
		h3 {
			font-size: 1.15rem;
			margin-top: 10px;
			font-weight: bold;
		}
		p {
			font-size: 13px;
		}
	}
`;

const PriceSection = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	justify-content: space-between;
	@media (max-width: 768px) {
		align-items: flex-start;
		margin-top: 20px;
	}
`;

const FinalPrice = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	font-size: 1.25rem;
	.current-price {
		font-weight: bold;
		color: darkgreen;
		font-size: 1.3rem;
	}
	.original-price {
		color: red;
		font-weight: bolder;
		font-size: 0.9rem;
	}
	@media (max-width: 768px) {
		align-items: flex-start;
		.current-price {
			font-size: 1rem;
		}
		.original-price {
			font-size: 0.78rem;
		}
		.finalTotal,
		.nights {
			font-size: 0.75rem;
			font-weight: bold;
		}
	}
`;

const AmenitiesWrapper = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	grid-gap: 10px;
	margin-top: 15px;
	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		margin-top: 5px;
		grid-gap: 5px;
		h4 {
			font-size: 1.15rem;
		}
	}
`;

const AmenityItem = styled.div`
	display: flex;
	align-items: center;
	font-size: 12px;
	color: var(--text-color-primary);
	font-weight: bold;
	span {
		margin-left: 5px;
	}
`;

const StyledButton = styled(Button)`
	width: 75%;
	margin: 20px auto 0;
	background-color: var(--button-bg-primary);
	color: var(--button-font-color);
	border: 1px solid var(--primary-color);
	padding: 0.5rem 1rem;
	font-size: 1rem;
	text-transform: uppercase;
	transition: var(--main-transition);
	box-shadow: var(--box-shadow-light);
	display: flex;
	align-items: center;
	justify-content: center;
	&:hover {
		background-color: var(--primary-color-light);
		border-color: var(--primary-color-lighter);
		color: var(--button-font-color);
		box-shadow: var(--box-shadow-dark);
	}
	&:focus {
		background-color: var(--primary-color-darker);
		border-color: var(--primary-color-dark);
		box-shadow: var(--box-shadow-dark);
	}
	&:active {
		background-color: var(--primary-color);
		border-color: var(--primary-color-darker);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
	}
`;

const StyledRangePickerContainer = styled.div`
	@media (max-width: 576px) {
		.ant-picker-panels {
			flex-direction: column !important;
		}
	}
`;
const panelRender = (node) => (
	<StyledRangePickerContainer>{node}</StyledRangePickerContainer>
);

const ResponsiveRangePicker = styled(RangePicker)`
	width: 100%;
	.ant-picker-input {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 7px;
		padding-bottom: 7px;
	}
	.ant-picker {
		border-radius: 10px;
	}
	@media (max-width: 768px) {
		.ant-picker {
			width: 100%;
		}
	}
`;

const DateRangeWrapper = styled.div`
	margin-top: 20px;
	margin-bottom: 20px;
	display: flex;
	justify-content: center;
	width: 100%;
`;

const UnavailableBadge = styled.div`
	display: inline-block;
	margin-top: 0.5rem;
	padding: 0.3rem 0.8rem;
	border-radius: 0.25rem;
	background-color: var(--accent-color-1);
	color: var(--secondary-color-dark);
	font-size: 0.85rem;
	font-weight: bold;
	text-align: center;
	box-shadow: var(--box-shadow-light);
	transition: var(--main-transition);
`;

const OffersSection = styled.div`
	width: 100%;
	max-width: 1200px;
	margin-top: 20px;
`;
