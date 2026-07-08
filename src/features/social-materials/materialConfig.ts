export type SocialMaterial = "cloth" | "rubber" | "glass" | "grass";

export type SocialMaterialItem = {
  id: string;
  label: string;
  material: SocialMaterial;
};

export const socialMaterialMatrix: SocialMaterialItem[] = [
  { id: "instagram", label: "Instagram", material: "cloth" },
  { id: "linkedin", label: "LinkedIn", material: "rubber" },
  { id: "discord", label: "Discord", material: "glass" },
  { id: "email", label: "Email", material: "grass" },
];

export function materialForSocial(id: string) {
  return (
    socialMaterialMatrix.find((item) => item.id === id)?.material ?? "rubber"
  );
}
