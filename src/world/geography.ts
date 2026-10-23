import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  dot,
  texture as nodeTexture,
  normalWorld,
  smoothstep,
  uniform,
} from "three/tsl";
import { MeshStandardNodeMaterial } from "three/webgpu";
import { architecture, deck } from "./architecture";

type Point = [number, number];
export function isCoordinate(value: unknown): value is Point {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every(Number.isFinite) &&
    Math.abs(value[0]) <= 180 &&
    Math.abs(value[1]) <= 90
  );
}
export type Geography = {
  buildings: { name: string; height: number; points: Point[] }[];
  areas: { name: string; kind: string; points: Point[] }[];
  roads: {
    name?: string;
    kind: string;
    width?: number;
    bridge?: boolean;
    points: Point[];
  }[];
  trees?: { point: Point; species: string }[];
  lamps?: Point[];
  rivers: Point[][];
};

/** One unit represents forty metres around the Great Court */
export function locate([longitude, latitude]: Point) {
  return new THREE.Vector2(
    (longitude - 153.01302) * 2469,
    -(latitude + 27.4974) * 2783,
  );
}

export function parseGeography(value: unknown): Geography {
  if (!value || typeof value !== "object")
    throw new Error("Invalid geographic source");
  const data = value as Geography;
  for (const key of ["buildings", "areas", "roads", "rivers"] as const)
    if (
      !Array.isArray(data[key]) ||
      data[key].length >
        (key === "roads" ? 20000 : key === "buildings" ? 8000 : 5000)
    )
      throw new Error(`Invalid geographic ${key}`);
  for (const item of [...data.buildings, ...data.areas, ...data.roads]) {
    if (
      !item ||
      typeof item !== "object" ||
      !Array.isArray(item.points) ||
      item.points.length > 12000
    )
      throw new Error("Invalid map outline");
    for (const point of item.points)
      if (!isCoordinate(point)) throw new Error("Invalid map coordinate");
  }
  for (const building of data.buildings)
    if (
      !Number.isFinite(building.height) ||
      building.height <= 0 ||
      building.height > 400 ||
      typeof building.name !== "string"
    )
      throw new Error("Invalid building record");
  for (const river of data.rivers) {
    if (
      !Array.isArray(river) ||
      river.length > 12000 ||
      river.some((p) => !isCoordinate(p))
    )
      throw new Error("Invalid river geometry");
  }
  for (const road of data.roads)
    if (
      typeof road.kind !== "string" ||
      (road.width !== undefined &&
        (!Number.isFinite(road.width) ||
          road.width <= 0 ||
          road.width > 100)) ||
      (road.bridge !== undefined && typeof road.bridge !== "boolean")
    )
      throw new Error("Invalid road record");
  if (
    data.trees !== undefined &&
    (!Array.isArray(data.trees) ||
      data.trees.length > 10000 ||
      data.trees.some(
        (t) => !t || !isCoordinate(t.point) || typeof t.species !== "string",
      ))
  )
    throw new Error("Invalid tree record");
  if (
    data.lamps !== undefined &&
    (!Array.isArray(data.lamps) ||
      data.lamps.length > 10000 ||
      !data.lamps.every(isCoordinate))
  )
    throw new Error("Invalid lamp record");
  return data;
}

function shape(points: Point[], project = locate) {
  return new THREE.Shape(
    points.map((point) => {
      const p = project(point);
      return new THREE.Vector2(p.x, -p.y);
    }),
  );
}

/** Geometry is batched by material while paths follow the actual elevation field */
export async function makeGeography(
  data: Geography,
  city: boolean,
  elevation: (x: number, z: number) => number = () => 0,
  signal?: AbortSignal,
  project = locate,
) {
  const built = await architecture(
    data.buildings,
    city,
    project,
    elevation,
    signal,
  );
  const group = built.group;
  const green = new THREE.MeshStandardMaterial({
    color: 0x52684d,
    roughness: 0.95,
  });
  const water = new THREE.MeshStandardMaterial({
    color: 0x355c62,
    metalness: 0.45,
    roughness: 0.26,
  });
  const landAreas: THREE.BufferGeometry[] = [],
    waterAreas: THREE.BufferGeometry[] = [];
  for (const area of data.areas) {
    if (area.points.length < 4) continue;
    const geometry = new THREE.ShapeGeometry(shape(area.points, project));
    geometry.rotateX(-Math.PI / 2);
    const vertices = geometry.getAttribute("position");
    for (let i = 0; i < vertices.count; i++)
      vertices.setY(
        i,
        area.kind === "water"
          ? 0.09
          : elevation(vertices.getX(i), vertices.getZ(i)) + 0.012,
      );
    geometry.computeVertexNormals();
    (area.kind === "water" ? waterAreas : landAreas).push(geometry);
  }
  for (const [parts, material] of [
    [landAreas, green],
    [waterAreas, water],
  ] as const) {
    if (!parts.length) {
      material.dispose();
      continue;
    }
    const merged = mergeGeometries(parts);
    for (const part of parts) part.dispose();
    if (!merged) throw new Error("Map surfaces could not be assembled");
    const surface = new THREE.Mesh(merged, material);
    surface.receiveShadow = true;
    group.add(surface);
  }
  const paths: number[] = [],
    roads: number[] = [];
  for (const [index, road] of data.roads.entries()) {
    if (index % 400 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      signal?.throwIfAborted();
    }
    const footpath = [
      "footway",
      "path",
      "pedestrian",
      "cycleway",
      "steps",
    ].includes(road.kind);
    const buffer = footpath ? paths : roads;
    const width =
      Math.min(16, Math.max(1, road.width ?? (footpath ? 2 : 10))) / 80;
    for (let i = 1; i < road.points.length; i++) {
      const a = project(road.points[i - 1]),
        b = project(road.points[i]),
        d = b.clone().sub(a);
      if (d.lengthSq() < 0.000001) continue;
      const n = new THREE.Vector2(-d.y, d.x).normalize().multiplyScalar(width);
      const ay =
        (road.bridge
          ? Math.max(deck(road), elevation(a.x, a.y))
          : elevation(a.x, a.y)) + 0.02;
      const by =
        (road.bridge
          ? Math.max(deck(road), elevation(b.x, b.y))
          : elevation(b.x, b.y)) + 0.02;
      const points = [
        [a.x + n.x, ay, a.y + n.y],
        [a.x - n.x, ay, a.y - n.y],
        [b.x + n.x, by, b.y + n.y],
        [b.x - n.x, by, b.y - n.y],
      ];
      for (const j of [0, 1, 2, 2, 1, 3]) buffer.push(...points[j]);
    }
  }
  for (const [vertices, color] of [
    [paths, 0xc0b7a2],
    [roads, 0x48504b],
  ] as const) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.94,
        side: THREE.DoubleSide,
      }),
    );
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return { ...built, group };
}

/** The supplied centreline defines the river, with an interpretive constant width */
export function makeRiver(points: Point[]) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => {
      const point = locate(p);
      return new THREE.Vector3(point.x, 0, point.y);
    }),
  );
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const count = Math.max(100, points.length * 4);
  for (let i = 0; i <= count; i++) {
    const p = curve.getPoint(i / count),
      t = curve.getTangent(i / count);
    const across = new THREE.Vector3(-t.z, 0, t.x)
      .normalize()
      .multiplyScalar(2.5);
    vertices.push(
      p.x - across.x,
      0.065,
      p.z - across.z,
      p.x + across.x,
      0.065,
      p.z + across.z,
    );
    uvs.push(0, i / 8, 1, i / 8);
    if (i < count) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const river = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0x3b666c,
      metalness: 0.58,
      roughness: 0.23,
      side: THREE.DoubleSide,
    }),
  );
  river.receiveShadow = true;
  return river;
}

export const earthRadius = 6_371_000 / 40;

export function earthPosition(
  longitude: number,
  latitude: number,
  radius = earthRadius,
) {
  const lat = THREE.MathUtils.degToRad(latitude),
    lon = THREE.MathUtils.degToRad(longitude);
  return new THREE.Vector3(
    Math.cos(lat) * Math.sin(lon) * radius,
    Math.sin(lat) * radius,
    Math.cos(lat) * Math.cos(lon) * radius,
  );
}

/** The local city and planet share metric scale and a tangent at Brisbane */
export function makeEarth() {
  const group = new THREE.Group(),
    brisbane = locate([153.025, -27.47]);
  const orientation = new THREE.Quaternion().setFromUnitVectors(
    earthPosition(153.025, -27.47, 1),
    new THREE.Vector3(0, 1, 0),
  );
  const lat = THREE.MathUtils.degToRad(-27.47),
    lon = THREE.MathUtils.degToRad(153.025);
  const north = new THREE.Vector3(
    -Math.sin(lat) * Math.sin(lon),
    Math.cos(lat),
    -Math.sin(lat) * Math.cos(lon),
  ).applyQuaternion(orientation);
  orientation.premultiply(
    new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      Math.atan2(north.x, -north.z),
    ),
  );
  const material = new MeshStandardNodeMaterial({
    color: 0xffffff,
    roughness: 1,
    metalness: 0,
  });
  const darkness = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  darkness.needsUpdate = true;
  const night = nodeTexture(darkness);
  const sun = uniform(new THREE.Vector3(0, 1, 0));
  const daylight = smoothstep(-0.08, 0.12, dot(normalWorld, sun));
  material.emissiveNode = night.rgb.mul(daylight.oneMinus()).mul(2);
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius, 192, 128),
    material,
  );
  globe.rotation.y = -Math.PI / 2;
  group.add(globe);
  group.quaternion.copy(orientation);
  group.position.set(brisbane.x, -earthRadius, brisbane.y);
  group.visible = false;
  const point = (longitude: number, latitude: number) =>
    earthPosition(longitude, latitude)
      .applyQuaternion(orientation)
      .add(group.position);
  return { group, material, point, night, sun, maps: [darkness] };
}
