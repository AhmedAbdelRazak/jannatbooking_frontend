const fs = require("fs");
const path = require("path");

const readSource = (...segments) =>
  fs.readFileSync(path.resolve(__dirname, "..", ...segments), "utf8");

describe("featured hotel customer-surface wiring", () => {
  test("pins Zad Ajyad on every hotel and room recommendation list", () => {
    const home = readSource("components", "Home", "PopularHotels.js");
    const hotels = readSource("pages", "OurHotels.js");
    const rooms = readSource("pages", "OurHotelRooms2.js");
    const offers = readSource("pages", "OffersAndMonthly.js");

    expect(home).toContain("prioritizeFeaturedHotels(activeHotels)");
    expect(hotels).toContain("prioritizeFeaturedHotels(rankedHotels)");
    expect(rooms).toContain("prioritizeFeaturedHotels(sortedHotels)");
    expect(offers).toContain("prioritizeFeaturedRoomCards(cards)");
  });

  test("applies the restrained featured treatment to all active card surfaces", () => {
    const surfaces = [
      readSource("components", "Home", "PopularHotels.js"),
      readSource("components", "OurHotels", "HotelList2.js"),
      readSource("pages", "OurHotelRooms2.js"),
      readSource("pages", "OffersAndMonthly.js"),
      readSource("components", "SingleHotel", "SingleHotel.js"),
    ];

    surfaces.forEach((source) => {
      expect(source).toContain("isFeaturedHotel");
      expect(source).toContain("FeaturedHotelBadge");
      expect(source).toContain("$featured");
    });
  });

  test("keeps recommendation priority pure instead of effect-driven", () => {
    const policy = readSource("utils", "featuredHotel.js");
    expect(policy).not.toMatch(/useEffect|setState|setInterval|setTimeout/);
    expect(policy).toContain("return [...featured, ...standard]");
  });
});
