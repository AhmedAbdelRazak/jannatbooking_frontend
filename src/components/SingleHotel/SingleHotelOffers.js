import React, {
	useEffect,
	useMemo,
	useRef,
	useState,
	useCallback,
} from "react";
import styled from "styled-components";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import StarRatings from "react-star-ratings";
import { FaCar } from "react-icons/fa";
import { Button, Tag } from "antd";
import dayjs from "dayjs";
import { useCartContext } from "../../cart_context";
import { amenitiesList, viewsList, extraAmenitiesList } from "../../Assets";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import { useHistory, useLocation } from "react-router-dom";

/* ===== behavior constants ===== */
const HEADER_OFFSET = 80; // base offset for fixed header
const SCROLL_DELAY_MS = 450; // allow layout/images to settle

/* ===== i18n ===== */
const tDict = {
	English: {
		heading: "Packages & Offers",
		choose: "Choose a package",
		offers: "Offers",
		monthly: "Monthly",
		perNight: "/ NIGHT",
		perMonth: "/ MONTH",
		valid: "Valid",
		to: "to",
		addToReservation: "Add to Reservation",
		hotelRating: "Hotel Rating:",
		drivingToHaram: "Driving To El Haram",
		drivingToProphetMosque: "Driving To The Mosque",
		noDealsTitle: "No packages or offers yet",
		noDealsSub:
			"We’re working hard with the hotel to bring you fresh offers and monthly packages. Please check back soon!",
		SAR: "SAR",
		USD: "USD",
		EUR: "EUR",
		showMore: "Show more",
		showLess: "Show less",
	},
	Arabic: {
		heading: "العروض والباقات",
		choose: "اختر باقة",
		offers: "العروض",
		monthly: "الشهرية",
		perNight: "/ ليلة",
		perMonth: "/ شهر",
		valid: "ساري",
		to: "إلى",
		addToReservation: "إضافة إلى الحجز",
		hotelRating: "تقييم الفندق:",
		drivingToHaram: "بالسيارة إلى الحرم",
		drivingToProphetMosque: "الى المسجد النبوي الشريف",
		noDealsTitle: "لا توجد عروض أو باقات حالياً",
		noDealsSub:
			"نعمل بجد مع الفندق لإضافة عروض وباقات شهرية جديدة. يُرجى العودة لاحقاً!",
		SAR: "ريال",
		USD: "دولار",
		EUR: "يورو",
		showMore: "عرض المزيد",
		showLess: "عرض أقل",
	},
};

/* ===== helpers ===== */
const safeNum = (v, d = 0) => {
	const n = Number(v);
	return Number.isFinite(n) ? n : d;
};

const toCommissionDecimal = (room, hotel) => {
	const envFactor = safeNum(process.env.REACT_APP_COMMISSIONRATE, 1.1); // e.g., 1.1 => 10%
	const defaultPct = (envFactor - 1) * 100;
	const norm = (v) => (v <= 1 ? v : v / 100);
	const r = safeNum(room?.roomCommission, NaN);
	const h = safeNum(hotel?.commission, NaN);
	const rn = Number.isFinite(r) && r > 0 ? norm(r) : NaN;
	const hn = Number.isFinite(h) && h > 0 ? norm(h) : NaN;
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

const isActiveOrUpcoming = (from, to) => {
	const now = new Date();
	const f = from ? new Date(from) : null;
	const t = to ? new Date(to) : null;
	if (t && !isNaN(t) && t < now) return false;
	if (f && !isNaN(f) && f >= now) return true;
	if (t && !isNaN(t) && t >= now) return true;
	return false;
};

const dateRange = (start, end) => {
	const a = dayjs(start);
	const b = dayjs(end);
	const out = [];
	for (let d = a; d.isBefore(b, "day"); d = d.add(1, "day")) {
		out.push(d.format("YYYY-MM-DD"));
	}
	return out;
};

const convertPrice = (sar, currency, rates) => {
	if (!currency || currency === "sar") return sar.toFixed(0);
	if (currency === "usd") return (sar * (rates?.SAR_USD || 0.27)).toFixed(0);
	if (currency === "eur") return (sar * (rates?.SAR_EUR || 0.25)).toFixed(0);
	return sar.toFixed(0);
};

const getIcon = (item) => {
	const amenity = amenitiesList.find((a) => a.name === item);
	if (amenity) return amenity.icon;
	const view = viewsList.find((v) => v.name === item);
	if (view) return view.icon;
	const extra = extraAmenitiesList.find((e) => e.name === item);
	if (extra) return extra.icon;
	return null;
};

const localizeDrive = (s, lang) => {
	if (!s) return s;
	if (lang !== "Arabic") return s;
	return s.replace(/Mins?/i, "دقائق").replace(/Hours?/i, "ساعات");
};

/* ===== Component ===== */
const SingleHotelOffers = ({
	selectedHotel,
	chosenLanguage,
	selectedCurrency,
	currencyRates,
}) => {
	const { addRoomToCart, openSidebar2 } = useCartContext();
	const history = useHistory();
	const location = useLocation();

	const t = tDict[chosenLanguage] || tDict.English;
	const currency = (selectedCurrency || "sar").toLowerCase();

	const [selectedByRoom, setSelectedByRoom] = useState({});
	const [expandedByRoom, setExpandedByRoom] = useState({}); // {roomId:{offers,monthly}}
	const roomRefs = useRef({}); // map roomId -> DOM node for scrolling
	const initialScrolled = useRef(false);

	const cards = useMemo(() => {
		const out = [];
		(selectedHotel?.roomCountDetails || []).forEach((room) => {
			const offers =
				(room?.offers || [])
					.map(normalizeOffer)
					.filter((o) => Number.isFinite(o.base) && o.base > 0)
					.filter((o) => isActiveOrUpcoming(o.from, o.to)) || [];
			const monthly =
				(room?.monthly || [])
					.map(normalizeMonthly)
					.filter((m) => Number.isFinite(m.monthBase) && m.monthBase > 0)
					.filter((m) => isActiveOrUpcoming(m.from, m.to)) || [];
			if (offers.length || monthly.length) out.push({ room, offers, monthly });
		});
		return out;
	}, [selectedHotel]);

	/* ---------- URL helpers ---------- */
	const setURLSelection = useCallback(
		(roomId, deal) => {
			if (!deal) return;
			const sp = new URLSearchParams(location.search);
			sp.set("section", "packages");
			sp.set("roomId", roomId);
			sp.set("pkgType", deal.type);
			sp.set("pkgId", deal.id);
			["packageId"].forEach((k) => sp.delete(k)); // for legacy
			history.push({
				pathname: location.pathname,
				search: `?${sp.toString()}`,
			});
		},
		[history, location.pathname, location.search]
	);

	const deepLink = useMemo(() => {
		const sp = new URLSearchParams(location.search);
		return {
			section: sp.get("section") || "",
			roomId: sp.get("roomId") || "",
			pkgType: sp.get("pkgType") || "",
			pkgId: sp.get("pkgId") || sp.get("packageId") || "",
		};
	}, [location.search]);

	const getDynamicHeaderOffset = useCallback(() => {
		let offset = HEADER_OFFSET + (window.innerWidth <= 768 ? 40 : 0);
		const stickyTabs =
			document.querySelector("[data-tabs-sticky]") ||
			document.querySelector("[data-singlehotel-tabs]");
		if (stickyTabs) offset += stickyTabs.getBoundingClientRect().height || 0;
		return offset;
	}, []);

	// Scroll to room card OR to the exact tile (id is unique per room+pkg)
	const smartScroll = useCallback(
		(roomId, pkgId, attempt = 0) => {
			const doScroll = () => {
				const tile =
					(pkgId && document.getElementById(`pkg-tile-${roomId}-${pkgId}`)) ||
					null;
				const el = tile || roomRefs.current[roomId];
				if (!el) return;
				const top =
					el.getBoundingClientRect().top +
					window.scrollY -
					getDynamicHeaderOffset() -
					6;
				window.scrollTo({ top, behavior: attempt === 0 ? "auto" : "smooth" });
			};

			const delay = [150, SCROLL_DELAY_MS, 900][attempt] || 900;
			setTimeout(() => {
				requestAnimationFrame(doScroll);
				if (attempt < 2) smartScroll(roomId, pkgId, attempt + 1);
			}, delay);
		},
		[getDynamicHeaderOffset]
	);

	/* ---------- Preselect from URL + scroll to exact room/tile ---------- */
	useEffect(() => {
		if (!cards.length) return;
		if (!deepLink.roomId || !deepLink.pkgId) return;

		const bucket = cards.find((c) => c.room._id === deepLink.roomId);
		if (!bucket) return;

		let searchIn =
			deepLink.pkgType === "offer" ? bucket.offers : bucket.monthly;
		let found = (searchIn || []).find((x) => x.id === deepLink.pkgId);
		if (!found) {
			const any = [...bucket.offers, ...bucket.monthly];
			found = any.find((x) => x.id === deepLink.pkgId);
		}
		if (!found) return;

		const idxOffers = bucket.offers.findIndex((x) => x.id === found.id);
		const idxMonthly = bucket.monthly.findIndex((x) => x.id === found.id);
		setExpandedByRoom((p) => ({
			...p,
			[bucket.room._id]: {
				offers: idxOffers >= 3 ? true : p[bucket.room._id]?.offers || false,
				monthly: idxMonthly >= 3 ? true : p[bucket.room._id]?.monthly || false,
			},
		}));

		setSelectedByRoom((prev) => ({ ...prev, [bucket.room._id]: found }));

		if (!initialScrolled.current) {
			initialScrolled.current = true;
			smartScroll(bucket.room._id, found.id);
		}
	}, [cards, deepLink, smartScroll]);

	const onSelectDeal = (roomId, deal) => {
		setSelectedByRoom((prev) => ({ ...prev, [roomId]: deal }));
		setURLSelection(roomId, deal);
		smartScroll(roomId, deal.id);
	};

	/* ---------- Add to Reservation with package breakdown ---------- */
	const handleAddToReservation = (room) => {
		const hotel = selectedHotel;
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
			// flags for reducer / drawer:
			fromPackagesOffers: true,
			lockDates: true,
			packageMeta: { type: sel.type, pkgId: sel.id, roomId: room._id },
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
			category: "Deals in Single Hotel",
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
		if (deal.type === "offer") {
			const sar = safeNum(deal.base, 0) + safeNum(deal.root, 0) * commission;
			const display = convertPrice(sar, currency, currencyRates);
			return (
				<TilePrice>
					<b>
						{display} {t[currency.toUpperCase()]}
					</b>
					<span className='unit'>{t.perNight}</span>
				</TilePrice>
			);
		}
		const sar =
			safeNum(deal.monthBase, 0) + safeNum(deal.monthRoot, 0) * commission;
		const display = convertPrice(sar, currency, currencyRates);
		return (
			<TilePrice>
				<b>
					{display} {t[currency.toUpperCase()]}
				</b>
				<span className='unit'>{t.perMonth}</span>
			</TilePrice>
		);
	};

	const rtl = chosenLanguage === "Arabic";
	const driving = localizeDrive(
		selectedHotel?.distances?.drivingToElHaram,
		chosenLanguage
	);

	return (
		<Wrapper dir={rtl ? "rtl" : "ltr"}>
			<SectionTitle>{t.heading}</SectionTitle>

			{!cards.length ? (
				<Empty>
					<h3>{t.noDealsTitle}</h3>
					<p>{t.noDealsSub}</p>
				</Empty>
			) : (
				cards.map(({ room, offers, monthly }) => {
					const commission = toCommissionDecimal(room, selectedHotel);
					const selected = selectedByRoom[room._id] || null;
					const state = expandedByRoom[room._id] || {
						offers: false,
						monthly: false,
					};
					const showOffers = state.offers ? offers : offers.slice(0, 3);
					const showMonthly = state.monthly ? monthly : monthly.slice(0, 3);

					const combinedFeatures = [
						...(room.amenities || []),
						...(room.views || []),
						...(room.extraAmenities || []),
					];
					const features = [...new Set(combinedFeatures)];
					const visibleFeatures = features.slice(0, 4);

					return (
						<Card
							key={room._id}
							rtl={rtl}
							ref={(el) => {
								if (el) roomRefs.current[room._id] = el;
							}}
							id={`pkg-room-${room._id}`}
						>
							{/* Images */}
							<MediaCol>
								<MediaBox>
									<Swiper
										modules={[Pagination, Thumbs]}
										spaceBetween={10}
										slidesPerView={1}
										pagination={{ clickable: true }}
										loop
										className='main-swiper'
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

							{/* Content */}
							<InfoCol>
								<HotelName>
									{rtl && selectedHotel.hotelName_OtherLanguage
										? selectedHotel.hotelName_OtherLanguage
										: selectedHotel.hotelName}
								</HotelName>

								<RoomTitle title={room.displayName}>
									{rtl
										? room.displayName_OtherLanguage || room.displayName
										: room.displayName}
								</RoomTitle>

								<RatingRow>
									<span className='rating-label'>{t.hotelRating}</span>
									<StarRatings
										rating={selectedHotel.hotelRating || 0}
										starRatedColor='orange'
										numberOfStars={5}
										name='rating'
										starDimension='15px'
										starSpacing='1px'
									/>
								</RatingRow>

								<DistanceLine>
									<FaCar />
									{selectedHotel.hotelState?.toLowerCase().includes("madinah")
										? driving
											? `${driving} ${t.drivingToProphetMosque}`
											: `N/A ${t.drivingToProphetMosque}`
										: driving
											? `${driving} ${t.drivingToHaram}`
											: `N/A ${t.drivingToHaram}`}
								</DistanceLine>

								<Amenities>
									{visibleFeatures.map((f) => (
										<Amenity key={f}>
											{getIcon(f)} <span>{f}</span>
										</Amenity>
									))}
								</Amenities>

								<SectionHead>{t.choose}</SectionHead>

								{offers.length > 0 && (
									<>
										<Tag color='green' style={{ marginBottom: 6 }}>
											{t.offers}
										</Tag>
										<TileGrid>
											{showOffers.map((d) => {
												const checked = selected?.id === d.id;
												const title = `${d.name} · ${t.valid}: ${dayjs(
													d.from
												).format(
													"DD MMM YYYY"
												)} ${t.to} ${dayjs(d.to).format("DD MMM YYYY")}`;
												return (
													<Tile
														key={d.id}
														id={`pkg-tile-${room._id}-${d.id}`} // UNIQUE per room + deal
														onClick={() => onSelectDeal(room._id, d)}
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
															[room._id]: {
																...(p[room._id] || {}),
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
										<Tag color='blue' style={{ marginTop: 8, marginBottom: 6 }}>
											{t.monthly}
										</Tag>
										<TileGrid>
											{showMonthly.map((m) => {
												const checked = selected?.id === m.id;
												const title = `${m.name} · ${t.valid}: ${dayjs(
													m.from
												).format(
													"DD MMM YYYY"
												)} ${t.to} ${dayjs(m.to).format("DD MMM YYYY")}`;
												return (
													<Tile
														key={m.id}
														id={`pkg-tile-${room._id}-${m.id}`} // UNIQUE per room + deal
														onClick={() => onSelectDeal(room._id, m)}
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
															[room._id]: {
																...(p[room._id] || {}),
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

								<CTARow>
									{selected && (
										<Button
											type='primary'
											size='middle'
											onClick={() => handleAddToReservation(room)}
										>
											{t.addToReservation}
										</Button>
									)}
								</CTARow>

								{selected && (
									<Summary>
										<b>{selected.name}</b> —{" "}
										{dayjs(selected.from).format("DD MMM YYYY")} {t.to}{" "}
										{dayjs(selected.to).format("DD MMM YYYY")}
										{(() => {
											const s = dayjs(selected.from);
											const e = dayjs(selected.to);
											const n = e.isAfter(s) ? e.diff(s, "day") : 0;
											return n > 0 ? (
												<>
													{" "}
													· {n}{" "}
													{chosenLanguage === "Arabic" ? "ليالٍ" : "nights"}
												</>
											) : null;
										})()}
									</Summary>
								)}
							</InfoCol>
						</Card>
					);
				})
			)}
		</Wrapper>
	);
};

export default SingleHotelOffers;

/* ===== styled ===== */
const Wrapper = styled.section`
	background: var(--neutral-light);
	border-radius: 10px;
	padding: 16px;
`;

const SectionTitle = styled.h2`
	color: var(--primaryBlue);
	margin: 0 0 10px;
	font-weight: bold;
`;

const Empty = styled.div`
	background: #fff;
	border: 1px solid var(--border-color-light);
	border-radius: 10px;
	padding: 24px;
	text-align: center;
	color: var(--darkGrey);

	h3 {
		margin: 0 0 6px;
		color: #0f1f2e;
	}
	p {
		margin: 0;
	}
`;

const Card = styled.div`
	background: #fff;
	border: 1px solid var(--border-color-light);
	border-radius: 10px;
	box-shadow: var(--box-shadow-light);
	padding: 14px;
	display: flex;
	gap: 16px;
	flex-direction: ${({ rtl }) => (rtl ? "row-reverse" : "row")};
	margin-bottom: 12px;

	&:hover {
		box-shadow: var(--box-shadow-dark);
	}

	@media (max-width: 900px) {
		flex-direction: column;
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

/* >>> FIX: use a wide aspect ratio (desktop) and 4:3 on mobile <<< */
const MediaBox = styled.div`
	position: relative;
	width: 100%;
	aspect-ratio: 10 / 10; /* WIDE on desktop */
	min-height: 220px;
	max-height: 520px;
	overflow: hidden;
	border-radius: 10px;
	background: #f2f2f2;

	@media (max-width: 900px) {
		aspect-ratio: 4 / 3; /* friendlier on phones */
	}

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
	}
`;

const HotelName = styled.p`
	font-size: 1rem;
	color: #555;
	margin: 0 0 4px;
	text-transform: capitalize;
	font-weight: bold;
`;

const RoomTitle = styled.h3`
	font-size: clamp(1rem, 1.2vw + 0.8rem, 1.25rem);
	color: #333;
	margin: 0 0 6px;
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
	margin: 0 0 6px;
	text-transform: capitalize;
	font-weight: bold;
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
	min-height: 64px;

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
		text-overflow: ellipsis;
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
	margin-top: 19px;
	margin-bottom: 8px;
	flex-wrap: wrap;
	width: 100%;
	button.ant-btn {
		width: 100%;
	}
`;

const Summary = styled.div`
	color: #666;
	font-size: 0.86rem;
	margin-top: 4px;
`;
