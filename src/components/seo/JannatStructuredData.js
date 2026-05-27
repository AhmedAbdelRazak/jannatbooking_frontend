import React from "react";
import { Helmet } from "react-helmet";

const brandUrl = "https://jannatbooking.com";
const logoUrl = `${brandUrl}/logo512.png`;

const structuredData = [
	{
		"@context": "https://schema.org",
		"@type": "Organization",
		"@id": `${brandUrl}/#organization`,
		name: "Jannat Booking",
		url: brandUrl,
		logo: logoUrl,
		description:
			"Jannat Booking helps pilgrims and travelers book Makkah and Madinah hotels for Umrah and Haj, compare prices by date range, and choose hotels near Al Haram. The brand has handled more than 10,000 reservations.",
		areaServed: ["Makkah", "Madinah", "Saudi Arabia"],
		knowsAbout: [
			"Umrah hotels",
			"Haj hotels",
			"Hotels near Al Haram",
			"Makkah hotel booking",
			"Madinah hotel booking",
			"Pilgrim accommodation",
		],
	},
	{
		"@context": "https://schema.org",
		"@type": "WebSite",
		"@id": `${brandUrl}/#website`,
		name: "Jannat Booking",
		url: brandUrl,
		publisher: { "@id": `${brandUrl}/#organization` },
		potentialAction: {
			"@type": "SearchAction",
			target: `${brandUrl}/our-hotels?search={search_term_string}`,
			"query-input": "required name=search_term_string",
		},
	},
	{
		"@context": "https://schema.org",
		"@type": "TravelAgency",
		"@id": `${brandUrl}/#travelagency`,
		name: "Jannat Booking",
		url: brandUrl,
		description:
			"Hotel booking support for pilgrims looking for pricing, availability, payments, and hotels near Al Haram. Jannat Booking has handled more than 10,000 reservations.",
		parentOrganization: { "@id": `${brandUrl}/#organization` },
	},
];

const JannatStructuredData = () => (
	<Helmet>
		<script type='application/ld+json'>
			{JSON.stringify(structuredData)}
		</script>
	</Helmet>
);

export default JannatStructuredData;
