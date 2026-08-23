import {
  FEATURED_HOTEL_ID,
  isFeaturedHotel,
  prioritizeFeaturedHotels,
  prioritizeFeaturedRoomCards,
  toHotelSlug,
} from "./featuredHotel";

describe("Zad Ajyad featured-hotel policy", () => {
  test("recognizes the canonical id and slug without fuzzy matching", () => {
    expect(
      isFeaturedHotel({ _id: FEATURED_HOTEL_ID, hotelName: "Other" }),
    ).toBe(true);
    expect(isFeaturedHotel({ _id: { $oid: FEATURED_HOTEL_ID } })).toBe(true);
    expect(isFeaturedHotel({ hotelName: "Zad Ajyad" })).toBe(true);
    expect(isFeaturedHotel({ hotelNameSlug: "zad-ajyad" })).toBe(true);
    expect(
      isFeaturedHotel({
        hotelName: "Translated name",
        hotelNameSlug: "zad-ajyad",
      }),
    ).toBe(true);
    expect(isFeaturedHotel({ hotelName: "Zad Ajyad Annex" })).toBe(false);
    expect(isFeaturedHotel(null)).toBe(false);
  });

  test("pins the featured hotel first while preserving every other ranking", () => {
    const original = Object.freeze([
      Object.freeze({ _id: "a", hotelName: "Alpha" }),
      Object.freeze({ _id: FEATURED_HOTEL_ID, hotelName: "Zad Ajyad" }),
      Object.freeze({ _id: "b", hotelName: "Beta" }),
    ]);
    const prioritized = prioritizeFeaturedHotels(original);

    expect(prioritized.map((hotel) => hotel._id)).toEqual([
      FEATURED_HOTEL_ID,
      "a",
      "b",
    ]);
    expect(original.map((hotel) => hotel._id)).toEqual([
      "a",
      FEATURED_HOTEL_ID,
      "b",
    ]);
  });

  test("pins all eligible featured room cards without changing room order", () => {
    const cards = [
      { room: { _id: "other-1" }, hotel: { _id: "other" } },
      { room: { _id: "zad-1" }, hotel: { _id: FEATURED_HOTEL_ID } },
      { room: { _id: "zad-2" }, hotel: { _id: FEATURED_HOTEL_ID } },
      { room: { _id: "other-2" }, hotel: { _id: "other" } },
    ];

    expect(
      prioritizeFeaturedRoomCards(cards).map((card) => card.room._id),
    ).toEqual(["zad-1", "zad-2", "other-1", "other-2"]);
  });

  test("normalizes public hotel names into the canonical URL slug", () => {
    expect(toHotelSlug("  Zad  Ajyad  ")).toBe("zad-ajyad");
    expect(prioritizeFeaturedHotels(null)).toEqual([]);
    expect(prioritizeFeaturedRoomCards(undefined)).toEqual([]);
  });
});
