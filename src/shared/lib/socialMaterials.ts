import {
  createLinkedInRegionManifest,
  getMaterialKind,
  listRegionMaterials,
  type MaterialKind,
  type MaterialRegionManifest,
} from "@uqrealitylabs/feelable-materials";

export type SocialMaterialSource = {
  label?: string;
  material?: string;
};

export type ResolvedSocialMaterial = {
  kind: MaterialKind;
  regions?: MaterialRegionManifest | undefined;
  regionKinds: MaterialKind[];
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

export function resolveSocialMaterial(source: SocialMaterialSource) {
  const kind = resolveSocialMaterialKind(source);
  const label = source.label?.toLowerCase() ?? "";
  const regions = label.includes("linkedin")
    ? createLinkedInRegionManifest("linkedin.svg")
    : undefined;

  return {
    kind,
    regions,
    regionKinds: regions ? listRegionMaterials(regions) : [kind],
  } satisfies ResolvedSocialMaterial;
}
