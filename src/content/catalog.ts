import { shared } from "./load.ts";
import { isSafeHref, type Locale } from "./schema.ts";

export type Social = { label: string; url: string; material?: string };

export function getSiteContent(_locale: Locale) {
  const membership = shared.membership;
  const socialLinks = shared.socialLinks;
  if (typeof membership !== "string" || !isSafeHref(membership))
    throw new Error("shared.toml.membership: expected a safe membership URL");
  if (!Array.isArray(socialLinks) || !socialLinks.length)
    throw new Error("shared.toml.socialLinks: expected social records");
  for (const record of socialLinks) {
    const link = record as Record<string, unknown> | null;
    if (
      !link ||
      typeof link !== "object" ||
      typeof link.label !== "string" ||
      typeof link.url !== "string" ||
      !isSafeHref(link.url)
    )
      throw new Error(
        "shared.toml.socialLinks: expected a label and a safe URL",
      );
    if (
      link.material !== undefined &&
      !["cloth", "glass", "rubber", "grass", "mail"].includes(
        String(link.material),
      )
    )
      throw new Error("shared.toml.socialLinks.material: unknown material");
  }
  return { membership, socialLinks: socialLinks as Social[] };
}
