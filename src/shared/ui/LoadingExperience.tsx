import { useEffect, useRef, useState } from "react";

const SEGMENT_COUNT = 20;
const SEGMENTS = Array.from({ length: SEGMENT_COUNT }, (_, i) => `seg-${i}`);
const EXIT_MS = 800;
const EXIT_EASE = "cubic-bezier(0.65, 0, 0.35, 1)";

export function LoadingExperience({
  hidden,
  label,
  progress,
}: {
  hidden: boolean;
  label: string;
  progress: number;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(!hidden);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!hidden || !mounted) return;

    const overlay = overlayRef.current;
    if (!overlay?.animate) {
      setMounted(false);
      return;
    }

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const duration = reduced ? 350 : EXIT_MS;

    setExiting(true);

    const animation = overlay.animate(
      [{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }],
      { duration, easing: EXIT_EASE, fill: "forwards" },
    );
    const timeout = window.setTimeout(() => setMounted(false), duration + 400);
    animation.onfinish = () => setMounted(false);

    return () => {
      window.clearTimeout(timeout);
      animation.onfinish = null;
      animation.cancel();
    };
  }, [hidden, mounted]);

  if (!mounted) return null;

  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  const filled = Math.round((pct / 100) * SEGMENT_COUNT);

  return (
    <div
      ref={overlayRef}
      className={exiting ? "loading-experience is-exit" : "loading-experience"}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
      aria-hidden={exiting || undefined}
    >
      <div className="loading-experience__panel">
        <div className="loading-experience__meta">
          <span>{label}</span>
          <span aria-hidden="true">{pct}%</span>
        </div>
        <div className="loading-experience__track" aria-hidden="true">
          {SEGMENTS.map((id, i) => (
            <span
              key={id}
              className={
                i < filled
                  ? "loading-experience__seg is-on"
                  : "loading-experience__seg"
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
