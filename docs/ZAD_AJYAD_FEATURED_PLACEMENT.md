# Zad Ajyad featured placement

Zad Ajyad is the owned marketing hotel and is identified by the exact hotel ID
`6a40b6a1a6efe70450536038` or the canonical slug `zad-ajyad`.

The shared rules live in `src/utils/featuredHotel.js`. Recommendation lists use a
stable, non-mutating partition so Zad Ajyad is first whenever it is present, while
every other hotel or room keeps its original order. Filters, prices, availability,
and API payloads are not changed.

The customer card components and single-hotel view use the same exact identification
rule for a restrained gold accent and bilingual “Jannat Booking Choice” badge. Do not
duplicate the ID in page components or use fuzzy name matching. Update the constants
and tests together if ownership or the canonical slug changes.

Run the featured-hotel tests, the full test suite, and `npm run build` after changing
this behavior. The public `/rooms` route is rendered by the companion SSR frontend,
which mirrors this policy in its own shared utility.
