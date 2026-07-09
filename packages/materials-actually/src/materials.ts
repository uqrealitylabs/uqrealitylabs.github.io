export type MaterialKind = "cloth" | "rubber" | "glass" | "grass" | "mail";
export type MaterialBehavior = "crease" | "squish" | "smudge" | "bend";
export type MaterialEventKind =
  | "hover"
  | "contact"
  | "press"
  | "fastSwipe"
  | "wipe"
  | "damage"
  | "cut"
  | "release";

export type MaterialConfig = {
  kind: MaterialKind;
  behavior: MaterialBehavior;
  pointerResponse: true;
  pressBoost: number;
  decay: number;
  deformation: number;
  smear: number;
  damageVelocity: number;
  cutVelocity: number;
  resistance: number;
  grassBlades?: {
    minCount: number;
    tennisLineOutline: true;
  };
};

export const materialConfigs: Record<MaterialKind, MaterialConfig> = {
  cloth: {
    kind: "cloth",
    behavior: "crease",
    pointerResponse: true,
    pressBoost: 1.4,
    decay: 0.86,
    deformation: 0.7,
    smear: 0.1,
    damageVelocity: 0.42,
    cutVelocity: Number.POSITIVE_INFINITY,
    resistance: 0.28,
  },
  rubber: {
    kind: "rubber",
    behavior: "squish",
    pointerResponse: true,
    pressBoost: 1.75,
    decay: 0.78,
    deformation: 1,
    smear: 0.05,
    damageVelocity: 0.36,
    cutVelocity: Number.POSITIVE_INFINITY,
    resistance: 0.62,
  },
  glass: {
    kind: "glass",
    behavior: "smudge",
    pointerResponse: true,
    pressBoost: 1.15,
    decay: 0.94,
    deformation: 0,
    smear: 1,
    damageVelocity: Number.POSITIVE_INFINITY,
    cutVelocity: Number.POSITIVE_INFINITY,
    resistance: 0.08,
  },
  grass: {
    kind: "grass",
    behavior: "bend",
    pointerResponse: true,
    pressBoost: 1.55,
    decay: 0.82,
    deformation: 0.55,
    smear: 0,
    damageVelocity: Number.POSITIVE_INFINITY,
    cutVelocity: 0.32,
    resistance: 0.35,
    grassBlades: { minCount: 320, tennisLineOutline: true },
  },
  mail: {
    kind: "mail",
    behavior: "bend",
    pointerResponse: true,
    pressBoost: 1.35,
    decay: 0.84,
    deformation: 0.38,
    smear: 0.12,
    damageVelocity: Number.POSITIVE_INFINITY,
    cutVelocity: Number.POSITIVE_INFINITY,
    resistance: 0.2,
  },
};

export function getMaterialKind(label = ""): MaterialKind {
  const name = label.toLowerCase();

  if (Object.hasOwn(materialConfigs, name)) return name as MaterialKind;
  if (name.includes("discord")) return "rubber";
  if (name.includes("linkedin")) return "glass";
  if (name.includes("email") || name.includes("mail")) return "mail";
  if (name.includes("grass")) return "grass";
  return "cloth";
}

export function getMaterialConfig(label = "") {
  return materialConfigs[getMaterialKind(label)];
}
