import {
  Canvas,
  events as r3fEvents,
  type ThreeEvent,
  useFrame,
  useLoader,
} from "@react-three/fiber";
import {
  createGrassBladeInstances,
  getMaterialEventKind,
  getMaterialPreset,
  getMaterialResponse,
  type MaterialKind,
  type PokeState,
} from "@uqrealitylabs/feelable-materials";
import {
  applyFeelableMeshResponse,
  usePokeSurface,
} from "@uqrealitylabs/feelable-materials/react";
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { getPageContent, getSiteContent } from "../../content/contentRegistry";
import type { ContentBlock } from "../../content/schema/contentSchema";
import {
  JOIN_US_BLUSH_DELAY_MS,
  JOIN_US_NAVIGATION_DELAY_MS,
  type JoinUsState,
  joinUsStates,
  nextJoinUsState,
} from "../../shared/lib/joinUsState";
import { resolveSocialMaterialKind } from "../../shared/lib/socialMaterials";
import {
  SceneDomScaffold,
  type SceneMember,
  type SceneNavItem,
} from "./SceneDomScaffold";

const MODEL_PATH = "/Assets/test-two.glb";
const LABS_LOGO_PATH = "/Assets/images/labs_logo.png";
const TAB_ORDER = [
  "home",
  "about",
  "contact",
  "sponsors",
  "committee",
] as const;
const CLEAR_COLOUR = "#0f1118";
const SECTION_Y_STEP = 1.6;
const SOCIAL_CARD_WIDTH = 2.55;
const SOCIAL_CARD_HEIGHT = 1.72;

const STAR_LAYERS = [
  { count: 72, spread: 55, depth: 55, size: 0.09, opacity: 0.94, speed: 0.002 },
  {
    count: 126,
    spread: 90,
    depth: 110,
    size: 0.06,
    opacity: 0.68,
    speed: 0.0012,
  },
  {
    count: 192,
    spread: 140,
    depth: 180,
    size: 0.035,
    opacity: 0.42,
    speed: 0.0006,
  },
] as const;

const rainbowVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const rainbowFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uOpacity;

  vec3 rainbow(float value) {
    return 0.5 + 0.5 * cos(6.28318 * (value + vec3(0.0, 0.16, 0.33)));
  }

  void main() {
    vec2 centered = vUv - 0.5;
    float radius = length(centered) * 2.0;
    float ring = smoothstep(0.96, 0.42, radius) * smoothstep(0.1, 0.32, radius);
    float angle = atan(centered.y, centered.x) / 6.28318;
    vec3 colour = rainbow(angle + uTime * 0.015 + radius * 0.08);
    float alpha = ring * uOpacity;
    gl_FragColor = vec4(colour, alpha);
  }
`;

type SceneTab = SceneNavItem & {
  title: string;
  description: string;
};

type SocialMaterialDebug = {
  label: string;
  kind: MaterialKind;
  visible: boolean;
  settled: boolean;
  hasLogo: boolean;
  hasUnderline: boolean;
  hasGrassLogo: boolean;
  grassBladeCount: number;
  logoFillRatio: number;
  underlineScaleY: number;
  pressure: number;
  stains: number;
  scratches: number;
  cuts: number;
  cutBladeCount: number;
  lastHapticKind: string;
  screenX: number;
  screenY: number;
};

type SocialDebugRecord = SocialMaterialDebug & {
  state: PokeState;
};

declare global {
  interface Window {
    __uqrlSocialMaterials?: () => SocialMaterialDebug[];
  }
}

function compactText(blocks: readonly ContentBlock[]) {
  return blocks
    .flatMap((block) =>
      block.type === "list"
        ? block.items
        : block.type === "rubricList"
          ? block.items.map((item) => `${item.title} ${item.text}`)
          : "text" in block
            ? [block.text]
            : [],
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTabs(locale: string): SceneTab[] {
  return TAB_ORDER.map((id) => {
    const page = getPageContent(locale, id);
    return {
      id,
      label: page.nav.label,
      shortLabel: page.nav.shortLabel,
      title: page.hero.title,
      description: compactText(page.hero.body) || page.meta.description,
    };
  });
}

function getRenderPixelRatio() {
  return Math.min(window.devicePixelRatio || 1, 2);
}

function prepareModel(scene: THREE.Group, logoTexture: THREE.Texture) {
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  scene.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;

    const mesh = child as THREE.Mesh<
      THREE.BufferGeometry,
      THREE.Material | THREE.Material[]
    >;
    mesh.geometry.computeVertexNormals();
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];

    materials.forEach((material) => {
      const surface = material as THREE.MeshPhysicalMaterial;
      if (child.name === "Body1") {
        surface.map = logoTexture;
        surface.color.set(0xffffff);
        surface.roughness = 0.14;
        surface.metalness = 0.18;
        surface.clearcoat = 0.94;
        surface.clearcoatRoughness = 0.04;
      } else if (surface.color) {
        surface.map = null;
        surface.color.set(0x050608);
        surface.roughness = 0.2;
        surface.metalness = 0.58;
        surface.clearcoat = 0.86;
        surface.clearcoatRoughness = 0.08;
        surface.emissive?.set(0x07090f);
        surface.emissiveIntensity = 0.12;
      }
      surface.needsUpdate = true;
    });
  });
}

function KeythingModel({
  sectionIndex,
  reducedMotion,
}: {
  sectionIndex: number;
  reducedMotion: boolean;
}) {
  const gltf = useLoader(GLTFLoader, MODEL_PATH);
  const logoTexture = useLoader(THREE.TextureLoader, LABS_LOGO_PATH);
  const group = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    prepareModel(gltf.scene, logoTexture);
  }, [gltf.scene, logoTexture]);

  useFrame((_, delta) => {
    const object = group.current;
    if (!object) return;
    const targetY = -sectionIndex * SECTION_Y_STEP;
    object.position.y = THREE.MathUtils.damp(
      object.position.y,
      targetY,
      3.2,
      delta,
    );
    if (!reducedMotion) object.rotation.y += delta * 0.035;
  });

  return (
    <group
      ref={group}
      position={[0, 0, -20]}
      rotation={[
        THREE.MathUtils.degToRad(-20),
        THREE.MathUtils.degToRad(160),
        THREE.MathUtils.degToRad(180),
      ]}
      scale={0.1}
      userData={{ keything: true, bodyMaterial: "black", logo: "outer" }}
    >
      <primitive object={gltf.scene} />
    </group>
  );
}

function makeStarPositions(
  count: number,
  spread: number,
  depth: number,
  seed: number,
) {
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const phase = index + seed * 31;
    positions[index * 3] =
      ((Math.sin(phase * 12.9898) * 43758.5453) % 1) * spread;
    positions[index * 3 + 1] =
      ((Math.sin(phase * 78.233) * 43758.5453) % 1) * spread;
    positions[index * 3 + 2] =
      -Math.abs(((Math.sin(phase * 39.425) * 43758.5453) % 1) * depth) - 12;
  }
  return positions;
}

function StarLayer({
  count,
  spread,
  depth,
  size,
  opacity,
  speed,
  reducedMotion,
  seed,
}: (typeof STAR_LAYERS)[number] & { reducedMotion: boolean; seed: number }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(
    () => makeStarPositions(count, spread, depth, seed),
    [count, depth, seed, spread],
  );

  useFrame((_, delta) => {
    if (reducedMotion || !points.current) return;
    points.current.rotation.y += delta * speed;
    points.current.rotation.x += delta * speed * 0.35;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={seed === 1 ? "#fff3d2" : seed === 2 ? "#dbeafe" : "#f8fafc"}
        size={size}
        sizeAttenuation
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </points>
  );
}

function Starfield({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group
      userData={{
        batchedStars: true,
        starCount: STAR_LAYERS.reduce((sum, layer) => sum + layer.count, 0),
      }}
    >
      {STAR_LAYERS.map((layer, index) => (
        <StarLayer
          key={layer.count}
          {...layer}
          seed={index + 1}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}

function RainbowBackdrop({ reducedMotion }: { reducedMotion: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0.68 },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (!material.current || reducedMotion) return;
    material.current.uniforms.uTime.value += delta;
  });

  return (
    <mesh
      position={[0, 0, -100]}
      scale={[1.36, 1.36, 1]}
      renderOrder={-10}
      userData={{ backgroundRainbow: true, radiusScale: 1.6, decay: "slow" }}
    >
      <planeGeometry args={[58, 58]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={rainbowVertexShader}
        fragmentShader={rainbowFragmentShader}
        transparent
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

function SectionArtwork({
  path,
  position,
  size,
}: {
  path: string;
  position: [number, number, number];
  size: [number, number];
}) {
  const texture = useLoader(THREE.TextureLoader, path);

  useLayoutEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
  }, [texture]);

  return (
    <mesh position={position} userData={{ sectionArtwork: path }}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={texture} transparent opacity={0.92} />
    </mesh>
  );
}

type CommitteeMemberConfig = SceneMember & {
  accentColor: string;
  pathVariant: string;
  index: number;
  row: number;
  column: number;
  rowLength: number;
};

function getCommitteeMembers(
  site: ReturnType<typeof getSiteContent>,
): CommitteeMemberConfig[] {
  return site.committee.rows.flatMap((roleRow, row) => {
    const members = roleRow.flatMap((roleSlug) => {
      const role = site.roles[roleSlug];
      return (
        role?.members.map((member) => ({
          image: member.photo,
          name: member.name,
          title: member.role || role.role,
          body:
            member.bio || member.shortBio || role.microcopy || role.slugline,
          url: member.linkedin,
          accentColor: member.accentColor || role.accentColor,
          pathVariant:
            member.pathVariant || role.pathVariant || "underline-swoop",
          row,
          column: 0,
          rowLength: 1,
          index: 0,
        })) ?? []
      );
    });
    return members.map((member, column) => ({
      ...member,
      column,
      rowLength: members.length,
      index: row * 10 + column,
    }));
  });
}

function CommitteeMember({
  member,
  onSelect,
}: {
  member: CommitteeMemberConfig;
  onSelect: (member: SceneMember) => void;
}) {
  const texture = useLoader(THREE.TextureLoader, member.image);
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useLayoutEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
  }, [texture]);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    const target = hovered ? 1.1 : 1;
    const scale = THREE.MathUtils.damp(mesh.current.scale.x, target, 8, delta);
    mesh.current.scale.setScalar(scale);
  });

  const x = (member.column - (member.rowLength - 1) / 2) * 2.7;
  const y = 1.2 - member.row * 2.55;

  return (
    <group position={[x, y, -8]}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: the canvas has a keyboard-accessible profile fallback link. */}
      <mesh
        ref={mesh}
        onPointerOver={() => {
          setHovered(true);
          document.body.dataset.contentHover = "committee";
          document.body.dataset.committeeGroup =
            member.row === 0 ? "role" : "content";
          document.body.dataset.pathVariant = member.pathVariant;
          document.body.style.setProperty(
            "--committee-accent",
            member.accentColor,
          );
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.removeAttribute("data-content-hover");
          document.body.removeAttribute("data-committee-group");
          document.body.removeAttribute("data-path-variant");
          document.body.style.removeProperty("--committee-accent");
        }}
        onClick={() => onSelect(member)}
        userData={{ committeeMember: member.name, role: member.title }}
      >
        <planeGeometry args={[1.9, 1.9]} />
        <meshBasicMaterial map={texture} transparent opacity={0.96} />
      </mesh>
    </group>
  );
}

function CommitteeScene({
  site,
  onSelect,
}: {
  site: ReturnType<typeof getSiteContent>;
  onSelect: (member: SceneMember) => void;
}) {
  const members = useMemo(() => getCommitteeMembers(site), [site]);
  return (
    <group userData={{ committeeScene: true }}>
      {members.map((member) => (
        <CommitteeMember
          key={`${member.name}-${member.index}`}
          member={member}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

function GrassBlades({
  blades,
  width,
  height,
  reducedMotion,
}: {
  blades: ReturnType<typeof createGrassBladeInstances>;
  width: number;
  height: number;
  reducedMotion: boolean;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((state) => {
    const target = mesh.current;
    if (!target) return;
    const time = reducedMotion ? 0 : state.clock.elapsedTime;
    blades.forEach((blade, index) => {
      const wind = Math.sin(time * 0.9 + index * 0.37) * 0.035;
      dummy.position.set(
        (blade.x - 0.5) * width,
        (blade.y - 0.5) * height,
        0.24,
      );
      dummy.rotation.set(wind, 0, blade.angle * 0.18);
      dummy.scale.set(blade.width / 0.02, blade.height / 0.7, 1);
      dummy.updateMatrix();
      target.setMatrixAt(index, dummy.matrix);
    });
    target.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, blades.length]}
      frustumCulled={false}
    >
      <planeGeometry args={[0.02, 0.7, 1, 2]} />
      <meshStandardMaterial
        color="#9bd45b"
        roughness={0.78}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

type SocialCardProps = {
  label: string;
  url: string;
  texture: string;
  material: MaterialKind;
  accent: string;
  index: number;
  reducedMotion: boolean;
  onRegister: (record: SocialDebugRecord) => void;
};

function SocialCard({
  label,
  url,
  texture,
  material,
  accent,
  index,
  reducedMotion,
  onRegister,
}: SocialCardProps) {
  const config = getMaterialPreset(material);
  const poke = usePokeSurface(material, {
    hoverPressure: 0.25,
    pressPressure: 0.95,
    reducedMotion,
  });
  const card = useRef<THREE.Mesh>(null);
  const underline = useRef<THREE.Mesh>(null);
  const logoTexture = useLoader(THREE.TextureLoader, texture);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const blades = useMemo(
    () =>
      material === "grass"
        ? createGrassBladeInstances({
            count: Math.max(420, config.bladeCount),
            seed: index + 7,
            mask: (x, y) => {
              const envelope =
                Math.abs(x - 0.5) < 0.36 && Math.abs(y - 0.5) < 0.24;
              const fold =
                Math.abs(y - (0.5 + Math.abs(x - 0.5) * 0.44)) < 0.035;
              return envelope && (fold || y < 0.48 || y > 0.66);
            },
          })
        : [],
    [config.bladeCount, index, material],
  );
  const record = useRef<SocialDebugRecord>({
    label,
    kind: material,
    visible: true,
    settled: false,
    hasLogo: true,
    hasUnderline: true,
    hasGrassLogo: material === "grass",
    grassBladeCount: blades.length,
    logoFillRatio: 1,
    underlineScaleY: 1,
    pressure: 0,
    stains: 0,
    scratches: 0,
    cuts: 0,
    cutBladeCount: 0,
    lastHapticKind: "hover",
    screenX: 0,
    screenY: 0,
    state: poke.stateRef.current,
  });

  useLayoutEffect(() => {
    logoTexture.colorSpace = THREE.SRGBColorSpace;
  }, [logoTexture]);

  useEffect(() => {
    onRegister(record.current);
  }, [onRegister]);

  const markContact = useCallback(
    (
      event: ThreeEvent<PointerEvent> | undefined,
      pressure: number,
      phase: "hover" | "press" | "release",
    ) => {
      if (event && phase === "hover") {
        poke.handlers.onPointerMove(
          event as unknown as Parameters<typeof poke.handlers.onPointerMove>[0],
        );
      }
      if (event && phase === "press") {
        poke.handlers.onPointerDown(
          event as unknown as Parameters<typeof poke.handlers.onPointerDown>[0],
        );
      }
      if (phase === "release") poke.handlers.onPointerUp();
      record.current.lastHapticKind = getMaterialEventKind(
        config,
        poke.stateRef.current,
        pressure,
      );
      document.body.dataset.materialType = material;
      document.body.dataset.pointerActive =
        phase === "release" ? "false" : "true";
      document.body.dataset.interactionState =
        phase === "press" ? "pressed" : phase;
    },
    [config, material, poke.handlers, poke.stateRef],
  );

  useFrame((state, delta) => {
    const current = poke.step(delta * 1000);
    const response = getMaterialResponse(config, current);
    if (card.current) applyFeelableMeshResponse(card.current, config, current);
    if (underline.current) {
      underline.current.scale.set(
        1 + response.bulge * 0.1,
        1 + current.pressure * 0.4,
        1,
      );
    }
    if (card.current) {
      projected
        .set(0, 0, 0)
        .applyMatrix4(card.current.matrixWorld)
        .project(state.camera);
      const rect = state.gl.domElement.getBoundingClientRect();
      record.current.screenX =
        rect.left + (projected.x * 0.5 + 0.5) * rect.width;
      record.current.screenY =
        rect.top + (-projected.y * 0.5 + 0.5) * rect.height;
    }
    record.current.state = current;
    record.current.pressure = current.pressure;
    record.current.stains = current.stains;
    record.current.scratches = current.scratches;
    record.current.cuts = current.cuts;
    record.current.underlineScaleY = underline.current?.scale.y ?? 1;
    record.current.settled = current.pressure < 0.01 && current.stains < 0.01;
  });

  const row = Math.floor(index / 3);
  const column = index % 3;
  const x = (column - 1) * 3.3;
  const y = row === 0 ? 1.7 : -1.1;

  return (
    <group position={[x, y, -8]} userData={{ socialLabel: label, material }}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: the R3F mesh is the visible, keyboard-fallback-backed surface. */}
      <mesh
        ref={card}
        {...poke.handlers}
        onPointerMove={(event: ThreeEvent<PointerEvent>) =>
          markContact(event, 0.25, "hover")
        }
        onPointerDown={(event: ThreeEvent<PointerEvent>) =>
          markContact(event, 0.95, "press")
        }
        onPointerUp={() => markContact(undefined, 0, "release")}
        onPointerLeave={() => {
          poke.handlers.onPointerLeave();
          document.body.dataset.pointerActive = "false";
          document.body.dataset.interactionState = "release";
        }}
        onClick={() => {
          if (url.startsWith("mailto:")) window.location.href = url;
          else window.open(url, "_blank", "noopener,noreferrer");
        }}
        castShadow
        receiveShadow
        userData={{
          socialLabel: label,
          material,
          hasLogo: true,
          hasUnderline: true,
        }}
      >
        <boxGeometry args={[SOCIAL_CARD_WIDTH, SOCIAL_CARD_HEIGHT, 0.42]} />
        <meshPhysicalMaterial
          color={accent}
          roughness={config.roughness}
          metalness={
            material === "glass" ? 0.08 : material === "enamel" ? 0.45 : 0.06
          }
          clearcoat={material === "glass" || material === "enamel" ? 0.9 : 0.35}
          clearcoatRoughness={material === "glass" ? 0.03 : 0.12}
          transmission={material === "glass" ? 0.2 : 0}
          transparent={material === "glass"}
          opacity={material === "glass" ? 0.84 : 1}
        />
      </mesh>
      <mesh position={[0, 0.08, 0.24]} scale={[0.78, 0.74, 1]}>
        <planeGeometry args={[1.8, 1.05]} />
        <meshBasicMaterial map={logoTexture} transparent opacity={0.9} />
      </mesh>
      <mesh ref={underline} position={[0, -0.78, 0.24]}>
        <planeGeometry args={[1.42, 0.055]} />
        <meshBasicMaterial color="#fff3d2" transparent opacity={0.78} />
      </mesh>
      {material === "grass" ? (
        <GrassBlades
          blades={blades}
          width={SOCIAL_CARD_WIDTH * 0.78}
          height={SOCIAL_CARD_HEIGHT * 0.7}
          reducedMotion={reducedMotion}
        />
      ) : null}
    </group>
  );
}

function SocialScene({
  links,
  reducedMotion,
  onReady,
}: {
  links: ReturnType<typeof getSiteContent>["socialLinks"];
  reducedMotion: boolean;
  onReady: () => void;
}) {
  const diagnostics = useRef<SocialDebugRecord[]>([]);
  const register = useCallback((record: SocialDebugRecord) => {
    const existing = diagnostics.current.findIndex(
      (item) => item.label === record.label,
    );
    if (existing >= 0) diagnostics.current[existing] = record;
    else diagnostics.current.push(record);
  }, []);

  useEffect(() => {
    window.__uqrlSocialMaterials = () =>
      diagnostics.current.map(({ state: _state, ...record }) => ({
        ...record,
      }));
    onReady();
    return () => {
      delete window.__uqrlSocialMaterials;
    };
  }, [onReady]);

  return (
    <group userData={{ socialMaterialScene: true }}>
      {links.map((social, index) => (
        <SocialCard
          key={social.label}
          label={social.label}
          url={social.url}
          texture={social.texture}
          material={resolveSocialMaterialKind(social)}
          accent={social.accent}
          index={index}
          reducedMotion={reducedMotion}
          onRegister={register}
        />
      ))}
    </group>
  );
}

function SceneContent({
  sectionIndex,
  site,
  socials,
  reducedMotion,
  onSectionReady,
  onSelectMember,
}: {
  sectionIndex: number;
  site: ReturnType<typeof getSiteContent>;
  socials: ReturnType<typeof getSiteContent>["socialLinks"];
  reducedMotion: boolean;
  onSectionReady: () => void;
  onSelectMember: (member: SceneMember) => void;
}) {
  useEffect(() => {
    void sectionIndex;
    onSectionReady();
  }, [onSectionReady, sectionIndex]);

  return (
    <>
      <color attach="background" args={[CLEAR_COLOUR]} />
      <fog attach="fog" args={[CLEAR_COLOUR, 40, 180]} />
      <ambientLight intensity={0.45} color="#e8edff" />
      <hemisphereLight args={["#ffffff", "#2a2f45", 0.95]} />
      <directionalLight
        position={[2, 10, 40]}
        intensity={1.45}
        color="#ffffff"
        castShadow
      />
      <directionalLight
        position={[-12, 4, 25]}
        intensity={0.62}
        color="#bfd2ff"
      />
      <Starfield reducedMotion={reducedMotion} />
      {sectionIndex === 0 ? (
        <RainbowBackdrop reducedMotion={reducedMotion} />
      ) : null}
      <KeythingModel
        sectionIndex={sectionIndex}
        reducedMotion={reducedMotion}
      />
      {sectionIndex === 1 ? (
        <SectionArtwork
          path="/Assets/images/rubric.png"
          position={[2.25, -0.8, -9]}
          size={[3.4, 2.15]}
        />
      ) : null}
      {sectionIndex === 2 ? (
        <SocialScene
          links={socials}
          reducedMotion={reducedMotion}
          onReady={onSectionReady}
        />
      ) : null}
      {sectionIndex === 3 ? (
        <SectionArtwork
          path="/Assets/images/nuaxion_logo.avif"
          position={[0, -0.8, -9]}
          size={[4.2, 2.1]}
        />
      ) : null}
      {sectionIndex === 4 ? (
        <CommitteeScene site={site} onSelect={onSelectMember} />
      ) : null}
    </>
  );
}

function JoinStateController({
  sectionIndex,
  joinHref,
  state,
  setState,
}: {
  sectionIndex: number;
  joinHref: string;
  state: JoinUsState;
  setState: (next: JoinUsState) => void;
}) {
  const hoverTimer = useRef<number | undefined>(undefined);
  const recoveryTimer = useRef<number | undefined>(undefined);
  const navigationTimer = useRef<number | undefined>(undefined);
  const stateRef = useRef(state);

  stateRef.current = state;

  useEffect(() => {
    document.body.dataset.joinState = state;
    document.body.dataset.joinWink =
      state === joinUsStates.rubricsHoverExcited ||
      state === joinUsStates.rubricsHoverBlush ||
      state === joinUsStates.rubricsClickCelebration
        ? "true"
        : "false";
  }, [state]);

  useEffect(() => {
    document.body.dataset.trailsReady = "true";
    return () => {
      delete document.body.dataset.trailsReady;
      delete document.body.dataset.joinWink;
    };
  }, []);

  useEffect(() => {
    if (sectionIndex !== 1) {
      setState(joinUsStates.idleCurious);
      return;
    }

    const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
    const link = document.querySelector<HTMLAnchorElement>(
      "#join-us-accessible-link",
    );
    const word = document.querySelector<SVGGraphicsElement>(
      ".bee-trail__join-word",
    );
    if (!canvas || !link) return;

    const setPupil = (event: PointerEvent) => {
      const pupil = document.querySelector<SVGCircleElement>(
        ".bee-trail--join .bee-trail__eye--o .bee-trail__eye-pupil",
      );
      const rect = word?.getBoundingClientRect();
      if (!pupil || !rect || rect.width <= 0 || rect.height <= 0) return;
      const x =
        (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const y =
        (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      pupil.setAttribute(
        "transform",
        `translate(${(x * 2).toFixed(2)} ${(y * 1.2).toFixed(2)})`,
      );
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = word?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      const padding = 76;
      const near =
        event.clientX >= rect.left - padding &&
        event.clientX <= rect.right + padding &&
        event.clientY >= rect.top - padding &&
        event.clientY <= rect.bottom + padding;
      setPupil(event);
      if (
        stateRef.current === joinUsStates.idleCurious ||
        stateRef.current === joinUsStates.joinNear
      ) {
        setState(
          nextJoinUsState(
            stateRef.current,
            near ? "pointerNear" : "pointerAway",
          ),
        );
      }
    };

    const onFocus = () => {
      window.clearTimeout(recoveryTimer.current);
      setState(nextJoinUsState(stateRef.current, "rubricsHover"));
    };
    const onBlur = () => {
      window.clearTimeout(hoverTimer.current);
      window.clearTimeout(recoveryTimer.current);
      setState(nextJoinUsState(stateRef.current, "rubricsLeave"));
      recoveryTimer.current = window.setTimeout(() => {
        setState(joinUsStates.recoveringToIdle);
        recoveryTimer.current = window.setTimeout(
          () => setState(joinUsStates.idleCurious),
          180,
        );
      }, 760);
    };
    const onClick = (event: MouseEvent) => {
      event.preventDefault();
      if (navigationTimer.current !== undefined) return;
      setState(nextJoinUsState(stateRef.current, "rubricsClick"));
      navigationTimer.current = window.setTimeout(() => {
        navigationTimer.current = undefined;
        window.open(joinHref, "_blank", "noopener,noreferrer");
      }, JOIN_US_NAVIGATION_DELAY_MS);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onClick(event as unknown as MouseEvent);
    };

    canvas.addEventListener("pointermove", onPointerMove, { passive: true });
    link.addEventListener("focus", onFocus);
    link.addEventListener("blur", onBlur);
    link.addEventListener("click", onClick);
    link.addEventListener("keydown", onKeyDown);

    return () => {
      canvas.removeEventListener("pointermove", onPointerMove);
      link.removeEventListener("focus", onFocus);
      link.removeEventListener("blur", onBlur);
      link.removeEventListener("click", onClick);
      link.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(hoverTimer.current);
      window.clearTimeout(recoveryTimer.current);
      window.clearTimeout(navigationTimer.current);
    };
  }, [joinHref, sectionIndex, setState]);

  useEffect(() => {
    if (state !== joinUsStates.rubricsHoverExcited) return;
    hoverTimer.current = window.setTimeout(
      () => setState(joinUsStates.rubricsHoverBlush),
      JOIN_US_BLUSH_DELAY_MS,
    );
    return () => window.clearTimeout(hoverTimer.current);
  }, [setState, state]);

  return null;
}

export function ThreeSceneExperience({
  locale,
  labels,
  onReady,
}: {
  locale: string;
  labels: Parameters<typeof SceneDomScaffold>[0]["labels"];
  onReady: () => void;
}) {
  const tabs = useMemo(() => getTabs(locale), [locale]);
  const site = useMemo(() => getSiteContent(locale), [locale]);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [sectionReady, setSectionReady] = useState(false);
  const [joinState, setJoinState] = useState<JoinUsState>(
    joinUsStates.idleCurious,
  );
  const [selectedMember, setSelectedMember] = useState<SceneMember | null>(
    null,
  );
  const [reducedMotion, setReducedMotion] = useState(false);
  const sectionRef = useRef(sectionIndex);
  const scrollLock = useRef(false);

  sectionRef.current = sectionIndex;

  const navigate = useCallback(
    (index: number) => {
      if (index < 0 || index >= tabs.length || index === sectionRef.current)
        return;
      setSectionReady(false);
      setSectionIndex(index);
    },
    [tabs.length],
  );

  const markSectionReady = useCallback(() => {
    setSectionReady(true);
  }, []);

  const selectMember = useCallback((member: SceneMember) => {
    setSelectedMember(member);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(media.matches);
      document.body.dataset.reducedMotion = String(media.matches);
    };
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    document.body.dataset.section = String(sectionIndex);
    document.body.dataset.sectionReady = String(sectionReady);
    document.body.dataset.sceneReady = "true";
    document.body.dataset.contentHover = "";
  }, [sectionIndex, sectionReady]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input,textarea,select")) return;
      const actions: Record<string, () => void> = {
        ArrowDown: () => navigate(sectionRef.current + 1),
        ArrowRight: () => navigate(sectionRef.current + 1),
        PageDown: () => navigate(sectionRef.current + 1),
        ArrowUp: () => navigate(sectionRef.current - 1),
        ArrowLeft: () => navigate(sectionRef.current - 1),
        PageUp: () => navigate(sectionRef.current - 1),
        Home: () => navigate(0),
        End: () => navigate(tabs.length - 1),
      };
      const action = actions[event.key];
      if (!action) return;
      event.preventDefault();
      action();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate, tabs.length]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  const about = getPageContent(locale, "about");
  const joinHref = about.hero.cta?.href ?? "#nav-links";
  const navItems = tabs.map(({ id, label, shortLabel }) => ({
    id,
    label,
    shortLabel,
  }));
  const socialLinks = site.socialLinks.map(({ label, url }) => ({
    label,
    url,
  }));

  return (
    <>
      <SceneDomScaffold
        labels={labels}
        navItems={navItems}
        activeSection={sectionIndex}
        joinHref={joinHref}
        joinLabel={about.hero.cta?.label ?? site.animationCopy.joinUs}
        socialLinks={socialLinks}
        sectionTitle={tabs[sectionIndex]?.title ?? "UQ Reality Labs"}
        sectionDescription={tabs[sectionIndex]?.description ?? ""}
        selectedMember={selectedMember}
        onNavigate={navigate}
        onCloseMember={() => setSelectedMember(null)}
      >
        <Canvas
          id="canvas"
          aria-label={labels.sceneLabel}
          dpr={getRenderPixelRatio()}
          camera={{ fov: 60, near: 0.1, far: 2000, position: [0, 0, 5] }}
          gl={{
            antialias: getRenderPixelRatio() <= 2,
            powerPreference: "high-performance",
          }}
          events={(state) => ({
            ...r3fEvents(state),
            compute: (event, currentState) => {
              const rect = currentState.gl.domElement.getBoundingClientRect();
              currentState.pointer.set(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1,
              );
              currentState.raycaster.setFromCamera(
                currentState.pointer,
                currentState.camera,
              );
            },
          })}
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.04;
          }}
          onWheel={(event) => {
            if (scrollLock.current || Math.abs(event.deltaY) < 30) return;
            scrollLock.current = true;
            navigate(sectionRef.current + (event.deltaY > 0 ? 1 : -1));
            window.setTimeout(
              () => {
                scrollLock.current = false;
              },
              reducedMotion ? 0 : 420,
            );
          }}
        >
          <Suspense fallback={null}>
            <SceneContent
              sectionIndex={sectionIndex}
              site={site}
              socials={site.socialLinks}
              reducedMotion={reducedMotion}
              onSectionReady={markSectionReady}
              onSelectMember={selectMember}
            />
          </Suspense>
        </Canvas>
      </SceneDomScaffold>
      <JoinStateController
        sectionIndex={sectionIndex}
        joinHref={joinHref}
        state={joinState}
        setState={setJoinState}
      />
    </>
  );
}
