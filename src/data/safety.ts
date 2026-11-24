import type { FirstAidItem, SafetyTip } from "../types";

export const SAFETY_TIPS: SafetyTip[] = [
  {
    id: "tip-1",
    number: "01",
    title: "Maintain 3+ Meter Clearance",
    detail:
      "Most venomous snakes strike up to half their body length, while Mugger crocodiles and Monitor lizards can lunge or lash with tails suddenly. Step back slowly without blocking their escape.",
  },
  {
    id: "tip-2",
    number: "02",
    title: "Photograph & Share Pin Safely",
    detail:
      "Zoom in on the reptile from a safe distance for AI scan identification, then share your live GPS pin directly with an authorized Forest Department rescuer (1926) or local NGO.",
  },
  {
    id: "tip-3",
    number: "03",
    title: "Keep Bites Calm & Immobilized",
    detail:
      "If bitten by a snake, immobilize the limb like a fracture using a loose splint, remove rings/bangles/watches immediately, and dial 108 to reach a hospital stocking Indian Polyvalent ASV.",
  },
  {
    id: "tip-4",
    number: "04",
    title: "Protect Wildlife Under WPA 1972",
    detail:
      "Killing or capturing native Indian snakes, monitor lizards, crocodiles, or Star tortoises is a criminal offense under the Wildlife (Protection) Act, 1972. Call authorized rescuers instead.",
  },
];

export const FIRST_AID_DOS: FirstAidItem[] = [
  {
    id: "do-1",
    title: "Reassure & Keep the Victim Still",
    explanation:
      "Panic raises heart rate and spreads snake venom faster through the bloodstream. Have the person lie still on their left side if nauseous, with the bitten limb kept at or slightly below heart level.",
  },
  {
    id: "do-2",
    title: "Immobilize Like a Broken Bone",
    explanation:
      "Use a clean wooden board, folded cardboard, or stick as a gentle splint to stop joint flexion without squeezing circulation. Avoid walking or running to get help.",
  },
  {
    id: "do-3",
    title: "Remove Jewelry & Tight Clothing",
    explanation:
      "Take off rings, watches, toe rings, anklets, or tight sleeves before rapid swelling develops from Russell's Viper or Saw-scaled Viper bites.",
  },
  {
    id: "do-4",
    title: "Dial 108 / Reach ASV Hospital Immediately",
    explanation:
      "Only Polyvalent Anti-Snake Venom (ASV) given under medical supervision neutralizes Indian Big-Four snakebite venom. For monitor lizard or crocodile lacerations, rush to trauma ER for deep wound irrigation & tetanus.",
  },
];

export const FIRST_AID_DONTS: FirstAidItem[] = [
  {
    id: "dont-1",
    title: "Never Tie a Tight Tourniquet or Rope",
    explanation:
      "Tight tourniquets trap hemotoxic venom in one limb, leading to severe tissue death (gangrene) and amputation while releasing fatal shock when loosened.",
  },
  {
    id: "dont-2",
    title: "Never Cut the Wound or Suck Venom",
    explanation:
      "Slashing the skin with blades causes dangerous bleeding (especially with viper bites) and secondary infection; suction removes virtually zero venom.",
  },
  {
    id: "dont-3",
    title: "Avoid Faith Healers, Mantras, or Herbal Pastes",
    explanation:
      "Delays seeking hospital ASV for krait or cobra neurotoxicity cost lives within hours. Never apply cow dung, chilies, snake-stone, or ash on bites.",
  },
  {
    id: "dont-4",
    title: "Never Chase or Handle Any Reptile",
    explanation:
      "Do not attempt to catch, kill, or corner a snake, monitor lizard, or crocodile even for identification — show doctors a safe zoomed photo instead.",
  },
];
