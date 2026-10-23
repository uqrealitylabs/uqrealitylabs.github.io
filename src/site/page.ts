/** Page enhancements are released on navigation while the world and camera remain alive */
export function mountPage() {
  const lifetime = new AbortController();
  const { signal } = lifetime;
  const cleanups: (() => void)[] = [];
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const calendar = document.querySelector<HTMLElement>("#calendar");
  if (calendar)
    void import("./calendar")
      .then(async ({ mountCalendar }) => {
        if (signal.aborted) return;
        const root = await mountCalendar(calendar, signal);
        if (!root) return;
        if (signal.aborted) root.unmount();
        else cleanups.push(() => root.unmount());
      })
      .catch((error) =>
        console.warn("The static calendar remains available", error),
      );
  const feed = document.querySelector<HTMLButtonElement>(".feed-copy");
  if (feed && navigator.clipboard) {
    feed.hidden = false;
    feed.addEventListener(
      "click",
      async () => {
        try {
          await navigator.clipboard.writeText(
            "https://uqrealitylabs.com/events.ics",
          );
          feed.textContent = feed.dataset.copied ?? "Copied";
        } catch {
          feed.textContent = "https://uqrealitylabs.com/events.ics";
        }
      },
      { signal },
    );
  }
  for (const award of document.querySelectorAll<HTMLElement>(".award-object")) {
    const load = award.querySelector<HTMLButtonElement>(".award-object__load");
    let active: { dispose(): void } | undefined;
    let pending = false;
    let recoveries = 0;
    const start = async () => {
      const canvas = award.querySelector("canvas");
      if (!canvas || !load || pending || signal.aborted) return;
      pending = true;
      load.disabled = true;
      try {
        const { createScene } = await import("../world/scene");
        if (signal.aborted) return;
        const result = await createScene(
          canvas,
          award,
          award.dataset.visual,
          signal,
        );
        if (signal.aborted) result.dispose();
        else {
          active = result;
          load.hidden = true;
        }
      } catch (error) {
        if (signal.aborted) return;
        const status = award.querySelector<HTMLElement>("[role=status]");
        if (status) status.textContent = status.dataset.error ?? "";
        pending = false;
        load.disabled = false;
        console.warn("Optional award view unavailable", error);
      }
    };
    award.addEventListener(
      "worldrestore",
      () => {
        if (recoveries++ || signal.aborted || !active) return;
        active.dispose();
        const previous = award.querySelector("canvas");
        previous?.replaceWith(previous.cloneNode(false));
        pending = false;
        void start();
      },
      { signal },
    );
    load?.addEventListener("click", () => void start(), { signal });
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !motion.matches && !connection?.saveData) {
        observer.disconnect();
        void start();
      }
    });
    observer.observe(award);
    cleanups.push(() => {
      observer.disconnect();
      active?.dispose();
    });
  }
  return () => {
    lifetime.abort();
    for (const cleanup of cleanups) cleanup();
  };
}
