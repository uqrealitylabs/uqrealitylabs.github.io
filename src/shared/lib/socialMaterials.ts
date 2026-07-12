import {
  getMaterialKind,
  type MaterialKind,
} from "@uqrealitylabs/feelable-materials";

export type SocialMaterialSource = {
  label?: string;
  material?: string;
};

const socialMaterialFallbacks: Record<string, MaterialKind> = {
  discord: "rubber",
  email: "grass",
  instagram: "cloth",
  linkedin: "glass",
  mail: "grass",
};

export function resolveSocialMaterialKind(
  source: SocialMaterialSource,
): MaterialKind {
  if (source.material) return getMaterialKind(source.material);

  const label = source.label?.toLowerCase() ?? "";
  const fallbackKey = Object.keys(socialMaterialFallbacks).find((key) =>
    label.includes(key),
  );

  return fallbackKey ? socialMaterialFallbacks[fallbackKey] : "cloth";
}
