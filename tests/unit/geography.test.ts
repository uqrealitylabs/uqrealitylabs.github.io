import { readFileSync } from "node:fs";
import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  earthRadius,
  locate,
  makeEarth,
  parseGeography,
} from "../../src/world/geography";
import { makeLab } from "../../src/world/lab";
import { parseElevation, terrain } from "../../src/world/terrain";
import { parseTransit } from "../../src/world/transit";
import { travel } from "../../src/world/travel";

const source = (name: string) =>
  JSON.parse(readFileSync(`public/assets/world/${name}.json`, "utf8"));

describe("the geographic world", () => {
  it("keeps every capital district and terrain extract bounded and independently loadable", () => {
    for (const city of [
      "sydney",
      "melbourne",
      "canberra",
      "perth",
      "adelaide",
      "hobart",
      "darwin",
    ]) {
      const data = parseGeography(source(city));
      expect(data.buildings.length).toBeGreaterThan(1000);
      expect(data.roads.length).toBeGreaterThan(1000);
      expect(parseElevation(source(`${city}-elevation`)).samples.length).toBe(
        129 * 129,
      );
    }
  });
  it("assembles the landmark, landscape and three transport types as renderable geometry", async () => {
    const lab = await makeLab({
      campus: parseGeography(source("campus")),
      city: parseGeography(source("city")),
      elevation: parseElevation(source("elevation")),
      transit: parseTransit(source("transit")),
    });
    expect(lab.transit.group.children.length).toBeGreaterThanOrEqual(6);
    expect(lab.rooms.has("about")).toBe(true);
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>();
    lab.group.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      expect(node.geometry.getAttribute("position").count).toBeGreaterThan(0);
      geometries.add(node.geometry);
      for (const material of Array.isArray(node.material)
        ? node.material
        : [node.material])
        materials.add(material);
      if (node instanceof THREE.InstancedMesh) node.dispose();
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
  });
  it("anchors the Great Court and accepts the expanded map and transit extracts", () => {
    expect(locate([153.01302, -27.4974]).length()).toBe(0);
    expect(locate([153.01302, -27.49]).y).toBeLessThan(0);
    expect(parseGeography(source("campus")).trees?.length).toBeGreaterThan(
      1000,
    );
    expect(parseGeography(source("city")).buildings.length).toBeGreaterThan(
      4000,
    );
    expect(
      parseTransit(source("transit"))
        .routes.map((r) => r.name)
        .sort(),
    ).toEqual(["192", "F1", "M1", "M2"]);
  });

  it("rejects malformed map, tree, road and transit records", () => {
    const empty = { buildings: [], areas: [], roads: [], rivers: [] };
    for (const buildings of [
      [null],
      [{ points: [[181, 0]], height: 12, name: "Bad" }],
      [{ points: [[153, -27]], height: -1, name: "Bad" }],
    ])
      expect(() => parseGeography({ ...empty, buildings })).toThrow(/Invalid/);
    expect(() =>
      parseGeography({
        ...empty,
        trees: [{ point: [0, Number.NaN], species: "" }],
      }),
    ).toThrow(/tree/);
    expect(() =>
      parseGeography({
        ...empty,
        roads: [{ points: [], kind: "road", width: -5 }],
      }),
    ).toThrow(/road/);
    for (const routes of [
      [null],
      [
        {
          name: "F1",
          kind: "ferry",
          points: [
            [153, -27],
            [200, -27],
          ],
        },
      ],
      [
        {
          name: "M2",
          kind: "shell",
          points: [
            [153, -27],
            [153, -28],
          ],
        },
      ],
    ])
      expect(() => parseTransit({ routes })).toThrow(/Invalid/);
  });

  it("keeps the planet tangent to Brisbane and geographic north in the local direction", () => {
    const earth = makeEarth(),
      p = locate([153.025, -27.47]);
    expect(
      earth.point(153.025, -27.47).distanceTo(new THREE.Vector3(p.x, 0, p.y)),
    ).toBeLessThan(1e-8);
    const north = earth
      .point(153.025, -27.469)
      .sub(earth.point(153.025, -27.47));
    expect(north.z).toBeCloseTo(-2.78, 1);
    expect(Math.abs(north.x)).toBeLessThan(0.001);
    const east = earth.point(153.026, -27.47).sub(earth.point(153.025, -27.47));
    expect(east.x).toBeCloseTo(2.47, 1);
    const eye = new THREE.Vector3(),
      at = new THREE.Vector3();
    travel(0.55, earth, eye, at);
    const before = eye.clone(),
      target = at.clone();
    travel(0.55 + 1e-8, earth, eye, at);
    expect(eye.distanceTo(before)).toBeLessThan(0.001);
    expect(at.distanceTo(target)).toBeLessThan(0.001);
    travel(1, earth, eye, at);
    expect(eye.distanceTo(at)).toBeCloseTo(earthRadius * 1.65);
    expect(earth.group.scale.toArray()).toEqual([1, 1, 1]);
    earth.group.traverse((node) => {
      if (node instanceof THREE.Mesh) node.geometry.dispose();
    });
    earth.material.dispose();
  });

  it("samples actual hills and excludes the river independently of elevation", () => {
    const campus = parseGeography(source("campus"));
    const field = terrain(parseElevation(source("elevation")), campus.rivers);
    const hill = locate([152.9599, -27.4796]);
    expect(field.heightAt(hill.x, hill.y)).toBeGreaterThan(4);
    const p = locate(campus.rivers[0][2]);
    expect(field.waterAt(p.x, p.y)).toBe(true);
    expect(field.heightAt(p.x, p.y)).toBe(0);
    expect(field.waterAt(0, 0)).toBe(false);
    expect(() =>
      parseElevation({ width: 1000, height: 1000, samples: [] }),
    ).toThrow(/grid/);
    const flat = {
      width: 2,
      height: 2,
      west: 152,
      east: 154,
      south: -28,
      north: -27,
      samples: [80, 80, 160, 160],
    };
    const p2 = locate([153, -27.5]);
    expect(terrain(parseElevation(flat), []).heightAt(p2.x, p2.y)).toBeCloseTo(
      3,
    );
  });
});
