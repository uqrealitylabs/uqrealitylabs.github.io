export type SocialMaterialKind =
  | "cloth"
  | "rubber"
  | "glass"
  | "grass"
  | "mail";
export type SocialMaterialBehavior = "crease" | "squish" | "smudge" | "bend";

export type SocialMaterialConfig = {
  kind: SocialMaterialKind;
  behavior: SocialMaterialBehavior;
  pointerResponse: true;
  pressBoost: number;
  decay: number;
};

export const socialMaterialConfigs: Record<
  SocialMaterialKind,
  SocialMaterialConfig
> = {
  cloth: {
    kind: "cloth",
    behavior: "crease",
    pointerResponse: true,
    pressBoost: 1.4,
    decay: 0.86,
  },
  rubber: {
    kind: "rubber",
    behavior: "squish",
    pointerResponse: true,
    pressBoost: 1.75,
    decay: 0.78,
  },
  glass: {
    kind: "glass",
    behavior: "smudge",
    pointerResponse: true,
    pressBoost: 1.15,
    decay: 0.94,
  },
  grass: {
    kind: "grass",
    behavior: "bend",
    pointerResponse: true,
    pressBoost: 1.55,
    decay: 0.82,
  },
  mail: {
    kind: "mail",
    behavior: "bend",
    pointerResponse: true,
    pressBoost: 1.55,
    decay: 0.82,
  },
};

export function getSocialMaterialKind(label = ""): SocialMaterialKind {
  const name = label.toLowerCase();

  if (name in socialMaterialConfigs) return name as SocialMaterialKind;
  if (name.includes("discord")) return "rubber";
  if (name.includes("linkedin")) return "glass";
  if (name.includes("email") || name.includes("mail")) return "mail";
  if (name.includes("grass")) return "grass";
  return "cloth";
}

export function getSocialMaterialConfig(label = "") {
  return socialMaterialConfigs[getSocialMaterialKind(label)];
}
