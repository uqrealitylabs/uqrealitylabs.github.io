import { useEffect } from "react";
import { LegacyDomScaffold } from "../features/legacy-three/LegacyDomScaffold";
import { getLocaleMeta, t } from "../shared/i18n/runtime";

declare global {
  interface Window {
    __uqrlLegacySceneLoaded?: boolean;
  }
}

export function App() {
  const locale = "en";
  const meta = getLocaleMeta(locale);

  useEffect(() => {
    document.documentElement.lang = meta.lang;
    document.documentElement.dir = meta.dir;
  }, [meta]);

  useEffect(() => {
    if (window.__uqrlLegacySceneLoaded) return;

    import("../features/legacy-three/legacy-main")
      .then(() => {
        window.__uqrlLegacySceneLoaded = true;
      })
      .catch((error) => {
        console.error("Failed to load the legacy scene.", error);
        document.body.dataset.sceneReady = "error";
      });
  }, []);

  return (
    <>
      <LegacyDomScaffold
        labels={{
          mainNav: t(locale, "nav.main"),
          joinFallback: t(locale, "nav.joinFallback"),
          logoAlt: t(locale, "nav.logoAlt"),
          socialLinks: t(locale, "nav.social"),
          sceneLabel: t(locale, "scene.label"),
          closeProfile: t(locale, "profile.close"),
          linkedIn: t(locale, "profile.linkedin"),
        }}
      />
      <div className="loading-experience" role="status" aria-live="polite">
        <span className="loading-experience__orb" aria-hidden="true" />
        <span>{t(locale, "loading.scene")}</span>
      </div>
    </>
  );
}
