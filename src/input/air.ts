import { worldState } from "../world/state";
import {
  type eyeGesture,
  type handGesture,
  type Pinch,
  pinchAction,
} from "./gestures";

/** Camera ownership starts with consent and ends on stop, exit or a hidden tab */
export function airControls() {
  const dialog = document.querySelector<HTMLDialogElement>("#air")!;
  const session = document.querySelector<HTMLElement>("#air-session")!;
  const video = session.querySelector<HTMLVideoElement>("video")!;
  const status = session.querySelector<HTMLElement>("[role=status]")!;
  const cursor = session.querySelector<HTMLElement>(".air-cursor")!;
  const start = dialog.querySelector<HTMLButtonElement>("[data-start]")!;
  const calibrate =
    session.querySelector<HTMLButtonElement>("[data-calibrate]")!;
  const effects = session.querySelector<HTMLElement>(".air-effects")!;
  let worker: Worker | undefined;
  let stream: MediaStream | undefined;
  let generation = 0,
    timer = 0,
    deadline = 0;
  let pinch: Pinch | undefined;
  let pinchTarget: HTMLElement | null = null;
  let heartAt = 0,
    heartDue = 0;
  let winkAt = 0,
    winked = false,
    reactionAt = 0,
    hearted = false;
  let sign = "",
    signAt = 0,
    expression = "neutral",
    expressionAt = 0;
  let handSeen = 0;
  let target: HTMLElement | null = null;
  let x = innerWidth / 2,
    y = innerHeight / 2;
  let neutral: { x: number; y: number } | undefined;
  let latestEye: { x: number; y: number } | undefined;
  const say = (key: string) => {
    status.textContent = status.dataset[key] ?? "";
  };
  const stop = () => {
    generation++;
    clearTimeout(timer);
    clearTimeout(deadline);
    worker?.terminate();
    worker = undefined;
    for (const track of stream?.getTracks() ?? []) track.stop();
    stream = undefined;
    video.srcObject = null;
    session.hidden = true;
    target?.classList.remove("air-target");
    target = null;
    start.disabled = false;
    pinch = undefined;
    pinchTarget = null;
    hearted = false;
    heartAt = 0;
    handSeen = 0;
    effects.replaceChildren();
    worldState.setState({
      steering: false,
      expression: "neutral",
      reaction: "",
      palm: { x: 0, y: 0, brake: true },
    });
    winked = false;
    neutral = latestEye = undefined;
    cursor.hidden = true;
  };
  const point = (nx: number, ny: number) => {
    x += (Math.max(0.02, Math.min(0.98, nx)) * innerWidth - x) * 0.65;
    y += (Math.max(0.02, Math.min(0.98, ny)) * innerHeight - y) * 0.65;
    cursor.hidden = false;
    cursor.style.translate = `${x}px ${y}px`;
    const next =
      document
        .elementFromPoint(x, y)
        ?.closest<HTMLElement>("a, button, summary, select, input") ?? null;
    if (next === target) return;
    target?.classList.remove("air-target");
    target = next;
    target?.classList.add("air-target");
  };
  const activate = (element = target) => {
    if (!element || element.matches(":disabled, [aria-disabled=true]")) return;
    element.focus({ preventScroll: true });
    element.click();
  };
  const react = (kind: string) => {
    const now = performance.now();
    if (
      now - reactionAt < 3500 ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    reactionAt = now;
    worldState.setState({ reaction: `${kind}:${now}` });
    const paths: Record<string, string> = {
      heart: "M12 21C-8 8 6-3 12 6C18-3 32 8 12 21Z",
      kiss: "M12 21C-8 8 6-3 12 6C18-3 32 8 12 21Z",
      peace: "M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8Z",
      rock: "M14 1L3 14H11L9 23L22 9H14Z",
      surprise:
        "M12 1V7M12 17V23M1 12H7M17 12H23M4 4L8 8M16 16L20 20M4 20L8 16M16 8L20 4",
    };
    const path = paths[kind] ?? paths.peace;
    effects.dataset.reaction = kind;
    for (let i = 0; i < 12; i++) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      const shape = document.createElementNS(svg.namespaceURI, "path");
      shape.setAttribute("d", path);
      svg.append(shape);
      svg.style.setProperty("--i", String(i));
      svg.style.left = `${15 + ((i * 37) % 70)}%`;
      effects.append(svg);
      svg
        .animate(
          [
            { transform: "translateY(2rem) scale(.2)", opacity: 0 },
            { opacity: 0.9, offset: 0.2 },
            {
              transform: `translate(${((i % 3) - 1) * 100}px, -${180 + i * 25}px) rotate(${i * 31}deg)`,
              opacity: 0,
            },
          ],
          { duration: 1800 + i * 60, easing: "cubic-bezier(.16,1,.3,1)" },
        )
        .finished.then(() => svg.remove())
        .catch(() => svg.remove());
    }
  };
  const capture = async (run: number) => {
    if (!worker || !stream || generation !== run) return;
    try {
      const frame = await createImageBitmap(video, { resizeWidth: 480 });
      if (!worker || generation !== run) {
        frame.close();
        return;
      }
      worker.postMessage({ frame, time: performance.now() }, [frame]);
    } catch (error) {
      console.warn("Air controls stopped", error);
      stop();
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[role=status]")!.textContent =
        status.dataset.error ?? "";
    }
  };
  start.addEventListener("click", async () => {
    stop();
    const run = generation;
    start.disabled = true;
    const message = dialog.querySelector<HTMLElement>("[role=status]")!;
    message.textContent = status.dataset.loading ?? "";
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof Worker === "undefined"
      )
        throw new Error("Camera or workers unavailable");
      const camera = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 20 },
        },
        audio: false,
      });
      if (generation !== run) {
        for (const track of camera.getTracks()) track.stop();
        return;
      }
      stream = camera;
      video.srcObject = stream;
      session.hidden = false;
      calibrate.hidden = false;
      say("loading");
      dialog.close();
      deadline = window.setTimeout(() => {
        stop();
        message.textContent = status.dataset.error ?? "";
        dialog.showModal();
      }, 15000);
      await video.play();
      clearTimeout(deadline);
      if (generation !== run) return;
      worker = new Worker(new URL("./vision.ts", import.meta.url), {
        type: "module",
      });
      deadline = window.setTimeout(() => {
        fail();
      }, 60000);
      const fail = () => {
        stop();
        message.textContent = status.dataset.error ?? "";
        if (!dialog.open) dialog.showModal();
      };
      worker.onerror = (event) => {
        console.warn("Vision worker failed", event.message);
        fail();
      };
      worker.onmessage = ({
        data,
      }: MessageEvent<{
        ready?: boolean;
        error?: string;
        hands?: NonNullable<ReturnType<typeof handGesture>>[];
        heart?: boolean;
        expression?: string;
        eye?: ReturnType<typeof eyeGesture> | null;
      }>) => {
        if (run !== generation) return;
        if (data.error) {
          console.warn("Air controls unavailable", data.error);
          fail();
          return;
        }
        const now = performance.now();
        if (data.ready) {
          clearTimeout(deadline);
          say("hand");
        }
        const hands = data.hands ?? [];
        const hand =
          hands.find((h) => h.sign === "point" || h.pinch) ?? hands[0];
        if (data.heart) heartAt ||= now;
        else {
          heartAt = 0;
          hearted = false;
        }
        if (data.heart && !hearted && now - heartAt > 450 && now > heartDue) {
          hearted = true;
          heartDue = now + 2500;
          const steering = !worldState.getState().steering;
          worldState.setState({ steering });
          react("heart");
        }
        const steering = worldState.getState().steering;
        if (hand) {
          handSeen = now;
          if (steering) {
            pinch = undefined;
            worldState.setState({
              palm: {
                x: (hand.palm.x - 0.5) * 2,
                y: (hand.palm.y - 0.5) * 2,
                brake: hand.sign !== "palm",
              },
            });
          } else {
            if (!pinch) point(hand.x, hand.y);
            if (hand.pinch && !pinch) pinchTarget = target;
            const action = pinchAction(pinch, hand.pinch, hand.y);
            pinch = action.state;
            cursor.dataset.state = pinch?.dragged
              ? "drag"
              : hand.pinch
                ? "pinch"
                : target
                  ? "target"
                  : "point";
            if (action.scroll)
              window.scrollBy(
                0,
                Math.max(-160, Math.min(160, action.scroll * innerHeight * 3)),
              );
            if (action.click && pinchTarget?.isConnected) activate(pinchTarget);
          }
          if (hand.sign !== sign) {
            sign = hand.sign;
            signAt = now;
          }
          if (
            sign &&
            !["point", "fist"].includes(sign) &&
            now - signAt > 450 &&
            !hand.pinch
          )
            react(sign);
        } else {
          pinch = undefined;
          pinchTarget = null;
          worldState.setState({ palm: { x: 0, y: 0, brake: true } });
        }
        if (data.expression) {
          worldState.setState({ expression: data.expression });
          if (data.expression !== expression) {
            expression = data.expression;
            expressionAt = now;
          }
          if (expression !== "neutral" && now - expressionAt > 600)
            react(expression);
        }
        if (data.eye) {
          latestEye = data.eye;
          neutral ??= latestEye;
          if (now - handSeen > 800 && !steering) {
            point(
              0.5 - (latestEye.x - neutral.x) * 4,
              0.5 + (latestEye.y - neutral.y) * 2,
            );
            if (data.eye.wink) {
              winkAt ||= now;
              if (!winked && now - winkAt > 450) {
                winked = true;
                activate();
                react("wink");
              }
            } else {
              winkAt = 0;
              winked = false;
            }
          }
        } else if (!hand && now - handSeen > 800) {
          cursor.hidden = true;
          target?.classList.remove("air-target");
          target = null;
          winkAt = 0;
          winked = false;
        }
        timer = window.setTimeout(() => void capture(run), 50);
      };
      worker.postMessage({ start: true, time: performance.now() });
      dialog.close();
    } catch (error) {
      if (generation !== run) return;
      console.warn("Camera access unavailable", error);
      stop();
      message.textContent = status.dataset.error ?? "";
    }
  });
  calibrate.addEventListener("click", () => {
    neutral = latestEye;
  });
  session.querySelector("[data-stop]")!.addEventListener("click", stop);
  dialog.addEventListener("cancel", stop);
  dialog.querySelector("[data-close]")!.addEventListener("click", () => {
    stop();
    dialog.close();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  window.addEventListener("pagehide", stop);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") stop();
  });
  return () => {
    stop();
    dialog.showModal();
  };
}
