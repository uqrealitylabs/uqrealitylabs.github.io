import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import {
  applyPoke,
  createGrassBladeInstances,
  createPokeState,
  getMaterialPreset,
  type MaterialKind,
  releasePoke,
  resolveGrassBladeCount,
  stepPoke,
} from "@uqrealitylabs/feelable-materials";
import { applyFeelableMeshResponse } from "@uqrealitylabs/feelable-materials/react";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  type Group,
  type InstancedMesh,
  type Mesh,
  type MeshPhysicalMaterial,
  Object3D,
} from "three";

export type FeelableQuality = "balanced" | "showcase";

type FeelableSceneProps = {
  material: MaterialKind;
  onReady: () => void;
  pokeSignal: number;
  quality: FeelableQuality;
  reducedMotion: boolean;
  resetSignal: number;
};

const colours: Record<MaterialKind, string> = {
  cloth: "#cc6f72",
  rubber: "#ffb64d",
  glass: "#85dcff",
  grass: "#63b779",
  mail: "#f0d8a1",
  enamel: "#856dff",
};

function MaterialSurface({
  material,
  pokeSignal,
  quality,
  reducedMotion,
}: Omit<FeelableSceneProps, "onReady" | "resetSignal">) {
  const group = useRef<Group>(null);
  const mesh = useRef<Mesh>(null);
  const physicalMaterial = useRef<MeshPhysicalMaterial>(null);
  const grass = useRef<InstancedMesh>(null);
  const poke = useRef(createPokeState());
  const pulseRemaining = useRef(0);
  const handledSignal = useRef(pokeSignal);
  const config = getMaterialPreset(material);
  const blades = useMemo(
    () =>
      createGrassBladeInstances({
        count: resolveGrassBladeCount(
          quality === "showcase" ? 420 : 180,
          reducedMotion,
        ),
        seed: 17,
      }),
    [quality, reducedMotion],
  );

  useEffect(() => {
    if (handledSignal.current === pokeSignal) return;
    handledSignal.current = pokeSignal;
    if (reducedMotion) return;
    applyPoke(poke.current, 0.5, 0.5, 1);
    pulseRemaining.current = 0.22;
  }, [pokeSignal, reducedMotion]);

  useLayoutEffect(() => {
    if (!grass.current) return;
    const blade = new Object3D();
    for (const [index, instance] of blades.entries()) {
      blade.position.set(
        (instance.x - 0.5) * 4.45,
        (instance.y - 0.5) * 2.7,
        0.28,
      );
      blade.rotation.set(0, 0, instance.angle);
      blade.scale.set(Math.max(0.8, instance.width * 60), instance.height, 1);
      blade.updateMatrix();
      grass.current.setMatrixAt(index, blade.matrix);
    }
    grass.current.instanceMatrix.needsUpdate = true;
  }, [blades]);

  const pokeAt = (event: ThreeEvent<PointerEvent>, pressure: number) => {
    if (reducedMotion || !event.uv) return;
    event.stopPropagation();
    applyPoke(poke.current, event.uv.x, event.uv.y, pressure);
  };

  useFrame((_state, delta) => {
    if (pulseRemaining.current > 0) {
      pulseRemaining.current -= delta;
      if (pulseRemaining.current <= 0) releasePoke(poke.current);
    }

    stepPoke(poke.current, config, delta * 1000);

    if (mesh.current)
      applyFeelableMeshResponse(mesh.current, config, poke.current);
    const response = mesh.current?.userData.feelableResponse;
    if (!response) return;
    if (physicalMaterial.current) {
      physicalMaterial.current.roughness = Math.min(
        1,
        Math.max(
          0.03,
          config.roughness + response.smudge * 0.55 - response.gloss * 0.08,
        ),
      );
      physicalMaterial.current.emissiveIntensity = response.highlight * 0.32;
    }
    if (group.current) {
      const bend =
        material === "mail" || material === "grass" ? response.bend : 0;
      group.current.rotation.x +=
        (bend * -0.12 - group.current.rotation.x) * 0.14;
      group.current.rotation.y +=
        (bend * 0.16 - group.current.rotation.y) * 0.14;
    }
    if (grass.current) {
      grass.current.rotation.z +=
        (response.bend * 0.16 - grass.current.rotation.z) * 0.12;
    }
  });

  return (
    <group ref={group}>
      <mesh
        ref={mesh}
        onPointerMove={(event) => pokeAt(event, 0.3)}
        onPointerDown={(event) => pokeAt(event, 1)}
        onPointerUp={() => releasePoke(poke.current)}
        onPointerLeave={() => releasePoke(poke.current)}
      >
        <boxGeometry args={[4.8, 3.1, 0.38, 8, 8, 1]} />
        <meshPhysicalMaterial
          ref={physicalMaterial}
          color={colours[material]}
          roughness={config.roughness}
          metalness={material === "enamel" ? 0.28 : 0.04}
          clearcoat={material === "glass" || material === "enamel" ? 1 : 0.25}
          clearcoatRoughness={material === "glass" ? 0.02 : 0.14}
          transmission={material === "glass" ? 0.22 : 0}
          transparent={material === "glass"}
          opacity={material === "glass" ? 0.82 : 1}
          emissive={colours[material]}
          emissiveIntensity={0}
        />
        {material === "grass" ? (
          <instancedMesh
            key={blades.length}
            ref={grass}
            args={[undefined, undefined, blades.length]}
          >
            <boxGeometry args={[0.025, 0.22, 0.035]} />
            <meshStandardMaterial color="#b8e58d" roughness={0.78} />
          </instancedMesh>
        ) : null}
      </mesh>
    </group>
  );
}

export default function FeelableScene({
  material,
  onReady,
  pokeSignal,
  quality,
  reducedMotion,
  resetSignal,
}: FeelableSceneProps) {
  return (
    <Canvas
      aria-label="Interactive feelable material surface"
      camera={{ position: [0, 0, 7.4], fov: 43 }}
      dpr={[1, 1.75]}
      frameloop={reducedMotion ? "demand" : "always"}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={onReady}
    >
      <color attach="background" args={["#0c1118"]} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[4, 5, 7]} intensity={2.2} color="#fff3d2" />
      <pointLight position={[-4, -3, 4]} intensity={18} color="#68e8ff" />
      <gridHelper
        args={[14, 28, "#234553", "#162832"]}
        position={[0, 0, -1.2]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <MaterialSurface
        key={`${material}-${reducedMotion}-${resetSignal}`}
        material={material}
        pokeSignal={pokeSignal}
        quality={quality}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}
