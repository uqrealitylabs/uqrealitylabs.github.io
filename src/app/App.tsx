import { useEffect, useState } from "react";
import { LegacyDomScaffold } from "../features/legacy-three/LegacyDomScaffold";
import { getLocaleMeta, t } from "../shared/i18n/runtime";
import { useUiStore } from "../shared/state/uiStore";
import { LoadingExperience } from "../shared/ui/LoadingExperience";

declare global {
  interface Window {
    __uqrlLegacySceneLoaded?: boolean;
  }
}

export function App() {
  const locale = useUiStore((state) => state.locale);
  const [sceneReady, setSceneReady] = useState(false);
  const meta = getLocaleMeta(locale);

  useEffect(() => {
    document.documentElement.lang = meta.lang;
    document.documentElement.dir = meta.dir;
  }, [meta]);

  useEffect(() => {
    let cancelled = false;

    if (window.__uqrlLegacySceneLoaded) {
      setSceneReady(true);
      return;
    }

    import("../features/legacy-three/legacy-main").then(() => {
      window.__uqrlLegacySceneLoaded = true;
      if (!cancelled) setSceneReady(true);
    });

    return () => {
      cancelled = true;
    };
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
      <LoadingExperience
        hidden={sceneReady}
        label={t(locale, "loading.scene")}
      />
    </>
  );
}
