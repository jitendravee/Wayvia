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
  {
    slug: "delhi-to-patna",
    from: "Delhi",
    to: "Patna",
    fromCity: "Delhi",
    toCity: "Patna",
    fromCode: "NDLS",
    toCode: "PNBE",
    blurb:
      "One of India's most heavily congested rail routes, especially during festival rushes. When direct Rajdhanis and Superfasts are sold out, connecting via Kanpur, Prayagraj, or Varanasi opens up confirmed seats.",
    hubs: ["Kanpur", "Prayagraj", "Varanasi", "Pt Deen Dayal Upadhyaya"],
    keywords: [
      "Delhi to Patna train",
      "Delhi to Patna waitlist alternative",
      "Delhi to Patna connecting trains",
      "confirmed ticket Delhi to Patna",
      "Delhi to Patna via Kanpur",
    ],
  },
  {
    slug: "mumbai-to-varanasi",
    from: "Mumbai",
    to: "Varanasi",
    fromCity: "Mumbai",
    toCity: "Varanasi",
    fromCode: "CSMT",
    toCode: "BSB",
    blurb:
      "A perennial high-demand spiritual and family corridor. When direct trains like Mahanagari Express are waitlisted, breaking the journey at Bhusawal, Itarsi, or Jabalpur often unlocks confirmed berths.",
    hubs: ["Bhusawal", "Itarsi", "Jabalpur", "Prayagraj"],
    keywords: [
      "Mumbai to Varanasi train",
      "Mumbai to Varanasi train availability",
      "Mumbai to Varanasi connecting trains",
      "Mumbai to Varanasi via Itarsi",
    ],
  },
  {
    slug: "bangalore-to-hyderabad",
    from: "Bangalore",
    to: "Hyderabad",
    fromCity: "Bengaluru",
    toCity: "Hyderabad",
    fromCode: "SBC",
    toCode: "SC",
    blurb:
      "The primary tech corridor connecting Karnataka and Telangana. Routes via Guntakal or Kurnool City frequently provide confirmed seats when direct express trains are full.",
    hubs: ["Guntakal", "Kurnool", "Anantapur"],
    keywords: [
      "Bangalore to Hyderabad train",
      "Bangalore to Hyderabad connecting trains",
      "fastest train Bangalore to Hyderabad",
      "Bangalore to Hyderabad alternative route",
    ],
  },
  {
    slug: "delhi-to-lucknow",
    from: "Delhi",
    to: "Lucknow",
    fromCity: "Delhi",
    toCity: "Lucknow",
    fromCode: "NDLS",
    toCode: "LKO",
    blurb:
      "A fast-moving northern trunk corridor. When Tejas, Shatabdi, and Gomti Express are waitlisted, checking connections via Kanpur Central or Moradabad delivers confirmed seats.",
    hubs: ["Kanpur", "Moradabad", "Bareilly"],
    keywords: [
      "Delhi to Lucknow train",
      "Delhi to Lucknow alternative route",
      "Delhi to Lucknow connecting trains",
      "Delhi to Lucknow train ticket availability",
    ],
  },
  {
    slug: "mumbai-to-ahmedabad",
    from: "Mumbai",
    to: "Ahmedabad",
    fromCity: "Mumbai",
    toCity: "Ahmedabad",
    fromCode: "BCT",
    toCode: "ADI",
    blurb:
      "India's highest frequency commercial rail corridor. When direct Vande Bharat and Tejas Express are full, connecting via Surat or Vadodara unlocks extra quota allocations.",
    hubs: ["Surat", "Vadodara", "Vapi"],
    keywords: [
      "Mumbai to Ahmedabad train",
      "Mumbai to Ahmedabad connecting trains",
      "Mumbai to Ahmedabad via Surat",
      "fastest train Mumbai to Ahmedabad",
    ],
  },
  {
    slug: "kolkata-to-puri",
    from: "Kolkata",
    to: "Puri",
    fromCity: "Kolkata",
    toCity: "Puri",
    fromCode: "HWH",
    toCode: "PURI",
    blurb:
      "Eastern India's most popular coastal getaway. Weekend trains sell out weeks in advance; connecting via Kharagpur, Cuttack, or Bhubaneswar often reveals available berths.",
    hubs: ["Kharagpur", "Bhubaneswar", "Cuttack"],
    keywords: [
      "Kolkata to Puri train",
      "Howrah to Puri train alternative",
      "Kolkata to Puri connecting trains",
      "Kolkata to Puri train availability",
    ],
  },
  {
    slug: "pune-to-goa",
    from: "Pune",
    to: "Goa",
    fromCity: "Pune",
    toCity: "Goa",
    fromCode: "PUNE",
    toCode: "MAO",
    blurb:
      "Scenic Western Ghats corridor. Direct trains are limited and quickly waitlisted; connecting via Miraj, Belagavi, or Londa Junction gives dependable confirmed alternatives.",
    hubs: ["Miraj", "Belagavi", "Londa"],
    keywords: [
      "Pune to Goa train",
      "Pune to Goa connecting trains",
      "Pune to Goa train waitlist",
      "Pune to Goa via Miraj",
    ],
  },
  {
    slug: "bangalore-to-goa",
    from: "Bangalore",
    to: "Goa",
    fromCity: "Bengaluru",
    toCity: "Goa",
    fromCode: "SBC",
    toCode: "MAO",
    blurb:
      "Massive weekend holiday route. Direct overnight trains are perpetually waitlisted; connecting via Hubballi or Londa frequently yields confirmed berths or train+bus combinations.",
    hubs: ["Hubballi", "Londa", "Dharwad"],
    keywords: [
      "Bangalore to Goa train",
      "Bangalore to Goa train availability",
      "Bangalore to Goa connecting trains",
      "Bangalore to Goa alternative route",
    ],
  },
  {
    slug: "delhi-to-katra",
    from: "Delhi",
    to: "Katra",
    fromCity: "Delhi",
    toCity: "Shri Mata Vaishno Devi Katra",
    fromCode: "NDLS",
    toCode: "SVDK",
    blurb:
      "Heavy pilgrimage traffic throughout the year. When Vande Bharat and Uttar Sampark Kranti are fully booked, connecting via Ambala, Ludhiana, or Jammu Tawi gets you confirmed berths.",
    hubs: ["Ambala", "Ludhiana", "Jammu Tawi", "Pathankot"],
    keywords: [
      "Delhi to Katra train",
      "Delhi to Vaishno Devi train availability",
      "Delhi to Katra connecting trains",
      "Delhi to Katra confirmed ticket",
    ],
  },
  {
    slug: "chennai-to-coimbatore",
    from: "Chennai",
    to: "Coimbatore",
    fromCity: "Chennai",
    toCity: "Coimbatore",
    fromCode: "MAS",
    toCode: "CBE",
    blurb:
      "Tamil Nadu's premier industrial and student link. When direct Cheran or Kovai Express are full, connecting through Salem or Erode unlocks open quota seats.",
    hubs: ["Salem", "Erode", "Katpadi"],
    keywords: [
      "Chennai to Coimbatore train",
      "Chennai to Coimbatore connecting trains",
      "Chennai to Coimbatore train ticket availability",
      "Chennai to Coimbatore via Salem",
    ],
  },
  {
    slug: "hyderabad-to-tirupati",
    from: "Hyderabad",
    to: "Tirupati",
    fromCity: "Hyderabad",
    toCity: "Tirupati",
    fromCode: "SC",
    toCode: "TPTY",
    blurb:
      "High-volume spiritual corridor. Daily direct trains fill up instantly; connecting via Renigunta, Guntur, or Gudur provides multiple confirmed alternatives.",
    hubs: ["Renigunta", "Guntur", "Gudur"],
    keywords: [
      "Hyderabad to Tirupati train",
      "Hyderabad to Tirupati connecting trains",
      "Secunderabad to Tirupati train availability",
      "Hyderabad to Tirupati via Renigunta",
    ],
  },
  {
    slug: "delhi-to-varanasi",
    from: "Delhi",
    to: "Varanasi",
    fromCity: "Delhi",
    toCity: "Varanasi",
    fromCode: "NDLS",
    toCode: "BSB",
    blurb:
      "Cultural hotspot and key tourist trunk route. When Kashi Vishwanath and Vande Bharat are waitlisted, connecting through Kanpur or Lucknow provides fast, confirmed travel.",
    hubs: ["Kanpur", "Lucknow", "Prayagraj"],
    keywords: [
      "Delhi to Varanasi train",
      "Delhi to Varanasi alternative trains",
      "Delhi to Varanasi connecting train route",
      "Delhi to Varanasi via Kanpur",
    ],
  },
  {
    slug: "ahmedabad-to-jaipur",
    from: "Ahmedabad",
    to: "Jaipur",
    fromCity: "Ahmedabad",
    toCity: "Jaipur",
    fromCode: "ADI",
    toCode: "JP",
    blurb:
      "Key trade and tourism link. Connecting via Abu Road, Marwar Junction, or Ajmer frequently uncovers seats when direct express trains are full.",
    hubs: ["Abu Road", "Ajmer", "Marwar"],
    keywords: [
      "Ahmedabad to Jaipur train",
      "Ahmedabad to Jaipur connecting trains",
      "Ahmedabad to Jaipur train availability",
      "Ahmedabad to Jaipur via Ajmer",
    ],
  },
  {
    slug: "bangalore-to-kochi",
    from: "Bangalore",
    to: "Kochi",
    fromCity: "Bengaluru",
    toCity: "Kochi / Ernakulam",
    fromCode: "SBC",
    toCode: "ERS",
    blurb:
      "Popular Kerala tech and commuter link. Island Express and KSRTC connections via Coimbatore, Palakkad, or Thrissur beat waitlists on direct trains.",
    hubs: ["Coimbatore", "Palakkad", "Thrissur", "Erode"],
    keywords: [
      "Bangalore to Kochi train",
      "Bangalore to Ernakulam train availability",
      "Bangalore to Kochi connecting trains",
      "Bangalore to Kochi via Coimbatore",
    ],
  },
  {
    slug: "kolkata-to-patna",
    from: "Kolkata",
    to: "Patna",
    fromCity: "Kolkata",
    toCity: "Patna",
    fromCode: "HWH",
    toCode: "PNBE",
    blurb:
      "Dense eastern trunk line. When direct trains are packed, connecting through Asansol, Jasidih, or Kiul Junction frequently offers confirmed travel options.",
    hubs: ["Asansol", "Jasidih", "Kiul", "Mokama"],
    keywords: [
      "Kolkata to Patna train",
      "Howrah to Patna train availability",
      "Kolkata to Patna connecting trains",
      "Kolkata to Patna via Asansol",
    ],
  },
  {
    slug: "delhi-to-chandigarh",
    from: "Delhi",
    to: "Chandigarh",
    fromCity: "Delhi",
    toCity: "Chandigarh",
    fromCode: "NDLS",
    toCode: "CDG",
    blurb:
      "Frequent capital-link corridor. When Shatabdi and Jan Shatabdi are sold out, connecting via Ambala Cantt or Panipat opens up dozens of connecting schedules.",
    hubs: ["Ambala", "Panipat", "Kurukshetra"],
    keywords: [
      "Delhi to Chandigarh train",
      "Delhi to Chandigarh alternative route",
      "Delhi to Chandigarh connecting trains",
      "Delhi to Chandigarh via Ambala",
    ],
  },
  {
    slug: "pune-to-nagpur",
    from: "Pune",
    to: "Nagpur",
    fromCity: "Pune",
    toCity: "Nagpur",
    fromCode: "PUNE",
    toCode: "NGP",
    blurb:
      "High-volume Maharashtra corridor connecting Vidarbha and Western Maharashtra. Connecting via Daund, Manmad, or Bhusawal uncovers confirmed berths on sold-out days.",
    hubs: ["Daund", "Manmad", "Bhusawal", "Badnera"],
    keywords: [
      "Pune to Nagpur train",
      "Pune to Nagpur connecting trains",
      "Pune to Nagpur train availability",
      "Pune to Nagpur via Bhusawal",
    ],
  },
  {
    slug: "jaipur-to-mumbai",
    from: "Jaipur",
    to: "Mumbai",
    fromCity: "Jaipur",
    toCity: "Mumbai",
    fromCode: "JP",
    toCode: "BCT",
    blurb:
      "Busy commercial link. Direct superfasts fill up rapidly; connecting via Kota, Vadodara, or Ratlam Junction easily gives confirmed alternatives.",
    hubs: ["Kota", "Vadodara", "Ratlam", "Surat"],
    keywords: [
      "Jaipur to Mumbai train",
      "Jaipur to Mumbai alternative train routes",
      "Jaipur to Mumbai connecting trains",
      "Jaipur to Mumbai via Kota",
    ],
  },
  {
    slug: "delhi-to-kolkata",
    from: "Delhi",
    to: "Kolkata",
    fromCity: "Delhi",
    toCity: "Kolkata",
    fromCode: "NDLS",
    toCode: "HWH",
    blurb:
      "Grand Trunk corridor connecting northern and eastern capitals. Connecting via Kanpur, Prayagraj, or Pt Deen Dayal Upadhyaya bypasses long Rajdhani waitlists.",
    hubs: ["Kanpur", "Prayagraj", "Pt Deen Dayal Upadhyaya", "Asansol"],
    keywords: [
      "Delhi to Kolkata train",
      "Delhi to Kolkata connecting trains",
      "Delhi to Kolkata alternative route",
      "Delhi to Kolkata train ticket availability",
    ],
  },
  {
    slug: "mumbai-to-nagpur",
    from: "Mumbai",
    to: "Nagpur",
    fromCity: "Mumbai",
    toCity: "Nagpur",
    fromCode: "CSMT",
    toCode: "NGP",
    blurb:
      "Core central transit line. When Duronto and Sewagram are waitlisted, connecting through Nashik, Bhusawal, or Akola reliably finds open seats.",
    hubs: ["Nashik", "Bhusawal", "Akola", "Badnera"],
    keywords: [
      "Mumbai to Nagpur train",
      "Mumbai to Nagpur connecting trains",
      "Mumbai to Nagpur train availability",
      "Mumbai to Nagpur via Bhusawal",
    ],
  },
];

export function getPopularRoute(slug: string): PopularRoute | undefined {
  return POPULAR_ROUTES.find((r) => r.slug === slug);
}
