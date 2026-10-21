import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { color, float, mix, normalWorld, positionWorld, step } from "three/tsl";
import { MeshStandardNodeMaterial } from "three/webgpu";
import type { Geography } from "./geography";

/** The council mesh supplies real forms; floor bands distinguish glazing from opaque roofs */
export function cityMaterial() {
  const material = new MeshStandardNodeMaterial({
    roughness: 0.48,
    metalness: 0.25,
  });
  const course = positionWorld.y.mul(10).fract();
  const window = step(0.22, course)
    .mul(float(1).sub(step(0.83, course)))
    .mul(float(1).sub(normalWorld.y.abs()));
  material.colorNode = mix(color(0xb0b3aa), color(0x50727c), window);
  material.roughnessNode = mix(float(0.78), float(0.28), window);
  return material;
}

export function deck(road: Geography["roads"][number]) {
  return !road.bridge
    ? 0
    : /Story Bridge/.test(road.name ?? "")
      ? 0.9
      : /Eleanor Schonell|Kurilpa Bridge|Goodwill Bridge/.test(road.name ?? "")
        ? 0.36
        : 0.18;
}

/** Footprints retain their real outlines; near façades carry recessed glazing and masonry depth */
export async function architecture(
  buildings: Geography["buildings"],
  city: boolean,
  locate: (point: [number, number]) => THREE.Vector2,
  elevation: (x: number, z: number) => number,
  signal?: AbortSignal,
) {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({
    color: city ? 0x939d9c : 0xd5c6ad,
    roughness: 0.82,
    vertexColors: true,
  });
  const roof = new THREE.MeshStandardMaterial({
    color: city ? 0x707a7c : 0x9b9a90,
    roughness: 0.86,
    vertexColors: true,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: city ? 0x477381 : 0x344c4e,
    roughness: 0.22,
    metalness: 0.45,
    clearcoat: 1,
    side: THREE.DoubleSide,
  });
  const trim = new THREE.MeshStandardMaterial({
    color: city ? 0x9bafaf : 0xc0b39d,
    roughness: 0.7,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x283332,
    roughness: 0.96,
    side: THREE.DoubleSide,
  });
  const freestone = [0xd7c5ab, 0xc8b7a7, 0xb5a5a7, 0xe5d7bc, 0xb59a89].map(
    (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.92 }),
  );
  const timber = new THREE.MeshStandardMaterial({
    color: 0x806951,
    roughness: 0.8,
  });
  const arches: THREE.BufferGeometry[] = [];
  const walls: THREE.BufferGeometry[] = [],
    roofs: THREE.BufferGeometry[] = [];
  const batches = new Map<THREE.Material, THREE.Matrix4[]>();
  const pose = new THREE.Object3D();
  const block = (
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    yaw = 0,
  ) => {
    pose.position.set(x, y, z);
    pose.scale.set(w, h, d);
    pose.rotation.set(0, yaw, 0);
    pose.updateMatrix();
    const batch = batches.get(material) ?? [];
    batch.push(pose.matrix.clone());
    batches.set(material, batch);
  };
  let panes = 0;
  for (const [index, building] of buildings.entries()) {
    if (index % 40 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      signal?.throwIfAborted();
    }
    const points = building.points.map(locate);
    if (points.length < 4) continue;
    const centre = new THREE.Box2()
      .setFromPoints(points)
      .getCenter(new THREE.Vector2());
    const base = Math.max(0.1, elevation(centre.x, centre.y));
    const h = building.height / 40;
    const close = city
      ? centre.distanceTo(new THREE.Vector2(30, -76)) < 24 ||
        centre.length() < 25
      : centre.length() < 14;
    const outline = new THREE.Shape(
      points.map((p) => new THREE.Vector2(p.x, -p.y)),
    );
    const body = new THREE.ExtrudeGeometry(outline, {
      depth: h,
      bevelEnabled: close,
      bevelSize: 0.006,
      bevelThickness: 0.004,
      bevelSegments: 1,
      steps: 1,
    });
    body.rotateX(-Math.PI / 2);
    body.translate(0, base, 0);
    const heritage = /Forgan|Michie|Steele|Parnell|Goddard|Richards/.test(
      building.name,
    );
    const tint = new THREE.Color(
      city
        ? 0xd0d9d8
        : heritage
          ? 0xf0dbaf
          : /Library|Biosciences|Sciences|Greenwood|Engineering/.test(
                building.name,
              )
            ? 0xc9cdc4
            : 0xd3c8b5,
    );
    for (const section of body.groups) {
      const part = new THREE.BufferGeometry();
      for (const name of ["position", "normal", "uv"]) {
        const attr = body.getAttribute(name);
        part.setAttribute(
          name,
          new THREE.BufferAttribute(
            (attr.array as Float32Array).slice(
              section.start * attr.itemSize,
              (section.start + section.count) * attr.itemSize,
            ),
            attr.itemSize,
          ),
        );
      }
      const colors = new Float32Array(section.count * 3);
      for (let i = 0; i < colors.length; i += 3) {
        colors[i] = tint.r;
        colors[i + 1] = tint.g;
        colors[i + 2] = tint.b;
      }
      part.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      (section.materialIndex === 0 ? roofs : walls).push(part);
    }
    body.dispose();
    if (!close || panes > 12000 || building.name === "Forgan Smith Building")
      continue;
    const floors = Math.max(1, Math.round(building.height / (city ? 4 : 3.5)));
    const floor = h / floors;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i];
      const delta = b.clone().sub(a),
        length = delta.length();
      if (length < 0.12) continue;
      const direction = delta.divideScalar(length),
        normal = new THREE.Vector2(-direction.y, direction.x);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      if (normal.dot(mid.clone().sub(centre)) < 0) normal.negate();
      const yaw = -Math.atan2(direction.y, direction.x);
      const bays = Math.max(1, Math.floor(length / (city ? 0.09 : 0.095)));
      const bay = length / bays;
      if (heritage) {
        const courses = Math.max(2, Math.round(h / 0.045));
        for (let row = 0; row < courses; row++) {
          const count = Math.ceil(length / 0.11);
          for (let tile = 0; tile < count; tile++) {
            const t = Math.min(
              length - 0.025,
              ((tile + 0.5 + (row % 2) * 0.45) * length) / count,
            );
            const p = a
              .clone()
              .addScaledVector(direction, t)
              .addScaledVector(normal, 0.006);
            block(
              freestone[(row * 7 + tile * 3 + index) % freestone.length],
              p.x,
              base + ((row + 0.5) * h) / courses,
              p.y,
              length / count - 0.002,
              h / courses - 0.001,
              0.009,
              yaw,
            );
          }
        }
      }
      // The horizontal ledges and projecting reveals cast real depth, rather than tiled window pixels
      for (let f = 1; f <= floors; f++)
        block(
          trim,
          mid.x + normal.x * 0.007,
          base + f * floor,
          mid.y + normal.y * 0.007,
          length,
          0.012,
          0.025,
          yaw,
        );
      for (let bayIndex = 0; bayIndex < bays; bayIndex++) {
        const p = a
          .clone()
          .addScaledVector(direction, (bayIndex + 0.5) * bay)
          .addScaledVector(normal, 0.007);
        for (let f = 0; f < floors && panes < 12000; f++, panes++) {
          const y = base + floor * (f + 0.54),
            width = bay * (city ? 0.79 : 0.6),
            height = floor * 0.66;
          if (heritage && f === 0) {
            const r = bay * 0.4;
            const opening = new THREE.Shape();
            opening.moveTo(-r, 0);
            opening.lineTo(r, 0);
            opening.lineTo(r, floor * 0.7 - r);
            opening.absarc(0, floor * 0.7 - r, r, 0, Math.PI, false);
            opening.closePath();
            const aperture = new THREE.ShapeGeometry(opening);
            aperture.rotateY(yaw);
            aperture.translate(
              p.x + normal.x * 0.014,
              base + 0.012,
              p.y + normal.y * 0.014,
            );
            arches.push(aperture);
            continue;
          }
          block(dark, p.x, y, p.y, width + 0.014, height + 0.018, 0.012, yaw);
          block(
            glass,
            p.x + normal.x * 0.008,
            y,
            p.y + normal.y * 0.008,
            width,
            height,
            0.006,
            yaw,
          );
          if (
            /Advanced Engineering|Global Change|Molecular Biosciences/.test(
              building.name,
            )
          ) {
            const material = /Advanced Engineering/.test(building.name)
              ? timber
              : trim;
            block(
              material,
              p.x + normal.x * 0.04,
              y,
              p.y + normal.y * 0.04,
              0.016,
              floor * 0.94,
              0.065,
              yaw + 0.25,
            );
          }
          block(
            trim,
            p.x + normal.x * 0.012,
            y - height / 2,
            p.y + normal.y * 0.012,
            width + 0.02,
            0.008,
            0.033,
            yaw,
          );
          block(
            trim,
            p.x + normal.x * 0.012,
            y,
            p.y + normal.y * 0.012,
            0.004,
            height,
            0.018,
            yaw,
          );
        }
      }
    }
    // Roof services are separate from parapets, with a restrained variation in real building scale
    if (building.height > 10) {
      block(roof, centre.x, base + h + 0.025, centre.y, 0.16, 0.05, 0.12);
    }
  }
  for (const [parts, material] of [
    [walls, stone],
    [roofs, roof],
    [arches, dark],
  ] as const) {
    if (!parts.length) continue;
    const geometry = mergeGeometries(parts);
    for (const part of parts) part.dispose();
    if (!geometry) throw new Error("Architecture could not be assembled");
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
  }
  for (const [material, matrices] of batches) {
    const mesh = new THREE.InstancedMesh(
      material === glass || material === dark
        ? new THREE.PlaneGeometry(1, 1)
        : new THREE.BoxGeometry(1, 1, 1),
      material,
      matrices.length,
    );
    matrices.forEach((matrix, i) => {
      mesh.setMatrixAt(i, matrix);
    });
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
  }
  return { group, stone, trim, glass };
}

/** Photo-informed Forgan Smith detailing and structural silhouettes on mapped bridges */
export function landmarks(
  roads: Geography["roads"],
  locate: (point: [number, number]) => THREE.Vector2,
  heightAt: (x: number, z: number) => number,
  stone: THREE.MeshStandardMaterial,
  campus = true,
) {
  const group = new THREE.Group();
  const glass = new THREE.MeshStandardMaterial({
    color: 0x263c3f,
    roughness: 0.3,
    metalness: 0.45,
  });
  const concrete = new THREE.MeshStandardMaterial({
    color: 0xaaa99d,
    roughness: 0.8,
  });
  const steel = new THREE.MeshStandardMaterial({
    color: 0xa1b6b3,
    metalness: 0.65,
    roughness: 0.4,
  });
  const parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const pose = new THREE.Object3D();
  const add = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    yaw = 0,
  ) => {
    geometry.rotateY(yaw);
    geometry.translate(x, y, z);
    const batch = parts.get(material) ?? [];
    batch.push(geometry);
    parts.set(material, batch);
  };
  const block = (
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    yaw = 0,
  ) => add(new THREE.BoxGeometry(w, h, d), material, x, y, z, yaw);
  const beam = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    radius: number,
    material: THREE.Material,
  ) => {
    const geometry = new THREE.CylinderGeometry(
      radius,
      radius,
      a.distanceTo(b),
      6,
    );
    pose.position.copy(a).add(b).multiplyScalar(0.5);
    pose.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      b.clone().sub(a).normalize(),
    );
    pose.updateMatrix();
    geometry.applyMatrix4(pose.matrix);
    const batch = parts.get(material) ?? [];
    batch.push(geometry);
    parts.set(material, batch);
  };
  if (campus) {
    const a = locate([153.0119796, -27.4973221]),
      b = locate([153.0142696, -27.4967514]);
    const axis = b.clone().sub(a),
      length = axis.length(),
      yaw = -Math.atan2(axis.y, axis.x);
    axis.normalize();
    const normal = new THREE.Vector2(-axis.y, axis.x);
    const bays = 40,
      bay = length / bays;
    for (let i = 0; i <= bays; i++) {
      const p = a
        .clone()
        .addScaledVector(axis, bay * i)
        .addScaledVector(normal, 0.014);
      const base = heightAt(p.x, p.y);
      block(stone, p.x, base + 0.085, p.y, 0.037, 0.17, 0.052, yaw);
      block(stone, p.x, base + 0.012, p.y, 0.06, 0.024, 0.075, yaw);
      if (i === bays) continue;
      p.addScaledVector(axis, bay / 2);
      const shape = new THREE.Shape();
      const r = (bay - 0.035) / 2;
      shape.moveTo(-bay / 2, 0.27);
      shape.lineTo(bay / 2, 0.27);
      shape.lineTo(bay / 2, 0.15);
      shape.lineTo(r, 0.15);
      shape.absarc(0, 0.15, r, 0, Math.PI, false);
      shape.lineTo(-bay / 2, 0.15);
      shape.closePath();
      add(
        new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false }),
        stone,
        p.x,
        base,
        p.y,
        yaw,
      );
      block(
        glass,
        p.x - normal.x * 0.007,
        base + 0.095,
        p.y - normal.y * 0.007,
        bay - 0.025,
        0.19,
        0.01,
        yaw,
      );
      block(glass, p.x, base + 0.32, p.y, bay * 0.35, 0.095, 0.018, yaw);
    }
    const centre = a.clone().add(b).multiplyScalar(0.5);
    const base = heightAt(centre.x, centre.y);
    for (const y of [0.275, 0.38, 0.4])
      block(
        stone,
        centre.x,
        base + y,
        centre.y,
        length + 0.06,
        0.014,
        0.075,
        yaw,
      );
    const tower = locate([153.013025, -27.49696]);
    const towerBase = heightAt(tower.x, tower.y);
    block(stone, tower.x, towerBase + 0.52, tower.y, 0.49, 1.04, 0.47, yaw);
    block(stone, tower.x, towerBase + 1.045, tower.y, 0.53, 0.035, 0.51, yaw);
    for (const side of [-1, 1])
      for (const offset of [-0.12, 0, 0.12]) {
        const p = tower
          .clone()
          .addScaledVector(axis, offset)
          .addScaledVector(normal, side * 0.24);
        block(glass, p.x, towerBase + 0.64, p.y, 0.035, 0.59, 0.013, yaw);
        for (const y of [0.4, 0.55, 0.7, 0.85])
          block(stone, p.x, towerBase + y, p.y, 0.047, 0.012, 0.027, yaw);
      }
  }
  for (const road of roads) {
    const name = road.name ?? "";
    if (
      !road.bridge ||
      !/Story Bridge|Eleanor Schonell|Kurilpa Bridge|Goodwill Bridge/.test(name)
    )
      continue;
    const points = road.points.map(locate);
    const from = points[0],
      to = points.at(-1);
    if (!from || !to || from.distanceTo(to) < 1.5) continue;
    const direction = to.clone().sub(from).normalize(),
      across = new THREE.Vector2(-direction.y, direction.x);
    const truss = /Story Bridge/.test(name);
    const level = deck(road);
    for (let i = 1; i < points.length; i++) {
      const p = points[i - 1],
        q = points[i];
      beam(
        new THREE.Vector3(p.x, level, p.y),
        new THREE.Vector3(q.x, level, q.y),
        truss ? 0.12 : 0.07,
        concrete,
      );
    }
    const count = truss ? 12 : 6;
    for (let i = 0; i < count; i++) {
      const p = from.clone().lerp(to, i / count),
        q = from.clone().lerp(to, (i + 1) / count);
      for (const side of [-1, 1]) {
        const start = new THREE.Vector3(
          p.x + across.x * 0.18 * side,
          level,
          p.y + across.y * 0.18 * side,
        );
        const end = new THREE.Vector3(
          q.x + across.x * 0.18 * side,
          level,
          q.y + across.y * 0.18 * side,
        );
        if (truss) {
          const high = start
            .clone()
            .add(new THREE.Vector3(0, i > 2 && i < 9 ? 0.75 : 0.45, 0));
          beam(start, high, 0.025, steel);
          beam(high, end, 0.024, steel);
          beam(high, high.clone().add(end.clone().sub(start)), 0.025, steel);
        } else if (i === 2 || i === 4) {
          const high = start.clone().add(new THREE.Vector3(0, 0.75, 0));
          beam(start, high, 0.035, concrete);
          for (const t of [-0.18, 0.18]) {
            const anchor = from
              .clone()
              .lerp(to, Math.min(1, Math.max(0, i / count + t)));
            beam(
              high,
              new THREE.Vector3(anchor.x, level, anchor.y),
              0.006,
              steel,
            );
          }
        }
      }
    }
  }
  for (const [material, geometries] of parts) {
    const normalized = geometries.map((geometry) =>
      geometry.index ? geometry.toNonIndexed() : geometry,
    );
    const merged = mergeGeometries(normalized);
    for (const geometry of new Set([...geometries, ...normalized]))
      geometry.dispose();
    if (!merged) throw new Error("Landmark geometry could not be assembled");
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}
