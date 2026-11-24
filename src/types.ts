export type TabId = "home" | "scan" | "atlas" | "rescue";
export type AtlasSection = "guide" | "local" | "firstaid";
export type LanguageCode = "en" | "hi" | "mr" | "ta" | "kn" | "bn" | "te";

export type ReptileCategory = "snake" | "lizard" | "crocodilian" | "turtle";

export interface ReptileSpecies {
  id: string;
  category: ReptileCategory;
  commonName: string;
  localNames: string;
  scientificName: string;
  imageUrl: string;
  isVenomous: boolean;
  isPhysicallyDangerous?: boolean;
  dangerScale: number;
  venomOrRiskType: string;
  wpaSchedule: string;
  conservationStatus: string;
  indianRegions: string[];
  habitat: string;
  averageLength: string;
  summary: string;
  identifyingFeatures: string[];
  threatsAndBehavior: string[];
  lookAlikeNote: string;
  immediateAction: string;
  isSample?: boolean;
}

export interface ScanResult {
  isReptileDetected: boolean;
  category: ReptileCategory;
  commonName: string;
  localIndianNames?: string;
  scientificName: string;
  imageUrl: string;
  confidencePercent: number;
  isVenomous: boolean;
  isPhysicallyDangerous?: boolean;
  dangerScale: number;
  venomOrRiskType: string;
  wpaSchedule: string;
  conservationStatus: string;
  indianHabitatZones: string;
  summary: string;
  identifyingFeatures: string[];
  threatsAndBehavior: string[];
  lookAlikeNote: string;
  immediateAction: string;
  hospitalPrepNote?: string;
  source: "ai-vision" | "sample";
}

export interface CoordsState {
  lat: number;
  lng: number;
  isLiveGps: boolean;
  isTracking: boolean;
  accuracyMeters?: number;
  formattedAddress?: string;
  locality?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  plusCode?: string;
}

export interface RealHospitalPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  phone?: string;
  internationalPhone?: string;
  isOpenNow?: boolean;
  openingHoursText?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  directionsUri?: string;
  primaryTypeLabel?: string;
}

export interface LocalRescuer {
  id: string;
  name: string;
  organization: string;
  cityOrRegion: string;
  phone: string;
  category: "forest-dept" | "ngo" | "rescuer" | "medical";
  availability: string;
  notes: string;
}

export interface LocalAreaReport {
  regionTitle: string;
  biogeographicZone: string;
  seasonalRiskNote: string;
  commonLocalSpecies: Array<{
    commonName: string;
    scientificName: string;
    category: ReptileCategory;
    isVenomous: boolean;
    dangerScale: number;
    whereFoundLocally: string;
    quickTip: string;
  }>;
  safetyAdvisory: string;
}

export interface SafetyTip {
  id: string;
  number: string;
  title: string;
  detail: string;
}

export interface FirstAidItem {
  id: string;
  title: string;
  explanation: string;
}

export interface IndianCityPreset {
  id: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  regionTag: string;
}
