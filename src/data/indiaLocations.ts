import type { IndianCityPreset, LocalRescuer } from "../types";

export const DEFAULT_INDIA_COORDS = {
  lat: 12.9716,
  lng: 77.5946,
  city: "Bengaluru",
  state: "Karnataka",
};

export const INDIAN_CITY_PRESETS: IndianCityPreset[] = [
  {
    id: "bengaluru",
    city: "Bengaluru",
    state: "Karnataka",
    lat: 12.9716,
    lng: 77.5946,
    regionTag: "Deccan Plateau",
  },
  {
    id: "mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    lat: 19.076,
    lng: 72.8777,
    regionTag: "Konkan / Western Ghats",
  },
  {
    id: "pune",
    city: "Pune",
    state: "Maharashtra",
    lat: 18.5204,
    lng: 73.8567,
    regionTag: "Sahyadri Foothills",
  },
  {
    id: "delhi",
    city: "New Delhi",
    state: "Delhi",
    lat: 28.6139,
    lng: 77.209,
    regionTag: "Yamuna / Aravalli Ridge",
  },
  {
    id: "chennai",
    city: "Chennai",
    state: "Tamil Nadu",
    lat: 13.0827,
    lng: 80.2707,
    regionTag: "Coromandel Coast",
  },
  {
    id: "kolkata",
    city: "Kolkata",
    state: "West Bengal",
    lat: 22.5726,
    lng: 88.3639,
    regionTag: "Lower Gangetic Delta",
  },
  {
    id: "hyderabad",
    city: "Hyderabad",
    state: "Telangana",
    lat: 17.385,
    lng: 78.4867,
    regionTag: "Deccan Scrub & Lakes",
  },
  {
    id: "ahmedabad",
    city: "Ahmedabad",
    state: "Gujarat",
    lat: 23.0225,
    lng: 72.5714,
    regionTag: "Semi-Arid Gujarat",
  },
  {
    id: "jaipur",
    city: "Jaipur",
    state: "Rajasthan",
    lat: 26.9124,
    lng: 75.7873,
    regionTag: "Aravalli Scrub",
  },
  {
    id: "kochi",
    city: "Kochi",
    state: "Kerala",
    lat: 9.9312,
    lng: 76.2673,
    regionTag: "Malabar Coast",
  },
  {
    id: "guwahati",
    city: "Guwahati",
    state: "Assam",
    lat: 26.1445,
    lng: 91.7362,
    regionTag: "Brahmaputra Valley",
  },
  {
    id: "bhopal",
    city: "Bhopal",
    state: "Madhya Pradesh",
    lat: 23.2599,
    lng: 77.4126,
    regionTag: "Upper Lake & Vindhya Hills",
  },
  {
    id: "indore",
    city: "Indore",
    state: "Madhya Pradesh",
    lat: 22.7196,
    lng: 75.8577,
    regionTag: "Malwa Plateau",
  },
  {
    id: "lucknow",
    city: "Lucknow",
    state: "Uttar Pradesh",
    lat: 26.8467,
    lng: 80.9462,
    regionTag: "Central Gangetic Plain",
  },
  {
    id: "bhubaneswar",
    city: "Bhubaneswar",
    state: "Odisha",
    lat: 20.2961,
    lng: 85.8245,
    regionTag: "Eastern Coastal Plains",
  },
];

// Official nationwide Indian emergency numbers and verified national NGO helplines.
// Local district/city rescue teams are dynamically retrieved via Google Search grounding.
export const VERIFIED_INDIA_HELPLINES: LocalRescuer[] = [
  {
    id: "india-108",
    name: "108 Emergency Ambulance",
    organization: "National Emergency Medical Response (EMRI)",
    cityOrRegion: "Pan-India (Free 24/7)",
    phone: "108",
    category: "medical",
    availability: "24/7 Free Dispatch",
    notes: "Immediate ambulance dispatch to nearest Government/District Hospital with Anti-Snake Venom (ASV).",
  },
  {
    id: "india-112",
    name: "112 ERSS National Emergency",
    organization: "Emergency Response Support System (Govt of India)",
    cityOrRegion: "Pan-India (Police · Fire · Medical)",
    phone: "112",
    category: "forest-dept",
    availability: "24/7 Unified Helpline",
    notes: "Connects police, disaster response, and coordinates Forest Range rescue in crocodile or urban reptile conflicts.",
  },
  {
    id: "india-1926",
    name: "1926 Forest & Wildlife Helpline",
    organization: "State Forest Department Control Room (Common Toll-Free)",
    cityOrRegion: "India State Forest Control (UP, UK, MP, MH, KA & others)",
    phone: "1926",
    category: "forest-dept",
    availability: "24/7 Control Room",
    notes: "Direct wildlife conflict reporting for cobras, monitors, crocodilians, and Schedule I protected species.",
  },
  {
    id: "wti-helpline",
    name: "Wildlife SOS 24x7 Rescue Hotline (Delhi NCR / Agra)",
    organization: "Wildlife SOS India",
    cityOrRegion: "Delhi NCR · Agra · Vadodara · J&K",
    phone: "+919871963535",
    category: "ngo",
    availability: "24/7 Rapid Wildlife Rescue",
    notes: "Specialized rescue for snakes, monitor lizards, mugger crocodiles, and distressed reptiles.",
  },
  {
    id: "pfa-rescue",
    name: "BBMP / PFA Wildlife Rescue (Bengaluru)",
    organization: "People For Animals Wildlife Hospital & BBMP Forest Cell",
    cityOrRegion: "Bengaluru Urban & Rural, Karnataka",
    phone: "+919900025370",
    category: "ngo",
    availability: "Day & Emergency Dispatch",
    notes: "Authorized urban snake, kite, monitor lizard, and tortoise rescue and rehabilitation.",
  },
  {
    id: "raw-mumbai",
    name: "RAWW Wildlife Rescue Helpline (Mumbai MMR)",
    organization: "Resqink Association for Wildlife Welfare",
    cityOrRegion: "Mumbai · Thane · Navi Mumbai",
    phone: "+917666680202",
    category: "ngo",
    availability: "24/7 Forest-Partnered Rescue",
    notes: "Coordinated with Maharashtra Forest Department for cobras, Russell's vipers, pythons, and crocodiles.",
  },
];

export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}
