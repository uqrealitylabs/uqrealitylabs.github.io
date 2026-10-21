import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  type Conditions,
  parseSnapshot,
  parseWeather,
  type Snapshot,
  weatherUrl,
} from "./feeds";
import { locate } from "./geography";

/** Live snapshots stay fixed at their reported positions rather than inventing trajectories */
export function liveWorld(host: HTMLElement, wake: () => void) {
  const group = new THREE.Group();
  const makeFleet = (aircraft: boolean) => {
    const pieces: THREE.BufferGeometry[] = [];
    for (const [w, h, d, y, z] of aircraft
      ? [
          [0.04, 0.04, 0.45, 0, 0],
          [0.42, 0.012, 0.07, 0, 0],
          [0.14, 0.018, 0.05, 0.025, -0.16],
          [0.01, 0.09, 0.06, 0.04, -0.16],
        ]
      : [
          [0.16, 0.04, 0.42, 0.02, 0],
          [0.12, 0.075, 0.24, 0.075, 0.02],
        ]) {
      pieces.push(new THREE.BoxGeometry(w, h, d).translate(0, y, z));
    }
    const geometry = mergeGeometries(pieces)!;
    for (const piece of pieces) piece.dispose();
    const mesh = new THREE.InstancedMesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: aircraft ? 0xf5e1bd : 0x64badd,
        roughness: 0.5,
        emissive: aircraft ? 0x69523b : 0x164662,
        emissiveIntensity: 0.25,
      }),
      300,
    );
    mesh.count = 0;
    mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  };
  const aircraft = makeFleet(true),
    ferries = makeFleet(false),
    vessels = makeFleet(false);
  vessels.geometry.scale(1.8, 1.5, 2.5);
  const rain = new THREE.Points(
    new THREE.BufferGeometry(),
    new THREE.PointsMaterial({
      color: 0xc7d9df,
      size: 0.018,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    }),
  );
  const drops = new Float32Array(220 * 3);
  for (let i = 0; i < drops.length; i++)
    drops[i] = THREE.MathUtils.seededRandom(i + 2) * 8 - 4;
  rain.geometry.setAttribute("position", new THREE.BufferAttribute(drops, 3));
  rain.visible = false;
  group.add(rain);
  const pose = new THREE.Object3D();
  const weatherText = host
    .closest(".world")
    ?.querySelector<HTMLElement>("#world-weather");
  const trafficText = host
    .closest(".world")
    ?.querySelector<HTMLElement>("#world-traffic");
  let weather: Conditions[] = [],
    weatherDue = 0;
  let active = false,
    disposed = false,
    request: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let liveFerries = false;
  const place = (mesh: THREE.InstancedMesh, snapshot: Snapshot) => {
    const fresh = snapshot.vehicles.filter(
      (v) => Date.now() / 1000 - v.updated < 600,
    );
    mesh.count = fresh.length;
    fresh.forEach((v, i) => {
      const p = locate([v.longitude, v.latitude]);
      pose.position.set(p.x, v.altitude / 40 + 0.1, p.y);
      pose.rotation.set(0, Math.PI - (v.bearing * Math.PI) / 180, 0);
      pose.updateMatrix();
      mesh.setMatrixAt(i, pose.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  const json = async (url: string, signal: AbortSignal) => {
    const response = await fetch(url, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
    });
    if (!response.ok) throw new Error(`World feed: ${response.status}`);
    const text = await response.text();
    if (text.length > 1_000_000) throw new Error("World feed exceeds budget");
    return JSON.parse(text);
  };
  const refresh = async () => {
    if (!active || disposed) return;
    request = new AbortController();
    const { signal } = request;
    await Promise.all([
      (async () => {
        if (Date.now() < weatherDue) return;
        try {
          weather = parseWeather(await json(weatherUrl, signal));
          weatherDue = Date.now() + 900_000;
        } catch (error) {
          if (signal.aborted) return;
          weatherDue = Date.now() + 120_000;
          if (weatherText) {
            weatherText.hidden = false;
            weatherText.textContent = "Local weather unavailable";
          }
          console.warn("Local weather unavailable", error);
        }
      })(),
      (async () => {
        try {
          const data = await json("/api/world/traffic", signal);
          if (signal.aborted || disposed) return;
          const labels: string[] = [];
          for (const [name, mesh] of [
            ["aircraft", aircraft],
            ["ferries", ferries],
            ["ships", vessels],
          ] as const) {
            const feed = data[name];
            if (feed?.status !== "live" && feed?.status !== "stale") {
              mesh.count = 0;
              labels.push(`${name} unavailable`);
              continue;
            }
            const snapshot = parseSnapshot(feed);
            if (Date.now() / 1000 - snapshot.updated > 900) {
              mesh.count = 0;
              labels.push(`${name} unavailable`);
              continue;
            }
            place(mesh, snapshot);
            labels.push(
              `${mesh.count} ${name} · ${feed.status === "stale" ? "delayed · " : ""}${new Date(snapshot.updated * 1000).toLocaleTimeString("en-AU", { timeZone: "Australia/Brisbane", hour: "2-digit", minute: "2-digit" })} AEST`,
            );
          }
          liveFerries = ferries.count > 0;
          if (trafficText) {
            trafficText.hidden = false;
            trafficText.textContent = labels.join(" / ");
          }
        } catch (error) {
          if (signal.aborted) return;
          aircraft.count = ferries.count = vessels.count = 0;
          liveFerries = false;
          if (trafficText) {
            trafficText.hidden = false;
            trafficText.textContent =
              "Live traffic unavailable · route animation only";
          }
          console.warn("Live traffic unavailable", error);
        }
      })(),
    ]);
    if (!active || disposed || signal.aborted) return;
    wake();
    timer = setTimeout(() => void refresh(), 60_000);
  };
  return {
    group,
    get liveFerries() {
      return liveFerries;
    },
    conditions(progress: number) {
      return weather[progress > 0.28 ? 1 : 0];
    },
    setActive(value: boolean) {
      if (active === value || disposed) return;
      active = value;
      clearTimeout(timer);
      request?.abort();
      if (active) void refresh();
    },
    update(
      progress: number,
      paused: boolean,
      elapsed: number,
      focus: THREE.Vector3,
    ) {
      group.visible = progress < 0.64;
      const conditions = weather[progress > 0.28 ? 1 : 0];
      if (weatherText && conditions) {
        const text = `${conditions.name} · ${Math.round(conditions.temperature)}°C · ${conditions.rain > 0 ? "rain" : conditions.cloud > 65 ? "overcast" : conditions.cloud > 25 ? "partly cloudy" : "clear"} · ${Math.round(conditions.wind)} km/h`;
        if (weatherText.textContent !== text) {
          weatherText.hidden = false;
          weatherText.textContent = text;
          weatherText.title = `Open-Meteo · ${new Date(conditions.updated * 1000).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })} AEST`;
        }
      }
      rain.visible = Boolean(
        conditions && conditions.rain > 0 && progress < 0.55,
      );
      if (!rain.visible || !conditions) return false;
      rain.position.copy(focus);
      if (!paused) {
        const vertices = rain.geometry.getAttribute("position");
        const speed = 2 + Math.min(conditions.rain, 5);
        const direction = (conditions.direction * Math.PI) / 180;
        const drift = elapsed * conditions.wind * 0.015;
        for (let i = 0; i < vertices.count; i++) {
          const seed = THREE.MathUtils.seededRandom(i + 1);
          vertices.setXYZ(
            i,
            ((((seed * 73 - Math.sin(direction) * drift) % 8) + 8) % 8) - 4,
            (((seed * 89 - elapsed * speed) % 6) + 6) % 6,
            ((((seed * 127 + Math.cos(direction) * drift) % 8) + 8) % 8) - 4,
          );
        }
        vertices.needsUpdate = true;
      }
      return !paused;
    },
    dispose() {
      disposed = true;
      active = false;
      clearTimeout(timer);
      request?.abort();
    },
  };
}
