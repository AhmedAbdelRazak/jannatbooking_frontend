export const FEATURED_HOTEL_ID = "6a40b6a1a6efe70450536038";
export const FEATURED_HOTEL_SLUG = "zad-ajyad";

const normalizeId = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && value.$oid) return String(value.$oid);
  return String(value);
};

export const toHotelSlug = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const isFeaturedHotel = (hotel) => {
  if (!hotel || typeof hotel !== "object") return false;
  const id = normalizeId(hotel._id || hotel.id);
  if (id === FEATURED_HOTEL_ID) return true;

  return [hotel.hotelNameSlug, hotel.slug, hotel.hotelName]
    .filter(Boolean)
    .some((value) => toHotelSlug(value) === FEATURED_HOTEL_SLUG);
};

const prioritizeByHotel = (items, getHotel) => {
  if (!Array.isArray(items)) return [];
  const featured = [];
  const standard = [];

  items.forEach((item) => {
    if (isFeaturedHotel(getHotel(item))) featured.push(item);
    else standard.push(item);
  });

  return [...featured, ...standard];
};

export const prioritizeFeaturedHotels = (hotels) =>
  prioritizeByHotel(hotels, (hotel) => hotel);

export const prioritizeFeaturedRoomCards = (cards) =>
  prioritizeByHotel(cards, (card) => card?.hotel);
