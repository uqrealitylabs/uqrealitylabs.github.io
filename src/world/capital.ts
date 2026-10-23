import * as THREE from "three";
import { makeGeography, parseGeography } from "./geography";
import { release } from "./models";
import { parseElevation } from "./terrain";

/** City geometry is fetched only for an intentional fly-in, with one retained destination */
export async function capital(
  name: string,
  origin: [number, number],
  signal: AbortSignal,
) {
  if (
    ![
      "Sydney",
      "Melbourne",
      "Canberra",
      "Perth",
      "Adelaide",
      "Hobart",
      "Darwin",
    ].includes(name)
  )
    throw new Error("Unknown capital");
  const [[data, elevation], bytes] = await Promise.all([
    Promise.all(
      [name.toLowerCase(), `${name.toLowerCase()}-elevation`].map(
        async (slug) => {
          const response = await fetch(`/assets/world/${slug}.json`, {
            signal,
          });
          if (!response.ok) throw new Error(`${name} map unavailable`);
          const text = await response.text();
          if (text.length > 12_000_000)
            throw new Error("City map exceeds budget");
          return JSON.parse(text);
        },
      ),
    ),
    fetch(`/assets/world/${name.toLowerCase()}-water.bin`, { signal }).then(
      async (response) => {
        if (!response.ok) throw new Error("Coastline mask unavailable");
        return response.arrayBuffer();
      },
    ),
  ]);
  if (bytes.byteLength !== 513 * 513)
    throw new Error("Invalid coastline mask size");
  const mask = new Uint8Array(bytes);
  if (mask.some((value) => value > 1))
    throw new Error("Invalid coastline mask");
  const geography = parseGeography(data),
    field = parseElevation(elevation);
  const scale = (Math.cos((origin[1] * Math.PI) / 180) * 111320) / 40;
  const project = ([lon, lat]: [number, number]) =>
    new THREE.Vector2((lon - origin[0]) * scale, -(lat - origin[1]) * 2783);
  const water = geography.areas
    .filter((a) => a.kind === "water")
    .map((a) => {
      const points = a.points.map(project);
      return { points, bounds: new THREE.Box2().setFromPoints(points) };
    });
  const inside = (x: number, z: number, points: THREE.Vector2[]) => {
    let within = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i],
        b = points[j];
      if (
        a.y > z !== b.y > z &&
        x < ((b.x - a.x) * (z - a.y)) / (b.y - a.y) + a.x
      )
        within = !within;
    }
    return within;
  };
  const waterAt = (x: number, z: number) => {
    const u = Math.round(
      THREE.MathUtils.clamp(
        (origin[0] + x / scale - field.west) / (field.east - field.west),
        0,
        1,
      ) * 512,
    );
    const v = Math.round(
      THREE.MathUtils.clamp(
        (field.north - origin[1] + z / 2783) / (field.north - field.south),
        0,
        1,
      ) * 512,
    );
    return (
      mask[v * 513 + u] === 1 ||
      water.some(
        ({ points, bounds }) =>
          x >= bounds.min.x &&
          x <= bounds.max.x &&
          z >= bounds.min.y &&
          z <= bounds.max.y &&
          inside(x, z, points),
      )
    );
  };
  const height = (x: number, z: number) => {
    if (waterAt(x, z)) return 0;
    const u = THREE.MathUtils.clamp(
      ((origin[0] + x / scale - field.west) / (field.east - field.west)) *
        (field.width - 1),
      0,
      field.width - 1,
    );
    const v = THREE.MathUtils.clamp(
      ((field.north - origin[1] + z / 2783) / (field.north - field.south)) *
        (field.height - 1),
      0,
      field.height - 1,
    );
    const a = Math.floor(u),
      b = Math.floor(v),
      c = Math.min(a + 1, field.width - 1),
      d = Math.min(b + 1, field.height - 1);
    return (
      ((field.samples[b * field.width + a] * (1 - (u % 1)) +
        field.samples[b * field.width + c] * (u % 1)) *
        (1 - (v % 1)) +
        (field.samples[d * field.width + a] * (1 - (u % 1)) +
          field.samples[d * field.width + c] * (u % 1)) *
          (v % 1)) /
      40
    );
  };
  const group = new THREE.Group();
  try {
    const district = await makeGeography(
      geography,
      true,
      height,
      signal,
      project,
    );
    group.add(district.group);
    const ground = new THREE.PlaneGeometry(500, 500, 128, 128);
    ground.rotateX(-Math.PI / 2);
    const vertices = ground.getAttribute("position");
    const colours = new Float32Array(vertices.count * 3);
    const land = new THREE.Color(
      name === "Darwin"
        ? 0x666b42
        : name === "Perth" || name === "Adelaide"
          ? 0x777252
          : 0x4e644e,
    );
    const sea = new THREE.Color(0x355e6a);
    for (let i = 0; i < vertices.count; i++) {
      const h = height(vertices.getX(i), vertices.getZ(i));
      vertices.setY(i, h - 0.02);
      const colour = waterAt(vertices.getX(i), vertices.getZ(i)) ? sea : land;
      colours.set([colour.r, colour.g, colour.b], i * 3);
    }
    ground.setAttribute("color", new THREE.BufferAttribute(colours, 3));
    ground.computeVertexNormals();
    const terrain = new THREE.Mesh(
      ground,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }),
    );
    terrain.receiveShadow = true;
    group.add(terrain);
    const stone = new THREE.MeshStandardMaterial({
      color: 0xd2c5a7,
      roughness: 0.85,
    });
    const white = new THREE.MeshStandardMaterial({
      color: 0xe4e6dc,
      roughness: 0.55,
    });
    const steel = new THREE.MeshStandardMaterial({
      color: 0x52646b,
      metalness: 0.65,
      roughness: 0.45,
    });
    const glass = new THREE.MeshStandardMaterial({
      color: 0x446a77,
      metalness: 0.45,
      roughness: 0.25,
    });
    const copper = new THREE.MeshStandardMaterial({
      color: 0x759087,
      metalness: 0.55,
      roughness: 0.5,
    });
    const add = (
      parent: THREE.Group,
      geometry: THREE.BufferGeometry,
      material: THREE.Material,
      x = 0,
      y = 0,
      z = 0,
    ) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.castShadow = mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const landmark = (longitude: number, latitude: number, yaw = 0) => {
      const p = project([longitude, latitude]);
      const model = new THREE.Group();
      model.position.set(p.x, height(p.x, p.y), p.y);
      model.rotation.y = yaw;
      group.add(model);
      return model;
    };
    const bridge = (
      from: [number, number],
      to: [number, number],
      arch: boolean,
    ) => {
      const a = project(from),
        b = project(to),
        length = a.distanceTo(b);
      const model = landmark(
        (from[0] + to[0]) / 2,
        (from[1] + to[1]) / 2,
        -Math.atan2(b.y - a.y, b.x - a.x),
      );
      model.position.y = 0;
      add(model, new THREE.BoxGeometry(length, 0.08, 0.65), steel, 0, 1.2);
      for (const side of [-1, 1]) {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(-length / 2, 1.2, side * 0.35),
          new THREE.Vector3(0, arch ? 5.2 : 2.1, side * 0.35),
          new THREE.Vector3(length / 2, 1.2, side * 0.35),
        );
        add(
          model,
          new THREE.TubeGeometry(curve, 48, arch ? 0.07 : 0.03, 6, false),
          steel,
        );
        for (let i = 1; i < 24; i++) {
          const p = curve.getPoint(i / 24);
          add(
            model,
            new THREE.CylinderGeometry(0.012, 0.012, p.y - 1.2, 5),
            steel,
            p.x,
            (p.y + 1.2) / 2,
            p.z,
          );
        }
      }
    };
    if (name === "Sydney") {
      const opera = landmark(151.2153, -33.8568, 0.3);
      add(opera, new THREE.BoxGeometry(2.8, 0.25, 4.2), stone, 0, 0.1);
      for (const side of [-1, 1])
        for (let i = 0; i < 4; i++) {
          const shell = add(
            opera,
            new THREE.SphereGeometry(1, 32, 20, 0, Math.PI, 0, Math.PI / 2),
            white,
            side * (0.65 - i * 0.08),
            0.25,
            (i - 1.5) * 0.8,
          );
          shell.scale.set(0.75 - i * 0.1, 1.55 - i * 0.2, 1.7 - i * 0.2);
          shell.rotation.z = side * 0.23;
        }
      bridge([151.2085, -33.8578], [151.2113, -33.8488], true);
    } else if (name === "Melbourne") {
      const station = landmark(144.9671, -37.8183, -0.13);
      add(station, new THREE.BoxGeometry(5.1, 0.5, 0.8), stone, 0, 0.25);
      const dome = add(
        station,
        new THREE.SphereGeometry(0.46, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        copper,
        2,
        0.7,
      );
      dome.scale.y = 1.3;
      const arts = landmark(144.9682, -37.8218);
      for (let i = 0; i < 8; i++) {
        const p = (i / 8) * Math.PI * 2;
        const mast = add(
          arts,
          new THREE.CylinderGeometry(0.006, 0.02, 2.7, 5),
          white,
          Math.cos(p) * 0.18,
          1.55,
          Math.sin(p) * 0.18,
        );
        mast.rotation.z = Math.sin(p) * 0.15;
        mast.rotation.x = Math.cos(p) * 0.15;
      }
    } else if (name === "Canberra") {
      const parliament = landmark(149.1244, -35.3082, 0.1);
      add(parliament, new THREE.BoxGeometry(5.2, 0.6, 3.5), stone, 0, 0.3);
      add(
        parliament,
        new THREE.BoxGeometry(4.6, 0.08, 3.4),
        new THREE.MeshStandardMaterial({ color: 0x63885d }),
        0,
        0.64,
      );
      for (const side of [-1, 1])
        for (const z of [-1, 1]) {
          const beam = add(
            parliament,
            new THREE.CylinderGeometry(0.016, 0.025, 1.8, 6),
            steel,
            side * 0.25,
            1.4,
            z * 0.25,
          );
          beam.rotation.z = side * 0.3;
          beam.rotation.x = z * -0.3;
        }
      add(
        parliament,
        new THREE.BoxGeometry(0.45, 0.18, 0.015),
        glass,
        0.22,
        2.5,
      );
    } else if (name === "Perth") {
      const bell = landmark(115.8575, -31.9583);
      for (const side of [-1, 1]) {
        const sail = add(
          bell,
          new THREE.ConeGeometry(0.28, 2, 3),
          copper,
          side * 0.15,
          1,
        );
        sail.rotation.z = side * -0.1;
      }
      add(bell, new THREE.CylinderGeometry(0.15, 0.28, 1.2, 8), glass, 0, 0.6);
      const stadium = landmark(115.8891, -31.9511);
      const bowl = add(
        stadium,
        new THREE.TorusGeometry(2.2, 0.28, 10, 64),
        copper,
        0,
        0.65,
      );
      bowl.rotation.x = Math.PI / 2;
      bowl.scale.x = 1.3;
    } else if (name === "Adelaide") {
      const oval = landmark(138.5961, -34.9154);
      for (let i = 0; i < 3; i++) {
        const roof = add(
          oval,
          new THREE.SphereGeometry(1, 32, 12, 0, Math.PI, 0, Math.PI / 2),
          white,
          (i - 1) * 1.3,
          0.3,
        );
        roof.scale.set(0.9, 0.6, 1.8);
      }
      const sahmri = landmark(138.5874, -34.9206);
      const shell = add(
        sahmri,
        new THREE.IcosahedronGeometry(1.1, 1),
        white,
        0,
        0.85,
      );
      shell.scale.set(1.6, 0.75, 0.8);
    } else if (name === "Hobart") {
      bridge([147.3379, -42.8657], [147.3575, -42.8633], false);
      const wharf = landmark(147.3339, -42.8862, -0.55);
      for (let i = 0; i < 12; i++)
        add(
          wharf,
          new THREE.BoxGeometry(0.24, 0.3, 0.7),
          stone,
          (i - 6) * 0.25,
          0.15,
        );
    } else {
      const convention = landmark(130.8498, -12.4676, -0.4);
      for (let i = 0; i < 3; i++) {
        const roof = add(
          convention,
          new THREE.CylinderGeometry(0.8, 0.8, 1.8, 32, 1, false, 0, Math.PI),
          white,
          (i - 1) * 0.8,
          0.3,
        );
        roof.rotation.z = Math.PI / 2;
      }
      const wharf = landmark(130.8505, -12.4721, 0.7);
      add(wharf, new THREE.BoxGeometry(3, 0.08, 0.45), stone, 0, 0.2);
    }
    signal.throwIfAborted();
    return {
      group,
      height,
      windows: [district.glass],
      point: (lon: number, lat: number) => {
        const p = project([lon, lat]);
        return new THREE.Vector3(p.x, height(p.x, p.y), p.y);
      },
    };
  } catch (error) {
    release(group);
    throw error;
  }
}
