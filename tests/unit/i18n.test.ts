import { describe, expect, it } from "vitest";
import {
  buildAlternateLocaleUrls,
  buildLocaleUrl,
  getLocaleFromHostname,
  stripLocaleSubdomain,
} from "../../src/shared/i18n/localeUrls";
import {
  getInitialLocale,
  getLocaleForHostname,
  getLocaleMeta,
  isLocale,
  t,
} from "../../src/shared/i18n/runtime";

describe("i18n runtime", () => {
  it.each([
    ["en", "Main"],
    ["es", "Principal"],
  ] as const)("resolves nav.main for %s", (locale, expected) => {
    expect(t(locale, "nav.main")).toBe(expected);
  });

  it("falls back safely for missing keys", () => {
    expect(t("es", "missing.key")).toBe("missing.key");
  });

  it("reports lang and dir metadata", () => {
    expect(getLocaleMeta("en")).toEqual({ lang: "en", dir: "ltr" });
    expect(isLocale("es")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  it("resolves locale subdomains and falls back on unknown hosts", () => {
    const supported = ["en", "ja", "ar"] as const;

    expect(getLocaleFromHostname("en.example.com", supported, "en")).toBe("en");
    expect(getLocaleFromHostname("ja.example.com", supported, "en")).toBe("ja");
    expect(getLocaleFromHostname("ar.example.com", supported, "en")).toBe("ar");
    expect(getLocaleFromHostname("fr.example.com", supported, "en")).toBe("en");
    expect(stripLocaleSubdomain("ja.example.com", supported)).toBe(
      "example.com",
    );
    expect(getLocaleForHostname("es.uqrealitylabs.github.io")).toBe("es");
    expect(getInitialLocale()).toBe("en");
  });

  it("builds subdomain locale URLs without requiring localhost subdomains", () => {
    const supported = ["en", "ja", "ar"] as const;
    const config = {
      siteOrigin: "https://example.com",
      supportedLocales: supported,
      defaultLocale: "en",
      mode: "subdomain" as const,
    };

    expect(buildLocaleUrl("ja", "/about", config)).toBe(
      "https://ja.example.com/about",
    );
    expect(buildLocaleUrl("ja", "/en/about", config)).toBe(
      "https://ja.example.com/about",
    );
    expect(
      buildLocaleUrl("ja", "/about", {
        ...config,
        siteOrigin: "http://localhost:3000",
      }),
    ).toBe("http://localhost:3000/about");
  });

  it("builds fully-qualified hreflang alternates", () => {
    expect(
      buildAlternateLocaleUrls("/about", {
        siteOrigin: "https://example.com",
        supportedLocales: ["en", "ja"] as const,
        defaultLocale: "en",
        mode: "subdomain",
      }),
    ).toEqual([
      { hreflang: "en", href: "https://en.example.com/about" },
      { hreflang: "ja", href: "https://ja.example.com/about" },
      { hreflang: "x-default", href: "https://en.example.com/about" },
    ]);
  });
});
