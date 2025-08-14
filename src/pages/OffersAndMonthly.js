import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Spin, Tag, Button } from "antd";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Thumbs, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import StarRatings from "react-star-ratings";
import { FaCar } from "react-icons/fa";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";

import { gettingHotelsWithOffersAndMonths } from "../apiCore";
import { amenitiesList, viewsList, extraAmenitiesList } from "../Assets";
import { useCartContext } from "../cart_context";

/* =========================
   Helpers & Translations
   ========================= */

const tDict = {
	English: {
		pageTitle: "Special Offers & Monthly Deals",
		sub: "Hand‑picked hotels with limited‑time nightly offers and long‑stay monthly rates.",
		loading: "Loading deals...",
		noDeals: "No current offers at the moment.",
		offers: "Offers",
		monthly: "Monthly",
		perNight: "/ NIGHT",
		perMonth: "/ MONTH",
		valid: "Valid",
		to: "to",
		viewHotel: "View Hotel",
		searchDates: "Search with these dates",
		drivingToHaram: "Driving To El Haram",
		drivingToProphetMosque: "Driving To The Mosque",
		hotelRating: "Hotel Rating:",
		available: "Available",
		currency: "Currency",
		SAR: "SAR",
		USD: "USD",
		EUR: "EUR",
	},
	Arabic: {
		pageTitle: "عروض خاصة وأسعار شهرية",
		sub: "فنادق مختارة بعناية مع عروض ليلية مؤقتة وأسعار شهرية للإقامات الطويلة.",
		loading: "جاري تحميل العروض...",
		noDeals: "لا توجد عروض حالياً.",
		offers: "العروض",
		monthly: "الشهرية",
		perNight: "/ ليلة",
		perMonth: "/ شهر",
		valid: "ساري",
		to: "إلى",
		viewHotel: "عرض الفندق",
		searchDates: "البحث بهذه التواريخ",
		drivingToHaram: "بالسيارة إلى الحرم",
		drivingToProphetMosque: "الى المسجد النبوي الشريف",
		hotelRating: "تقييم الفندق:",
		available: "متاح",
		currency: "العملة",
		SAR: "ريال",
		USD: "دولار",
		EUR: "يورو",
	},
};

const safeNum = (v, d = 0) => {
	const n = Number(v);
	return Number.isFinite(n) ? n : d;
};

const fmt = (d) => (d ? dayjs(d).format("DD MMM YYYY") : "—");

/** Robust slug; falls back to hotel id if empty to avoid `/single-hotel/-` */
const buildSlug = (name) =>
	(name || "")
		.trim()
		.replace(/[\\/]+/g, "-")
		.replace(/\s+/g, "-")
		.toLowerCase();

const getIcon = (item) => {
	const amenity = amenitiesList.find((a) => a.name === item);
	if (amenity) return amenity.icon;
	const view = viewsList.find((v) => v.name === item);
	if (view) return view.icon;
	const extra = extraAmenitiesList.find((e) => e.name === item);
	if (extra) return extra.icon;
	return null;
};

const normalizeOffer = (o) => ({
	type: "offer",
	name: o?.offerName || o?.name || "Special Offer",
	from: o?.offerFrom || o?.from || o?.start || o?.validFrom || null,
	to: o?.offerTo || o?.to || o?.end || o?.validTo || null,
	price: safeNum(o?.offerPrice ?? o?.price),
	rootPrice: safeNum(o?.offerRootPrice ?? o?.rootPrice ?? o?.cost),
});

const normalizeMonthly = (m) => ({
	type: "monthly",
	name: m?.monthlyName || m?.name || "Monthly Rate",
	from: m?.monthFrom || m?.from || m?.start || m?.validFrom || null,
	to: m?.monthTo || m?.to || m?.end || m?.validTo || null,
	price: safeNum(m?.monthlyPrice ?? m?.price ?? m?.rate ?? m?.monthPrice),
	rootPrice: safeNum(m?.monthlyRootPrice ?? m?.rootPrice ?? m?.cost),
});

const getCommissionDecimal = (room, hotel) => {
	const envFactor = safeNum(process.env.REACT_APP_COMMISSIONRATE, 1.1);
	const defaultPct = (envFactor - 1) * 100;
	return (room?.roomCommission ?? hotel?.commission ?? defaultPct) / 100.0;
};

const calcDisplayPrice = (deal, commissionDecimal) => {
	const base = safeNum(deal.price, 0);
	const root = safeNum(deal.rootPrice, 0);
	return base + root * commissionDecimal;
};

const convertPrice = (sar, currency, rates) => {
	if (!currency || currency === "sar") return sar.toFixed(0);
	if (currency === "usd") return (sar * (rates?.SAR_USD || 0.27)).toFixed(0);
	if (currency === "eur") return (sar * (rates?.SAR_EUR || 0.25)).toFixed(0);
	return sar.toFixed(0);
};

const localizeDrive = (s, lang) => {
	if (!s) return s;
	if (lang !== "Arabic") return s;
	return s.replace(/Mins?/i, "دقائق").replace(/Hours?/i, "ساعات");
};

/* =========================
   Component
   ========================= */

const OffersAndMonthly = () => {
	const { chosenLanguage } = useCartContext();
	const t = tDict[chosenLanguage] || tDict.English;

	const [loading, setLoading] = useState(true);
	const [hotels, setHotels] = useState([]);
	const [error, setError] = useState("");
	const [thumbsByHotel, setThumbsByHotel] = useState({});
	const [currency, setCurrency] = useState(
		localStorage.getItem("selectedCurrency") || "sar"
	);

	// We show all deals; per-room mini toggle keeps cards compact
	const filter = "all";

	// Room-level preference (offers vs monthly) to minimize height
	const [roomGroup, setRoomGroup] = useState({}); // { roomId: 'offers' | 'monthly' }

	useEffect(() => {
		let isMounted = true;
		(async () => {
			try {
				const data = await gettingHotelsWithOffersAndMonths();
				if (!isMounted) return;
				setHotels(Array.isArray(data) ? data : []);
			} catch (e) {
				console.error("Deals fetch error:", e);
				setError("Failed to load deals.");
			} finally {
				if (isMounted) setLoading(false);
			}
		})();
		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		localStorage.setItem("selectedCurrency", currency);
	}, [currency]);

	const rates = useMemo(() => {
		try {
			return (
				JSON.parse(localStorage.getItem("rates")) || {
					SAR_USD: 0.27,
					SAR_EUR: 0.25,
				}
			);
		} catch {
			return { SAR_USD: 0.27, SAR_EUR: 0.25 };
		}
	}, []);

	const hotelsWithDeals = useMemo(() => {
		const normed = (hotels || []).map((h) => {
			const rooms =
				(h?.roomCountDetails || [])
					.map((r) => {
						const offers =
							(r?.offers || [])
								.map(normalizeOffer)
								.filter((o) => Number.isFinite(o.price) && o.price > 0) || [];
						const monthly =
							(r?.monthly || [])
								.map(normalizeMonthly)
								.filter((m) => Number.isFinite(m.price) && m.price > 0) || [];
						return { room: r, offers, monthly };
					})
					.filter((x) => x.offers.length || x.monthly.length) || [];
			return { ...h, rooms };
		});

		if (filter === "offers") {
			return normed
				.map((h) => ({
					...h,
					rooms: h.rooms
						.map((rr) => ({ ...rr, monthly: [], offers: rr.offers }))
						.filter((x) => x.offers.length),
				}))
				.filter((h) => h.rooms.length);
		}
		if (filter === "monthly") {
			return normed
				.map((h) => ({
					...h,
					rooms: h.rooms
						.map((rr) => ({ ...rr, offers: [], monthly: rr.monthly }))
						.filter((x) => x.monthly.length),
				}))
				.filter((h) => h.rooms.length);
		}
		return normed.filter((h) => h.rooms.length);
	}, [hotels, filter]);

	// Default the room-group to whichever exists (offers preferred)
	useEffect(() => {
		setRoomGroup((prev) => {
			const next = { ...prev };
			hotelsWithDeals.forEach((h) => {
				h.rooms.forEach(({ room, offers, monthly }) => {
					const rid = room?._id || `${h._id}-${room?.displayName || "room"}`;
					if (!next[rid]) next[rid] = offers.length ? "offers" : "monthly";
				});
			});
			return next;
		});
	}, [hotelsWithDeals]);

	const hasDeals = hotelsWithDeals.length > 0;

	return (
		<OffersAndMonthlyWrapper
			className='container my-3'
			isArabic={chosenLanguage === "Arabic"}
			dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
		>
			<HeaderBlock>
				<h1>{t.pageTitle}</h1>
				<p className='subtitle'>{t.sub}</p>

				<ControlsRow>
					<CurrencySelect>
						<label>{t.currency}</label>
						<select
							value={currency}
							onChange={(e) => setCurrency(e.target.value)}
						>
							<option value='sar'>{t.SAR}</option>
							<option value='usd'>{t.USD}</option>
							<option value='eur'>{t.EUR}</option>
						</select>
					</CurrencySelect>
				</ControlsRow>
			</HeaderBlock>

			{loading ? (
				<Loader>
					<Spin size='large' tip={t.loading} />
				</Loader>
			) : error ? (
				<Fallback>{error}</Fallback>
			) : !hasDeals ? (
				<Fallback>{t.noDeals}</Fallback>
			) : (
				<HotelsGrid>
					{hotelsWithDeals.map((hotel) => {
						const hotelId = hotel._id;
						const slug = buildSlug(hotel.hotelName) || hotelId; // fallback to id
						const targetUrl = `/single-hotel/${slug}`;
						const thumbs = thumbsByHotel[hotelId];
						const driving = localizeDrive(
							hotel?.distances?.drivingToElHaram,
							chosenLanguage
						);

						return (
							<HotelCard key={hotelId}>
								{/* Images + thumbnails (left on desktop, stacked on top for mobile) */}
								<HotelImageCol>
									<Swiper
										modules={[Pagination, Thumbs, Autoplay]}
										spaceBetween={10}
										slidesPerView={1}
										pagination={{ clickable: true }}
										autoplay={{ delay: 4000, disableOnInteraction: false }}
										thumbs={{ swiper: thumbs }}
										loop
										className='main-swiper'
									>
										{(hotel.hotelPhotos || []).map((photo, idx) => (
											<SwiperSlide key={idx}>
												<div
													onClick={() => {
														ReactGA.event({
															category:
																"User Nav To A HOTEL from Offers & Monthly",
															action:
																"User Nav To A HOTEL from Offers & Monthly",
															label:
																"User Nav To A HOTEL from Offers & Monthly",
														});
														ReactPixel.track("User Clicked On A Hotel_Deals", {
															action:
																"Single Hotel Page Clicked from Deals Page",
															page: "Offers & Monthly",
														});
														window.location.href = targetUrl;
													}}
												>
													<img
														src={photo.url}
														alt={`${hotel.hotelName} - ${idx + 1}`}
														className='hotel-image'
													/>
												</div>
											</SwiperSlide>
										))}
										{(!hotel.hotelPhotos || hotel.hotelPhotos.length === 0) && (
											<SwiperSlide>
												<div onClick={() => (window.location.href = targetUrl)}>
													<img
														src='https://via.placeholder.com/1200x800?text=Hotel'
														alt={`${hotel.hotelName}`}
														className='hotel-image'
													/>
												</div>
											</SwiperSlide>
										)}
									</Swiper>

									{/* Thumbnails — visible on mobile too, just smaller */}
									<Swiper
										modules={[Thumbs]}
										onSwiper={(sw) =>
											setThumbsByHotel((prev) => ({ ...prev, [hotelId]: sw }))
										}
										spaceBetween={2}
										slidesPerView={5}
										watchSlidesProgress
										className='thumbnail-swiper'
										breakpoints={{
											0: { slidesPerView: 4 },
											480: { slidesPerView: 5 },
											768: { slidesPerView: 5 },
											1024: { slidesPerView: 5 },
										}}
									>
										{(hotel.hotelPhotos || []).map((photo, idx) => (
											<SwiperSlide key={idx}>
												<ThumbnailImage
													src={photo.url}
													alt={`${hotel.hotelName} - ${idx + 1}`}
												/>
											</SwiperSlide>
										))}
									</Swiper>
								</HotelImageCol>

								{/* Details (to the right on desktop; below on mobile) */}
								<HotelDetailsCol isArabic={chosenLanguage === "Arabic"}>
									<div>
										<HotelName
											style={{
												textAlign: chosenLanguage === "Arabic" ? "center" : "",
											}}
										>
											{chosenLanguage === "Arabic" &&
											hotel.hotelName_OtherLanguage
												? hotel.hotelName_OtherLanguage
												: hotel.hotelName}
										</HotelName>

										<LocationLine>
											{(hotel.hotelAddress || "")
												.split(",")
												.slice(1, 3)
												.join(", ")
												.toUpperCase()}
										</LocationLine>

										<RatingRow>
											<span className='rating-label'>{t.hotelRating}</span>
											<StarRatings
												rating={hotel.hotelRating || 0}
												starRatedColor='orange'
												numberOfStars={5}
												name='rating'
												starDimension='15px'
												starSpacing='1px'
											/>
										</RatingRow>

										<DistanceLine
											dir={chosenLanguage === "Arabic" ? "rtl" : ""}
										>
											<FaCar />
											{hotel.hotelState?.toLowerCase().includes("madinah") ? (
												<>
													{driving
														? `${driving} ${t.drivingToProphetMosque}`
														: `N/A ${t.drivingToProphetMosque}`}
												</>
											) : (
												<>
													{driving
														? `${driving} ${t.drivingToHaram}`
														: `N/A ${t.drivingToHaram}`}
												</>
											)}
										</DistanceLine>
									</div>

									{/* Rooms & Deals */}
									<DealsSection>
										{hotel.rooms.map(({ room, offers, monthly }) => {
											const commissionDecimal = getCommissionDecimal(
												room,
												hotel
											);
											const rid =
												room?._id ||
												`${hotel._id}-${room?.displayName || "room"}`;
											const hasOffers = offers.length > 0;
											const hasMonthly = monthly.length > 0;

											const currentGroup =
												roomGroup[rid] || (hasOffers ? "offers" : "monthly");

											const combinedFeatures = [
												...(room.amenities || []),
												...(room.views || []),
												...(room.extraAmenities || []),
											];
											const uniqueFeatures = [...new Set(combinedFeatures)];
											const visibleFeatures =
												uniqueFeatures.length > 0
													? uniqueFeatures.slice(0, 3)
													: [];

											const showDeals =
												currentGroup === "offers" ? offers : monthly;

											return (
												<RoomDealBlock key={rid}>
													<RoomHeader>
														<div className='room-titles'>
															<h3>
																{chosenLanguage === "Arabic"
																	? room.displayName_OtherLanguage ||
																		room.displayName
																	: room.displayName}
															</h3>
															<span className='room-type'>
																{room.roomType?.replace(/([A-Z])/g, " $1")}
															</span>
														</div>

														{visibleFeatures.length > 0 && (
															<AmenitiesRow>
																{visibleFeatures.map((feature) => (
																	<Amenity key={feature}>
																		{getIcon(feature)} <span>{feature}</span>
																	</Amenity>
																))}
															</AmenitiesRow>
														)}

														{hasOffers && hasMonthly && (
															<LocalToggle>
																<button
																	className={`mini-pill ${
																		currentGroup === "offers" ? "active" : ""
																	}`}
																	onClick={() =>
																		setRoomGroup((prev) => ({
																			...prev,
																			[rid]: "offers",
																		}))
																	}
																>
																	{t.offers}
																</button>
																<button
																	className={`mini-pill ${
																		currentGroup === "monthly" ? "active" : ""
																	}`}
																	onClick={() =>
																		setRoomGroup((prev) => ({
																			...prev,
																			[rid]: "monthly",
																		}))
																	}
																>
																	{t.monthly}
																</button>
															</LocalToggle>
														)}
													</RoomHeader>

													<DealGroup>
														<GroupTitle>
															{currentGroup === "offers" ? (
																<Tag color='green'>{t.offers}</Tag>
															) : (
																<Tag color='blue'>{t.monthly}</Tag>
															)}
														</GroupTitle>

														<DealCards>
															{showDeals.map((deal, idx) => {
																const sar = calcDisplayPrice(
																	deal,
																	commissionDecimal
																);
																const display = convertPrice(
																	sar,
																	currency,
																	rates
																);
																const curLabel = t[currency.toUpperCase()];

																const qs = new URLSearchParams({
																	startDate: deal.from
																		? dayjs(deal.from).format("YYYY-MM-DD")
																		: "",
																	endDate: deal.to
																		? dayjs(deal.to).format("YYYY-MM-DD")
																		: "",
																	roomType: room.roomType || "",
																	adults: "2",
																	children: "0",
																	destination:
																		hotel.hotelCity || hotel.hotelState || "",
																}).toString();

																return (
																	<DealCard key={idx}>
																		<div className='deal-title'>
																			<strong>{deal.name}</strong>
																		</div>
																		<div className='validity'>
																			{deal.from || deal.to ? (
																				<>
																					{t.valid}: {fmt(deal.from)} {t.to}{" "}
																					{fmt(deal.to)}
																				</>
																			) : (
																				<>&nbsp;</>
																			)}
																		</div>

																		<div className='price-line'>
																			<span className='price'>
																				{display} {curLabel}
																			</span>
																			<span className='unit'>
																				{currentGroup === "offers"
																					? t.perNight
																					: t.perMonth}
																			</span>
																		</div>

																		<DealActions>
																			<Button
																				type='primary'
																				onClick={() => {
																					ReactGA.event({
																						category: "Deals Page",
																						action: "View Hotel",
																						label: hotel.hotelName,
																					});
																					ReactPixel.track(
																						"Deals_ViewHotel_Click",
																						{
																							hotel: hotel.hotelName,
																						}
																					);
																					window.location.href = targetUrl;
																				}}
																				size='middle'
																			>
																				{t.viewHotel}
																			</Button>

																			<Link
																				to={`/our-hotels?${qs}`}
																				onClick={() => {
																					ReactGA.event({
																						category: "Deals Page",
																						action: "Search With Dates",
																						label: `${hotel.hotelName} - ${deal.name}`,
																					});
																					ReactPixel.track(
																						"Deals_SearchWithDates_Click",
																						{
																							hotel: hotel.hotelName,
																							deal: deal.name,
																						}
																					);
																				}}
																			>
																				<Button ghost size='middle'>
																					{t.searchDates}
																				</Button>
																			</Link>
																		</DealActions>
																	</DealCard>
																);
															})}
														</DealCards>
													</DealGroup>
												</RoomDealBlock>
											);
										})}
									</DealsSection>
								</HotelDetailsCol>
							</HotelCard>
						);
					})}
				</HotelsGrid>
			)}
		</OffersAndMonthlyWrapper>
	);
};

export default OffersAndMonthly;

/* =========================
   Styled Components
   ========================= */

const OffersAndMonthlyWrapper = styled.div`
	min-height: 60vh;
	padding: 130px 0 60px;

	div,
	p,
	span,
	section,
	small,
	input,
	button,
	li,
	ul {
		font-family: ${({ isArabic }) =>
			isArabic ? `"Droid Arabic Kufi", sans-serif` : ""};
	}

	@media (max-width: 1000px) {
		padding: 100px 0 40px;
	}
`;

const HeaderBlock = styled.div`
	max-width: 1200px;
	margin: 0 auto 16px auto;
	padding: 0 12px;

	h1 {
		font-size: 1.6rem;
		color: #006ad1;
		margin: 0 0 4px 0;
		font-weight: 800;
		text-align: center;
	}

	.subtitle {
		text-align: center;
		color: var(--darkGrey);
		margin: 0 auto 12px auto;
		max-width: 820px;
		font-size: 0.95rem;
	}

	@media (max-width: 700px) {
		h1 {
			font-size: 1.25rem;
		}
		.subtitle {
			font-size: 0.85rem;
		}
	}
`;

const ControlsRow = styled.div`
	max-width: 1200px;
	margin: 8px auto 0 auto;
	padding: 0 12px;
	display: flex;
	gap: 10px;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
`;

const CurrencySelect = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;

	label {
		font-weight: 700;
		color: var(--darkGrey);
		font-size: 0.9rem;
	}
	select {
		border: 1px solid var(--border-color-light);
		padding: 6px 10px;
		border-radius: 6px;
		outline: none;
		font-size: 0.9rem;
	}

	@media (max-width: 700px) {
		label,
		select {
			font-size: 0.8rem;
		}
	}
`;

const Loader = styled.div`
	width: 100%;
	min-height: 40vh;
	display: grid;
	place-items: center;
`;

const Fallback = styled.div`
	max-width: 1200px;
	margin: 30px auto;
	padding: 0 12px;
	font-weight: 700;
	color: var(--darkGrey);
	text-align: center;
`;

const HotelsGrid = styled.div`
	max-width: 1200px;
	margin: 8px auto 30px auto;
	padding: 0 12px;
	display: grid;
	grid-template-columns: 1fr;
	gap: 12px;
`;

const HotelCard = styled.div`
	display: grid;
	grid-template-columns: 34% 66%;
	gap: 12px;
	background-color: var(--mainWhite);
	border: 1px solid var(--border-color-light);
	border-radius: 10px;
	box-shadow: var(--box-shadow-light);
	padding: 12px;
	transition: var(--main-transition);

	&:hover {
		box-shadow: var(--box-shadow-dark);
	}

	/* On mobile: stack image+thumbs first, details below */
	@media (max-width: 900px) {
		grid-template-columns: 1fr;
		gap: 8px;
		padding: 10px;
	}
`;

const HotelImageCol = styled.div`
	position: relative;

	.hotel-image {
		width: 100%;
		height: 300px;
		object-fit: cover;
		border-radius: 10px;
		cursor: pointer;
		display: block;
	}

	.thumbnail-swiper {
		margin-top: 6px;
	}

	/* Thumbnails design */
	.thumbnail-swiper .swiper-slide {
		opacity: 0.6;
		margin: 2px;
	}
	.thumbnail-swiper .swiper-slide-thumb-active {
		opacity: 1;
		border: 2px solid var(--primary-color);
		border-radius: 5px;
	}

	.main-swiper .swiper-slide {
		opacity: 1;
	}

	/* Mobile: bigger image on top, thumbnails visible below it */
	@media (max-width: 900px) {
		width: 500px !important;

		.hotel-image {
			height: 280px;
			border-radius: 8px;
		}
	}
	@media (max-width: 700px) {
		width: 375px !important;

		.hotel-image {
			height: 280px;
			border-radius: 6px;
		}
	}
`;

const ThumbnailImage = styled.img`
	width: 100%;
	height: 48px !important;
	object-fit: cover;
	border-radius: 6px;
`;

const HotelDetailsCol = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	padding: 0 0 0 8px;

	.rating-label {
		font-size: 0.85rem;
		font-weight: 700;
		color: #555;
	}

	@media (max-width: 900px) {
		padding: 0;
	}

	@media (max-width: 700px) {
		.rating-label {
			font-size: 0.8rem;
		}
	}
`;

const HotelName = styled.h3`
	font-size: 1.15rem;
	color: #333;
	margin: 0 0 4px 0;
	text-transform: capitalize;
	font-weight: 800;

	@media (max-width: 700px) {
		font-size: 1rem;
	}
`;

const LocationLine = styled.p`
	font-size: 0.9rem;
	color: #666;
	margin: 0 0 4px 0;
	text-transform: capitalize;

	@media (max-width: 700px) {
		font-size: 0.8rem;
	}
`;

const RatingRow = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	margin-bottom: 2px;

	@media (max-width: 700px) {
		gap: 4px;
	}
`;

const DistanceLine = styled.div`
	font-size: 0.92rem;
	color: #006ed9;
	text-transform: capitalize;
	font-weight: 700;
	margin-top: 4px;

	@media (max-width: 700px) {
		font-size: 0.85rem;
		font-weight: 600;
	}
`;

const DealsSection = styled.div`
	margin-top: 10px;
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const RoomDealBlock = styled.div`
	border: 1px solid var(--border-color-light);
	border-radius: 10px;
	padding: 10px;
	background: #fafafa;
`;

const RoomHeader = styled.div`
	display: grid;
	grid-template-columns: 1fr;
	gap: 6px;
	margin-bottom: 8px;

	.room-titles h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 800;
	}

	.room-type {
		font-size: 0.78rem;
		color: #666;
		text-transform: capitalize;
	}

	@media (max-width: 700px) {
		.room-titles h3 {
			font-size: 0.95rem;
		}
		.room-type {
			font-size: 0.72rem;
		}
	}
`;

const AmenitiesRow = styled.div`
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
	margin-top: 2px;

	@media (max-width: 700px) {
		gap: 8px;
	}
`;

const Amenity = styled.div`
	display: flex;
	align-items: center;
	font-size: 12px;
	color: var(--text-color-primary);

	span {
		margin-left: 5px;
		font-weight: 600;
	}

	@media (max-width: 700px) {
		font-size: 11px;
	}
`;

const LocalToggle = styled.div`
	margin-top: 4px;
	display: flex;
	gap: 6px;

	.mini-pill {
		border: 1px solid var(--primaryBlue);
		color: var(--primaryBlue);
		background: white;
		border-radius: 999px;
		padding: 2px 10px;
		font-size: 0.8rem;
		font-weight: 700;
		cursor: pointer;
		transition: 0.2s ease;
	}

	.mini-pill.active,
	.mini-pill:hover {
		background: var(--primaryBlue);
		color: white;
	}
`;

const DealGroup = styled.div``;

const GroupTitle = styled.div`
	margin-bottom: 6px;
`;

const DealCards = styled.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 10px;

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
	}
`;

const DealCard = styled.div`
	background: white;
	border: 1px solid var(--border-color-light);
	border-radius: 10px;
	padding: 10px;
	box-shadow: var(--box-shadow-light);

	.deal-title {
		font-size: 0.95rem;
		margin-bottom: 4px;
	}
	.validity {
		font-size: 0.82rem;
		color: #666;
		margin-bottom: 8px;
	}
	.price-line {
		display: flex;
		align-items: baseline;
		gap: 6px;
		margin-bottom: 10px;

		.price {
			font-size: 1.05rem;
			font-weight: 900;
			color: #0f1f2e;
		}
		.unit {
			font-size: 0.82rem;
			color: #333;
			font-weight: 700;
		}
	}

	@media (max-width: 700px) {
		padding: 8px;
		.deal-title {
			font-size: 0.9rem;
		}
		.validity {
			font-size: 0.78rem;
		}
		.price-line .price {
			font-size: 1rem;
		}
		.price-line .unit {
			font-size: 0.78rem;
		}
	}
`;

const DealActions = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;

	.ant-btn {
		font-weight: 700;
	}

	@media (max-width: 700px) {
		gap: 6px;
		.ant-btn {
			font-size: 0.85rem;
		}
	}
`;
