import "./style.css";
import { worldState } from "../world/state";
import { mountPage } from "./page";

const lifetime = new AbortController();
const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
const menu = document.querySelector<HTMLButtonElement>(".menu");
const navigation = document.querySelector<HTMLElement>("#navigation");

for (const station of document.querySelectorAll<HTMLAnchorElement>(
  ".station__link",
)) {
  station.addEventListener("click", (event) => {
    if (
      event.button ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    history.replaceState(history.state, "", `#${station.id}`);
  });
}
window.addEventListener("pageshow", () => {
  if (!location.hash.startsWith("#station-")) return;
  const station = document.getElementById(location.hash.slice(1));
  if (!station) return;
  station.focus({ preventScroll: true });
});

if (menu && navigation) {
  menu.hidden = false;
  const closeMenu = () => {
    menu.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
  };
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    navigation.classList.toggle("is-open", open);
  });
  navigation.addEventListener("click", closeMenu);
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menu.getAttribute("aria-expanded") === "true"
    ) {
      closeMenu();
      menu.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (
      event.target instanceof Node &&
      !navigation.contains(event.target) &&
      !menu.contains(event.target)
    )
      closeMenu();
  });
}

const specimen = document.querySelector<HTMLElement>("#specimen");
let canvas = document.querySelector<HTMLCanvasElement>("#canvas");
const status = document.querySelector<HTMLElement>("#scene-status");
let scene: { dispose(): void; select(key: string): void } | undefined;
let loading = false;
let disposed = false;
let hero = document.querySelector<HTMLElement>(".hero");
let disposePage = () => {};
function setJourney(progress: number) {
  if (!hero) return;
  const chapter = progress < 0.32 ? 0 : progress < 0.77 ? 1 : 2;
  hero.dataset.chapter = ["campus", "brisbane", "australia"][chapter];
  const current = worldState.getState();
  if (current.progress !== progress || current.selected !== "home")
    worldState.setState({ progress, selected: "home" });
}
const followJourney = () => {
  const world = document.querySelector<HTMLElement>(".world");
  const bounds = hero?.getBoundingClientRect();
  const hidden = !!bounds && bounds.bottom <= 0;
  if (world && world.hidden !== hidden) world.hidden = hidden;
  if (
    !bounds ||
    motion.matches ||
    worldState.getState().city ||
    worldState.getState().selected !== "home"
  )
    return;
  setJourney(
    Math.min(
      1,
      Math.max(0, -bounds.top / Math.max(bounds.height - innerHeight, 1)),
    ),
  );
};
let journeyFrame = 0;
const queueJourney = () => {
  if (journeyFrame) return;
  journeyFrame = requestAnimationFrame(() => {
    journeyFrame = 0;
    followJourney();
  });
};
// Focus-driven scrolling must not cancel an exhibit selection
const resumeJourney = () => {
  if (worldState.getState().selected === "home" || motion.matches) return;
  worldState.setState({ selected: "home" });
  queueJourney();
};
for (const event of ["wheel", "touchmove"] as const)
  window.addEventListener(event, resumeJourney, {
    passive: true,
    signal: lifetime.signal,
  });
window.addEventListener(
  "keydown",
  (event) => {
    if (
      !(event.target instanceof Element) ||
      event.target.closest(
        "button, a, input, textarea, select, [contenteditable]",
      )
    )
      return;
    if (
      [
        "ArrowDown",
        "ArrowUp",
        "PageDown",
        "PageUp",
        "Home",
        "End",
        " ",
      ].includes(event.key)
    )
      resumeJourney();
  },
  { signal: lifetime.signal },
);
window.addEventListener("scroll", queueJourney, {
  passive: true,
  signal: lifetime.signal,
});
window.addEventListener("resize", queueJourney, { signal: lifetime.signal });
setJourney(0);
followJourney();
motion.addEventListener(
  "change",
  () => {
    if (motion.matches) setJourney(0);
    else followJourney();
  },
  { signal: lifetime.signal },
);
const viewButtons = [
  ...document.querySelectorAll<HTMLButtonElement>(".station__view"),
];
for (const button of viewButtons)
  button.addEventListener("click", () =>
    scene?.select(button.dataset.view ?? "home"),
  );
const unsubscribeWorld = worldState.subscribe(({ selected: key }, previous) => {
  if (key === previous.selected) return;
  const selected = viewButtons.find((button) => button.dataset.view === key);
  for (const button of viewButtons)
    button.setAttribute("aria-pressed", String(button === selected));
  const readout = document.querySelector<HTMLElement>(".scene-readout");
  if (readout) readout.hidden = !selected;
  if (selected) {
    const title = document.getElementById("room-title");
    const description = document.getElementById("room-description");
    const link = document.querySelector<HTMLAnchorElement>("#room-link");
    if (title) title.textContent = selected.dataset.title ?? "";
    if (description)
      description.textContent = selected.dataset.description ?? "";
    if (link) {
      link.href = selected.dataset.url ?? "/";
      link.textContent = `${link.dataset.label} ${selected.dataset.title}`;
    }
    if (hero) history.replaceState(history.state, "", `#station-${key}`);
  } else if (key === "home" && hero)
    history.replaceState(
      history.state,
      "",
      `${location.pathname}${location.search}`,
    );
});

async function loadScene() {
  if (!canvas || !specimen || !status || loading || scene || disposed) return;
  loading = true;
  specimen.dataset.scene = "loading";
  status.textContent = status.dataset.loading ?? "";
  try {
    const { createScene } = await import("../world/scene");
    if (disposed) return;
    const result = await createScene(
      canvas,
      specimen,
      undefined,
      lifetime.signal,
    );
    if (disposed) {
      result.dispose();
      return;
    }
    scene = result;
    for (const button of viewButtons) button.hidden = false;
    scene.select(
      hero
        ? location.hash.replace("#station-", "") || "home"
        : (document.querySelector<HTMLElement>("#main")?.dataset.room ??
            "about"),
    );
    status.textContent = status.dataset.ready ?? "";
  } catch (error) {
    if (lifetime.signal.aborted) return;
    console.warn("The optional 3D view is unavailable", error);
    specimen.dataset.scene = "error";
    status.textContent = status.dataset.error ?? "";
  } finally {
    loading = false;
  }
}

let worldRecoveries = 0;
specimen?.addEventListener(
  "worldrestore",
  () => {
    if (loading || worldRecoveries >= 1 || disposed || !canvas) return;
    worldRecoveries++;
    scene?.dispose();
    scene = undefined;
    // Three releases the previous GPU context asynchronously, so recovery owns a fresh surface
    const replacement = canvas.cloneNode(false) as HTMLCanvasElement;
    canvas.replaceWith(replacement);
    canvas = replacement;
    void loadScene();
  },
  { signal: lifetime.signal },
);
const connection = (
  navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }
).connection;
if (
  motion.matches ||
  connection?.saveData ||
  /(^|-)[23]g$/.test(connection?.effectiveType ?? "")
) {
  specimen?.setAttribute("data-scene", "static");
} else {
  // The first frame and its links never wait for the optional scene
  window.setTimeout(() => void loadScene(), 100);
}

window.addEventListener("pagehide", (event) => {
  if (event.persisted) return;
  disposed = true;
  cancelAnimationFrame(journeyFrame);
  lifetime.abort();
  unsubscribeWorld();
  scene?.dispose();
  disposePage();
  searchLifetime.abort();
  searchRoot?.unmount();
});

const search = document.querySelector<HTMLDialogElement>("#search");
const trigger = document.querySelector<HTMLButtonElement>(".search-trigger");
const searchLifetime = new AbortController();
let searchReady = false;
let searchRoot: { unmount(): void } | undefined;
if (search && trigger) {
  trigger.hidden = false;
  trigger.addEventListener("click", async () => {
    search.returnValue = "";
    search.showModal();
    search.querySelector("input")?.focus();
    if (searchReady) return;
    searchReady = true;
    try {
      const { mountSearch } = await import("./search");
      const host = search.querySelector<HTMLElement>("#search-content");
      if (host && !searchLifetime.signal.aborted) {
        const root = await mountSearch(host);
        if (searchLifetime.signal.aborted) root.unmount();
        else searchRoot = root;
      }
    } catch (error) {
      searchReady = false;
      if (searchLifetime.signal.aborted) return;
      const results = search.querySelector("#search-results");
      if (results)
        results.textContent =
          document.documentElement.lang === "es"
            ? "La búsqueda no está disponible. Usa los enlaces de navegación."
            : "Search is unavailable. Use the page navigation or try again.";
      console.warn("Public search unavailable", error);
    }
  });
  search
    .querySelector("[data-close]")
    ?.addEventListener("click", () => search.close());
  search.addEventListener("close", () => {
    if (search.returnValue !== "navigate")
      trigger.focus({ preventScroll: true });
  });
  search.addEventListener("click", (event) => {
    if (
      event.target instanceof Element &&
      event.target.closest("#search-results a")
    )
      search.close("navigate");
    if (event.target === search) {
      const rect = search.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        search.close();
    }
  });
}

const footer = document.querySelector<HTMLElement>(".footer");
const latch = footer?.querySelector<HTMLButtonElement>(".footer__latch");
if (footer && latch) {
  let pinned = false;
  const openFooter = (open: boolean) => {
    footer.dataset.open = String(open);
    latch.setAttribute("aria-expanded", String(open));
  };
  footer.dataset.enhanced = "true";
  latch.hidden = false;
  footer.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") openFooter(true);
  });
  footer.addEventListener("pointerleave", () => {
    if (!pinned && !footer.contains(document.activeElement)) openFooter(false);
  });
  footer.addEventListener("focusin", () => openFooter(true));
  footer.addEventListener("focusout", (event) => {
    if (!pinned && !footer.contains(event.relatedTarget as Node | null))
      openFooter(false);
  });
  latch.addEventListener("click", () => {
    pinned = !pinned;
    openFooter(pinned);
  });
  footer.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      pinned = false;
      latch.focus();
      openFooter(false);
    }
  });
}

// Camera capability is discovered without asking for access or loading a vision model
const airTrigger = document.querySelector<HTMLButtonElement>(".air-trigger");
const airInvite = document.querySelector<HTMLElement>(".air-invite");
let openAir: Promise<() => void> | undefined;
let airDismissed = false;
const rememberAir = () => {
  airDismissed = true;
  if (airInvite) airInvite.hidden = true;
  try {
    localStorage.setItem("uqrl-air-invitation", "seen");
  } catch {
    /* Private browsing can disable storage */
  }
};
const showAir = async () => {
  rememberAir();
  openAir ??= import("../input/air").then(({ airControls }) => airControls());
  try {
    const open = await openAir;
    if (!disposed) open();
  } catch (error) {
    openAir = undefined;
    console.warn("Air controls unavailable", error);
    const dialog = document.querySelector<HTMLDialogElement>("#air");
    const message = dialog?.querySelector<HTMLElement>("[role=status]");
    if (message)
      message.textContent =
        document.querySelector<HTMLElement>("#air-session [role=status]")
          ?.dataset.error ?? "";
    if (dialog && !disposed) dialog.showModal();
  }
};
if (
  airTrigger &&
  typeof navigator.mediaDevices?.getUserMedia === "function" &&
  typeof Worker !== "undefined"
) {
  airTrigger.hidden = false;
  airTrigger.addEventListener("click", () => void showAir());
  airInvite
    ?.querySelector("[data-air-open]")
    ?.addEventListener("click", () => void showAir());
  airInvite
    ?.querySelector("[data-air-dismiss]")
    ?.addEventListener("click", rememberAir);
  let seen = true;
  try {
    seen = localStorage.getItem("uqrl-air-invitation") === "seen";
  } catch {
    /* Keep the optional invitation closed when storage is unavailable */
  }
  if (hero && !seen && !connection?.saveData) {
    const invitation = window.setTimeout(() => {
      if (airInvite && !disposed && !airDismissed) airInvite.hidden = false;
    }, 6000);
    const visibility = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        clearTimeout(invitation);
        if (airInvite) airInvite.hidden = true;
      }
    });
    visibility.observe(hero);
    window.addEventListener(
      "pagehide",
      () => {
        clearTimeout(invitation);
        visibility.disconnect();
      },
      { once: true },
    );
  }
}

// The route root changes; the world, dialogs and camera session retain ownership
const onRoute = () => {
  disposePage();
  disposePage = mountPage();
  hero = document.querySelector<HTMLElement>(".hero");
  document.body.dataset.page =
    document.querySelector<HTMLElement>("#main")?.dataset.page;
  document
    .querySelectorAll<HTMLAnchorElement>("#navigation a")
    .forEach((link) => {
      if (new URL(link.href).pathname === location.pathname)
        link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  if (hero) {
    const station = location.hash.startsWith("#station-")
      ? location.hash.slice(9)
      : "";
    if (viewButtons.some((button) => button.dataset.view === station)) {
      worldState.setState({ selected: station });
      scene?.select(station);
      document
        .getElementById(`station-${station}`)
        ?.focus({ preventScroll: true });
    } else {
      setJourney(0);
      followJourney();
    }
  } else {
    const world = document.querySelector<HTMLElement>(".world");
    if (world) world.hidden = false;
    worldState.setState({ city: "" });
    worldState.setState({
      selected:
        document.querySelector<HTMLElement>("#main")?.dataset.room ?? "about",
      progress: 0,
    });
  }
  menu?.setAttribute("aria-expanded", "false");
  navigation?.classList.remove("is-open");
};
if (!hero)
  worldState.setState({
    selected:
      document.querySelector<HTMLElement>("#main")?.dataset.room ?? "about",
  });
void import("./router")
  .then(({ mountRouter }) => mountRouter(onRoute))
  .catch((error) => {
    disposePage = mountPage();
    console.warn("Direct page navigation remains available", error);
  });

for (const city of document.querySelectorAll<HTMLButtonElement>(
  "[data-capital]",
))
  city.addEventListener("click", () => {
    worldState.setState(
      city.dataset.capital === "Brisbane"
        ? { city: "", progress: 0.5 }
        : { city: city.dataset.capital ?? "" },
    );
  });
document
  .querySelector(".world-return")
  ?.addEventListener("click", () =>
    worldState.setState({ city: "", progress: 1 }),
  );
