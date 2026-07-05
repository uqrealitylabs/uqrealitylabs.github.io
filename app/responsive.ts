export interface SafeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface BeeTrailPlacement {
  width: number;
  right?: number;
  left?: number;
  bottom: number;
}

export interface PopupLayout {
  maxWidth: number;
  imageSize: number;
  padding: number;
}

export type NavbarMode = "desktop" | "compact" | "mobile";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getNavbarMode(viewportWidth: number): NavbarMode {
  if (viewportWidth <= 480) return "mobile";
  if (viewportWidth <= 860) return "compact";
  return "desktop";
}

export function getCommitteePopupLayout(
  viewportWidth: number,
  viewportHeight: number,
): PopupLayout {
  const shortSide = Math.min(viewportWidth, viewportHeight);
  const maxWidth = clamp(viewportWidth * 0.9, 300, 420);
  const imageSize = clamp(shortSide * 0.18, 64, 112);
  const padding = clamp(viewportWidth * 0.024, 10, 20);

  return { maxWidth, imageSize, padding };
}

export function getBeeTrailPlacement(
  section: "join" | "social" | "committee",
  viewportWidth: number,
  viewportHeight: number,
  insets: SafeInsets,
): BeeTrailPlacement {
  const compact = viewportWidth <= 480 || viewportHeight <= 480;

  if (section === "join") {
    return {
      right: insets.right + (compact ? 6 : 18),
      bottom: insets.bottom + (compact ? 56 : 82),
      width: clamp(viewportWidth - insets.left - insets.right - (compact ? 18 : 36), 132, 240),
    };
  }

  if (section === "social") {
    return {
      left: insets.left + (compact ? 6 : 16),
      bottom: insets.bottom + (compact ? 44 : 68),
      width: clamp(viewportWidth - insets.left - insets.right - (compact ? 18 : 32), 124, 240),
    };
  }

  return {
    right: insets.right + (compact ? 10 : 28),
    bottom: insets.bottom + (compact ? 50 : 92),
    width: clamp(viewportWidth - insets.left - insets.right - (compact ? 24 : 40), 128, 252),
  };
}
