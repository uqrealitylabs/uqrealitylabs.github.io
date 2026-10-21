import type * as THREE from "three";
import { earthPosition } from "./geography";

/** Approximate solar declination and subsolar longitude from UTC, including Earth's rotation */
export function sunlight(time: Date) {
  const days = time.getTime() / 86400000 - 10957.5;
  const radians = Math.PI / 180;
  const anomaly = (357.528 + 0.9856003 * days) * radians;
  const longitude =
    (280.46 +
      0.9856474 * days +
      1.915 * Math.sin(anomaly) +
      0.02 * Math.sin(2 * anomaly)) *
    radians;
  const obliquity = (23.439 - 0.0000004 * days) * radians;
  const ascension =
    Math.atan2(Math.cos(obliquity) * Math.sin(longitude), Math.cos(longitude)) /
    radians;
  const latitude =
    Math.asin(Math.sin(obliquity) * Math.sin(longitude)) / radians;
  const sidereal = 280.46061837 + 360.98564736629 * days;
  const east = ((((ascension - sidereal + 540) % 360) + 360) % 360) - 180;
  return {
    longitude: east,
    latitude,
    direction: earthPosition(east, latitude, 1),
  };
}

export function solarDirection(time: Date, orientation: THREE.Quaternion) {
  return sunlight(time).direction.applyQuaternion(orientation);
}
