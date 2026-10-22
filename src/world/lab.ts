import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { cityMaterial, landmarks } from "./architecture";
import { spacecraft } from "./craft";
import {
  locate,
  makeEarth,
  makeGeography,
  makeRiver,
  parseGeography,
} from "./geography";
import { loadModel, modelReader, plantTrees, release } from "./models";
import { parseElevation, terrain } from "./terrain";
import { makeTransit, parseTransit } from "./transit";

export type Station =
  | "home"
  | "projects"
  | "events"
  | "team"
  | "about"
  | "sponsors";
export const viewpoints: Record<Station, { eye: number[]; at: number[] }> = {
  home: { eye: [1.25, 1.55, 2.8], at: [0, 0.7, -0.6] },
  projects: { eye: [2.8, 2.3, 3.7], at: [0, 1.8, 0] },
  events: { eye: [-7, 4, 7], at: [-0.5, 0.4, -0.5] },
  team: { eye: [5.5, 4, 5], at: [1.1, 2, 0] },
  about: { eye: [1.5, 2.3, 4], at: [-0.4, 0.7, -1.2] },
  sponsors: { eye: [-6, 5, 5], at: [0, 2.5, 0] },
};
export function isStation(value: string): value is Station {
  return Object.hasOwn(viewpoints, value);
}

export async function loadWorld(signal?: AbortSignal) {
  const [values, surface] = await Promise.all([
    Promise.all(
      ["campus", "elevation", "transit"].map(async (name) => {
        const response = await fetch(`/assets/world/${name}.json`, { signal });
        if (!response.ok) throw new Error(`World data: ${response.status}`);
        const source = await response.text();
        if (source.length > 8_000_000)
          throw new Error("World source exceeds its budget");
        return JSON.parse(source);
      }),
    ),
    fetch("/assets/world/terrain.bin", { signal }).then(async (response) => {
      if (!response.ok) throw new Error("Baked terrain unavailable");
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== 181 * 181 * 6 * 4)
        throw new Error("Invalid baked terrain size");
      const values = new Float32Array(bytes);
      if (!values.every(Number.isFinite))
        throw new Error("Invalid baked terrain coordinates");
      return values;
    }),
  ]);
  return {
    surface,
    campus: parseGeography(values[0]),
    city: parseGeography({ buildings: [], areas: [], roads: [], rivers: [] }),
    elevation: parseElevation(values[1]),
    transit: parseTransit(values[2]),
  };
}

/** Mapped campus, open LiDAR city geometry and an imagined UQRL spacecraft */
export async function makeLab(
  data: Omit<Awaited<ReturnType<typeof loadWorld>>, "surface"> & {
    surface?: Float32Array;
  },
  signal?: AbortSignal,
) {
  const group = new THREE.Group();
  try {
    const landscape = new THREE.Group();
    group.add(landscape);
    const rooms = new Map<Station, THREE.Group>();
    const photos: THREE.Mesh<
      THREE.PlaneGeometry,
      THREE.MeshStandardMaterial
    >[] = [];
    const maps: THREE.Texture[] = [];
    const stone = new THREE.MeshStandardMaterial({
      color: 0x5c6b53,
      roughness: 0.96,
      metalness: 0.02,
    });
    const silver = new THREE.MeshStandardMaterial({
      color: 0xcbd5d0,
      metalness: 0.85,
      roughness: 0.19,
    });
    const mesh = <G extends THREE.BufferGeometry, M extends THREE.Material>(
      parent: THREE.Object3D,
      geometry: G,
      material: M,
      x = 0,
      y = 0,
      z = 0,
    ) => {
      const node = new THREE.Mesh(geometry, material);
      node.position.set(x, y, z);
      node.castShadow = true;
      node.receiveShadow = true;
      parent.add(node);
      return node;
    };
    const field = terrain(data.elevation, [
      ...data.campus.rivers,
      ...data.city.rivers,
    ]);
    const ground = new THREE.PlaneGeometry(360, 360, 180, 180);
    ground.rotateX(-Math.PI / 2);
    ground.translate(0, 0, -75);
    if (data.surface) {
      const count = 181 * 181 * 3;
      ground.setAttribute(
        "position",
        new THREE.BufferAttribute(data.surface.subarray(0, count), 3),
      );
      ground.setAttribute(
        "color",
        new THREE.BufferAttribute(data.surface.subarray(count), 3),
      );
    } else {
      const vertices = ground.getAttribute("position");
      const colors = new Float32Array(vertices.count * 3),
        shade = new THREE.Color();
      for (let i = 0; i < vertices.count; i++) {
        if (i % 2000 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          signal?.throwIfAborted();
        }
        const x = vertices.getX(i),
          z = vertices.getZ(i),
          h = field.heightAt(x, z);
        vertices.setY(i, h);
        shade.setHSL(
          0.26 + Math.min(h / 40, 0.04),
          0.25,
          0.19 + Math.sin(x * 0.035 + z * 0.02) * 0.025,
        );
        colors.set([shade.r, shade.g, shade.b], i * 3);
      }
      ground.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    }
    ground.computeVertexNormals();
    stone.color.set(0xffffff);
    stone.vertexColors = true;
    mesh(landscape, ground, stone);
    let council: THREE.Group | undefined;
    const treeModels: (THREE.Group | undefined)[] = [];
    const pending = new AbortController();
    const detailSignal = signal
      ? AbortSignal.any([signal, pending.signal])
      : pending.signal;
    const nearBuildings = data.campus.buildings.filter((b) =>
      b.points.some((p) => locate(p).lengthSq() < 144),
    );
    const architecture = await makeGeography(
        { ...data.campus, buildings: nearBuildings },
        false,
        field.heightAt,
        signal,
      ),
      city = await makeGeography(data.city, true, field.heightAt, signal);
    landscape.add(architecture.group, city.group);
    for (const river of [...data.campus.rivers, ...data.city.rivers])
      if (river.length > 2) landscape.add(makeRiver(river));

    const heritage = landmarks(
      [...data.campus.roads, ...data.city.roads],
      locate,
      field.heightAt,
      architecture.stone,
    );
    landscape.add(heritage);
    const transit = makeTransit(data.transit, field.heightAt, [
      ...data.campus.roads,
      ...data.city.roads,
    ]);
    landscape.add(transit.group);
    const pathLights = data.campus.roads
      .filter((road) =>
        ["footway", "path", "pedestrian", "steps"].includes(road.kind),
      )
      .flatMap((road) => road.points.filter((_, index) => index % 4 === 0))
      .map(locate)
      .filter((point) => point.lengthSq() < 225)
      .slice(0, 240);
    const lampPositions = [
      ...(data.campus.lamps ?? []),
      ...(data.city.lamps ?? []),
    ]
      .map(locate)
      .concat(pathLights)
      .slice(0, 5000);
    const lighting = new THREE.Group();
    const lampMetal = new THREE.MeshStandardMaterial({
      color: 0x4d5554,
      metalness: 0.5,
      roughness: 0.6,
    });
    const lampGlow = new THREE.MeshStandardMaterial({
      color: 0xf2e4be,
      emissive: 0xffd397,
      emissiveIntensity: 0,
    });
    const addLamps = (points: THREE.Vector2[]) => {
      const poles = new THREE.InstancedMesh(
        new THREE.CylinderGeometry(0.003, 0.005, 0.18, 6),
        lampMetal,
        points.length,
      );
      const bulbs = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.012, 8, 6),
        lampGlow,
        points.length,
      );
      const lampPose = new THREE.Object3D();
      points.forEach((point, i) => {
        const base = field.heightAt(point.x, point.y);
        lampPose.position.set(point.x, base + 0.09, point.y);
        lampPose.updateMatrix();
        poles.setMatrixAt(i, lampPose.matrix);
        lampPose.position.y = base + 0.18;
        lampPose.updateMatrix();
        bulbs.setMatrixAt(i, lampPose.matrix);
      });
      lighting.add(poles, bulbs);
    };
    addLamps(lampPositions);
    const pools = Array.from(
      { length: 8 },
      () => new THREE.PointLight(0xffd397, 0, 0.9, 2),
    );
    lighting.add(...pools);
    landscape.add(lighting);
    const trees = new THREE.Group();
    landscape.add(trees);
    const windows: { emissive: THREE.Color; emissiveIntensity: number }[] = [
      architecture.glass,
      city.glass,
    ];
    const enrich = async (
      wake: () => void,
      compile: (group: THREE.Object3D) => Promise<void>,
    ) => {
      const prepare = async (node: THREE.Object3D) => {
        try {
          await compile(node);
          detailSignal.throwIfAborted();
        } catch (error) {
          release(node);
          throw error;
        }
      };
      const reader =
        typeof Worker === "undefined" ? undefined : modelReader(detailSignal);
      if (!reader) return;
      try {
        // The first visible frame owns campus and the ship; district and foliage refine it afterwards
        const response = await fetch("/assets/world/city.json", {
          signal: detailSignal,
        });
        if (
          !response.ok ||
          Number(response.headers.get("content-length")) > 8_000_000
        )
          throw new Error("City data unavailable");
        const text = await response.text();
        if (text.length > 8_000_000)
          throw new Error("City data exceeds budget");
        data.city = parseGeography(JSON.parse(text));
        const districtLamps = (data.city.lamps ?? []).map(locate);
        lampPositions.push(...districtLamps);
        addLamps(districtLamps);
        const modelNames = [
          "tree-far",
          "jacaranda-far",
          "brisbane",
          "tree",
          "jacaranda",
        ];
        for (const name of modelNames) {
          detailSignal.throwIfAborted();
          try {
            performance.mark(`uqrl-${name}-start`);
            const model = await loadModel(name, reader, detailSignal);
            performance.measure(`uqrl-${name}-decode`, `uqrl-${name}-start`);
            if (name === "brisbane") {
              council = model;
              const glazing = cityMaterial();
              const old = new Set<THREE.Material>();
              model.traverse((node) => {
                if (node instanceof THREE.Mesh) {
                  for (const material of Array.isArray(node.material)
                    ? node.material
                    : [node.material])
                    old.add(material);
                  node.material = glazing;
                  node.castShadow = node.receiveShadow = true;
                }
              });
              for (const material of old) material.dispose();
              windows.push(glazing);
              await prepare(model);
              landscape.add(model);
              group.userData.parser = "rust-wasm";
            } else
              treeModels[
                name === "tree"
                  ? 0
                  : name === "jacaranda"
                    ? 1
                    : name === "tree-far"
                      ? 2
                      : 3
              ] = model;
          } catch (error) {
            if (detailSignal.aborted) throw error;
            console.warn(`Optional ${name} geometry unavailable`, error);
          }
          if (name === "jacaranda-far" || name === "jacaranda") {
            const planting = new THREE.Group();
            const bounds = [
              ...data.campus.buildings,
              ...data.city.buildings,
            ].map((b) => new THREE.Box2().setFromPoints(b.points.map(locate)));
            const candidates = [
              ...(data.campus.trees ?? []),
              ...(data.city.trees ?? []),
            ];
            const positions: Parameters<typeof plantTrees>[1][] = [
              [],
              [],
              [],
              [],
            ];
            for (const [i, tree] of candidates.entries()) {
              const p = locate(tree.point);
              if (
                field.waterAt(p.x, p.y) ||
                bounds.some((b) => b.distanceToPoint(p) < 0.06)
              )
                continue;
              let kind = /jacaranda/i.test(tree.species) ? 1 : 0;
              if (name !== "jacaranda" || p.lengthSq() > 64) kind += 2;
              if (name === "jacaranda" && p.lengthSq() > 64) continue;
              if (!treeModels[kind]) continue;
              positions[kind].push({
                x: p.x,
                y: field.heightAt(p.x, p.y),
                z: p.y,
                height: 0.28 + THREE.MathUtils.seededRandom(i + 1) * 0.15,
                yaw: THREE.MathUtils.seededRandom(i + 51) * Math.PI * 2,
              });
            }
            // Each template transfers ownership to its instances, so a refinement obtains fresh far templates
            for (const [kind, model] of treeModels.entries())
              if (model) {
                planting.add(plantTrees(model, positions[kind], kind < 2));
                treeModels[kind] = undefined;
              }
            if (name === "jacaranda") {
              const matrix = new THREE.Matrix4(),
                point = new THREE.Vector3();
              trees.traverse((node) => {
                if (node instanceof THREE.InstancedMesh) {
                  for (let i = 0; i < node.count; i++) {
                    node.getMatrixAt(i, matrix);
                    point.setFromMatrixPosition(matrix);
                    if (point.x * point.x + point.z * point.z < 64) {
                      matrix.scale(new THREE.Vector3(0, 0, 0));
                      node.setMatrixAt(i, matrix);
                    }
                  }
                  node.instanceMatrix.needsUpdate = true;
                }
              });
            }
            await prepare(planting);
            trees.add(planting);
            if (name === "jacaranda" && planting.children.length)
              group.userData.foliage = "ready";
          }
          wake();
        }
        const district = await makeGeography(
          {
            ...data.city,
            buildings: data.city.buildings.filter((b) => {
              const [lon, lat] = b.points[0];
              return (
                /Brisbane Skytower|One William Street|Meriton Infinity Tower/.test(
                  b.name,
                ) ||
                !council ||
                lon < 153.01074 ||
                lon > 153.05469 ||
                lat < -27.47934 ||
                lat > -27.43377
              );
            }),
          },
          true,
          field.heightAt,
          detailSignal,
        );
        const surroundings = await makeGeography(
          {
            ...data.campus,
            roads: [],
            areas: [],
            buildings: data.campus.buildings.filter(
              (b) => !nearBuildings.includes(b),
            ),
          },
          false,
          field.heightAt,
          detailSignal,
        );
        if (detailSignal.aborted) {
          release(district.group);
          release(surroundings.group);
          return;
        }
        await prepare(district.group);
        landscape.add(district.group);
        await prepare(surroundings.group);
        landscape.add(surroundings.group);
        landscape.add(
          landmarks(
            data.city.roads,
            locate,
            field.heightAt,
            architecture.stone,
            false,
          ),
        );
        group.userData.details = "ready";
        windows.push(district.glass, surroundings.glass);
        for (const river of data.city.rivers)
          if (river.length > 2) landscape.add(makeRiver(river));
        wake();
      } catch (error) {
        if (!detailSignal.aborted)
          console.warn("World detail unavailable", error);
      } finally {
        reader.dispose();
      }
    };
    const ship = spacecraft();
    const craft = ship.group;
    const engines = ship.engines;
    const radiance = ship.light;
    const launchGround = field.heightAt(0, 0.25);
    craft.position.set(0, launchGround + 0.18, 0.25);
    craft.scale.setScalar(0.1);
    group.add(craft);
    const photoGroup = new THREE.Group();
    photoGroup.visible = false;
    photoGroup.position.set(0, 1.8, 0.7);
    landscape.add(photoGroup);
    for (let i = 0; i < 3; i++) {
      const frame = new THREE.Group();
      frame.position.set(
        (i - 1) * 0.9,
        Math.sin(i * 1.5) * 0.12,
        -Math.abs(i - 1) * 0.2,
      );
      frame.rotation.set(-0.05, (i - 1) * -0.25, (i - 1) * -0.1);
      photoGroup.add(frame);
      mesh(frame, new RoundedBoxGeometry(0.85, 1.15, 0.045, 2, 0.025), silver);
      photos.push(
        mesh(
          frame,
          new THREE.PlaneGeometry(0.75, 0.94),
          new THREE.MeshStandardMaterial({ color: 0xd9d7d4, roughness: 0.7 }),
          0,
          0.04,
          0.025,
        ),
      );
    }
    for (const [key, target] of [
      ["projects", craft],
      ["team", photoGroup],
      ["about", heritage],
    ] as const) {
      target.userData.station = key;
      rooms.set(key, target);
    }

    const brisbane = locate([153.025, -27.47]);
    const earth = makeEarth();
    maps.push(...earth.maps);
    const globe = earth.group;
    group.add(globe);
    return {
      group,
      landscape,
      globe,
      photos,
      photoGroup,
      rooms,
      craft,
      ship,
      launchGround,
      engines,
      radiance,
      trees,
      council,
      stone,
      maps,
      brisbane,
      earth,
      field,
      transit,
      city: city.group,
      lampGlow,
      lampPositions,
      pools,
      windows,
      enrich,
      cancel: () => pending.abort(),
      masonry: [architecture.stone],
    };
  } catch (error) {
    release(group);
    throw error;
  }
}
