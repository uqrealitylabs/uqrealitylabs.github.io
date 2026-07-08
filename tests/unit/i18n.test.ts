import { describe, expect, it } from "vitest";
import { getLocaleMeta, isLocale, t } from "../../src/shared/i18n/runtime";

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
});
