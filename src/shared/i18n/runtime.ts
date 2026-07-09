export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];
type Direction = "ltr" | "rtl";

type Messages = Record<string, string>;

const messages: Record<Locale, Messages> = {
  en: {
    "nav.main": "Main",
    "nav.joinFallback": "Join Us",
    "nav.logoAlt": "UQ Reality Labs logo",
    "nav.social": "Social links",
    "scene.label": "Interactive UQ Reality Labs 3D scene",
    "profile.close": "Close profile",
    "profile.linkedin": "View LinkedIn profile",
    "loading.scene": "Loading scene",
  },
  es: {
    "nav.main": "Principal",
    "nav.joinFallback": "Unirse",
    "nav.logoAlt": "Logotipo de UQ Reality Labs",
    "nav.social": "Enlaces sociales",
    "scene.label": "Escena 3D interactiva de UQ Reality Labs",
    "profile.close": "Cerrar perfil",
    "profile.linkedin": "Ver perfil de LinkedIn",
    "loading.scene": "Cargando escena",
  },
};

const localeMeta: Record<Locale, { lang: Locale; dir: Direction }> = {
  en: { lang: "en", dir: "ltr" },
  es: { lang: "es", dir: "ltr" },
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getLocaleMeta(locale: Locale) {
  return localeMeta[locale];
}

export function t(locale: Locale, key: string) {
  return messages[locale]?.[key] ?? messages.en[key] ?? key;
}
