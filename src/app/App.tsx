import { lazy, Suspense, useEffect, useState } from "react";
import { getLocaleMeta, t } from "../shared/i18n/runtime";
import { LoadingExperience } from "../shared/ui/LoadingExperience";

const ThreeSceneExperience = lazy(() =>
  import("../features/three-scene/ThreeSceneExperience").then((module) => ({
    default: module.ThreeSceneExperience,
  })),
);

export function App() {
  const locale = "en";
  const [sceneReady, setSceneReady] = useState(false);
  const meta = getLocaleMeta(locale);

  useEffect(() => {
    document.documentElement.lang = meta.lang;
    document.documentElement.dir = meta.dir;
  }, [meta]);

  return (
    <>
      <Suspense fallback={null}>
        <ThreeSceneExperience
          locale={locale}
          onReady={() => setSceneReady(true)}
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
      </Suspense>
      <LoadingExperience
        hidden={sceneReady}
        label={t(locale, "loading.scene")}
      />
    </>
  );
}
