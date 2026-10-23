import * as THREE from "three";
import { earthRadius, locate } from "./geography";
import { viewpoints } from "./lab";

const brisbane = locate([153.025, -27.47]);
const route = new THREE.CatmullRomCurve3([
  new THREE.Vector3().fromArray(viewpoints.home.eye),
  new THREE.Vector3(6, 2.8, 9),
  new THREE.Vector3(24, 5, 8),
  new THREE.Vector3(32, 6, -18),
  new THREE.Vector3(33, 8, -46),
  new THREE.Vector3(36, 13, -70),
  new THREE.Vector3(52, 17, -65),
  new THREE.Vector3(brisbane.x + 33, 29, brisbane.y + 35),
]);
const targets = new THREE.CatmullRomCurve3([
  new THREE.Vector3().fromArray(viewpoints.home.at),
  new THREE.Vector3(3, 0.8, 2),
  new THREE.Vector3(15, 1, 5),
  new THREE.Vector3(24, 2, -28),
  new THREE.Vector3(28, 3, -58),
  new THREE.Vector3(33, 4, -77),
  new THREE.Vector3(37, 3, -79),
  new THREE.Vector3(brisbane.x, 1, brisbane.y),
]);

/** A metric ascent retains local scale while its viewing distance grows exponentially */
export function travel(
  progress: number,
  earth: { point(lon: number, lat: number): THREE.Vector3; group: THREE.Group },
  eye: THREE.Vector3,
  at: THREE.Vector3,
) {
  if (progress <= 0.55) {
    const t = THREE.MathUtils.clamp(progress / 0.55, 0, 1);
    route.getPoint(t, eye);
    targets.getPoint(t, at);
    return;
  }
  const t = THREE.MathUtils.clamp((progress - 0.55) / 0.45, 0, 1);
  const shift = THREE.MathUtils.smoothstep(t, 0.12, 1);
  const surface = earth.point(
    153.025 + (138 - 153.025) * shift,
    -27.47 + 2.47 * shift,
  );
  const normal = surface.clone().sub(earth.group.position).normalize();
  const direction = new THREE.Vector3(33, 28, 35)
    .normalize()
    .lerp(normal, THREE.MathUtils.smoothstep(t, 0, 0.5))
    .normalize();
  at.copy(surface).add(new THREE.Vector3(0, 1 - t, 0));
  eye
    .copy(at)
    .addScaledVector(
      direction,
      Math.hypot(33, 28, 35) *
        ((earthRadius * 1.65) / Math.hypot(33, 28, 35)) ** t,
    );
}
