export interface PopularRoute {
  slug: string;
  from: string;
  to: string;
  fromCity: string;
  toCity: string;
  fromCode: string;
  toCode: string;
  blurb: string;
  hubs: string[];
  keywords: string[];
}

/**
 * Curated set of high-intent city-pair landing pages. Each targets the
 * "alternative / connecting route" search intent rather than plain
 * "book a ticket" intent — e.g. "Delhi to Mumbai via Vadodara", "cheapest
 * way to travel Delhi to Mumbai" — which is Wayvia's actual differentiator.
 */
export const POPULAR_ROUTES: PopularRoute[] = [
  {
    slug: "delhi-to-mumbai",
    from: "Delhi",
    to: "Mumbai",
    fromCity: "Delhi",
    toCity: "Mumbai",
    fromCode: "NDLS",
    toCode: "BCT",
    blurb:
      "One of India's busiest corridors. When direct trains are waitlisted, routes via Vadodara, Kota, or Ratlam often have confirmed seats and can even work out cheaper.",
    hubs: ["Vadodara", "Kota", "Ratlam", "Surat"],
    keywords: [
      "Delhi to Mumbai train",
      "Delhi to Mumbai alternative train routes",
      "Delhi to Mumbai via Vadodara",
      "cheapest way to travel Delhi to Mumbai",
      "fastest way to travel Delhi to Mumbai",
    ],
  },
  {
    slug: "delhi-to-bangalore",
    from: "Delhi",
    to: "Bangalore",
    fromCity: "Delhi",
    toCity: "Bengaluru",
    fromCode: "NDLS",
    toCode: "SBC",
    blurb:
      "A long north-south run where connecting via Nagpur or Secunderabad frequently beats waiting on a single waitlisted direct train.",
    hubs: ["Nagpur", "Secunderabad", "Guntakal"],
    keywords: [
      "Delhi to Bangalore train",
      "Delhi to Bangalore connecting trains",
      "Delhi to Bangalore alternative route",
      "best train route Delhi to Bangalore",
    ],
  },
  {
    slug: "mumbai-to-goa",
    from: "Mumbai",
    to: "Goa",
    fromCity: "Mumbai",
    toCity: "Goa",
    fromCode: "CSMT",
    toCode: "MAO",
    blurb:
      "The Konkan route fills up fast in peak season. Checking connections via Pune or Ratnagiri-area junctions widens what's actually available.",
    hubs: ["Pune", "Ratnagiri"],
    keywords: [
      "Mumbai to Goa train",
      "Mumbai to Goa train availability",
      "Mumbai to Goa alternative routes",
      "cheapest way to travel Mumbai to Goa",
    ],
  },
  {
    slug: "chennai-to-delhi",
    from: "Chennai",
    to: "Delhi",
    fromCity: "Chennai",
    toCity: "Delhi",
    fromCode: "MAS",
    toCode: "NDLS",
    blurb:
      "One of the longest domestic rail corridors. Vijayawada and Nagpur are common transfer points when direct trains are full.",
    hubs: ["Vijayawada", "Nagpur", "Bhopal"],
    keywords: [
      "Chennai to Delhi train",
      "Chennai to Delhi connecting trains",
      "fastest train Chennai to Delhi",
      "train route with availability Chennai to Delhi",
    ],
  },
  {
    slug: "kolkata-to-delhi",
    from: "Kolkata",
    to: "Delhi",
    fromCity: "Kolkata",
    toCity: "Delhi",
    fromCode: "HWH",
    toCode: "NDLS",
    blurb:
      "Direct Rajdhani-class trains are popular and fill early. Routes via Kanpur or Allahabad often surface confirmed alternatives.",
    hubs: ["Kanpur", "Prayagraj", "Mughalsarai"],
    keywords: [
      "Kolkata to Delhi train",
      "Kolkata to Delhi alternative train routes",
      "best train route Kolkata to Delhi",
      "Kolkata to Delhi via Kanpur",
    ],
  },
  {
    slug: "pune-to-hyderabad",
    from: "Pune",
    to: "Hyderabad",
    fromCity: "Pune",
    toCity: "Hyderabad",
    fromCode: "PUNE",
    toCode: "SC",
    blurb:
      "A mid-length route where connecting via Solapur can open up seats that a sold-out direct train won't show.",
    hubs: ["Solapur", "Gulbarga"],
    keywords: [
      "Pune to Hyderabad train",
      "Pune to Hyderabad connecting trains",
      "Pune to Hyderabad train availability",
    ],
  },
  {
    slug: "delhi-to-jaipur",
    from: "Delhi",
    to: "Jaipur",
    fromCity: "Delhi",
    toCity: "Jaipur",
    fromCode: "NDLS",
    toCode: "JP",
    blurb:
      "A short, high-frequency corridor — usually plenty of direct options, but worth comparing fastest vs. cheapest picks.",
    hubs: ["Alwar", "Rewari"],
    keywords: ["Delhi to Jaipur train", "fastest train Delhi to Jaipur", "cheapest train Delhi to Jaipur"],
  },
  {
    slug: "bangalore-to-chennai",
    from: "Bangalore",
    to: "Chennai",
    fromCity: "Bengaluru",
    toCity: "Chennai",
    fromCode: "SBC",
    toCode: "MAS",
    blurb:
      "One of the busiest short-haul corridors in the south — comparing multiple direct trains by time and price usually beats booking the first one you see.",
    hubs: ["Jolarpettai", "Katpadi"],
    keywords: ["Bangalore to Chennai train", "fastest train Bangalore to Chennai", "Bangalore to Chennai train timing"],
  },
];

export function getPopularRoute(slug: string): PopularRoute | undefined {
  return POPULAR_ROUTES.find((r) => r.slug === slug);
}
