import { fetchCountriesDevPlaces } from "./countriesDev";
/**
 * Cache for global place data from countries.dev.
 * In the future, this could be backed by Redis.
 */
export class PlaceCache {
    constructor() {
        // Additional cache for general place seeding
        this.generalPlaces = [];
        this.seedingPromise = null;
        this.cache = new Map();
        // Start seeding general places
        this.seedingPromise = this.seedGeneralPlaces();
    }
    /** Waits for the initial seeding of general places to complete. */
    async waitForSeeding() {
        if (this.seedingPromise) {
            await this.seedingPromise;
        }
    }
    async seedGeneralPlaces() {
        // Seed with a comprehensive list of Indian states and major cities to ensure we have a baseline global place dataset
        // This is not route planning - it's general place discovery for the cache
        const indianStatesAndMajorCities = [
            "Andhra Pradesh",
            "Arunachal Pradesh",
            "Assam",
            "Bihar",
            "Chhattisgarh",
            "Goa",
            "Gujarat",
            "Haryana",
            "Himachal Pradesh",
            "Jharkhand",
            "Karnataka",
            "Kerala",
            "Madhya Pradesh",
            "Maharashtra",
            "Manipur",
            "Meghalaya",
            "Mizoram",
            "Nagaland",
            "Odisha",
            "Punjab",
            "Rajasthan",
            "Sikkim",
            "Tamil Nadu",
            "Telangana",
            "Tripura",
            "Uttar Pradesh",
            "Uttarakhand",
            "West Bengal",
            "Delhi",
            "Mumbai",
            "Bangalore",
            "Hyderabad",
            "Ahmedabad",
            "Chennai",
            "Kolkata",
            "Surat",
            "Pune",
            "Jaipur",
            "Lucknow",
            "Kanpur",
            "Nagpur",
            "Indore",
            "Thane",
            "Bhopal",
            "Visakhapatnam",
            "Pimpri-Chinchwad",
            "Patna",
            "Vadodara",
            "Ghaziabad",
            "Ludhiana",
            "Agra",
            "Nashik",
            "Faridabad",
            "Meerut",
            "Rajkot",
            "Kalyan-Dombivali",
            "Vasai-Virar",
            "Varanasi",
            "Srinagar",
            "Aurangabad",
            "Dhanbad",
            "Amritsar",
            "Navi Mumbai",
            "Allahabad",
            "Ranchi",
            "Haora",
            "Coimbatore",
            "Jabalpur",
            "Gwalior",
            "Vijayawada",
            "Jodhpur",
            "Madurai",
            "Raipur",
            "Kota",
            "Guwahati",
            "Chandigarh",
            "Solapur",
            "Hubli-Dharwad",
            "Bareilly",
            "Moradabad",
            "Mysore",
            "Gurgaon",
            "Aligarh",
            "Jalandhar",
            "Tiruchirappalli",
            "Bhubaneswar",
            "Salem",
            "Mira-Bhayandar",
            "Thiruvananthapuram",
            "Bhiwandi",
            "Saharanpur",
            "Gorakhpur",
            "Guntur",
            "Bikaner",
            "Amravati",
            "Noida",
            "Jamshedpur",
            "Bhilai",
            "Cuttack",
            "Firozabad",
            "Kochi",
            "Bhavnagar",
            "Dehradun",
            "Durgapur",
            "Asansol",
            "Nanded",
            "Kolhapur",
            "Ajmer",
            "Akola",
            "Gulbarga",
            "Jamnagar",
            "Ujjain",
            "Loni",
            "Siliguri",
            "Jhansi",
            "Ulhasnagar",
            "Nellore",
            "Jammu",
            "Sangli-Miraj & Kupwad",
            "Erode",
            "Belgaum",
            "Jamnagar",
            "Rajahmundry",
            "Tirupati",
            "Madhyamgram",
            "Nizamabad",
            "Thanjavur",
            "Pathankot",
            "Bhavnagar",
            "Jameshnapur",
            "Palakkad",
            "Gandhinagar"
        ];
        for (const query of indianStatesAndMajorCities) {
            try {
                const places = await fetchCountriesDevPlaces(query, 15);
                this.addGeneralPlaces(places);
            }
            catch (err) {
                console.warn(`Failed to seed places for query "${query}":`, err);
            }
        }
    }
    static getInstance() {
        if (!PlaceCache.instance) {
            PlaceCache.instance = new PlaceCache();
        }
        return PlaceCache.instance;
    }
    async getOrFetch(query, limit = 50) {
        const key = `${query.toLowerCase()}|${limit}`;
        const cached = this.cache.get(key);
        const now = Date.now();
        if (cached && (now - cached.timestamp) < PlaceCache.DEFAULT_TTL_SECONDS * 1000) {
            return cached.places;
        }
        // Fetch from countries.dev
        const places = await fetchCountriesDevPlaces(query, limit);
        this.cache.set(key, { places, timestamp: now });
        return places;
    }
    /** Get all general places that have been seeded or discovered */
    async getAllGeneralPlaces() {
        // Wait for seeding to complete if it's still in progress
        if (this.seedingPromise) {
            await this.seedingPromise;
        }
        return this.generalPlaces;
    }
    /** Add a place to the general places cache */
    addGeneralPlace(place) {
        // Avoid duplicates
        if (!this.generalPlaces.some(p => p.id === place.id)) {
            this.generalPlaces.push(place);
        }
    }
    /** Add multiple places to the general places cache */
    addGeneralPlaces(places) {
        for (const place of places) {
            this.addGeneralPlace(place);
        }
    }
    clear() {
        this.cache.clear();
        this.generalPlaces = [];
        this.seedingPromise = this.seedGeneralPlaces(); // Restart seeding
    }
}
PlaceCache.DEFAULT_TTL_SECONDS = 24 * 60 * 60; // 24 hours
PlaceCache.GENERAL_PLACES_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
