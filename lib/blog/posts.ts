/**
 * All blog content lives here. Add a new post by pushing another object
 * into BLOG_POSTS — every page and component (listing grid, detail page,
 * related-articles, sidebar, etc.) reads from this file and needs no
 * further changes.
 *
 * SEO note: `keywords` on each post is meant to be wired into that post's
 * generateMetadata() as `keywords: post.keywords` — the detail page
 * currently only sets title/description/openGraph, so add that one line
 * when you're ready to have it actually emitted into <meta name="keywords">
 * and considered by generateMetadata. Every post's `excerpt` also doubles
 * as its meta description, so it's written to read naturally AND lead with
 * the primary keyword phrase.
 */

export type BlogCategory =
  | "travel-guides"
  | "route-ideas"
  | "rail"
  | "bus"
  | "flights"
  | "wayvia"
  | "tips";

/** Pill label shown in the category filter row on the blog listing page. */
export const CATEGORY_PILL_LABEL: Record<BlogCategory, string> = {
  "travel-guides": "Travel Guides",
  "route-ideas": "Route Ideas",
  rail: "Rail",
  bus: "Bus",
  flights: "Flights",
  wayvia: "Wayvia",
  tips: "Tips",
};

/** Small badge label shown on each post card (e.g. "TRAVEL TIPS", "ROUTE GUIDE"). */
export const CATEGORY_BADGE_LABEL: Record<BlogCategory, string> = {
  "travel-guides": "Travel Guide",
  "route-ideas": "Route Guide",
  rail: "Rail",
  bus: "Bus",
  flights: "Flights",
  wayvia: "Wayvia",
  tips: "Travel Tips",
};

export interface BlogAuthor {
  name: string;
  role: string;
  avatar: string;
  bio: string;
}

export const DEFAULT_AUTHOR: BlogAuthor = {
  name: "Arjun Mehta",
  role: "Travel Writer at Wayvia",
  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
  bio: "Arjun loves exploring new places and helping travellers discover smarter ways to travel.",
};

/**
 * The article body is a list of blocks rendered in order by ArticleBody.
 * Headings automatically become numbered Table of Contents entries — give
 * every heading a stable, unique `id` (used as the scroll anchor).
 */
export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; id: string; text: string }
  | { type: "checklist"; items: string[] }
  | { type: "tip"; text: string }
  | { type: "modes"; items: { icon: "train-bus" | "flight-train" | "bus"; title: string; description: string }[] }
  | { type: "cta"; label: string; href: string };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  category: BlogCategory;
  readTime: string;
  /** ISO date, e.g. "2026-08-26". */
  date: string;
  featured?: boolean;
  author: BlogAuthor;
  content: ContentBlock[];
  /** Explicit related-post slugs. When omitted, the detail page falls back to other posts in the same category. */
  relatedSlugs?: string[];
  /** Target search phrases this post is written for — wire into generateMetadata's `keywords` field. */
  keywords?: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "what-to-do-when-your-train-is-fully-booked",
    title: "What to do when your train is fully booked",
    excerpt:
      "Smart alternatives, fallback routes and insider tips to help you reach your destination — even when plans change.",
    coverImage: "https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "7 min read",
    date: "2026-08-27",
    featured: true,
    author: DEFAULT_AUTHOR,
    keywords: [
      "train fully booked what to do",
      "alternative when train tickets not available",
      "no seats available train india",
      "how to travel when train is waitlisted",
    ],
    relatedSlugs: [
      "pnr-status-explained-cnf-rac-wl-meaning",
      "waitlist-ticket-confirmation-chances-explained",
      "delhi-to-goa-7-ways-to-get-there",
      "how-to-find-cheaper-flight-train-combos",
    ],
    content: [
      {
        type: "paragraph",
        text: "We've all been there. You finally decide to take that trip, open the booking app, search for trains… and everything is WL 200+ or RAC. Frustrating, right?",
      },
      {
        type: "paragraph",
        text: "The good news is: a fully booked train doesn't mean a canceled trip. It just means you need to look at the journey differently.",
      },
      {
        type: "paragraph",
        text: "Here's how you can still reach your destination — smoothly, affordably, and sometimes even faster.",
      },
      { type: "heading", id: "check-alternate-trains-and-classes", text: "1. Check alternate trains and classes" },
      { type: "paragraph", text: "Sometimes the same train has seats in a different class or quota." },
      {
        type: "checklist",
        items: [
          "Check 3AC / 2AC if 3E is full.",
          "Look for tatkal, premium tatkal, and foreign tourist quota.",
          "Check nearby departure stations.",
        ],
      },
      { type: "tip", text: "Trains running at non-peak times (early morning or late night) have higher availability." },
      { type: "heading", id: "consider-nearby-stations", text: "2. Consider nearby stations" },
      {
        type: "paragraph",
        text: "A small change in boarding or destination station can open up many options. Use Wayvia to explore trains from stations near you. You might find a seat just 30–50 km away.",
      },
      { type: "heading", id: "try-alternative-modes", text: "3. Try alternative modes" },
      { type: "paragraph", text: "Mixing modes can unlock seat availability and better prices." },
      {
        type: "modes",
        items: [
          { icon: "train-bus", title: "Train + Bus", description: "Take a train till the nearest major city and continue by bus." },
          { icon: "flight-train", title: "Flight + Train", description: "Fly to a nearby city and take a short train connect." },
          { icon: "bus", title: "Bus Direct", description: "Overnight buses can be comfortable and budget-friendly." },
        ],
      },
      { type: "tip", text: "Wayvia finds thousands of combinations so you don't have to." },
      { type: "heading", id: "be-flexible-with-dates", text: "4. Be flexible with dates" },
      {
        type: "paragraph",
        text: "Traveling a day earlier or later can make a huge difference. Even 24 hours can open up confirmed seats.",
      },
      { type: "heading", id: "use-wayvia-to-find-better-ways", text: "5. Use Wayvia to find better ways" },
      {
        type: "paragraph",
        text: "Wayvia searches across trains, buses, flights and nearby stations to show you the best possible ways to reach your destination.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* High-intent booking & status guides — these target the biggest      */
  /* recurring search queries in Indian rail travel (PNR/waitlist        */
  /* terminology, Tatkal rules, festival rush, senior citizen status).   */
  /* ------------------------------------------------------------------ */
  {
    slug: "pnr-status-explained-cnf-rac-wl-meaning",
    title: "PNR status explained: what CNF, RAC, WL, GNWL, PQWL, RLWL and TQWL mean",
    excerpt:
      "A plain-English guide to every code you'll see on your PNR — what CNF, RAC, WL, GNWL, PQWL, RLWL and TQWL actually mean, and how to check your status.",
    coverImage: "https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "6 min read",
    date: "2026-08-26",
    author: DEFAULT_AUTHOR,
    keywords: [
      "pnr status meaning",
      "what does rac mean in train ticket",
      "gnwl pqwl rlwl meaning",
      "cnf meaning train ticket",
      "how to check pnr status",
      "tqwl meaning railway",
    ],
    relatedSlugs: [
      "waitlist-ticket-confirmation-chances-explained",
      "rac-vs-waitlist-difference-explained",
      "irctc-tatkal-booking-2026-timings-rules",
    ],
    content: [
      {
        type: "paragraph",
        text: "Every Indian Railways ticket comes with a 10-digit PNR (Passenger Name Record) number, and that number is the key to one of the most confusing parts of train travel: the status code sitting next to it. Here's what each one actually means.",
      },
      { type: "heading", id: "the-status-codes-you-will-see", text: "The status codes you'll actually see" },
      {
        type: "checklist",
        items: [
          "CNF — Confirmed. You have a specific coach and berth number. You're travelling.",
          "RAC — Reservation Against Cancellation. You're guaranteed a seat, sharing a side-lower berth with one other passenger, and can board the train as-is.",
          "WL — Waitlisted. You don't have a seat or berth yet. You're in a queue that moves as confirmed passengers cancel.",
          "CAN — Cancelled. The booking has been cancelled or modified and is no longer valid.",
        ],
      },
      { type: "heading", id: "gnwl-pqwl-rlwl-tqwl-difference", text: "GNWL, PQWL, RLWL, TQWL — what's the difference" },
      {
        type: "paragraph",
        text: "\"Waitlisted\" isn't one single queue — which waitlist you're on has a big effect on your odds of confirming.",
      },
      {
        type: "checklist",
        items: [
          "GNWL (General Waitlist) — for passengers boarding at or near the train's originating station. This pool usually has the most cancellations, so it generally confirms best.",
          "PQWL (Pooled Quota Waitlist) — for journeys between two intermediate stations sharing a pooled quota, separate from the general quota.",
          "RLWL (Remote Location Waitlist) — a quota reserved for a specific station along the route. It only moves when passengers booked under that same quota cancel, so it can be slower to clear than GNWL.",
          "TQWL (Tatkal Waitlist) — a waitlist within the Tatkal quota itself. Because the Tatkal quota is small and booked a day before travel, TQWL tickets have the lowest confirmation chances of the four.",
        ],
      },
      { type: "tip", text: "Between two waitlisted tickets with the same number, GNWL is almost always the safer bet — check which type yours is, not just the number." },
      { type: "heading", id: "how-to-check-your-pnr-status", text: "How to check your PNR status" },
      {
        type: "paragraph",
        text: "You can check it on the IRCTC website or app, by sending an SMS with \"PNR\" followed by your 10-digit number to 139, or by calling 139 and following the prompts. Most third-party train-status apps show the same data, often alongside a waitlist-confirmation estimate.",
      },
      {
        type: "paragraph",
        text: "One important rule: once the chart is prepared — typically a few hours before departure — any ticket still showing WL is automatically cancelled and refunded (minus a small clerkage charge). A ticket that says CAN or is still WL after chart preparation means you cannot board that train.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "waitlist-ticket-confirmation-chances-explained",
    title: "Waitlist ticket confirmation chances: how to read your WL number",
    excerpt:
      "WL 8 and WL 80 are not the same bet. Here's how waitlist confirmation chances actually work, and what to do when your number looks risky.",
    coverImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "6 min read",
    date: "2026-08-25",
    author: DEFAULT_AUTHOR,
    keywords: [
      "waitlist confirmation chances",
      "wl ticket confirmation chances",
      "railway confirmation chances calculator",
      "will my waitlist ticket confirm",
      "wl 30 confirm hoga ya nahi",
    ],
    relatedSlugs: [
      "pnr-status-explained-cnf-rac-wl-meaning",
      "rac-vs-waitlist-difference-explained",
      "irctc-tatkal-booking-2026-timings-rules",
    ],
    content: [
      {
        type: "paragraph",
        text: "A waitlisted ticket isn't a rejection — most waitlisted tickets on Indian Railways do end up confirming, especially at lower numbers. But \"WL 8\" and \"WL 80\" are very different bets, and knowing roughly where the line is helps you decide whether to wait it out or make a backup plan.",
      },
      { type: "heading", id: "rough-confirmation-bands", text: "Rough confirmation bands (not a guarantee)" },
      {
        type: "paragraph",
        text: "These are general patterns seen across popular routes, not a promise for any specific train — the exact route, class, day of week and season all matter more than the number alone.",
      },
      {
        type: "checklist",
        items: [
          "WL 1–15 on GNWL: confirms in the large majority of cases.",
          "WL 16–30: roughly a coin-flip to moderately favourable — worth watching closely.",
          "WL 60 and above: confirmation becomes unlikely; treat it as a long shot, not a plan.",
          "RAC: not really a \"chance\" at all — you're already guaranteed to travel, sharing a berth.",
        ],
      },
      { type: "heading", id: "why-your-number-moves", text: "Why your number moves (and when)" },
      {
        type: "paragraph",
        text: "Every cancellation nudges the queue forward — RAC passengers move to a full berth first, then waitlisted passengers move into RAC or confirmed slots. Cancellations cluster heavily in the final 24–48 hours before departure, as other travellers finalise their own plans, so a lot of movement often happens right before chart preparation.",
      },
      { type: "tip", text: "Check your PNR status every day rather than once — a WL 40 dropping steadily to WL 12 over a week tells a very different story than one that hasn't moved at all." },
      { type: "heading", id: "what-to-do-if-your-chances-look-low", text: "What to do if your chances look low" },
      {
        type: "checklist",
        items: [
          "Check a different class on the same train — 3AC might be waitlisted while Sleeper still has room.",
          "Check nearby trains on the same route and date.",
          "Look at the Vikalp scheme, which can auto-shift you to an alternate train with available seats.",
          "Keep a Tatkal attempt, a bus, or a flight as your realistic backup — not your first choice, but a safety net.",
        ],
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "rac-vs-waitlist-difference-explained",
    title: "RAC vs waitlist: what's the difference, and can you still travel?",
    excerpt: "RAC and WL both mean \"no confirmed berth yet\" — but only one of them guarantees you'll actually board the train.",
    coverImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "4 min read",
    date: "2026-08-19",
    author: DEFAULT_AUTHOR,
    keywords: ["rac vs waitlist", "can rac passenger travel", "rac ticket meaning", "difference between rac and wl"],
    relatedSlugs: ["pnr-status-explained-cnf-rac-wl-meaning", "waitlist-ticket-confirmation-chances-explained"],
    content: [
      {
        type: "paragraph",
        text: "RAC and Waitlist are easy to mix up because both show up when a train is full — but they mean very different things for whether you'll actually get on board.",
      },
      { type: "heading", id: "rac-means-you-are-travelling", text: "RAC means you're travelling" },
      {
        type: "paragraph",
        text: "RAC — Reservation Against Cancellation — guarantees you a seat. You'll share a side-lower berth with one other RAC passenger to start, and if a confirmed passenger cancels, RAC holders are the first to be upgraded to a full berth, ahead of anyone on the waitlist.",
      },
      { type: "heading", id: "waitlist-means-not-yet", text: "Waitlist means \"not yet\"" },
      {
        type: "paragraph",
        text: "A Waitlisted (WL) ticket doesn't reserve a seat or a berth. You're in a queue, and you'll only get to travel if enough cancellations happen before the chart is prepared. If your ticket is still WL after that point, it's automatically cancelled — you cannot board on a WL ticket.",
      },
      {
        type: "checklist",
        items: [
          "RAC: guaranteed to travel, comfort improves with cancellations.",
          "WL: not guaranteed at all — confirmation depends entirely on other people cancelling.",
          "Movement order: RAC upgrades to CNF before any WL ticket does.",
        ],
      },
      { type: "tip", text: "If you're choosing between an RAC ticket and a WL ticket further down the list on a different train, the RAC ticket is almost always the safer pick." },
    ],
  },
  {
    slug: "irctc-tatkal-booking-2026-timings-rules",
    title: "IRCTC Tatkal booking 2026: timings, rules and how to actually get a seat",
    excerpt:
      "Tatkal opens at 10 AM for AC classes and 11 AM for non-AC, one day before travel — here's exactly how the 2026 rules work and how to book faster.",
    coverImage: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "7 min read",
    date: "2026-08-23",
    author: DEFAULT_AUTHOR,
    keywords: [
      "tatkal booking time",
      "irctc tatkal rules 2026",
      "tatkal ticket booking timing ac sleeper",
      "how to book tatkal ticket fast",
      "tatkal aadhaar otp",
    ],
    relatedSlugs: [
      "pnr-status-explained-cnf-rac-wl-meaning",
      "diwali-chhath-puja-train-booking-tips",
      "irctc-website-down-what-to-do",
    ],
    content: [
      {
        type: "paragraph",
        text: "Tatkal is Indian Railways' emergency quota for travel that can't wait for regular booking — released exactly one day before the train's departure from its originating station. It's genuinely useful when you know it, and genuinely stressful when you don't.",
      },
      { type: "heading", id: "tatkal-timings", text: "Tatkal timings" },
      {
        type: "checklist",
        items: [
          "AC classes (1A, 2A, 3A, CC, EC): booking opens at 10:00 AM IST.",
          "Sleeper (SL) and Second Sitting (2S): booking opens at 11:00 AM IST.",
          "The window opens one day before the date of journey, counted from the train's origin station — not necessarily your own boarding station.",
        ],
      },
      { type: "heading", id: "what-changed-recently", text: "What's changed recently" },
      {
        type: "paragraph",
        text: "Aadhaar-linked, OTP-verified IRCTC accounts are now required for online Tatkal bookings — the OTP goes to the mobile number registered with Aadhaar, so make sure that number is active before booking day. Bookings are capped at 4 passengers per PNR, and no senior citizen, child, or other concession applies under Tatkal, regardless of age.",
      },
      { type: "tip", text: "Confirmed Tatkal tickets are non-refundable if you cancel them yourself — only a waitlisted Tatkal ticket that never confirms gets refunded. Only book Tatkal when the trip is certain." },
      { type: "heading", id: "how-to-actually-get-a-seat", text: "How to actually get a seat" },
      {
        type: "checklist",
        items: [
          "Log in 10–15 minutes before the window opens — don't wait until the exact minute.",
          "Save passenger details in IRCTC's Master List in advance so you're not typing during the rush.",
          "Use a fast payment method with details already saved — UPI or a stored card beats net banking for speed.",
          "Have your train number and preferred class already selected before the clock hits the opening time.",
        ],
      },
      {
        type: "paragraph",
        text: "If Tatkal on your exact train is gone in seconds, check nearby departure stations or a connecting route — sometimes a train + bus or train + train combination has room even when the direct Tatkal quota doesn't.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "diwali-chhath-puja-train-booking-tips",
    title: "How to book confirmed train tickets during Diwali and Chhath Puja rush",
    excerpt:
      "Festival season is Indian Railways' busiest stretch of the year. Here's how the advance booking window works and how to actually get a confirmed seat home.",
    coverImage: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "6 min read",
    date: "2026-08-21",
    author: DEFAULT_AUTHOR,
    keywords: [
      "diwali train ticket booking tips",
      "chhath puja train booking rush",
      "advance reservation period train ticket",
      "festival season train booking india",
      "how many days before can i book train ticket",
    ],
    relatedSlugs: [
      "irctc-tatkal-booking-2026-timings-rules",
      "waitlist-ticket-confirmation-chances-explained",
      "irctc-website-down-what-to-do",
    ],
    content: [
      {
        type: "paragraph",
        text: "Diwali and Chhath Puja together make up the single biggest travel rush on the Indian rail network every year, especially on routes into Uttar Pradesh, Bihar, and Jharkhand. Tickets on the most popular trains can go from open to fully waitlisted within minutes of the booking window opening.",
      },
      { type: "heading", id: "know-your-booking-window", text: "Know your booking window" },
      {
        type: "paragraph",
        text: "Indian Railways' advance reservation period (ARP) currently opens tickets 60 days before the date of journey, at 8:00 AM IST — this window has changed in the past (it was 120 days for a long stretch), so it's worth double-checking the current ARP on irctc.co.in close to your travel dates.",
      },
      {
        type: "checklist",
        items: [
          "Count exactly 60 days back from your travel date and be logged in a few minutes early.",
          "Double-check the festival date for your specific state — Chhath, Durga Puja, and Diwali don't always fall on the same day everywhere.",
          "Book your return leg at the same time as your outward journey — return availability disappears just as fast, usually while you're still celebrating.",
        ],
      },
      { type: "tip", text: "Save your passenger list in IRCTC's Master List well before booking day — during festival rush, every extra second typing details costs you seats." },
      { type: "heading", id: "if-general-quota-is-already-gone", text: "If general quota is already gone" },
      {
        type: "paragraph",
        text: "Watch for special or Suvidha trains (numbered in the 0XXXX series) that Indian Railways typically adds during festival peaks — they're announced closer to the date and often have a separate, less crowded booking window. Tatkal remains a backup for the day before travel, though on the busiest festival corridors even that clears out fast.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "senior-citizen-train-travel-india-guide",
    title: "Senior citizen train travel in India: concession status and lower berth priority (2026)",
    excerpt:
      "The senior citizen fare concession has been suspended since March 2020 — here's the current 2026 status, plus the lower-berth and comfort benefits that are still in place.",
    coverImage: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "6 min read",
    date: "2026-08-17",
    author: DEFAULT_AUTHOR,
    keywords: [
      "senior citizen train concession 2026",
      "senior citizen railway concession status",
      "lower berth priority senior citizen",
      "indian railway senior citizen quota",
    ],
    relatedSlugs: ["pnr-status-explained-cnf-rac-wl-meaning", "irctc-tatkal-booking-2026-timings-rules"],
    content: [
      {
        type: "paragraph",
        text: "Train travel has long been the most practical way for senior citizens in India to get around — affordable, comfortable, and (before 2020) discounted. Here's exactly where things stand in 2026.",
      },
      { type: "heading", id: "concession-status", text: "The fare concession: still suspended" },
      {
        type: "paragraph",
        text: "Before March 2020, men aged 60 and above got a 40% fare discount, and women aged 58 and above got 50% off, on most reserved classes. That concession was suspended during the pandemic and, as of 2026, has not been reinstated — the Railway Ministry has cited the financial cost as the reason in Parliament, even as budget discussions about restoring it continue to come up periodically. Because this is an actively discussed policy, it's worth checking irctc.co.in for the latest before you assume either way.",
      },
      { type: "tip", text: "The concession never applied to Tatkal, Premium Tatkal, or Suvidha tickets even before 2020 — that hasn't changed either." },
      { type: "heading", id: "what-is-still-available", text: "What's still available" },
      {
        type: "checklist",
        items: [
          "Automatic lower-berth priority for senior citizens booking a reserved sleeper or AC class ticket — no separate request needed if age is entered correctly.",
          "Station-level assistance, including wheelchair and porter support at major stations.",
          "Separate concessions for other categories (Divyangjan/persons with disabilities, patients with specific medical conditions, and students) that are unrelated to the general senior citizen concession and have their own eligibility rules.",
        ],
      },
      { type: "heading", id: "booking-tips", text: "Booking tips" },
      {
        type: "paragraph",
        text: "Make sure the age entered while booking exactly matches the ID you'll be carrying — a mismatch can cause problems during ticket checking, even without a fare discount involved. If a lower berth isn't auto-allotted, it can usually still be requested during booking or checked afterward through your PNR.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Rail knowledge / product-adjacent content                           */
  /* ------------------------------------------------------------------ */
  {
    slug: "vande-bharat-express-routes-guide",
    title: "Vande Bharat Express: full route guide and what makes it different",
    excerpt:
      "Over 130 Vande Bharat trains now run across India, including the first Sleeper service — here's the full picture of routes, speed, and how to book smart.",
    coverImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&h=900&fit=crop",
    category: "rail",
    readTime: "7 min read",
    date: "2026-08-15",
    author: DEFAULT_AUTHOR,
    keywords: [
      "vande bharat express routes list",
      "vande bharat sleeper train",
      "vande bharat vs shatabdi vs rajdhani",
      "new vande bharat trains 2026",
    ],
    relatedSlugs: ["delhi-to-jaipur-best-ways-to-plan-your-trip", "how-wayvia-finds-alternative-journeys"],
    content: [
      {
        type: "paragraph",
        text: "Vande Bharat has gone from a single showcase train in 2019 to one of the backbones of India's premium rail network. As of 2026, over 130 Vande Bharat trains operate across more than 80 chair-car routes, plus the country's first Sleeper variant.",
      },
      { type: "heading", id: "chair-car-network", text: "The chair-car network" },
      {
        type: "paragraph",
        text: "Most Vande Bharat services are self-propelling AC chair-car trainsets, built under the Make in India programme, designed for fast daytime intercity travel — the same slot Shatabdi Express used to own, but with quicker acceleration and a noticeably smoother ride.",
      },
      {
        type: "checklist",
        items: [
          "Popular corridors include New Delhi–Varanasi, New Delhi–Katra (Mata Vaishno Devi), Mumbai–Ahmedabad, Chennai–Bengaluru, and Howrah–New Jalpaiguri.",
          "The Howrah–New Jalpaiguri route is a favourite with travellers heading onward to Darjeeling.",
          "Newer additions, including a Jammu–Srinagar service, continue to extend the network into previously underserved corridors.",
        ],
      },
      { type: "heading", id: "vande-bharat-sleeper", text: "Vande Bharat Sleeper — the overnight version" },
      {
        type: "paragraph",
        text: "The first Vande Bharat Sleeper service, connecting Howrah and Kamakhya, began regular operation in January 2026 — India's first sleeper Vande Bharat and, for now, the only one you can actually book. It's aimed squarely at routes currently served by Rajdhani-class trains, with more sleeper corridors expected to follow as additional rakes clear testing.",
      },
      { type: "tip", text: "On popular Vande Bharat routes, especially around festival season, check your PNR status soon after booking — seats fill and waitlists move fast." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "irctc-website-down-what-to-do",
    title: "IRCTC website or app not working? What to do when booking fails",
    excerpt:
      "IRCTC slows down or times out during Tatkal and festival peaks more often than anyone would like — here's what actually helps when booking fails.",
    coverImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "5 min read",
    date: "2026-08-13",
    author: DEFAULT_AUTHOR,
    keywords: [
      "irctc website not working",
      "irctc app down what to do",
      "irctc booking failed payment deducted",
      "irctc server slow tatkal",
    ],
    relatedSlugs: ["irctc-tatkal-booking-2026-timings-rules", "diwali-chhath-puja-train-booking-tips"],
    content: [
      {
        type: "paragraph",
        text: "IRCTC's servers see enormous spikes the moment Tatkal opens or a festival booking window starts — lakhs of people logging in within the same minute. Slowness or outright failures during those windows are common, not a sign something is uniquely wrong with your account.",
      },
      { type: "heading", id: "first-things-to-try", text: "First things to try" },
      {
        type: "checklist",
        items: [
          "Refresh once, then wait a few seconds rather than repeatedly resubmitting — repeated submissions can sometimes create duplicate booking attempts.",
          "Switch between the IRCTC website and the Rail Connect app (or vice versa) — one occasionally responds when the other is timing out.",
          "Check IRCTC's official social media accounts for an outage acknowledgement before assuming it's a problem on your end.",
          "If payment was deducted but no ticket was generated, don't panic or rebook immediately — failed transactions are auto-refunded, usually within a few business days.",
        ],
      },
      { type: "tip", text: "Avoid third-party ticket resellers or \"guaranteed booking\" services during an outage — they add a relay step that's typically slower, not faster, and carries its own risk." },
      { type: "heading", id: "if-you-still-cannot-book", text: "If you still can't book" },
      {
        type: "paragraph",
        text: "A physical PRS (Passenger Reservation System) counter can sometimes succeed when the app can't, particularly for non-Tatkal bookings. And if the train you wanted is genuinely sold out — not just slow to load — it's worth comparing a connecting route or another mode entirely instead of refreshing indefinitely.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "train-vs-flight-vs-bus-how-to-choose",
    title: "Train vs flight vs bus: how to actually choose for your route",
    excerpt: "There's no single \"best\" mode of travel — here's the framework to actually decide between train, flight, and bus for any given trip.",
    coverImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "6 min read",
    date: "2026-08-11",
    author: DEFAULT_AUTHOR,
    keywords: [
      "train vs flight vs bus india",
      "should i take train or flight",
      "cheapest way to travel india",
      "fastest way to travel long distance india",
    ],
    relatedSlugs: ["how-to-find-cheaper-flight-train-combos", "how-wayvia-finds-alternative-journeys"],
    content: [
      {
        type: "paragraph",
        text: "\"Which is better, train or flight?\" doesn't have one answer — it depends on distance, how flexible your dates are, and what you actually value on the day: cost, time, or comfort. Here's how to think about it route by route.",
      },
      { type: "heading", id: "distance-changes-the-math", text: "Distance changes the math" },
      {
        type: "paragraph",
        text: "Under roughly 300–400 km, a train or bus usually wins on total door-to-door time once you account for airport check-in and transfer time. Beyond about 800–1000 km, flights start to pull ahead on time, even after factoring in airport overhead — a fact that only really pays off if your fare isn't inflated by a last-minute booking.",
      },
      { type: "heading", id: "budget-vs-time", text: "Budget vs. time" },
      {
        type: "checklist",
        items: [
          "Tight on money, flexible on time: an AC train class or an overnight bus typically beats flying, sometimes by a wide margin.",
          "Tight on time, flexible on budget: a flight (or a flight + train combo) usually wins on very long routes.",
          "Somewhere in between: mixed-mode journeys — train to a hub, then a short flight or bus onward — often land the best balance of the three.",
        ],
      },
      { type: "tip", text: "Airfares spike hardest on thin, less-flown routes and small airports. Flying into a major hub and finishing the last stretch by train is frequently cheaper than a single-flight ticket, even though it's two bookings instead of one." },
      { type: "heading", id: "let-the-search-do-the-comparing", text: "Let the search do the comparing" },
      {
        type: "paragraph",
        text: "Rather than checking three separate apps for the same trip, Wayvia checks trains, buses, and flights together — including mixed-mode combinations — so you can actually compare real options instead of guessing.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Route guides — existing                                             */
  /* ------------------------------------------------------------------ */
  {
    slug: "delhi-to-goa-7-ways-to-get-there",
    title: "Delhi to Goa: 7 ways to get there",
    excerpt: "From direct trains to coastal routes, explore the best combinations for every kind of traveller.",
    coverImage: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "8 min read",
    date: "2026-08-24",
    author: DEFAULT_AUTHOR,
    keywords: ["delhi to goa train", "delhi to goa best way to travel", "delhi goa flight train combo"],
    content: [
      {
        type: "paragraph",
        text: "Delhi to Goa is one of India's most-searched long-distance routes, and it rarely has just one good answer. Your best option changes depending on your budget, how much time you can spare, and how much of the journey you actually want to enjoy versus just endure.",
      },
      { type: "heading", id: "the-direct-train", text: "1. The direct train" },
      {
        type: "paragraph",
        text: "A handful of direct trains connect Delhi to Goa, typically taking 24–30 hours. It's the classic option — comfortable in 2AC/3AC, but it's a long single sitting.",
      },
      { type: "heading", id: "train-plus-bus-via-jaipur", text: "2. Train + bus via Jaipur and Ahmedabad" },
      {
        type: "paragraph",
        text: "Breaking the journey through Jaipur and Ahmedabad often turns up better availability and a lower total fare, at the cost of a longer overall trip with a layover or two.",
      },
      { type: "heading", id: "fly-into-goa", text: "3. Fly into Goa, take the scenic train out" },
      {
        type: "paragraph",
        text: "Flying one way and taking the Konkan Railway back (or vice versa) is a popular pick for people who want the coastal train views without committing to it in both directions.",
      },
      { type: "tip", text: "Wayvia checks all of these combinations together, live, so you can compare real fares instead of guessing." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "best-bus-routes-between-major-cities-in-india",
    title: "Best bus routes between major cities in India",
    excerpt: "Comfort, affordability and scenic views — our top picks.",
    coverImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "6 min read",
    date: "2026-08-22",
    author: DEFAULT_AUTHOR,
    keywords: ["best bus routes india", "overnight bus travel india tips", "sleeper bus vs ac bus"],
    content: [
      {
        type: "paragraph",
        text: "Buses don't get the credit they deserve. On plenty of routes — especially where trains are scarce or badly timed — an overnight Volvo or sleeper coach beats waiting on a waitlist.",
      },
      { type: "heading", id: "what-to-look-for", text: "What to actually look for" },
      {
        type: "checklist",
        items: [
          "AC sleeper for anything over 6 hours overnight.",
          "Boarding point close to a real landmark, not a vague street name.",
          "Operator reviews from the last few weeks, not just the overall rating.",
        ],
      },
      { type: "tip", text: "Front-row upper berths near the driver tend to be the smoothest ride on hill routes." },
    ],
  },
  {
    slug: "how-wayvia-finds-alternative-journeys",
    title: "How Wayvia finds alternative journeys",
    excerpt: "A look behind the scenes at our multimodal search engine.",
    coverImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&h=900&fit=crop",
    category: "wayvia",
    readTime: "5 min read",
    date: "2026-08-20",
    author: DEFAULT_AUTHOR,
    keywords: ["wayvia multimodal search", "how does wayvia work", "train bus flight combined search"],
    content: [
      {
        type: "paragraph",
        text: "Most search tools only ever show you the direct option. Wayvia starts from a different question: if the direct route is full, slow, or expensive, what's the best real alternative — and is it actually bookable?",
      },
      { type: "heading", id: "structural-discovery", text: "Structural discovery, mode by mode" },
      {
        type: "paragraph",
        text: "We map out every plausible junction between your origin and destination, then check trains, buses, and flights through each one — in parallel, not as an afterthought once the direct search comes up short.",
      },
      { type: "heading", id: "live-availability", text: "Live availability, not guesswork" },
      {
        type: "paragraph",
        text: "Every candidate route gets checked against live seat and fare data before it's ever shown to you, so what you see is what you can actually book.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "mumbai-to-kochi-scenic-routes-by-train",
    title: "Mumbai to Kochi: Scenic routes by train",
    excerpt: "The Konkan Railway is one of India's most beautiful stretches of track — here's how to make the most of it.",
    coverImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "7 min read",
    date: "2026-08-18",
    author: DEFAULT_AUTHOR,
    keywords: ["mumbai to kochi train", "konkan railway scenic route", "mumbai kochi best train"],
    content: [
      {
        type: "paragraph",
        text: "The Mumbai–Kochi run along the Konkan Railway passes through some of the most dramatic coastal and Western Ghats scenery in the country. Here's how to plan it well.",
      },
      { type: "heading", id: "pick-a-daylight-window", text: "Pick a daylight window" },
      {
        type: "paragraph",
        text: "Try to time the Ratnagiri–Goa–Karwar stretch for daylight hours — it's the most scenic section by a wide margin.",
      },
      { type: "tip", text: "Window seats on the left side (heading south) generally face the coast." },
    ],
  },
  {
    slug: "delhi-to-jaipur-best-ways-to-plan-your-trip",
    title: "Delhi to Jaipur: Best ways to plan your trip",
    excerpt: "A short, popular route with more options than you'd think.",
    coverImage: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "5 min read",
    date: "2026-08-16",
    author: DEFAULT_AUTHOR,
    keywords: ["delhi to jaipur train", "delhi jaipur fastest train", "delhi to jaipur bus vs train"],
    content: [
      {
        type: "paragraph",
        text: "Delhi to Jaipur is short enough that mode choice comes down to timing and comfort more than availability — but it's still worth comparing before you book.",
      },
      { type: "heading", id: "fastest-vs-cheapest", text: "Fastest vs. cheapest" },
      {
        type: "paragraph",
        text: "The fastest trains cover it in under 5 hours; overnight buses take longer but let you sleep through the trip and arrive with a full day ahead of you.",
      },
    ],
  },
  {
    slug: "monsoon-travel-tips-for-safe-and-smooth-journeys",
    title: "Monsoon travel: Tips for safe and smooth journeys",
    excerpt: "Rain-proof your travel plans with these practical tips.",
    coverImage: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "6 min read",
    date: "2026-08-14",
    author: DEFAULT_AUTHOR,
    keywords: ["monsoon travel tips india", "train delays monsoon", "safe travel rainy season india"],
    content: [
      {
        type: "paragraph",
        text: "Monsoon season can turn a straightforward trip into a scheduling puzzle. A little slack in your plans goes a long way.",
      },
      { type: "heading", id: "build-in-buffer-time", text: "Build in buffer time" },
      {
        type: "paragraph",
        text: "Avoid tight same-day connections during heavy-rain months — waterlogging and speed restrictions are common causes of delay.",
      },
      { type: "checklist", items: ["Check the weather along your whole route, not just at the destination.", "Keep a backup mode in mind before you travel, not after a delay."] },
    ],
  },
  {
    slug: "how-to-find-cheaper-flight-train-combos",
    title: "How to find cheaper flight + train combos",
    excerpt: "Mixing modes can save you real money — if you know where to look.",
    coverImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "5 min read",
    date: "2026-08-12",
    author: DEFAULT_AUTHOR,
    keywords: ["cheap flight train combo india", "fly and train combination ticket", "cheaper than direct flight"],
    content: [
      {
        type: "paragraph",
        text: "A full-route flight isn't always the cheapest way to fly. Landing at a nearby hub and finishing the trip by train is often significantly less expensive.",
      },
      { type: "heading", id: "why-this-works", text: "Why this works" },
      {
        type: "paragraph",
        text: "Airfares spike sharply for less-flown routes and last-mile airports. A cheap flight into a major hub plus a short train leg frequently beats booking the whole thing as one flight.",
      },
      { type: "tip", text: "Wayvia checks flight+train combinations automatically, so you don't have to book two separate searches." },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* More route guides — new                                             */
  /* ------------------------------------------------------------------ */
  {
    slug: "mumbai-to-goa-train-bus-flight-compared",
    title: "Mumbai to Goa: train, bus, or flight — which is actually best?",
    excerpt: "One of India's most popular short-haul routes, compared honestly across all three modes.",
    coverImage: "https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "6 min read",
    date: "2026-08-10",
    author: DEFAULT_AUTHOR,
    keywords: ["mumbai to goa train vs flight", "mumbai goa best way to travel", "mumbai goa bus or train"],
    relatedSlugs: ["delhi-to-goa-7-ways-to-get-there", "train-vs-flight-vs-bus-how-to-choose"],
    content: [
      {
        type: "paragraph",
        text: "Mumbai to Goa is short enough that all three modes are genuinely competitive — which one wins depends mostly on what you're doing with the time you save (or don't).",
      },
      { type: "heading", id: "train-the-konkan-classic", text: "Train: the Konkan classic" },
      {
        type: "paragraph",
        text: "Trains along the Konkan Railway take roughly 8–12 hours depending on the exact train, but the coastal scenery is genuinely part of the trip, not just a means to an end.",
      },
      { type: "heading", id: "flight-fastest-pricier", text: "Flight: fastest, pricier" },
      {
        type: "paragraph",
        text: "Under 90 minutes in the air makes flying the clear choice if your weekend is short — the trade-off is fare volatility, which spikes hard on Friday evenings and holiday weekends.",
      },
      { type: "heading", id: "bus-flexible-and-cheap", text: "Bus: flexible and cheap" },
      {
        type: "paragraph",
        text: "Overnight AC sleeper buses cover it in about 10–12 hours and often have more last-minute availability than trains during peak weekends.",
      },
      { type: "tip", text: "For a long weekend, an overnight train or bus down and a quick flight back (or vice versa) is a popular way to get both the scenery and the time saving." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "bengaluru-to-chennai-fastest-ways-to-travel",
    title: "Bengaluru to Chennai: fastest ways to get there",
    excerpt: "A short, high-frequency corridor with strong train, bus, and Vande Bharat options.",
    coverImage: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "5 min read",
    date: "2026-08-09",
    author: DEFAULT_AUTHOR,
    keywords: ["bengaluru to chennai train", "bangalore chennai vande bharat", "bengaluru chennai fastest train"],
    relatedSlugs: ["vande-bharat-express-routes-guide", "delhi-to-jaipur-best-ways-to-plan-your-trip"],
    content: [
      {
        type: "paragraph",
        text: "Bengaluru–Chennai is one of South India's busiest corridors, and it's short enough that speed differences between trains actually matter for a same-day trip.",
      },
      { type: "heading", id: "vande-bharat-and-shatabdi", text: "Vande Bharat and Shatabdi" },
      {
        type: "paragraph",
        text: "The Vande Bharat service on this route covers the distance in around 4–5 hours, making a there-and-back day trip realistic for business travel.",
      },
      { type: "heading", id: "overnight-options", text: "Overnight options" },
      {
        type: "paragraph",
        text: "For a more relaxed pace, overnight trains and AC sleeper buses let you sleep through the trip and arrive with a full day ahead of you — a solid choice if you don't need to be there first thing in the morning.",
      },
      { type: "tip", text: "This route has enough frequency that checking two or three departure times before settling on one is usually worth the extra minute." },
    ],
  },
  {
    slug: "kolkata-to-delhi-travel-options-compared",
    title: "Kolkata to Delhi: train, flight and route options compared",
    excerpt: "One of India's classic long-distance corridors — Rajdhani, regular trains, and flights, compared.",
    coverImage: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "6 min read",
    date: "2026-08-08",
    author: DEFAULT_AUTHOR,
    keywords: ["kolkata to delhi train", "howrah delhi rajdhani", "kolkata delhi flight vs train"],
    relatedSlugs: ["waitlist-ticket-confirmation-chances-explained", "train-vs-flight-vs-bus-how-to-choose"],
    content: [
      {
        type: "paragraph",
        text: "At roughly 1,450 km, Kolkata–Delhi is a genuine long-haul route where every mode has a real case to make.",
      },
      { type: "heading", id: "rajdhani-and-duronto", text: "Rajdhani and Duronto" },
      {
        type: "paragraph",
        text: "The Rajdhani Express covers this in about 17 hours overnight — historically the gold standard for this route, and still a comfortable, reliable option in 2AC or 3AC.",
      },
      { type: "heading", id: "flying-instead", text: "Flying instead" },
      {
        type: "paragraph",
        text: "A flight takes around 2.5 hours in the air, which is the obvious pick if your trip is short on days — but demand on this route means fares can swing widely depending on how far ahead you book.",
      },
      { type: "tip", text: "Because this route is so heavily travelled, waitlist movement on the Rajdhani can be unpredictable during festival season — book as early in the ARP window as you can." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "chennai-to-kochi-how-to-plan-your-trip",
    title: "Chennai to Kochi: how to plan your trip",
    excerpt: "Crossing from Tamil Nadu into Kerala — the train, bus, and flight trade-offs for this route.",
    coverImage: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "5 min read",
    date: "2026-08-07",
    author: DEFAULT_AUTHOR,
    keywords: ["chennai to kochi train", "chennai kochi best route", "chennai to kerala travel options"],
    relatedSlugs: ["mumbai-to-kochi-scenic-routes-by-train", "monsoon-travel-tips-for-safe-and-smooth-journeys"],
    content: [
      {
        type: "paragraph",
        text: "Chennai to Kochi crosses through the Western Ghats, and the route you pick changes both the scenery and the total time more than you'd expect for a same-state-ish trip.",
      },
      { type: "heading", id: "the-direct-train", text: "The direct train" },
      {
        type: "paragraph",
        text: "Direct trains take roughly 11–12 hours, comfortably doable overnight in Sleeper or 3AC.",
      },
      { type: "heading", id: "flying-in-under-two-hours", text: "Flying in under two hours" },
      {
        type: "paragraph",
        text: "A direct flight covers it in around 1.5 hours — a strong option if your schedule is tight, though it's worth comparing against a night train plus a free day on arrival.",
      },
      { type: "tip", text: "This route sees heavier demand during Kerala's monsoon-adjacent festival season — check availability a little earlier than you would for an off-season trip." },
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getFeaturedPost(): BlogPost {
  return BLOG_POSTS.find((p) => p.featured) ?? BLOG_POSTS[0];
}

export function getRelatedPosts(post: BlogPost, limit = 4): BlogPost[] {
  if (post.relatedSlugs && post.relatedSlugs.length > 0) {
    const bySlug = post.relatedSlugs.map((s) => getPostBySlug(s)).filter((p): p is BlogPost => Boolean(p));
    if (bySlug.length > 0) return bySlug.slice(0, limit);
  }
  return BLOG_POSTS.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* "Route of the week" panel — a separate, small piece of content, not */
/* a blog post, but edited the same way: change the data, not the UI.  */
/* ------------------------------------------------------------------ */

export interface RouteOfWeekStep {
  code: string;
  name: string;
  /** Mode of the leg arriving at this stop. Omit for the first stop (the origin). */
  mode?: "train" | "bus" | "flight";
  /** Duration label for the leg arriving at this stop, e.g. "15h 30m". Omit for the origin. */
  legDuration?: string;
}

export interface RouteOfWeek {
  title: string;
  description: string;
  waysFound: number;
  bestValue: string;
  steps: RouteOfWeekStep[];
  href: string;
}

export const ROUTE_OF_THE_WEEK: RouteOfWeek = {
  title: "Delhi → Goa",
  description: "There's more than one way to get there. We found these top combinations for this route.",
  waysFound: 3,
  bestValue: "₹2,140",
  href: "/journey-planner?from=NDLS&to=GOA",
  steps: [
    { code: "NDLS", name: "New Delhi" },
    { code: "JP", name: "Jaipur", mode: "train", legDuration: "15h 30m" },
    { code: "ADI", name: "Ahmedabad", mode: "bus", legDuration: "8h 20m" },
    { code: "GOA", name: "Goa", mode: "train", legDuration: "10h 10m" },
  ],
};