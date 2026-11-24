import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOLUTION_ID = "gmp_mcp_codeassist_v1_aistudio";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  mr: "Marathi (मराठी)",
  ta: "Tamil (தமிழ்)",
  kn: "Kannada (ಕನ್ನಡ)",
  bn: "Bengali (বাংলা)",
  te: "Telugu (తెలుగు)",
};

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

function getMapsApiKey(): string {
  return (
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    ""
  ).trim();
}

function isQuotaExceededError(status: number, bodyText: string): boolean {
  return (
    status === 429 ||
    bodyText.includes("RESOURCE_EXHAUSTED") ||
    bodyText.toLowerCase().includes("quota")
  );
}

function calculateDistanceKmServer(
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

function stripJsonFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function pickComponentByPriority(
  components: Array<{ longText?: string; shortText?: string; types?: string[] }>,
  priorityTypes: string[]
): string {
  for (const targetType of priorityTypes) {
    const match = components.find((c) => c.types?.includes(targetType));
    if (match?.longText) return match.longText;
  }
  return "";
}

function buildFallbackLocalReptiles(
  city: string,
  state: string,
  formattedAddress?: string
) {
  const ctx = `${city} ${state} ${formattedAddress || ""}`.toLowerCase();
  const isBhopalOrMp =
    ctx.includes("bhopal") ||
    ctx.includes("madhya pradesh") ||
    ctx.includes("patel nagar");

  if (isBhopalOrMp) {
    return {
      regionTitle: `${city || "Bhopal"}, ${state || "Madhya Pradesh"} (MPSBB / WII City Biodiversity Baseline)`,
      biogeographicZone: "Central Indian Vindhyan Hills, Bhoj Wetland & Urban Scrub",
      seasonalRiskNote:
        "Monsoon & warm evenings increase movement of snakes, skinks, and turtles around drains, rocky ridges, gardens, and lake edges (Bhoj Wetland / Upper Lake / Van Vihar).",
      safetyAdvisory:
        "Never touch, corner, or catch any wild reptile. Observe from several meters away; dial 112 / 108 / 101 for emergencies or Madhya Pradesh Forest Department responders for indoor rescues.",
      commonLocalSpecies: [
        {
          commonName: "Spectacled Cobra (Naag)",
          scientificName: "Naja naja",
          category: "snake",
          isVenomous: true,
          dangerScale: 9,
          whereFoundLocally: "Gardens, storage piles, rocky scrub, urban fringes across Bhopal",
          quickTip: "Keep 3+ meters away; any bite requires immediate ASV hospital care.",
        },
        {
          commonName: "Russell's Viper (Ghonas)",
          scientificName: "Daboia russelii",
          category: "snake",
          isVenomous: true,
          dangerScale: 10,
          whereFoundLocally: "Tall grass, campus edges, rocky scrub and agricultural borders",
          quickTip: "Avoid tall grass at dusk without torch & boots; treat bites as an emergency.",
        },
        {
          commonName: "Common Indian Krait (Kala Saanp)",
          scientificName: "Bungarus caeruleus",
          category: "snake",
          isVenomous: true,
          dangerScale: 10,
          whereFoundLocally: "Nocturnal around brick stacks, ground-floor rooms, and damp edges",
          quickTip: "Do not confuse with harmless Common Wolf Snake; sleep off the floor with nets.",
        },
        {
          commonName: "Bengal Monitor Lizard (Goh)",
          scientificName: "Varanus bengalensis",
          category: "lizard",
          isVenomous: false,
          dangerScale: 4,
          whereFoundLocally: "Parks, rocky slopes, campuses (Barkatullah / IIFM), drains",
          quickTip: "Non-venomous but can bite, scratch, and whip tail; leave clear escape route.",
        },
        {
          commonName: "Mugger Crocodile (Magarmachh)",
          scientificName: "Crocodylus palustris",
          category: "crocodilian",
          isVenomous: false,
          dangerScale: 9,
          whereFoundLocally: "Lakes, reservoirs, and marsh banks around Bhopal & Van Vihar wetlands",
          quickTip: "Stay well back from waterbanks; never swim, wade, or approach basking animals.",
        },
        {
          commonName: "Indian Flap-shelled Turtle (Kachhua)",
          scientificName: "Lissemys punctata",
          category: "turtle",
          isVenomous: false,
          dangerScale: 2,
          whereFoundLocally: "Bhoj Wetland, ponds, monsoon-flooded water channels",
          quickTip: "Do not pick up from roads or keep as a pet; alert authorized wildlife rescuers.",
        },
      ],
    };
  }

  return {
    regionTitle: `${city || "Local Area"}${state ? `, ${state}` : ""}, India`,
    biogeographicZone: `Indian Urban, Garden & Wetland Mosaic (${state || "India"})`,
    seasonalRiskNote:
      "Warm evenings and monsoon rains raise activity for nocturnal snakes, wall geckos, garden lizards, and freshwater turtles near drains and greenery.",
    safetyAdvisory:
      "Maintain 3+ meters distance from unknown reptiles. Never handle based on markings alone; dial 108 / 112 / 1926 for emergencies.",
    commonLocalSpecies: [
      {
        commonName: "Indian Spectacled Cobra",
        scientificName: "Naja naja",
        category: "snake",
        isVenomous: true,
        dangerScale: 9,
        whereFoundLocally: "Outskirts, burrows, gardens, woodpiles",
        quickTip: "Step back calmly and allow unobstructed escape.",
      },
      {
        commonName: "Common Indian Krait",
        scientificName: "Bungarus caeruleus",
        category: "snake",
        isVenomous: true,
        dangerScale: 10,
        whereFoundLocally: "Nocturnal around brick stacks and rural/peri-urban homes",
        quickTip: "Use a torch at night; treat any night bite as a medical emergency.",
      },
      {
        commonName: "Indian Rat Snake (Dhaman)",
        scientificName: "Ptyas mucosa",
        category: "snake",
        isVenomous: false,
        dangerScale: 2,
        whereFoundLocally: "Parks, drains, farms, compound walls",
        quickTip: "Non-venomous rodent hunter; do not chase or corner.",
      },
      {
        commonName: "Indian Garden Lizard (Girgit)",
        scientificName: "Calotes versicolor",
        category: "lizard",
        isVenomous: false,
        dangerScale: 1,
        whereFoundLocally: "Hedges, trees, parks, boundary walls",
        quickTip: "Harmless insectivore; leave undisturbed.",
      },
      {
        commonName: "Bengal Monitor Lizard (Goh)",
        scientificName: "Varanus bengalensis",
        category: "lizard",
        isVenomous: false,
        dangerScale: 4,
        whereFoundLocally: "Parks, campuses, burrows, water edges",
        quickTip: "Protected Schedule I wildlife; keep dogs away.",
      },
      {
        commonName: "Checkered Keelback Water Snake",
        scientificName: "Fowlea piscator",
        category: "snake",
        isVenomous: false,
        dangerScale: 2,
        whereFoundLocally: "Lakes, drains, monsoon puddles, ponds",
        quickTip: "Non-venomous freshwater snake; avoid barefoot wading in dense weeds.",
      },
    ],
  };
}

function buildFallbackRescuersText(
  locality: string,
  city: string,
  state: string
): string {
  const area = [locality, city, state].filter(Boolean).join(", ") || "India";
  const lower = `${area}`.toLowerCase();
  const stateLines: string[] = [];

  if (lower.includes("madhya pradesh") || lower.includes("bhopal") || lower.includes("indore")) {
    stateLines.push(
      "• Madhya Pradesh Integrated Emergency & Ambulance: 112 (Police/Rescue) · 108 (Ambulance) · 101 (Fire)",
      "• Madhya Pradesh State Forest Dept / Wildlife Control Room: Dial 1926 (Forest Helpline) or ask 112 dispatch to connect Bhopal Range Forest Officer / Van Vihar Rescue Team."
    );
  } else {
    stateLines.push(
      `• Integrated Emergency Dispatch (${state || "India"}): 112 (Emergency) · 108 (Ambulance) · 101 (Fire)`,
      `• Forest Department Wildlife Helpline: 1926 (or request District Forest Range Officer via 112 for ${city || state || "your district"}).`
    );
  }

  stateLines.push(
    "• Do not rely on unverified social-media phone numbers; give dispatchers your exact neighborhood/landmark and GPS coordinates."
  );
  return stateLines.join("\n");
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "15mb" }));

  // Exposes runtime Google Maps API key configured in AI Studio Secrets
  app.get("/api/maps-config", (_req: Request, res: Response) => {
    const apiKey = getMapsApiKey();
    res.json({ apiKey });
  });

  // Reverse Geocode Proxy (Geocoding API v4)
  app.get("/api/geocode/reverse", async (req: Request, res: Response) => {
    try {
      const apiKey = getMapsApiKey();
      if (!apiKey) {
        res.status(500).json({ error: "Google Maps API key not configured." });
        return;
      }
      const lat = Number(req.query.lat);
      const lng = Number(req.query.lng);
      const languageCode =
        typeof req.query.language === "string" && req.query.language
          ? req.query.language
          : "en";

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        res.status(400).json({ error: "Valid lat and lng query params required." });
        return;
      }

      const url = new URL("https://geocode.googleapis.com/v4/geocode/location");
      url.searchParams.set("location.latitude", String(lat));
      url.searchParams.set("location.longitude", String(lng));
      url.searchParams.set("languageCode", languageCode);
      url.searchParams.set("regionCode", "IN");

      const upstream = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "results.placeId,results.formattedAddress,results.addressComponents,results.types,plusCode",
          "X-Goog-Maps-Solution-ID": SOLUTION_ID,
        },
      });

      const text = await upstream.text();
      if (!upstream.ok) {
        if (isQuotaExceededError(upstream.status, text)) {
          res.status(429).json({
            error: "Google Maps quota exceeded",
            quotaExceeded: true,
          });
          return;
        }
        res.status(upstream.status).json({
          error: `Reverse geocode error (${upstream.status})`,
          details: text,
        });
        return;
      }

      const data = JSON.parse(text) as {
        results?: Array<{
          formattedAddress?: string;
          addressComponents?: Array<{
            longText?: string;
            shortText?: string;
            types?: string[];
          }>;
        }>;
        plusCode?: { globalCode?: string; compoundCode?: string };
      };

      const topResult = data.results?.[0];
      const components = topResult?.addressComponents || [];

      const locality = pickComponentByPriority(components, [
        "sublocality_level_1",
        "sublocality",
        "neighborhood",
      ]);
      const city = pickComponentByPriority(components, [
        "locality",
        "administrative_area_level_2",
        "administrative_area_level_3",
        "sublocality_level_1",
      ]);
      const state = pickComponentByPriority(components, [
        "administrative_area_level_1",
      ]);
      const postalCode = pickComponentByPriority(components, ["postal_code"]);

      res.json({
        formattedAddress: topResult?.formattedAddress || "",
        locality,
        city,
        state,
        postalCode,
        plusCode: data.plusCode?.compoundCode || data.plusCode?.globalCode || "",
      });
    } catch (error) {
      console.error("Error in /api/geocode/reverse:", error);
      res.status(500).json({ error: "Failed to reverse geocode coordinates." });
    }
  });

  // Nearby & Text Search Hospitals Proxy (Places API New)
  app.post("/api/places/nearby-hospitals", async (req: Request, res: Response) => {
    try {
      const apiKey = getMapsApiKey();
      if (!apiKey) {
        res.status(500).json({ error: "Google Maps API key not configured." });
        return;
      }

      const {
        lat,
        lng,
        radiusMeters = 35000,
        query = "",
        languageCode = "en",
      } = req.body as {
        lat?: number;
        lng?: number;
        radiusMeters?: number;
        query?: string;
        languageCode?: string;
      };

      if (typeof lat !== "number" || typeof lng !== "number") {
        res.status(400).json({ error: "lat and lng are required numbers." });
        return;
      }

      const clampedRadius = Math.min(Math.max(radiusMeters, 1000), 50000);
      const trimmedQuery = typeof query === "string" ? query.trim() : "";

      const fieldMask = [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.shortFormattedAddress",
        "places.location",
        "places.nationalPhoneNumber",
        "places.internationalPhoneNumber",
        "places.currentOpeningHours",
        "places.rating",
        "places.userRatingCount",
        "places.googleMapsUri",
        "places.primaryTypeDisplayName",
      ].join(",");

      const endpoint = trimmedQuery
        ? "https://places.googleapis.com/v1/places:searchText"
        : "https://places.googleapis.com/v1/places:searchNearby";

      const requestBody = trimmedQuery
        ? {
            textQuery: trimmedQuery,
            includedType: "hospital",
            strictTypeFiltering: false,
            pageSize: 15,
            rankPreference: "DISTANCE",
            languageCode,
            regionCode: "IN",
            locationBias: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: clampedRadius,
              },
            },
          }
        : {
            includedTypes: ["hospital"],
            maxResultCount: 15,
            rankPreference: "DISTANCE",
            languageCode,
            regionCode: "IN",
            locationRestriction: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: clampedRadius,
              },
            },
          };

      const upstream = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": fieldMask,
          "X-Goog-Maps-Solution-ID": SOLUTION_ID,
        },
        body: JSON.stringify(requestBody),
      });

      const text = await upstream.text();
      if (!upstream.ok) {
        if (isQuotaExceededError(upstream.status, text)) {
          res.status(429).json({
            error: "Google Maps quota exceeded",
            quotaExceeded: true,
          });
          return;
        }
        res.status(upstream.status).json({
          error: `Places API error (${upstream.status})`,
          details: text,
        });
        return;
      }

      const data = JSON.parse(text) as {
        places?: Array<{
          id?: string;
          displayName?: { text?: string };
          formattedAddress?: string;
          shortFormattedAddress?: string;
          location?: { latitude?: number; longitude?: number };
          nationalPhoneNumber?: string;
          internationalPhoneNumber?: string;
          currentOpeningHours?: {
            openNow?: boolean;
            weekdayDescriptions?: string[];
          };
          rating?: number;
          userRatingCount?: number;
          googleMapsUri?: string;
          primaryTypeDisplayName?: { text?: string };
        }>;
      };

      const hospitals = (data.places || [])
        .filter((p) => p.location?.latitude != null && p.location?.longitude != null)
        .map((p) => {
          const pLat = p.location!.latitude!;
          const pLng = p.location!.longitude!;
          const distanceKm = calculateDistanceKmServer(lat, lng, pLat, pLng);
          return {
            id: p.id || `${pLat},${pLng}`,
            name: p.displayName?.text || "Medical Centre",
            address:
              p.shortFormattedAddress || p.formattedAddress || "India",
            lat: pLat,
            lng: pLng,
            distanceKm,
            phone: p.nationalPhoneNumber || p.internationalPhoneNumber || "",
            internationalPhone: p.internationalPhoneNumber || "",
            isOpenNow: p.currentOpeningHours?.openNow,
            openingHoursText:
              p.currentOpeningHours?.openNow === true
                ? "Open now"
                : p.currentOpeningHours?.openNow === false
                ? "Closed now"
                : undefined,
            rating: p.rating,
            userRatingCount: p.userRatingCount,
            googleMapsUri:
              p.googleMapsUri ||
              `https://www.google.com/maps/search/?api=1&query=${pLat},${pLng}`,
            directionsUri: `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${pLat},${pLng}&travelmode=driving`,
            primaryTypeLabel: p.primaryTypeDisplayName?.text || "Hospital",
          };
        })
        .sort((a, b) => a.distanceKm - b.distanceKm);

      res.json({ hospitals });
    } catch (error) {
      console.error("Error in /api/places/nearby-hospitals:", error);
      res.status(500).json({ error: "Failed to fetch nearby hospitals." });
    }
  });

  // Places Autocomplete (New) for searching Indian cities/districts
  app.post("/api/places/autocomplete", async (req: Request, res: Response) => {
    try {
      const apiKey = getMapsApiKey();
      if (!apiKey) {
        res.status(500).json({ error: "Google Maps API key not configured." });
        return;
      }

      const { input, languageCode = "en" } = req.body as {
        input?: string;
        languageCode?: string;
      };

      if (!input || !input.trim()) {
        res.json({ suggestions: [] });
        return;
      }

      const upstream = await fetch(
        "https://places.googleapis.com/v1/places:autocomplete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-Maps-Solution-ID": SOLUTION_ID,
          },
          body: JSON.stringify({
            input: input.trim(),
            includedRegionCodes: ["in"],
            languageCode,
          }),
        }
      );

      const text = await upstream.text();
      if (!upstream.ok) {
        if (isQuotaExceededError(upstream.status, text)) {
          res.status(429).json({
            error: "Google Maps quota exceeded",
            quotaExceeded: true,
          });
          return;
        }
        res.status(upstream.status).json({ error: "Autocomplete failed" });
        return;
      }

      const data = JSON.parse(text) as {
        suggestions?: Array<{
          placePrediction?: {
            placeId?: string;
            text?: { text?: string };
            structuredFormat?: {
              mainText?: { text?: string };
              secondaryText?: { text?: string };
            };
          };
        }>;
      };

      const suggestions = (data.suggestions || [])
        .filter((s) => s.placePrediction?.placeId)
        .slice(0, 6)
        .map((s) => ({
          placeId: s.placePrediction!.placeId!,
          description: s.placePrediction!.text?.text || "",
          mainText:
            s.placePrediction!.structuredFormat?.mainText?.text ||
            s.placePrediction!.text?.text ||
            "",
          secondaryText:
            s.placePrediction!.structuredFormat?.secondaryText?.text || "",
        }));

      res.json({ suggestions });
    } catch (error) {
      console.error("Error in /api/places/autocomplete:", error);
      res.status(500).json({ error: "Failed to autocomplete Indian place." });
    }
  });

  // Place Details (New) to resolve a selected Indian neighborhood/city into coordinates + district city/state
  app.get("/api/places/details", async (req: Request, res: Response) => {
    try {
      const apiKey = getMapsApiKey();
      if (!apiKey) {
        res.status(500).json({ error: "Google Maps API key not configured." });
        return;
      }

      const placeId =
        typeof req.query.placeId === "string" ? req.query.placeId.trim() : "";
      const languageCode =
        typeof req.query.language === "string" && req.query.language
          ? req.query.language
          : "en";

      if (!placeId) {
        res.status(400).json({ error: "placeId is required." });
        return;
      }

      const url = new URL(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`
      );
      url.searchParams.set("languageCode", languageCode);
      url.searchParams.set("regionCode", "IN");

      const upstream = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "id,displayName,formattedAddress,location,addressComponents",
          "X-Goog-Maps-Solution-ID": SOLUTION_ID,
        },
      });

      const text = await upstream.text();
      if (!upstream.ok) {
        if (isQuotaExceededError(upstream.status, text)) {
          res.status(429).json({
            error: "Google Maps quota exceeded",
            quotaExceeded: true,
          });
          return;
        }
        res.status(upstream.status).json({ error: "Place details failed" });
        return;
      }

      const data = JSON.parse(text) as {
        id?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude?: number; longitude?: number };
        addressComponents?: Array<{
          longText?: string;
          types?: string[];
        }>;
      };

      const comps = data.addressComponents || [];
      const locality =
        pickComponentByPriority(comps, [
          "sublocality_level_1",
          "sublocality",
          "neighborhood",
        ]) || "";
      const city =
        pickComponentByPriority(comps, [
          "locality",
          "administrative_area_level_2",
          "administrative_area_level_3",
        ]) ||
        data.displayName?.text ||
        "";
      const state = pickComponentByPriority(comps, [
        "administrative_area_level_1",
      ]);

      res.json({
        id: data.id,
        name: data.displayName?.text || "",
        formattedAddress: data.formattedAddress || "",
        lat: data.location?.latitude,
        lng: data.location?.longitude,
        locality: locality !== city ? locality : "",
        city,
        state,
      });
    } catch (error) {
      console.error("Error in /api/places/details:", error);
      res.status(500).json({ error: "Failed to resolve place details." });
    }
  });

  // Direct Text Query Geocode (Places API New searchText) for Enter/Submit in location search
  app.post("/api/places/geocode-query", async (req: Request, res: Response) => {
    try {
      const apiKey = getMapsApiKey();
      if (!apiKey) {
        res.status(500).json({ error: "Google Maps API key not configured." });
        return;
      }

      const { query, languageCode = "en" } = req.body as {
        query?: string;
        languageCode?: string;
      };

      if (!query || !query.trim()) {
        res.status(400).json({ error: "Location query is required." });
        return;
      }

      const textQuery = query.toLowerCase().includes("india")
        ? query.trim()
        : `${query.trim()}, India`;

      const upstream = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.location,places.addressComponents",
            "X-Goog-Maps-Solution-ID": SOLUTION_ID,
          },
          body: JSON.stringify({
            textQuery,
            pageSize: 1,
            languageCode,
            regionCode: "IN",
          }),
        }
      );

      const text = await upstream.text();
      if (!upstream.ok) {
        if (isQuotaExceededError(upstream.status, text)) {
          res.status(429).json({
            error: "Google Maps quota exceeded",
            quotaExceeded: true,
          });
          return;
        }
        res.status(upstream.status).json({ error: "Location lookup failed." });
        return;
      }

      const data = JSON.parse(text) as {
        places?: Array<{
          id?: string;
          displayName?: { text?: string };
          formattedAddress?: string;
          location?: { latitude?: number; longitude?: number };
          addressComponents?: Array<{
            longText?: string;
            types?: string[];
          }>;
        }>;
      };

      const place = data.places?.[0];
      if (!place?.location?.latitude || !place?.location?.longitude) {
        res.status(404).json({
          error: `Could not locate "${query.trim()}" in India. Try including city/district name.`,
        });
        return;
      }

      const comps = place.addressComponents || [];
      const locality =
        pickComponentByPriority(comps, [
          "sublocality_level_1",
          "sublocality",
          "neighborhood",
        ]) || "";
      const city =
        pickComponentByPriority(comps, [
          "locality",
          "administrative_area_level_2",
          "administrative_area_level_3",
        ]) ||
        place.displayName?.text ||
        "";
      const state = pickComponentByPriority(comps, [
        "administrative_area_level_1",
      ]);

      res.json({
        id: place.id,
        name: place.displayName?.text || query.trim(),
        formattedAddress: place.formattedAddress || "",
        lat: place.location.latitude,
        lng: place.location.longitude,
        locality: locality !== city ? locality : "",
        city,
        state,
      });
    } catch (error) {
      console.error("Error in /api/places/geocode-query:", error);
      res.status(500).json({ error: "Failed to resolve location query." });
    }
  });

  // Identify ALL Indian reptiles (snakes, lizards, monitors, crocodilians, turtles/tortoises)
  const handleIdentifyReptile = async (req: Request, res: Response) => {
    try {
      const {
        imageBase64,
        mimeType,
        language = "en",
        city = "",
        state = "",
      } = req.body as {
        imageBase64?: string;
        mimeType?: string;
        language?: string;
        city?: string;
        state?: string;
      };

      if (!imageBase64 || typeof imageBase64 !== "string") {
        res.status(400).json({ error: "Missing reptile image data." });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          error:
            "GEMINI_API_KEY is not configured. Check your Settings > Secrets panel.",
        });
        return;
      }

      const dataUrlMatch = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      const resolvedMimeType =
        dataUrlMatch?.[1] || mimeType || "image/jpeg";
      const rawBase64 = dataUrlMatch?.[2] || imageBase64;
      const targetLang = LANGUAGE_NAMES[language] || "English";
      const locationContext =
        city || state
          ? `User is currently located in ${[city, state, "India"].filter(Boolean).join(", ")}.`
          : "User is in India.";

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: resolvedMimeType,
                data: rawBase64,
              },
            },
            {
              text: `Identify the reptile in this photograph for Indian wildlife & emergency triage (covers ALL reptiles: snakes, lizards/monitors/geckos/chameleons/skinks, crocodilians like mugger/gharial/saltwater crocodile, and turtles/tortoises). ${locationContext} Write all descriptive fields (commonName, venomOrRiskType, summary, identifyingFeatures, threatsAndBehavior, lookAlikeNote, immediateAction, hospitalPrepNote, indianHabitatZones) in ${targetLang} (keep scientificName in Latin binomial, and localIndianNames showing common Hindi/regional Indian names). If no reptile is visible, set isReptileDetected to false and advise safe caution.`,
            },
          ],
        },
        config: {
          systemInstruction:
            "You are an expert Indian herpetologist and emergency wildlife triage specialist familiar with Indian Wildlife Protection Act (WPA 1972) schedules, Indian 'Big Four' venomous snakes, non-venomous colubrids/boas, monitor lizards, crocodilians, and freshwater/land chelonians. Be strictly conservative about human safety: never underestimate venomous snakes or aggressive crocodilians.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isReptileDetected: {
                type: Type.BOOLEAN,
                description: "Whether a reptile is clearly visible in the image.",
              },
              category: {
                type: Type.STRING,
                description:
                  "One of: snake, lizard, crocodilian, turtle.",
              },
              commonName: { type: Type.STRING },
              localIndianNames: {
                type: Type.STRING,
                description: "Common Indian vernacular names (e.g. Naag, Goh, Magar, Kachhua).",
              },
              scientificName: { type: Type.STRING },
              confidencePercent: { type: Type.NUMBER },
              isVenomous: {
                type: Type.BOOLEAN,
                description: "True only if venomous (e.g. venomous snake).",
              },
              isPhysicallyDangerous: {
                type: Type.BOOLEAN,
                description:
                  "True if capable of severe bite/tail strike/constriction (e.g. crocodile, large monitor, python).",
              },
              dangerScale: {
                type: Type.INTEGER,
                description: "Overall human hazard score from 1 (harmless) to 10 (lethal).",
              },
              venomOrRiskType: { type: Type.STRING },
              wpaSchedule: {
                type: Type.STRING,
                description: "Wildlife Protection Act 1972 schedule in India (e.g. Schedule I, Schedule II, Schedule IV).",
              },
              conservationStatus: { type: Type.STRING },
              indianHabitatZones: { type: Type.STRING },
              summary: { type: Type.STRING },
              identifyingFeatures: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              threatsAndBehavior: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              lookAlikeNote: { type: Type.STRING },
              immediateAction: { type: Type.STRING },
              hospitalPrepNote: {
                type: Type.STRING,
                description:
                  "India hospital note (e.g. polyvalent ASV availability or trauma care if crocodile/large bite).",
              },
            },
            required: [
              "isReptileDetected",
              "category",
              "commonName",
              "localIndianNames",
              "scientificName",
              "confidencePercent",
              "isVenomous",
              "isPhysicallyDangerous",
              "dangerScale",
              "venomOrRiskType",
              "wpaSchedule",
              "conservationStatus",
              "indianHabitatZones",
              "summary",
              "identifyingFeatures",
              "threatsAndBehavior",
              "lookAlikeNote",
              "immediateAction",
              "hospitalPrepNote",
            ],
          },
        },
      });

      const jsonText = stripJsonFences(response.text ?? "{}");
      const parsed = JSON.parse(jsonText);
      const validCategories = ["snake", "lizard", "crocodilian", "turtle"];
      if (!validCategories.includes(parsed.category)) {
        parsed.category = "snake";
      }
      res.json(parsed);
    } catch (error) {
      console.error("Error in /api/identify-reptile:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to analyze reptile photograph.";
      res.status(500).json({ error: message });
    }
  };

  app.post("/api/identify-reptile", handleIdentifyReptile);
  app.post("/api/identify-snake", handleIdentifyReptile);

  // Local Area Reptiles Intelligence across India (widen neighborhood -> district/city/state automatically)
  app.post("/api/local-reptiles", async (req: Request, res: Response) => {
    const {
      locality = "",
      city = "Bengaluru",
      state = "Karnataka",
      formattedAddress = "",
      lat,
      lng,
      language = "en",
    } = req.body as {
      locality?: string;
      city?: string;
      state?: string;
      formattedAddress?: string;
      lat?: number;
      lng?: number;
      language?: string;
    };

    const resolvedCity = city || locality || "India";
    const locationParts = [locality, city, state, "India"].filter(
      (v, idx, arr) => Boolean(v) && arr.indexOf(v) === idx
    );
    const locationLabel = locationParts.join(", ");

    try {
      if (!process.env.GEMINI_API_KEY) {
        res.json(buildFallbackLocalReptiles(resolvedCity, state, formattedAddress));
        return;
      }

      const targetLang = LANGUAGE_NAMES[language] || "English";

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Generate an accurate regional & city-level reptile checklist for "${locationLabel}"${
          formattedAddress ? ` (address context: ${formattedAddress})` : ""
        }${
          lat && lng ? ` (coordinates ${lat.toFixed(3)}, ${lng.toFixed(3)})` : ""
        }. IMPORTANT: If "${locality || city}" is a neighborhood/colony/ward (such as Patel Nagar in Bhopal), automatically broaden the scope to the encompassing Indian city/district (${city}) and regional biogeographic zone in ${state || "India"}. Include 8 notable native reptile species across snakes (both venomous and non-venomous), lizards/geckos/skinks/monitors, crocodilians (if present in regional lakes/rivers), and freshwater/land turtles. Respond in ${targetLang} (keep scientificName in Latin).`,
        config: {
          systemInstruction:
            "You are an Indian herpetologist compiling district-level reptile checklists and conflict prevention advisories across India. Never refuse or return empty for a neighborhood or colony — always broaden to the city, district, and state wildlife zone.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              regionTitle: { type: Type.STRING },
              biogeographicZone: { type: Type.STRING },
              seasonalRiskNote: { type: Type.STRING },
              safetyAdvisory: { type: Type.STRING },
              commonLocalSpecies: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    commonName: { type: Type.STRING },
                    scientificName: { type: Type.STRING },
                    category: { type: Type.STRING },
                    isVenomous: { type: Type.BOOLEAN },
                    dangerScale: { type: Type.INTEGER },
                    whereFoundLocally: { type: Type.STRING },
                    quickTip: { type: Type.STRING },
                  },
                  required: [
                    "commonName",
                    "scientificName",
                    "category",
                    "isVenomous",
                    "dangerScale",
                    "whereFoundLocally",
                    "quickTip",
                  ],
                },
              },
            },
            required: [
              "regionTitle",
              "biogeographicZone",
              "seasonalRiskNote",
              "safetyAdvisory",
              "commonLocalSpecies",
            ],
          },
        },
      });

      const parsed = JSON.parse(stripJsonFences(response.text ?? "{}"));
      if (
        !Array.isArray(parsed.commonLocalSpecies) ||
        parsed.commonLocalSpecies.length === 0
      ) {
        res.json(buildFallbackLocalReptiles(resolvedCity, state, formattedAddress));
        return;
      }
      res.json(parsed);
    } catch (error) {
      console.error("Error in /api/local-reptiles:", error);
      res.json(buildFallbackLocalReptiles(resolvedCity, state, formattedAddress));
    }
  });

  // Grounded Local Wildlife Rescuers & Snake Catchers (via Google Search Grounding)
  // NOTE: Never combine googleSearch with responseMimeType / responseSchema!
  app.post("/api/local-rescuers", async (req: Request, res: Response) => {
    const {
      locality = "",
      city = "Bengaluru",
      state = "Karnataka",
      formattedAddress = "",
      language = "en",
    } = req.body as {
      locality?: string;
      city?: string;
      state?: string;
      formattedAddress?: string;
      language?: string;
    };

    const resolvedCity = city || locality || "India";
    const areaParts = [locality, city, state, "India"].filter(
      (v, idx, arr) => Boolean(v) && arr.indexOf(v) === idx
    );
    const areaQuery = areaParts.join(", ");

    try {
      if (!process.env.GEMINI_API_KEY) {
        res.json({
          area: areaQuery,
          summaryText: buildFallbackRescuersText(locality, resolvedCity, state),
          sources: [],
          isFallback: true,
        });
        return;
      }

      const targetLang = LANGUAGE_NAMES[language] || "English";

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Search for official State Forest Department wildlife helplines, Forest Division control room numbers, and authorized snake/reptile rescue NGOs or trained snake catchers serving ${resolvedCity}, ${state || "India"}${
          locality ? ` (near ${locality})` : ""
        }${
          formattedAddress ? ` [${formattedAddress}]` : ""
        }. If exact neighborhood numbers are unavailable, broaden to ${resolvedCity} city/district and ${state || "state"} Forest Department wildlife rescue circles. List verified numbers as clear bullets with organization name and phone number, and remind the user of 112 / 108 / 101 / 1926. Never invent phone numbers. Respond in ${targetLang}.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const summaryText = (response.text || "").trim();
      const chunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = chunks
        .filter((c) => c.web?.uri)
        .map((c) => ({
          title: c.web?.title || "Verified Rescue Resource",
          uri: c.web!.uri!,
        }))
        .slice(0, 6);

      if (!summaryText) {
        res.json({
          area: areaQuery,
          summaryText: buildFallbackRescuersText(locality, resolvedCity, state),
          sources,
          isFallback: true,
        });
        return;
      }

      res.json({
        area: areaQuery,
        summaryText,
        sources,
        isFallback: false,
      });
    } catch (error) {
      console.error("Error in /api/local-rescuers:", error);
      res.json({
        area: areaQuery,
        summaryText: buildFallbackRescuersText(locality, resolvedCity, state),
        sources: [],
        isFallback: true,
      });
    }
  });

  const isProd = process.env.NODE_ENV === "production";
  const distDir = path.resolve(__dirname, "dist");

  if (!isProd || !fs.existsSync(distDir)) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`ANTIDOTE server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
