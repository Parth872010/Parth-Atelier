import type { LanguageCode } from "../types";

export interface LanguageOption {
  code: LanguageCode;
  nativeLabel: string;
  englishName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", nativeLabel: "English", englishName: "English" },
  { code: "hi", nativeLabel: "हिन्दी", englishName: "Hindi" },
  { code: "mr", nativeLabel: "मराठी", englishName: "Marathi" },
  { code: "ta", nativeLabel: "தமிழ்", englishName: "Tamil" },
  { code: "kn", nativeLabel: "ಕನ್ನಡ", englishName: "Kannada" },
  { code: "bn", nativeLabel: "বাংলা", englishName: "Bengali" },
  { code: "te", nativeLabel: "తెలుగు", englishName: "Telugu" },
];

export interface UITranslations {
  appTagline: string;
  navHome: string;
  navScan: string;
  navAtlas: string;
  navRescue: string;
  sosButton: string;
  liveGpsActive: string;
  enableLiveGps: string;
  stopTracking: string;
  sharePinOnMap: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubheadline: string;
  scanCameraCta: string;
  uploadPhotoCta: string;
  openMapCta: string;
  sampleSectionTitle: string;
  openScannerLink: string;
  localReptilesCardTitle: string;
  localReptilesSubtitle: string;
  exploreLocalArea: string;
  nearbyHospitalsTitle: string;
  openFullMap: string;
  safetyProtocolTitle: string;
  firstAidLink: string;
  scannerTitle: string;
  scannerSubtitle: string;
  openLiveCamera: string;
  uploadEncounterPhoto: string;
  captureAndIdentify: string;
  cancel: string;
  scanAnother: string;
  atlasTitle: string;
  atlasSubtitle: string;
  tabAllSpecies: string;
  tabLocalArea: string;
  tabFirstAid: string;
  searchSpeciesPlaceholder: string;
  catAll: string;
  catSnake: string;
  catLizard: string;
  catCrocodilian: string;
  catTurtle: string;
  filterAllRisk: string;
  filterVenomous: string;
  filterNonVenomous: string;
  rescueTitle: string;
  rescueSubtitle: string;
  searchLocationPlaceholder: string;
  searchHospitalPlaceholder: string;
  refreshGps: string;
  getDirections: string;
  callHospital: string;
  openGoogleMaps: string;
  sosModalTitle: string;
  sosModalSubtitle: string;
  ambulanceIndia: string;
  nationalEmergency: string;
  forestHelpline: string;
  localRescuersTitle: string;
  loadingLocalRescuers: string;
  callNow: string;
  shareGpsMap: string;
  firstAidDosTitle: string;
  firstAidDontsTitle: string;
  venomousLabel: string;
  nonVenomousLabel: string;
  physicallyDangerousLabel: string;
  disclaimerNote: string;
}

const EN: UITranslations = {
  appTagline: "India Reptile Identifier & Rescue",
  navHome: "Home",
  navScan: "Scan",
  navAtlas: "Field Guide",
  navRescue: "Rescue Map",
  sosButton: "SOS Rescue",
  liveGpsActive: "Live GPS Tracking",
  enableLiveGps: "Track Live GPS",
  stopTracking: "Pause GPS",
  sharePinOnMap: "Map & Share Pin",
  heroEyebrow: "All-India Herpetology Triage · Snakes, Lizards, Crocodilians & Turtles",
  heroHeadline: "Identify Any Indian Reptile Safely in Seconds",
  heroSubheadline:
    "Keep at least 3 meters away and zoom in. Scan via live camera for instant species identification, Wildlife Act status, local area sightings, and real nearby anti-venom hospitals.",
  scanCameraCta: "Open Camera & Scan",
  uploadPhotoCta: "Upload Photo",
  openMapCta: "Live Hospital Map",
  sampleSectionTitle: "Test with Indian Reptile Specimens",
  openScannerLink: "Full Scanner →",
  localReptilesCardTitle: "Reptiles Near Your Location",
  localReptilesSubtitle: "Species prevalent in your detected Indian district & habitat",
  exploreLocalArea: "Local Field Guide",
  nearbyHospitalsTitle: "Real Nearby Medical Centres",
  openFullMap: "Live Map & Route",
  safetyProtocolTitle: "Field Encounter Safety Protocol",
  firstAidLink: "First-Aid Protocol",
  scannerTitle: "AI Reptile Vision Scanner",
  scannerSubtitle:
    "Point camera at any snake, lizard, monitor, crocodile, or tortoise from a safe distance, or upload a photo.",
  openLiveCamera: "Open Live Camera",
  uploadEncounterPhoto: "Upload Photo",
  captureAndIdentify: "Capture & Identify",
  cancel: "Cancel",
  scanAnother: "Scan Another",
  atlasTitle: "Indian Reptile Field Guide & First Aid",
  atlasSubtitle:
    "Explore Indian snakes, lizards, skinks, geckos, crocodilians, turtles, local area checklists, and first aid.",
  tabAllSpecies: "All Reptiles",
  tabLocalArea: "Local Area Reptiles",
  tabFirstAid: "First-Aid Do's & Don'ts",
  searchSpeciesPlaceholder: "Search species, Hindi/local name, state, or markings...",
  catAll: "All",
  catSnake: "Snakes",
  catLizard: "Lizards & Monitors",
  catCrocodilian: "Crocodilians",
  catTurtle: "Turtles & Tortoises",
  filterAllRisk: "All Risk",
  filterVenomous: "Venomous",
  filterNonVenomous: "Non-Venomous",
  rescueTitle: "Live Hospital Map & GPS Tracker",
  rescueSubtitle:
    "Real-time coordinates, nearby hospitals via Google Places, driving routes & pin sharing",
  searchLocationPlaceholder: "Search any Indian city, district, or area...",
  searchHospitalPlaceholder: "Filter: trauma center, medical college, government hospital...",
  refreshGps: "Live GPS",
  getDirections: "Route on Map",
  callHospital: "Call",
  openGoogleMaps: "Google Maps",
  sosModalTitle: "Emergency Call & Wildlife Rescuers",
  sosModalSubtitle: "Tap any number to open your phone dialer immediately",
  ambulanceIndia: "Ambulance (108)",
  nationalEmergency: "National Emergency (112)",
  forestHelpline: "Forest Dept Helpline (1926)",
  localRescuersTitle: "Local Wildlife Rescuers & NGOs",
  loadingLocalRescuers: "Searching verified rescue teams near your location...",
  callNow: "Call",
  shareGpsMap: "Open Map & Share Live Pin",
  firstAidDosTitle: "First-Aid Do's (Immediate Care)",
  firstAidDontsTitle: "Critical Don'ts (Harmful Myths)",
  venomousLabel: "VENOMOUS",
  nonVenomousLabel: "NON-VENOMOUS",
  physicallyDangerousLabel: "HIGH PHYSICAL RISK",
  disclaimerNote:
    "Informational & educational field guide only. Always call 108 / 112 and visit a qualified hospital for any bite or medical emergency.",
};

const HI: UITranslations = {
  ...EN,
  appTagline: "भारत सरीसृप पहचान एवं बचाव",
  navHome: "होम",
  navScan: "स्कैन",
  navAtlas: "फील्ड गाइड",
  navRescue: "अस्पताल मैप",
  sosButton: "आपातकालीन SOS",
  liveGpsActive: "लाइव GPS चालू",
  enableLiveGps: "लाइव GPS ट्रैक करें",
  stopTracking: "GPS रोकें",
  sharePinOnMap: "मैप व लोकेशन भेजें",
  heroEyebrow: "अखिल भारतीय सरीसृप पहचान · सांप, छिपकली, मगरमच्छ और कछुए",
  heroHeadline: "किसी भी भारतीय सरीसृप की सेकंडों में सुरक्षित पहचान करें",
  heroSubheadline:
    "कम से कम 3 मीटर की दूरी बनाए रखें। लाइव कैमरे से फोटो लें और तुरंत प्रजाति, खतरे का स्तर, स्थानीय जीव जानकारी और नजदीकी असली अस्पताल देखें।",
  scanCameraCta: "कैमरा खोलें और स्कैन करें",
  uploadPhotoCta: "फोटो अपलोड करें",
  openMapCta: "अस्पताल मैप खोलें",
  sampleSectionTitle: "भारतीय प्रजातियों के उदाहरण से जांचें",
  openScannerLink: "पूरा स्कैनर →",
  localReptilesCardTitle: "आपके क्षेत्र के सरीसृप",
  localReptilesSubtitle: "आपके जिले और राज्य में पाए जाने वाले प्रमुख जीव",
  exploreLocalArea: "स्थानीय फील्ड गाइड",
  nearbyHospitalsTitle: "नजदीकी असली अस्पताल",
  openFullMap: "लाइव मैप और रूट",
  safetyProtocolTitle: "सुरक्षा नियम (मुठभेड़ होने पर)",
  firstAidLink: "प्राथमिक उपचार",
  scannerTitle: "AI सरीसृप कैमरा स्कैनर",
  scannerSubtitle: "सांप, गोह (मॉनिटर), मगरमच्छ या कछुए की सुरक्षित दूरी से फोटो लें।",
  openLiveCamera: "लाइव कैमरा खोलें",
  uploadEncounterPhoto: "फोटो चुनें",
  captureAndIdentify: "फोटो खींचें और पहचानें",
  cancel: "रद्द करें",
  scanAnother: "दूसरा स्कैन करें",
  atlasTitle: "भारतीय सरीसृप फील्ड गाइड एवं प्राथमिक उपचार",
  atlasSubtitle: "भारतीय सांप, गोह, गिरगिट, छिपकली, मगरमच्छ, कछुए और प्राथमिक उपचार गाइड।",
  tabAllSpecies: "सभी प्रजातियाँ",
  tabLocalArea: "मेरे क्षेत्र के जीव",
  tabFirstAid: "प्राथमिक उपचार (क्या करें / न करें)",
  searchSpeciesPlaceholder: "नाम, हिंदी नाम, राज्य या निशान खोजें...",
  catAll: "सभी",
  catSnake: "सांप",
  catLizard: "छिपकली और गोह",
  catCrocodilian: "मगरमच्छ व घड़ियाल",
  catTurtle: "कछुए",
  filterAllRisk: "सभी",
  filterVenomous: "जहरीले",
  filterNonVenomous: "गैर-जहरीले",
  rescueTitle: "लाइव अस्पताल मैप और GPS ट्रैकर",
  rescueSubtitle: "असली नजदीकी अस्पताल, ड्राइविंग रास्ता और लाइव लोकेशन शेयरिंग",
  searchLocationPlaceholder: "भारत का कोई भी शहर या क्षेत्र खोजें...",
  searchHospitalPlaceholder: "खोजें: ट्रॉमा सेंटर, सरकारी अस्पताल...",
  refreshGps: "लाइव GPS",
  getDirections: "मैप पर रास्ता",
  callHospital: "कॉल करें",
  openGoogleMaps: "Google मैप्स",
  sosModalTitle: "आपातकालीन कॉल और स्थानीय रेस्क्यू टीम",
  sosModalSubtitle: "सीधे फोन कॉल करने के लिए नंबर पर टैप करें",
  ambulanceIndia: "एम्बुलेंस (108)",
  nationalEmergency: "राष्ट्रीय आपातकाल (112)",
  forestHelpline: "वन विभाग हेल्पलाइन (1926)",
  localRescuersTitle: "स्थानीय वन्यजीव बचाव दल और हेल्पलाइन",
  loadingLocalRescuers: "आपके क्षेत्र के वन्यजीव बचाव दल खोजे जा रहे हैं...",
  callNow: "कॉल करें",
  shareGpsMap: "मैप खोलें व लाइव लोकेशन भेजें",
  firstAidDosTitle: "क्या करें (सही प्राथमिक उपचार)",
  firstAidDontsTitle: "क्या न करें (खतरनाक भ्रांतियां)",
  venomousLabel: "जहरीला",
  nonVenomousLabel: "गैर-जहरीला",
  physicallyDangerousLabel: "शारीरिक खतरा",
  disclaimerNote:
    "केवल सूचना एवं जागरूकता हेतु। किसी भी दंश या आपात स्थिति में तुरंत 108 / 112 पर कॉल करें और नजदीकी अस्पताल जाएं।",
};

const MR: UITranslations = {
  ...EN,
  appTagline: "भारत सरपटणारे प्राणी ओळख व बचाव",
  navHome: "मुख्यपृष्ठ",
  navScan: "स्कॅन",
  navAtlas: "फील्ड गाईड",
  atlasTitle: "भारतीय सरपटणारे प्राणी फील्ड गाईड व प्रथमोपचार",
  navRescue: "रुग्णालय नकाशा",
  sosButton: "तातडीचा SOS",
  heroHeadline: "कोणताही भारतीय सरपटणारा प्राणी काही सेकंदांत ओळखा",
  scanCameraCta: "कॅमेरा उघडा आणि स्कॅन करा",
  uploadPhotoCta: "फोटो अपलोड करा",
  openMapCta: "रुग्णालय नकाशा",
  tabAllSpecies: "सर्व प्रजाती",
  tabLocalArea: "स्थानिक परिसरातील प्राणी",
  tabFirstAid: "प्रथमोपचार",
  catAll: "सर्व",
  catSnake: "साप",
  catLizard: "सरडा व घोरपड",
  catCrocodilian: "मगर व सुसर",
  catTurtle: "कासव",
  sosModalTitle: "तातडीची मदत व स्थानिक सर्पमित्र",
  ambulanceIndia: "रुग्णवाहिका (108)",
  nationalEmergency: "राष्ट्रीय आपत्कालीन (112)",
  forestHelpline: "वन विभाग हेल्पलाइन (1926)",
  callNow: "कॉल करा",
  venomousLabel: "विषारी",
  nonVenomousLabel: "बिनविषारी",
};

const TA: UITranslations = {
  ...EN,
  appTagline: "இந்திய ஊர்வன அடையாளம் & மீட்பு",
  navHome: "முகப்பு",
  navScan: "ஸ்கேன்",
  navAtlas: "கள வழிகாட்டி",
  atlasTitle: "இந்திய ஊர்வன கள வழிகாட்டி & முதலுதவி",
  navRescue: "மருத்துவமனை",
  sosButton: "அவசர SOS",
  heroHeadline: "இந்திய ஊர்வனவற்றை நொடிகளில் பாதுகாப்பாக அடையாளம் காணுங்கள்",
  scanCameraCta: "கேமராவைத் திறந்து ஸ்கேன் செய்",
  uploadPhotoCta: "புகைப்படம் பதிவேற்று",
  openMapCta: "மருத்துவமனை வரைபடம்",
  tabAllSpecies: "அனைத்து இனங்கள்",
  tabLocalArea: "உள்ளூர் பகுதி ஊர்வன",
  tabFirstAid: "முதலுதவி",
  catAll: "அனைத்தும்",
  catSnake: "பாம்புகள்",
  catLizard: "உடும்பு & பல்லிகள்",
  catCrocodilian: "முதலைகள்",
  catTurtle: "ஆமைகள்",
  sosModalTitle: "அவசர அழைப்பு & உள்ளூர் மீட்பு குழுக்கள்",
  ambulanceIndia: "ஆம்புலன்ஸ் (108)",
  nationalEmergency: "தேசிய அவசர எண் (112)",
  forestHelpline: "வனத்துறை உதவி (1926)",
  callNow: "அழைக்க",
  venomousLabel: "விஷமுள்ளவை",
  nonVenomousLabel: "விஷமற்றவை",
};

const KN: UITranslations = {
  ...EN,
  appTagline: "ಭಾರತೀಯ ಸರೀಸೃಪ ಗುರುತಿಸುವಿಕೆ ಮತ್ತು ರಕ್ಷಣೆ",
  navHome: "ಮುಖಪುಟ",
  navScan: "ಸ್ಕ್ಯಾನ್",
  navAtlas: "ಕ್ಷೇತ್ರ ಮಾರ್ಗದರ್ಶಿ",
  atlasTitle: "ಭಾರತೀಯ ಸರೀಸೃಪ ಕ್ಷೇತ್ರ ಮಾರ್ಗದರ್ಶಿ ಮತ್ತು ಪ್ರಥಮ ಚಿಕಿತ್ಸೆ",
  navRescue: "ಆಸ್ಪತ್ರೆ ನಕ್ಷೆ",
  sosButton: "ತುರ್ತು SOS",
  heroHeadline: "ಯಾವುದೇ ಭಾರತೀಯ ಸರೀಸೃಪವನ್ನು ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಗುರುತಿಸಿ",
  scanCameraCta: "ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ ಮತ್ತು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
  uploadPhotoCta: "ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
  openMapCta: "ಆಸ್ಪತ್ರೆ ನಕ್ಷೆ",
  tabAllSpecies: "ಎಲ್ಲಾ ಪ್ರಭೇದಗಳು",
  tabLocalArea: "ಸ್ಥಳೀಯ ಪ್ರದೇಶದ ಸರೀಸೃಪಗಳು",
  tabFirstAid: "ಪ್ರಥಮ ಚಿಕಿತ್ಸೆ",
  catAll: "ಎಲ್ಲಾ",
  catSnake: "ಹಾವುಗಳು",
  catLizard: "ಉಡ ಮತ್ತು ಹಲ್ಲಿಗಳು",
  catCrocodilian: "ಮೊಸಳೆಗಳು",
  catTurtle: "ಆಮೆಗಳು",
  sosModalTitle: "ತುರ್ತು ಕರೆ ಮತ್ತು ಸ್ಥಳೀಯ ವನ್ಯಜೀವಿ ರಕ್ಷಕರು",
  ambulanceIndia: "ಆಂಬ್ಯುಲೆನ್ಸ್ (108)",
  nationalEmergency: "ರಾಷ್ಟ್ರೀಯ ತುರ್ತು (112)",
  forestHelpline: "ಅರಣ್ಯ ಇಲಾಖೆ ಸಹಾಯವಾಣಿ (1926)",
  callNow: "ಕರೆ ಮಾಡಿ",
  venomousLabel: "ವಿಷಕಾರಿ",
  nonVenomousLabel: "ವಿಷರಹಿತ",
};

const BN: UITranslations = {
  ...EN,
  appTagline: "ভারতীয় সরীসৃপ শনাক্তকরণ ও উদ্ধার",
  navHome: "হোম",
  navScan: "স্ক্যান",
  navAtlas: "ফিল্ড গাইড",
  atlasTitle: "ভারতীয় সরীসৃপ ফিল্ড গাইড ও প্রাথমিক চিকিৎসা",
  navRescue: "হাসপাতাল ম্যাপ",
  sosButton: "জরুরি SOS",
  heroHeadline: "যেকোনো ভারতীয় সরীসৃপ কয়েক সেকেন্ডে নিরাপদে শনাক্ত করুন",
  scanCameraCta: "ক্যামেরা খুলুন ও স্ক্যান করুন",
  uploadPhotoCta: "ছবি আপলোড করুন",
  openMapCta: "হাসপাতাল ম্যাপ",
  tabAllSpecies: "সব প্রজাতি",
  tabLocalArea: "স্থানীয় এলাকার সরীসৃপ",
  tabFirstAid: "প্রাথমিক চিকিৎসা",
  catAll: "সব",
  catSnake: "সাপ",
  catLizard: "গিরগিটি ও গুইসাপ",
  catCrocodilian: "কুমির ও ঘড়িয়াল",
  catTurtle: "কচ্ছপ",
  sosModalTitle: "জরুরি কল ও স্থানীয় বন্যপ্রাণী উদ্ধারকারী",
  ambulanceIndia: "অ্যাম্বুলেন্স (108)",
  nationalEmergency: "জাতীয় জরুরি নম্বর (112)",
  forestHelpline: "বনদপ্তর হেল্পলাইন (1926)",
  callNow: "কল করুন",
  venomousLabel: "বিষধর",
  nonVenomousLabel: "নির্বিষ",
};

const TE: UITranslations = {
  ...EN,
  appTagline: "భారతీయ సరీసృపాల గుర్తింపు & రక్షణ",
  navHome: "హోమ్",
  navScan: "స్కాన్",
  navAtlas: "ఫీల్డ్ గైడ్",
  atlasTitle: "భారతీయ సరీసృపాల ఫీల్డ్ గైడ్ & ప్రథమ చికిత్స",
  navRescue: "ఆసుపత్రి మ్యాప్",
  sosButton: "అత్యవసర SOS",
  heroHeadline: "ఏ భారతీయ సరీసృపాన్నైనా సెకన్లలో సురక్షితంగా గుర్తించండి",
  scanCameraCta: "కెమెరా తెరిచి స్కాన్ చేయండి",
  uploadPhotoCta: "ఫోటో అప్‌లోడ్ చేయండి",
  openMapCta: "ఆసుపత్రి మ్యాప్",
  tabAllSpecies: "అన్ని జాతులు",
  tabLocalArea: "స్థానిక ప్రాంత సరీసృపాలు",
  tabFirstAid: "ప్రథమ చికిత్స",
  catAll: "అన్నీ",
  catSnake: "పాములు",
  catLizard: "బల్లులు & ఉడుములు",
  catCrocodilian: "మొసళ్ళు",
  catTurtle: "తాబేళ్ళు",
  sosModalTitle: "అత్యవసర కాల్ & స్థానిక వన్యప్రాణి రక్షకులు",
  ambulanceIndia: "అంబులెన్స్ (108)",
  nationalEmergency: "జాతీయ అత్యవసర (112)",
  forestHelpline: "అటవీ శాఖ హెల్ప్‌లైన్ (1926)",
  callNow: "కాల్ చేయండి",
  venomousLabel: "విషపూరితమైనది",
  nonVenomousLabel: "విషరహితమైనది",
};

export const TRANSLATIONS: Record<LanguageCode, UITranslations> = {
  en: EN,
  hi: HI,
  mr: MR,
  ta: TA,
  kn: KN,
  bn: BN,
  te: TE,
};
