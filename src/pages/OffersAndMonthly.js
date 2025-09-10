import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Button, Spin, Tag } from "antd";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Thumbs } from "swiper/modules";
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

/* ============ i18n ============ */
const tDict = {
	English: {
		pageTitle: "Special Offers & Monthly Deals",
		sub: "Rooms with valid offers and monthly packages you can book instantly.",
		loading: "Loading deals...",
		noDeals: "No current offers at the moment.",
		offers: "Offers",
		monthly: "Monthly",
		perNight: "/ NIGHT",
		perMonth: "/ MONTH",
		valid: "Valid",
		to: "to",
		choosePackage: "Choose a package",
		selected: "Selected",
		viewHotel: "View Hotel",
		searchDates: "Search with these dates",
		addToReservation: "Add to Reservation",
		drivingToHaram: "Driving To El Haram",
		drivingToProphetMosque: "Driving To The Mosque",
		hotelRating: "Hotel Rating:",
		currency: "Currency",
		SAR: "SAR",
		USD: "USD",
		EUR: "EUR",
		showMore: "Show more",
		showLess: "Show less",
		totalNights: "Total",
		nights: "nights",
	},
	Arabic: {
		pageTitle: "عروض خاصة وأسعار شهرية",
		sub: "غرف تحتوي على عروض وحزم شهرية سارية يمكنك حجزها فورًا.",
		loading: "جاري تحميل العروض...",
		noDeals: "لا توجد عروض حالياً.",
		offers: "العروض",
		monthly: "الشهرية",
		perNight: "/ ليلة",
		perMonth: "/ شهر",
		valid: "ساري",
		to: "إلى",
		choosePackage: "اختر باقة",
		selected: "مُختار",
		viewHotel: "عرض الفندق",
		searchDates: "البحث بهذه التواريخ",
		addToReservation: "إضافة إلى الحجز",
		drivingToHaram: "بالسيارة إلى الحرم",
		drivingToProphetMosque: "الى المسجد النبوي الشريف",
		hotelRating: "تقييم الفندق:",
		currency: "العملة",
		SAR: "ريال",
		USD: "دولار",
		EUR: "يورو",
		showMore: "عرض المزيد",
		showLess: "عرض أقل",
		totalNights: "المجموع",
		nights: "ليالٍ",
	},
};

/* ============ helpers ============ */
const safeNum = (v, d = 0) => {
	const n = Number(v);
	return Number.isFinite(n) ? n : d;
};
const fmt = (d) => (d ? dayjs(d).format("DD MMM YYYY") : "—");
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

// robust commission → decimal (handles percent values too)
const toCommissionDecimal = (room, hotel) => {
	const envFactor = safeNum(process.env.REACT_APP_COMMISSIONRATE, 1.1); // 1.1 => 10%
	const defaultPct = (envFactor - 1) * 100;
	const norm = (v) => (v <= 1 ? v : v / 100); // percent -> decimal
	const r = safeNum(room?.roomCommission, NaN);
	const h = safeNum(hotel?.commission, NaN);
	const rn = Number.isFinite(r) && r > 0 ? norm(r) : NaN;
	const hn = Number.isFinite(h) && h > 0 ? norm(h) : NaN;

	// Prefer room when it's at least 1%; else use hotel; else fallback to default (10%)
	if (Number.isFinite(rn) && rn >= 0.01) return rn;
	if (Number.isFinite(hn)) return hn;
	return norm(defaultPct) || 0.1;
};

const normalizeOffer = (o) => ({
	type: "offer",
	id: o?._id || o?.id || Math.random().toString(36).slice(2),
	name: o?.offerName || o?.name || "Special Offer",
	from: o?.offerFrom || o?.from || o?.validFrom || null,
	to: o?.offerTo || o?.to || o?.validTo || null,
	base: safeNum(o?.offerPrice ?? o?.price),
	root: safeNum(o?.offerRootPrice ?? o?.rootPrice ?? o?.cost),
});

const normalizeMonthly = (m) => ({
	type: "monthly",
	id: m?._id || m?.id || Math.random().toString(36).slice(2),
	name: m?.monthName || m?.monthlyName || m?.name || "Monthly Rate",
	from: m?.monthFrom || m?.from || m?.validFrom || null,
	to: m?.monthTo || m?.to || m?.validTo || null,
	monthBase: safeNum(m?.monthPrice ?? m?.price ?? m?.rate),
	monthRoot: safeNum(m?.monthRootPrice ?? m?.rootPrice ?? m?.cost),
});

// Active now or in the future
const isActiveOrUpcoming = (from, to) => {
	const now = new Date();
	const f = from ? new Date(from) : null;
	const t = to ? new Date(to) : null;
	if (t && !isNaN(t) && t < now) return false;
	if (f && !isNaN(f) && f >= now) return true;
	if (t && !isNaN(t) && t >= now) return true;
	return false;
};

const convertPrice = (sar, currency, rates) => {
	if (!currency || currency === "sar") return sar.toFixed(0);
	if (currency === "usd") return (sar * (rates?.SAR_USD || 0.27)).toFixed(0);
	if (currency === "eur") return (sar * (rates?.SAR_EUR || 0.25)).toFixed(0);
	return sar.toFixed(0);
};

const dateRange = (start, end) => {
	const a = dayjs(start);
	const b = dayjs(end);
	const out = [];
	for (let d = a; d.isBefore(b, "day"); d = d.add(1, "day")) {
		out.push(d.format("YYYY-MM-DD")); // end-exclusive
	}
	return out;
};

const localizeDrive = (s, lang) => {
	if (!s) return s;
	if (lang !== "Arabic") return s;
	return s.replace(/Mins?/i, "دقائق").replace(/Hours?/i, "ساعات");
};

/* ============ Component ============ */
const OffersAndMonthly = () => {
	const { chosenLanguage, addRoomToCart, openSidebar2 } = useCartContext();
	const t = tDict[chosenLanguage] || tDict.English;

	const [loading, setLoading] = useState(true);
	const [hotels, setHotels] = useState([]);
	const [error, setError] = useState("");
	const [currency, setCurrency] = useState(
		localStorage.getItem("selectedCurrency") || "sar"
	);
	const [selectedByRoom, setSelectedByRoom] = useState({});
	const [expandedByRoom, setExpandedByRoom] = useState({}); // {roomId:{offers,monthly}}

	useEffect(() => {
		window.scrollTo({ top: 10, behavior: "smooth" });
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

	// flatten -> rooms with real (active/upcoming) deals
	const roomCards = useMemo(() => {
		const cards = [];
		(hotels || []).forEach((h) => {
			(h?.roomCountDetails || []).forEach((r) => {
				const offers =
					(r?.offers || [])
						.map(normalizeOffer)
						.filter((o) => Number.isFinite(o.base) && o.base > 0)
						.filter((o) => isActiveOrUpcoming(o.from, o.to)) || [];
				const monthly =
					(r?.monthly || [])
						.map(normalizeMonthly)
						.filter((m) => Number.isFinite(m.monthBase) && m.monthBase > 0)
						.filter((m) => isActiveOrUpcoming(m.from, m.to)) || [];
				if (offers.length || monthly.length)
					cards.push({ hotel: h, room: r, offers, monthly });
			});
		});
		return cards;
	}, [hotels]);

	const onSelectDeal = (roomId, deal) => {
		setSelectedByRoom((prev) => ({ ...prev, [roomId]: deal }));
	};

	const handleAddToReservation = (card) => {
		const { hotel, room } = card;
		const commission = toCommissionDecimal(room, hotel);
		const sel = selectedByRoom[room._id];
		if (!sel) return;

		const from = sel.from ? dayjs(sel.from).format("YYYY-MM-DD") : "";
		const to = sel.to ? dayjs(sel.to).format("YYYY-MM-DD") : "";
		if (!from || !to || !dayjs(to).isAfter(dayjs(from), "day")) return;

		let pricingByDay = [];
		if (sel.type === "offer") {
			const rng = dateRange(from, to);
			pricingByDay = rng.map((d) => ({
				date: d,
				price: safeNum(sel.base, 0),
				rootPrice: safeNum(sel.root, 0),
				commissionRate: commission,
			}));
		} else {
			const rng = dateRange(from, to);
			const nights = rng.length || 1;
			const perNightBase = safeNum(sel.monthBase, 0) / nights;
			const perNightRoot = safeNum(sel.monthRoot, 0) / nights;
			pricingByDay = rng.map((d) => ({
				date: d,
				price: perNightBase,
				rootPrice: perNightRoot,
				commissionRate: commission,
			}));
		}

		const totalWithComm = pricingByDay.reduce(
			(acc, it) => acc + it.price + it.rootPrice * commission,
			0
		);

		// IMPORTANT: add flags so reducer locks dates & tracks origin
		const payload = {
			id: room._id,
			name: room.displayName,
			nameOtherLanguage: room.displayName_OtherLanguage || room.displayName,
			roomType: room.roomType,
			price: (totalWithComm / Math.max(pricingByDay.length, 1)).toFixed(2),
			defaultCost: room.defaultCost || room?.price?.basePrice || 0,
			photos: room.photos,
			hotelName: hotel.hotelName,
			hotelAddress: hotel.hotelAddress,
			commissionRate: commission,
			fromPackagesOffers: true, // NEW
			lockDates: true, // NEW
			packageMeta: {
				// NEW (handy for support links/analytics)
				type: sel.type,
				pkgId: sel.id,
				roomId: room._id,
				hotelId: hotel._id,
				name: sel.name,
				from,
				to,
			},
		};

		addRoomToCart(
			room._id,
			payload,
			from,
			to,
			hotel._id,
			hotel.belongsTo,
			pricingByDay,
			room.roomColor || "#006ad1",
			"2",
			"0",
			commission
		);
		openSidebar2();

		ReactGA.event({
			category: "Deals Page",
			action: "Add To Reservation",
			label: `${hotel.hotelName} - ${room.displayName}`,
		});
		ReactPixel.track("Deals_AddToReservation_Click", {
			hotel: hotel.hotelName,
			room: room.displayName,
			deal: sel.name,
			type: sel.type,
		});
	};

	const renderTilePrice = (deal, commission) => {
		if (!deal) return null;
		if (deal.type === "offer") {
			const sar = safeNum(deal.base, 0) + safeNum(deal.root, 0) * commission;
			const display = convertPrice(sar, currency, rates);
			return (
				<TilePrice>
					<b>
						{display} {t[currency.toUpperCase()]}
					</b>
					<span className='unit'>{t.perNight}</span>
				</TilePrice>
			);
		} else {
			const sar =
				safeNum(deal.monthBase, 0) + safeNum(deal.monthRoot, 0) * commission;
			const display = convertPrice(sar, currency, rates);
			return (
				<TilePrice>
					<b>
						{display} {t[currency.toUpperCase()]}
					</b>
					<span className='unit'>{t.perMonth}</span>
				</TilePrice>
			);
		}
	};

	const hasDeals = roomCards.length > 0;

	return (
		<Page
			isArabic={chosenLanguage === "Arabic"}
			dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
		>
			<Header>
				<h1>{t.pageTitle}</h1>
				<p className='subtitle'>{t.sub}</p>
				<Controls>
					<Currency>
						<label>{t.currency}</label>
						<select
							value={currency}
							onChange={(e) => setCurrency(e.target.value)}
						>
							<option value='sar'>{t.SAR}</option>
							<option value='usd'>{t.USD}</option>
							<option value='eur'>{t.EUR}</option>
						</select>
					</Currency>
				</Controls>
			</Header>

			{loading ? (
				<Center>
					<Spin size='large' tip={t.loading} />
				</Center>
			) : error ? (
				<Center>{error}</Center>
			) : !hasDeals ? (
				<Center>{t.noDeals}</Center>
			) : (
				<CardsWrap>
					{roomCards.map((card) => {
						const { hotel, room, offers, monthly } = card;
						const rid = room._id;
						const rtl = chosenLanguage === "Arabic";
						const commission = toCommissionDecimal(room, hotel);
						const selected = selectedByRoom[rid] || null;

						const combinedFeatures = [
							...(room.amenities || []),
							...(room.views || []),
							...(room.extraAmenities || []),
						];
						const features = [...new Set(combinedFeatures)];
						const visibleFeatures = features.slice(0, 4);

						const hotelSlug = buildSlug(hotel.hotelName) || hotel._id;

						// Deep-link to SingleHotel with package if selected
						const singleHotelUrl = (() => {
							if (!selected) return `/single-hotel/${hotelSlug}`;
							const sp = new URLSearchParams();
							sp.set("section", "packages");
							sp.set("roomId", rid);
							sp.set("pkgType", selected.type);
							sp.set("pkgId", selected.id);
							return `/single-hotel/${hotelSlug}?${sp.toString()}`;
						})();

						const driving = localizeDrive(
							hotel?.distances?.drivingToElHaram,
							chosenLanguage
						);

						// Expand state per room
						const state = expandedByRoom[rid] || {
							offers: false,
							monthly: false,
						};
						const showOffers = state.offers ? offers : offers.slice(0, 3);
						const showMonthly = state.monthly ? monthly : monthly.slice(0, 3);

						// Nights summary (if selected)
						const start = selected?.from ? dayjs(selected.from) : null;
						const end = selected?.to ? dayjs(selected.to) : null;
						const nights =
							start && end && end.isAfter(start) ? end.diff(start, "day") : 0;

						return (
							<Card rtl={rtl} key={rid}>
								{/* Media column */}
								<MediaCol>
									<MediaBox>
										<Swiper
											modules={[Pagination, Thumbs]}
											spaceBetween={10}
											slidesPerView={1}
											pagination={{ clickable: true }}
											loop
											className='main-swiper'
											onClick={() => (window.location.href = singleHotelUrl)}
										>
											{(room.photos || []).map((photo, idx) => (
												<SwiperSlide key={idx}>
													<img
														src={photo.url}
														alt={`${room.displayName} - ${idx + 1}`}
														className='room-image'
														loading='lazy'
													/>
												</SwiperSlide>
											))}
											{(!room.photos || room.photos.length === 0) && (
												<SwiperSlide>
													<img
														src='https://via.placeholder.com/1200x800?text=Room'
														alt={room.displayName}
														className='room-image'
													/>
												</SwiperSlide>
											)}
										</Swiper>
									</MediaBox>
								</MediaCol>

								{/* Info column */}
								<InfoCol>
									<HotelName
										dir={rtl ? "rtl" : "ltr"}
										style={{ textAlign: rtl ? "center" : "" }}
									>
										{rtl && hotel.hotelName_OtherLanguage
											? hotel.hotelName_OtherLanguage
											: hotel.hotelName}
									</HotelName>

									<RoomTitle dir={rtl ? "rtl" : "ltr"} title={room.displayName}>
										{rtl
											? room.displayName_OtherLanguage || room.displayName
											: room.displayName}
									</RoomTitle>

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

									<DistanceLine dir={rtl ? "rtl" : ""}>
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

									<Amenities>
										{visibleFeatures.map((f) => (
											<Amenity key={f}>
												{getIcon(f)} <span>{f}</span>
											</Amenity>
										))}
									</Amenities>

									{/* PACKAGES (under amenities) */}
									<SectionHead>{t.choosePackage}</SectionHead>

									{offers.length > 0 && (
										<>
											<Tag color='green' style={{ marginBottom: 6 }}>
												{t.offers}
											</Tag>
											<TileGrid>
												{showOffers.map((d) => {
													const checked = selected?.id === d.id;
													const title = `${d.name} · ${t.valid}: ${fmt(
														d.from
													)} ${t.to} ${fmt(d.to)}`;
													return (
														<Tile
															key={d.id}
															onClick={() => onSelectDeal(rid, d)}
														>
															<input
																type='radio'
																readOnly
																checked={checked}
																aria-label={d.name}
															/>
															<div className='title' title={title}>
																{title}
															</div>
															{renderTilePrice(d, commission)}
														</Tile>
													);
												})}
											</TileGrid>
											{offers.length > 3 && (
												<ShowToggle>
													<button
														className='pill'
														onClick={() =>
															setExpandedByRoom((p) => ({
																...p,
																[rid]: {
																	...(p[rid] || {}),
																	offers: !state.offers,
																},
															}))
														}
													>
														{state.offers
															? t.showLess
															: `${t.showMore} (${offers.length - 3})`}
													</button>
												</ShowToggle>
											)}
										</>
									)}

									{monthly.length > 0 && (
										<>
											<Tag
												color='blue'
												style={{ marginTop: 8, marginBottom: 6 }}
											>
												{t.monthly}
											</Tag>
											<TileGrid>
												{showMonthly.map((m) => {
													const checked = selected?.id === m.id;
													const title = `${m.name} · ${t.valid}: ${fmt(
														m.from
													)} ${t.to} ${fmt(m.to)}`;
													return (
														<Tile
															key={m.id}
															onClick={() => onSelectDeal(rid, m)}
														>
															<input
																type='radio'
																readOnly
																checked={checked}
																aria-label={m.name}
															/>
															<div className='title' title={title}>
																{title}
															</div>
															{renderTilePrice(m, commission)}
														</Tile>
													);
												})}
											</TileGrid>
											{monthly.length > 3 && (
												<ShowToggle>
													<button
														className='pill'
														onClick={() =>
															setExpandedByRoom((p) => ({
																...p,
																[rid]: {
																	...(p[rid] || {}),
																	monthly: !state.monthly,
																},
															}))
														}
													>
														{state.monthly
															? t.showLess
															: `${t.showMore} (${monthly.length - 3})`}
													</button>
												</ShowToggle>
											)}
										</>
									)}

									{/* CTA row: appears only when a package is selected */}
									<CTARow>
										<Link to={singleHotelUrl}>
											<Button size='middle'>{t.viewHotel}</Button>
										</Link>

										{selected && (
											<Button
												type='primary'
												size='middle'
												onClick={() => handleAddToReservation(card)}
												style={{ marginInlineStart: 8 }}
											>
												{t.addToReservation}
											</Button>
										)}
									</CTARow>

									{/* Optional summary */}
									{selected && (
										<Summary>
											{t.selected}: <b>{selected.name}</b> —{" "}
											{fmt(selected.from)} {t.to} {fmt(selected.to)}
											{nights > 0 && (
												<>
													{" "}
													· {t.totalNights} {nights} {t.nights}
												</>
											)}
										</Summary>
									)}
								</InfoCol>
							</Card>
						);
					})}
				</CardsWrap>
			)}
		</Page>
	);
};

export default OffersAndMonthly;

/* ============ styled ============ */

/* Full-width page; inner content constrained to a wide container (max 1380px) */
const Page = styled.div`
	width: 100%;
	background-color: #f9f9f9;
	padding: clamp(90px, 10vw, 120px) 0 70px;

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
`;

const Header = styled.div`
	width: min(96vw, 1380px);
	margin: 0 auto 8px;

	h1 {
		font-size: clamp(1.4rem, 1.6vw + 1rem, 1.9rem);
		color: #006ad1;
		margin: 0 0 2px 0;
		font-weight: 800;
		text-align: center;
	}
	.subtitle {
		text-align: center;
		color: var(--darkGrey);
		margin: 0 auto 8px auto;
		max-width: 860px;
		font-size: 0.95rem;
	}
`;

const Controls = styled.div`
	width: min(96vw, 1380px);
	margin: 8px auto 14px;
	display: flex;
	justify-content: flex-end;
	align-items: center;
`;

const Currency = styled.div`
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
`;

const Center = styled.div`
	width: min(96vw, 1380px);
	margin: 30px auto;
	text-align: center;
	color: var(--darkGrey);
	font-weight: 700;
`;

const CardsWrap = styled.div`
	width: min(96vw, 1380px);
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: 14px;
`;

const Card = styled.div`
	background-color: var(--mainWhite);
	border: 1px solid var(--border-color-light);
	border-radius: 10px;
	box-shadow: var(--box-shadow-light);
	padding: clamp(12px, 1.2vw, 18px);
	display: flex;
	gap: clamp(10px, 2vw, 20px);
	flex-direction: ${({ rtl }) => (rtl ? "row-reverse" : "row")};

	&:hover {
		box-shadow: var(--box-shadow-dark);
	}

	@media (max-width: 900px) {
		flex-direction: column; /* mobile: image first, then content */
		gap: 10px;
	}
`;

const MediaCol = styled.div`
	flex: 0 0 40%;
	@media (max-width: 1200px) {
		flex-basis: 44%;
	}
	@media (max-width: 900px) {
		flex-basis: auto;
	}
`;
const InfoCol = styled.div`
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
`;

/* No distortion: aspect ratio + cover */
const MediaBox = styled.div`
	position: relative;
	width: 100%;
	aspect-ratio: 13 / 10;
	min-height: 220px;
	max-height: 520px;
	overflow: hidden;
	border-radius: 10px;
	background: #f2f2f2;

	.main-swiper {
		height: 100%;
	}
	.main-swiper .swiper-wrapper {
		height: 100%;
	}
	.main-swiper .swiper-slide {
		height: 100%;
		display: flex;
	}
	.room-image {
		width: 100%;
		height: 100% !important;
		object-fit: cover;
		object-position: center;
		display: block;
		cursor: pointer;
	}
`;

const HotelName = styled.p`
	font-size: 1rem;
	color: #555;
	margin: 0 0 4px 0;
	text-transform: capitalize;
	font-weight: bold;

	@media (max-width: 700px) {
		font-size: 1rem;
	}
`;

const RoomTitle = styled.h3`
	font-size: clamp(1rem, 1.2vw + 0.8rem, 1.25rem);
	color: #333;
	margin: 0 0 6px 0;
	text-transform: capitalize;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const RatingRow = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	margin-bottom: 4px;
	.rating-label {
		font-size: 11px;
		font-weight: 700;
		color: #555;
	}
`;

const DistanceLine = styled.div`
	font-size: 0.95rem;
	color: #006ed9;
	margin: 0 0 6px 0;
	text-transform: capitalize;
	font-weight: bold;

	@media (max-width: 700px) {
		font-size: 0.9rem;
		font-weight: 600;
	}
`;

const Amenities = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	grid-gap: 8px;
	margin: 4px 0 8px;

	@media (max-width: 600px) {
		grid-template-columns: repeat(2, 1fr);
	}
`;
const Amenity = styled.div`
	display: flex;
	align-items: center;
	font-size: 12px;
	color: #666;
	span {
		margin-left: 5px;
		font-size: 9px;
		font-weight: bold;
	}
`;

const SectionHead = styled.div`
	font-weight: 800;
	font-size: 0.95rem;
	margin: 6px 0 4px;
`;

const TileGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
	gap: 8px;
`;

const Tile = styled.div`
	display: grid;
	grid-template-columns: auto 1fr;
	grid-template-rows: auto auto;
	align-items: center;
	gap: 6px 8px;
	padding: 8px 10px;
	border: 1px solid var(--border-color-light);
	border-radius: 10px;
	background: #fff;
	cursor: pointer;
	min-height: 64px; /* compact height */

	input[type="radio"] {
		cursor: pointer;
	}
	.title {
		grid-column: 2 / 3;
		font-size: 0.88rem;
		font-weight: 700;
		color: #0f1f2e;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis; /* === first line only === */
		line-height: 1.2;
	}
`;

const TilePrice = styled.div`
	grid-column: 2 / 3;
	display: inline-flex;
	align-items: baseline;
	gap: 6px;
	margin-top: -2px;

	b {
		font-size: 1rem;
	}
	.unit {
		font-size: 0.78rem;
		color: #333;
		font-weight: 700;
	}
`;

const ShowToggle = styled.div`
	display: flex;
	justify-content: center;
	margin-top: 6px;
	.pill {
		border: 1px solid var(--primaryBlue);
		color: var(--primaryBlue);
		background: white;
		border-radius: 999px;
		padding: 3px 10px;
		font-size: 0.8rem;
		font-weight: 700;
		cursor: pointer;
		transition: 0.2s ease;
	}
	.pill:hover {
		background: var(--primaryBlue);
		color: #fff;
	}
`;

const CTARow = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 8px;
	flex-wrap: wrap;
`;

const Summary = styled.div`
	color: #666;
	font-size: 0.86rem;
	margin-top: 4px;
`;
