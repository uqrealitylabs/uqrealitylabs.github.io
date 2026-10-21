import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/** Each scene owns its decoded geometry and textures, including late cancelled results */
export function release(root: THREE.Object3D, extra: THREE.Texture[] = []) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>(extra);
  root.traverse((node) => {
    if (
      !(
        node instanceof THREE.Mesh ||
        node instanceof THREE.LineSegments ||
        node instanceof THREE.Points
      )
    )
      return;
    if (node instanceof THREE.InstancedMesh) node.dispose();
    geometries.add(node.geometry);
    for (const material of Array.isArray(node.material)
      ? node.material
      : [node.material]) {
      materials.add(material);
      for (const value of Object.values(material))
        if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) {
    texture.dispose();
    if (
      typeof ImageBitmap !== "undefined" &&
      texture.source.data instanceof ImageBitmap
    )
      texture.source.data.close();
  }
}

/** One worker owns bounded Rust parsing for a scene's model batch */
export function modelReader(signal?: AbortSignal) {
  const worker = new Worker(new URL("./parse.ts", import.meta.url), {
    type: "module",
  });
  const pending = new Map<
    number,
    {
      accept(value: {
        bytes: ArrayBuffer;
        vertices: number;
        milliseconds: number;
      }): void;
      reject(error: Error): void;
    }
  >();
  let sequence = 0;
  let closed = false;
  let deadline: ReturnType<typeof setTimeout>;
  // biome-ignore lint/correctness/useHookAtTopLevel: Meshopt owns decoder workers, not React hooks
  MeshoptDecoder.useWorkers(2);
  const dispose = () => {
    if (closed) return;
    closed = true;
    clearTimeout(deadline);
    worker.terminate();
    // biome-ignore lint/correctness/useHookAtTopLevel: Meshopt owns decoder workers, not React hooks
    MeshoptDecoder.useWorkers(0);
    signal?.removeEventListener("abort", dispose);
    for (const task of pending.values())
      task.reject(new Error("Model parsing cancelled"));
    pending.clear();
  };
  worker.onmessage = ({ data }) => {
    const task = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) task?.reject(new Error(data.error));
    else task?.accept(data);
  };
  worker.onerror = () => {
    dispose();
  };
  signal?.addEventListener("abort", dispose, { once: true });
  return {
    inspect(bytes: ArrayBuffer) {
      signal?.throwIfAborted();
      clearTimeout(deadline);
      deadline = setTimeout(() => dispose(), 20000);
      if (closed) return Promise.reject(new Error("Model parser closed"));
      if (pending.size >= 5)
        return Promise.reject(new Error("Model parsing queue exceeds budget"));
      return new Promise<{
        bytes: ArrayBuffer;
        vertices: number;
        milliseconds: number;
      }>((accept, reject) => {
        const id = ++sequence;
        pending.set(id, { accept, reject });
        worker.postMessage({ id, bytes }, [bytes]);
      });
    },
    dispose,
  };
}

export async function loadModel(
  name: string,
  reader: ReturnType<typeof modelReader>,
  signal?: AbortSignal,
) {
  const response = await fetch(`/assets/world/${name}.glb`, { signal });
  if (!response.ok) throw new Error(`Model ${name}: ${response.status}`);
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > 8_000_000) throw new Error("Model exceeds its budget");
  signal?.throwIfAborted();
  const inspected = await reader.inspect(bytes);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const { scene } = await loader.parseAsync(inspected.bytes, "/assets/world/");
  scene.userData.parser = "rust-wasm";
  scene.userData.parseMs = inspected.milliseconds;
  scene.userData.vertices = inspected.vertices;
  try {
    signal?.throwIfAborted();
  } catch (error) {
    release(scene);
    throw error;
  }
  scene.updateMatrixWorld(true);
  return scene;
}

/** Real branch and leaf meshes are shared across mapped tree instances */
export function plantTrees(
  model: THREE.Group,
  positions: { x: number; y: number; z: number; height: number; yaw: number }[],
  shadows: boolean,
) {
  const group = new THREE.Group();
  const bounds = new THREE.Box3().setFromObject(model);
  const centre = bounds.getCenter(new THREE.Vector3());
  const height = bounds.max.y - bounds.min.y;
  const pose = new THREE.Object3D();
  const cells = new Map<string, typeof positions>();
  for (const position of positions) {
    const key = `${Math.floor(position.x / 12)},${Math.floor(position.z / 12)}`;
    const cell = cells.get(key) ?? [];
    cell.push(position);
    cells.set(key, cell);
  }
  model.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const geometry = node.geometry.clone();
    const source = geometry.getAttribute("position");
    const coordinates = new Float32Array(source.count * 3);
    for (let i = 0; i < source.count; i++)
      coordinates.set([source.getX(i), source.getY(i), source.getZ(i)], i * 3);
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(coordinates, 3),
    );
    geometry.applyMatrix4(node.matrixWorld);
    geometry.translate(-centre.x, -bounds.min.y, -centre.z);
    for (const material of Array.isArray(node.material)
      ? node.material
      : [node.material]) {
      if (
        material instanceof THREE.MeshStandardMaterial &&
        /leaves/.test(material.name)
      ) {
        material.transparent = false;
        // A low cutout threshold and two-sided leaves retain full crowns on the mapped instances
        material.alphaTest = 0.08;
        material.alphaHash = false;
        material.side = THREE.DoubleSide;
        material.alphaToCoverage = false;
      }
    }
    for (const cell of cells.values()) {
      const instances = new THREE.InstancedMesh(
        geometry,
        node.material,
        cell.length,
      );
      cell.forEach((p, i) => {
        pose.position.set(p.x, p.y, p.z);
        pose.rotation.set(0, p.yaw, 0);
        pose.scale.setScalar(p.height / height);
        pose.updateMatrix();
        instances.setMatrixAt(i, pose.matrix);
      });
      instances.castShadow = shadows;
      instances.receiveShadow = true;
      instances.computeBoundingSphere();
      group.add(instances);
    }
    if (!cells.size) geometry.dispose();
  });
  // Materials and images move to the instances; only the superseded source geometry is released
  model.traverse((node) => {
    if (node instanceof THREE.Mesh) node.geometry.dispose();
  });
  return group;
}
