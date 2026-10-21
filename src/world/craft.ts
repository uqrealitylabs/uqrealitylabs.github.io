import * as THREE from "three";
import { float, sin, uniform, uv } from "three/tsl";
import { MeshBasicNodeMaterial } from "three/webgpu";

/** The favicon is the folded silhouette; its hoops articulate around a deployable hull */
export function spacecraft() {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({
    color: 0x333d47,
    metalness: 0.88,
    roughness: 0.32,
  });
  const edge = new THREE.MeshStandardMaterial({
    color: 0x121a23,
    metalness: 0.72,
    roughness: 0.4,
  });
  const silver = new THREE.MeshStandardMaterial({
    color: 0xe3e7e5,
    metalness: 0.84,
    roughness: 0.22,
  });
  const blue = new THREE.MeshStandardMaterial({
    color: 0x6ad8ff,
    emissive: 0x239cff,
    emissiveIntensity: 1.6,
    roughness: 0.24,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x123952,
    metalness: 0.35,
    roughness: 0.13,
    clearcoat: 1,
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
  const ring = new THREE.Group();
  group.add(ring);
  add(ring, new THREE.TorusGeometry(1.72, 0.095, 10, 96), metal);
  add(ring, new THREE.TorusGeometry(1.72, 0.032, 8, 96), silver, 0, 0, 0.085);
  add(ring, new THREE.TorusGeometry(1.61, 0.018, 6, 96), blue);
  const hoop = new THREE.Group();
  group.add(hoop);
  add(hoop, new THREE.TorusGeometry(1.72, 0.055, 8, 96), silver);
  const stem = new THREE.Group();
  group.add(stem);
  add(
    stem,
    new THREE.CapsuleGeometry(0.085, 0.73, 4, 10),
    silver,
    0,
    1.5,
    0.04,
  );
  const hull = new THREE.Group();
  hull.position.y = -0.4;
  group.add(hull);
  const plate = (
    parent: THREE.Group,
    points: number[][],
    depth: number,
    y: number,
    material = metal,
  ) => {
    const shape = new THREE.Shape(
      points.map(([x, z]) => new THREE.Vector2(x, -z)),
    );
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: 0.025,
      bevelThickness: 0.018,
      steps: 1,
    });
    geometry.rotateX(-Math.PI / 2);
    return add(parent, geometry, material, 0, y);
  };
  plate(
    hull,
    [
      [-0.76, -1.1],
      [-0.4, -1.45],
      [0.4, -1.45],
      [0.76, -1.1],
      [0.6, 0.9],
      [0, 1.65],
      [-0.6, 0.9],
    ],
    0.23,
    0,
  );
  plate(
    hull,
    [
      [-0.58, -0.95],
      [0.58, -0.95],
      [0.43, 0.75],
      [0, 1.3],
      [-0.43, 0.75],
    ],
    0.07,
    0.25,
    edge,
  );
  const wings: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    wings.push(
      plate(
        hull,
        [
          [0.16, -0.5],
          [0.42, -1.22],
          [0.92, -0.65],
          [0.64, 1.25],
          [0.4, 3.25],
          [0.21, 3.1],
        ].map(([x, z]) => [x * side, z]),
        0.16,
        0.14,
      ),
    );
    plate(
      hull,
      [
        [0.66, -0.85],
        [1.1, -0.55],
        [1.25, 0.7],
        [0.78, 1.1],
      ].map(([x, z]) => [x * side, z]),
      0.08,
      0.32,
      edge,
    );
    add(
      hull,
      new THREE.BoxGeometry(0.025, 0.045, 1.6),
      blue,
      side * 0.49,
      0.35,
      0.05,
    );
  }
  const cabin = new THREE.BufferGeometry();
  cabin.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        -0.38, 0.3, -0.7, 0.38, 0.3, -0.7, -0.3, 0.69, -0.45, 0.3, 0.69, -0.45,
        -0.22, 0.42, 0.85, 0.22, 0.42, 0.85, -0.28, 0.29, 1.12, 0.28, 0.29,
        1.12,
      ],
      3,
    ),
  );
  cabin.setIndex([
    0, 2, 1, 1, 2, 3, 2, 4, 3, 3, 4, 5, 4, 6, 5, 5, 6, 7, 0, 6, 2, 2, 6, 4, 1,
    3, 7, 3, 5, 7, 0, 1, 6, 1, 7, 6,
  ]);
  cabin.computeVertexNormals();
  add(hull, cabin, glass);
  const forwardHoop = new THREE.Group();
  forwardHoop.position.set(0, -0.15, 1.05);
  hull.add(forwardHoop);
  add(forwardHoop, new THREE.TorusGeometry(1.03, 0.055, 8, 64), metal);
  const clock = uniform(0),
    thrust = uniform(0);
  const flame = new MeshBasicNodeMaterial({
    color: 0x74dcff,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  flame.opacityNode = float(1)
    .sub(uv().y)
    .pow(2)
    .mul(float(1).sub(uv().x.sub(0.5).abs().mul(2)).pow(2))
    .mul(thrust)
    .mul(sin(clock.mul(23)).mul(0.08).add(0.9));
  const engines = new THREE.Group();
  hull.add(engines);
  for (const x of [-0.9, 0.9]) {
    const housing = add(
      engines,
      new THREE.CylinderGeometry(0.17, 0.23, 0.36, 12),
      edge,
      x,
      -0.15,
      -0.68,
    );
    const outlet = add(
      engines,
      new THREE.TorusGeometry(0.145, 0.025, 8, 24),
      silver,
      x,
      -0.34,
      -0.68,
    );
    outlet.rotation.x = Math.PI / 2;
    const emitter = add(
      engines,
      new THREE.CircleGeometry(0.125, 24),
      blue,
      x,
      -0.35,
      -0.68,
    );
    emitter.rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i++) {
      const plume = add(
        engines,
        new THREE.PlaneGeometry(0.36, 1.4),
        flame,
        x,
        -1.04,
        -0.68,
      );
      plume.rotation.y = (i * Math.PI) / 3;
      plume.castShadow = plume.receiveShadow = false;
    }
    housing.castShadow = true;
  }
  const light = new THREE.PointLight(0x75ceff, 0, 4, 2);
  light.position.set(0, -0.7, 0);
  group.add(light);
  let reactionAt = -100,
    previousReaction = "";
  return {
    group,
    engines,
    light,
    update(
      time: number,
      deployment: number,
      power: number,
      expression = "neutral",
      reaction = "",
      cruise = 0,
    ) {
      clock.value = time;
      const deployed = THREE.MathUtils.smoothstep(deployment, 0, 1);
      ring.rotation.x = (deployed * Math.PI) / 2;
      hoop.rotation.y = deployed * 0.12;
      stem.rotation.x = (deployed * Math.PI) / 2;
      stem.position.y = -deployed * 0.32;
      stem.position.z = -deployed * 1.5;
      hull.scale.set(
        0.04 + deployed * 0.96,
        0.04 + deployed * 0.96,
        0.12 + deployed * 0.88,
      );
      forwardHoop.scale.setScalar(0.1 + deployed * 0.9);
      for (const wing of wings) wing.scale.z = 0.12 + deployed * 0.88;
      if (reaction && reaction !== previousReaction) {
        reactionAt = time;
        previousReaction = reaction;
      }
      hull.visible = deployed > 0.05;
      const pulse = Math.max(0, 1 - (time - reactionAt) / 0.8);
      const warmth = /smile|love|kiss/.test(expression);
      blue.emissive.set(
        warmth ? 0x83e9bc : /frown|brow/.test(expression) ? 0xb38cff : 0x239cff,
      );
      blue.emissiveIntensity = 0.3 + power * 2 + pulse * 2;
      thrust.value = Math.min(1, power + pulse * 0.3);
      light.intensity = power * 2.2 + pulse;
      engines.rotation.x = (cruise * Math.PI) / 2;
    },
  };
}
