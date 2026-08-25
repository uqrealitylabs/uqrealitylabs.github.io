import { startTransition, useEffect, useState } from "react";
import { LegacyDomScaffold } from "../features/legacy-three/LegacyDomScaffold";
import { getLocaleMeta, t } from "../shared/i18n/runtime";
import { useUiStore } from "../shared/state/uiStore";
import { LoadingExperience } from "../shared/ui/LoadingExperience";

declare global {
  interface Window {
    __uqrlLegacySceneLoaded?: boolean;
  }
}

const SCENE_PROGRESS_EVENT = "uqrl:scene-progress";
const SCENE_READY_EVENT = "uqrl:scene-ready";

export function App() {
  const locale = useUiStore((state) => state.locale);
  const [sceneReady, setSceneReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const meta = getLocaleMeta(locale);

  useEffect(() => {
    document.documentElement.lang = meta.lang;
    document.documentElement.dir = meta.dir;
  }, [meta]);

  useEffect(() => {
    let cancelled = false;

    const markReady = () => {
      if (cancelled) return;
      startTransition(() => {
        setProgress(100);
        setSceneReady(true);
      });
    };

    const onProgress = (event: Event) => {
      const ratio = (event as CustomEvent<number>).detail;
      if (typeof ratio !== "number" || cancelled) return;
      startTransition(() => {
        setProgress(Math.round(Math.max(0, Math.min(1, ratio)) * 100));
      });
    };

    window.addEventListener(SCENE_PROGRESS_EVENT, onProgress);
    window.addEventListener(SCENE_READY_EVENT, markReady);

    if (
      window.__uqrlLegacySceneLoaded &&
      document.body.dataset.sceneReady === "true"
    ) {
      markReady();
      return () => {
        cancelled = true;
        window.removeEventListener(SCENE_PROGRESS_EVENT, onProgress);
        window.removeEventListener(SCENE_READY_EVENT, markReady);
      };
    }

    import("../features/legacy-three/legacy-main")
      .then(() => {
        window.__uqrlLegacySceneLoaded = true;
        if (!cancelled && document.body.dataset.sceneReady === "true") {
          markReady();
        }
      })
      .catch((error) => {
        console.error("Failed to load the legacy scene.", error);
        markReady();
      });

    return () => {
      cancelled = true;
      window.removeEventListener(SCENE_PROGRESS_EVENT, onProgress);
      window.removeEventListener(SCENE_READY_EVENT, markReady);
    };
  }, []);

  return (
    <>
      <div
        inert={sceneReady ? undefined : true}
        aria-hidden={sceneReady ? undefined : true}
      >
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
      </div>
      <LoadingExperience
        hidden={sceneReady}
        label={t(locale, "loading.scene")}
        progress={progress}
      />
    </>
  );
}
