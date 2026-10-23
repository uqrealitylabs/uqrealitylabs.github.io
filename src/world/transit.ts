import * as THREE from "three";
import { deck } from "./architecture";
import { type Geography, isCoordinate, locate } from "./geography";

type Route = {
  name: string;
  kind: "bus" | "metro" | "ferry";
  points: [number, number][];
};
export function parseTransit(value: unknown): { routes: Route[] } {
  const data = value as { routes?: Route[] } | null;
  if (
    !data ||
    !Array.isArray(data.routes) ||
    data.routes.length > 20 ||
    data.routes.some(
      (route) =>
        !route ||
        typeof route.name !== "string" ||
        route.name.length > 80 ||
        !["bus", "metro", "ferry"].includes(route.kind) ||
        !Array.isArray(route.points) ||
        route.points.length < 2 ||
        route.points.length > 5000 ||
        !route.points.every(isCoordinate),
    )
  )
    throw new Error("Invalid transit routes");
  return data as { routes: Route[] };
}

/** Vehicles follow published route shapes during camera travel, not live positions */
export function makeTransit(
  data: ReturnType<typeof parseTransit>,
  heightAt: (x: number, z: number) => number,
  roads: Geography["roads"],
) {
  const group = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({
    color: 0xe7e8dd,
    roughness: 0.65,
  });
  const blue = new THREE.MeshStandardMaterial({
    color: 0x1569a1,
    roughness: 0.4,
    metalness: 0.25,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x182f38,
    metalness: 0.5,
    roughness: 0.25,
  });
  const tyre = new THREE.MeshStandardMaterial({
    color: 0x25282a,
    roughness: 0.95,
  });
  const add = (
    parent: THREE.Group,
    material: THREE.Material,
    size: number[],
    position: number[],
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(...(size as [number, number, number])),
      material,
    );
    mesh.position.fromArray(position);
    mesh.castShadow = true;
    parent.add(mesh);
  };
  const vehicles: {
    object: THREE.Group;
    curve: THREE.CatmullRomCurve3;
    offset: number;
  }[] = [];
  const bridges = roads
    .filter((road) => road.bridge)
    .flatMap((road) =>
      road.points.slice(1).map((point, i) => ({
        a: locate(road.points[i]),
        b: locate(point),
        level: deck(road),
      })),
    );
  const roadHeight = (point: THREE.Vector2) => {
    let height = heightAt(point.x, point.y);
    for (const { a, b, level } of bridges) {
      const dx = b.x - a.x,
        dz = b.y - a.y,
        length = dx * dx + dz * dz;
      const t = length
        ? Math.min(
            1,
            Math.max(0, ((point.x - a.x) * dx + (point.y - a.y) * dz) / length),
          )
        : 0;
      if (
        (point.x - a.x - dx * t) ** 2 + (point.y - a.y - dz * t) ** 2 <
        0.35 ** 2
      )
        height = Math.max(height, level);
    }
    return height + 0.035;
  };
  for (const [index, route] of data.routes.entries()) {
    const points = route.points
      .map(locate)
      .filter((p) => p.x > -120 && p.x < 100 && p.y > -160 && p.y < 35);
    if (points.length < 2) continue;
    const curve = new THREE.CatmullRomCurve3(
      points.map(
        (p) =>
          new THREE.Vector3(
            p.x,
            route.kind === "ferry" ? 0.11 : roadHeight(p),
            p.y,
          ),
      ),
      false,
      "centripetal",
    );
    for (let i = 0; i < 3; i++) {
      const vehicle = new THREE.Group();
      if (route.kind === "ferry") {
        for (const x of [-0.065, 0.065])
          add(vehicle, blue, [0.055, 0.045, 0.5], [x, 0.015, 0]);
        add(vehicle, white, [0.18, 0.04, 0.38], [0, 0.055, 0]);
        add(vehicle, glass, [0.14, 0.065, 0.22], [0, 0.1, 0.015]);
        add(vehicle, white, [0.17, 0.025, 0.26], [0, 0.145, 0.015]);
        add(vehicle, blue, [0.025, 0.07, 0.025], [0, 0.18, -0.045]);
      } else {
        const metro = route.kind === "metro";
        const length = metro ? 0.59 : 0.31;
        add(
          vehicle,
          metro ? blue : white,
          [0.065, 0.065, length],
          [0, 0.046, 0],
        );
        add(vehicle, glass, [0.068, 0.035, length * 0.88], [0, 0.064, 0]);
        add(vehicle, white, [0.068, 0.012, length * 0.95], [0, 0.088, 0]);
        for (const z of metro ? [-0.19, 0, 0.19] : [-0.09, 0.09]) {
          if (metro && z === 0)
            add(vehicle, tyre, [0.07, 0.062, 0.023], [0, 0.052, -0.02]);
          for (const x of [-0.036, 0.036]) {
            const wheel = new THREE.Mesh(
              new THREE.CylinderGeometry(0.014, 0.014, 0.012, 10),
              tyre,
            );
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x, 0.02, z);
            vehicle.add(wheel);
          }
        }
      }
      vehicle.userData.route = route.name;
      group.add(vehicle);
      vehicles.push({
        object: vehicle,
        curve,
        offset: (index * 0.13 + i / 3) % 1,
      });
    }
  }
  const update = (progress: number) => {
    for (const { object, curve, offset } of vehicles) {
      const t = (offset + progress * 0.3) % 1;
      object.position.copy(curve.getPoint(t));
      const tangent = curve.getTangent(t);
      object.rotation.y = Math.atan2(tangent.x, tangent.z);
    }
  };
  update(0);
  return { group, update };
}
