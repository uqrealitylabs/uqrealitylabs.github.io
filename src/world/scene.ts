import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import * as THREE from "three/webgpu";
import type { capital } from "./capital";
import { earthRadius, locate } from "./geography";
import { isStation, loadWorld, makeLab, type Station, viewpoints } from "./lab";
import { liveWorld } from "./live";
import { release } from "./models";
import { worldState } from "./state";
import { solarDirection } from "./sun";
import { travel } from "./travel";

function makeAward(visual: string) {
  const group = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({
    color: 0xe6be66,
    metalness: 0.8,
    roughness: 0.23,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x282b24,
    metalness: 0.3,
    roughness: 0.4,
  });
  const paper = new THREE.MeshStandardMaterial({
    color: 0xf0e6c8,
    roughness: 0.65,
  });
  const add = (
    geometry: THREE.BufferGeometry,
    material = gold,
    x = 0,
    y = 0,
    z = 0,
  ) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };
  if (visual === "trophy") {
    add(new THREE.CylinderGeometry(0.62, 0.75, 0.25, 32), dark, 0, -1.1);
    add(new THREE.CylinderGeometry(0.16, 0.23, 0.8, 24), gold, 0, -0.6);
    const points = [
      [0.12, -0.3],
      [0.3, -0.2],
      [0.52, 0],
      [0.7, 0.4],
      [0.76, 0.85],
      [0.69, 0.85],
      [0.62, 0.4],
      [0.44, 0.1],
      [0.2, -0.15],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    add(new THREE.LatheGeometry(points, 48));
    for (const side of [-1, 1]) {
      const handle = add(
        new THREE.TorusGeometry(0.48, 0.075, 12, 32, Math.PI * 1.3),
        gold,
        side * 0.62,
        0.35,
      );
      handle.rotation.z = side > 0 ? -Math.PI * 0.65 : Math.PI * 0.35;
    }
    add(new THREE.BoxGeometry(0.68, 0.13, 0.03), gold, 0, -1.09, 0.7);
  } else if (visual === "medal" || visual === "badge") {
    const sides = visual === "badge" ? 8 : 64;
    const disc = add(new THREE.CylinderGeometry(0.9, 0.9, 0.17, sides));
    disc.rotation.x = Math.PI / 2;
    add(new THREE.TorusGeometry(0.72, 0.035, 8, 64), gold, 0, 0, 0.11);
    const emblem = add(
      new THREE.TorusGeometry(0.4, 0.09, 12, 48, Math.PI * 1.65),
      gold,
      0,
      0,
      0.15,
    );
    emblem.rotation.z = Math.PI * 0.675;
    add(new THREE.BoxGeometry(0.14, 0.5, 0.12), gold, 0, 0.3, 0.16);
    for (const side of [-1, 1]) {
      const ribbon = add(
        new THREE.BoxGeometry(0.3, 0.85, 0.08),
        new THREE.MeshStandardMaterial({
          color: side < 0 ? 0xb6a0ee : 0xf7a76f,
          roughness: 0.8,
        }),
        side * 0.22,
        1.02,
        -0.09,
      );
      ribbon.rotation.z = side * -0.25;
    }
  } else {
    add(new THREE.BoxGeometry(1.65, 2, 0.15), gold);
    add(
      new THREE.BoxGeometry(1.43, 1.78, 0.05),
      visual === "certificate" ? paper : dark,
      0,
      0,
      0.1,
    );
    const seal = add(
      new THREE.CylinderGeometry(0.24, 0.24, 0.05, 32),
      gold,
      0,
      -0.5,
      0.16,
    );
    seal.rotation.x = Math.PI / 2;
    for (let i = 0; i < 4; i++)
      add(
        new THREE.BoxGeometry(i === 0 ? 0.9 : 0.7, 0.045, 0.03),
        gold,
        0,
        0.6 - i * 0.18,
        0.15,
      );
  }
  return group;
}

export async function createScene(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  visual?: string,
  signal?: AbortSignal,
) {
  const world = visual ? undefined : await loadWorld(signal);
  if (signal?.aborted)
    throw new DOMException("Scene loading cancelled", "AbortError");
  const stage =
    host.querySelector<HTMLElement>(
      ".award-object__stage, .specimen__viewport",
    ) ?? host;
  const renderer = new THREE.WebGPURenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  let pixelRatioLimit = 1.5;
  let frameInterval = 1 / 30;
  let softwareRenderer = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioLimit));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  const scene = new THREE.Scene();
  const dusk = new THREE.Color(0x182635);
  const space = new THREE.Color(0x07131e);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 900);
  const object = new THREE.Group();
  scene.add(object);
  const sky = new THREE.HemisphereLight(0xc1d7eb, 0x514a52, 0.9);
  scene.add(sky);
  const key = new THREE.DirectionalLight(0xfff5e6, 3.5);
  key.position.set(-4, 6, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc6afff, 3.5);
  rim.position.set(4, 2, -3);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xd9caff, 1.2);
  fill.position.set(-3, -2, 4);
  scene.add(fill);
  if (!visual) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, {
      left: -24,
      right: 24,
      top: 24,
      bottom: -24,
      near: 1,
      far: 120,
    });
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.025;
    key.position.set(-18, 28, 14);
    key.color.set(0xffd5a3);
    key.intensity = 2.6;
    rim.intensity = 1.1;
    fill.intensity = 0.45;
    scene.environmentIntensity = 0.45;
    scene.background = new THREE.Color(0x182635);
    scene.fog = new THREE.FogExp2(0x182635, 0.014);
  }
  let lab: Awaited<ReturnType<typeof makeLab>> | undefined;
  let selected: Station = "home";
  let progress = 0;
  let journey = 0;
  let environment: THREE.RenderTarget | undefined;
  const eye = new THREE.Vector3();
  const at = new THREE.Vector3();
  const destination = new THREE.Vector3();
  const focus = new THREE.Vector3();
  let travelling = false;
  const textures: { texture: THREE.Texture; bitmap: ImageBitmap }[] = [];
  const raycaster = new THREE.Raycaster();
  let hovered: Station | undefined;
  let pressed: { x: number; y: number } | undefined;
  let disposed = false;
  let ready = false;
  let visible = true;
  let lost = false;
  let frame = 0;
  let lastFrame = 0;
  let targetX = 0;
  let targetY = 0;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let paused = reduced.matches;
  let lightX = 0;
  let lightY = 0;
  let settling = false;
  let solarTimer: ReturnType<typeof setInterval> | undefined;
  const sun = new THREE.Vector3(-0.5, 0.8, 0.5);
  let started = performance.now();
  const drift = new THREE.Vector3();
  let live: ReturnType<typeof liveWorld> | undefined;
  let weatherArea = -1;
  let unsubscribe: (() => void) | undefined;
  const labels = [...host.querySelectorAll<HTMLElement>(".world-label")].map(
    (element) => ({
      element,
      longitude: Number(element.dataset.longitude),
      latitude: Number(element.dataset.latitude),
      offset: Number(element.dataset.offset),
      kind: element.dataset.kind,
    }),
  );
  let destinationCity: Awaited<ReturnType<typeof capital>> | undefined;
  let cityRequest: AbortController | undefined;
  let cityFlight:
    | {
        started: number;
        from: THREE.Vector3;
        at: THREE.Vector3;
        to: THREE.Vector3;
        target: THREE.Vector3;
        up: THREE.Vector3;
      }
    | undefined;
  const cityStatus = host
    .closest(".world")
    ?.querySelector<HTMLElement>(".world-destination");
  const returnWorld = host
    .closest(".world")
    ?.querySelector<HTMLButtonElement>(".world-return");
  const flyCity = async (name: string) => {
    cityRequest?.abort();
    cityFlight = undefined;
    if (destinationCity) {
      destinationCity.group.removeFromParent();
      release(destinationCity.group);
      destinationCity = undefined;
    }
    if (returnWorld) returnWorld.hidden = !name;
    if (cityStatus) {
      cityStatus.hidden = !name;
      cityStatus.textContent = name;
    }
    document.body.dataset.city = name;
    delete host.dataset.city;
    if (!name || !lab) {
      onScroll();
      updateSolar();
      return;
    }
    const label = labels.find(
      (p) => p.element.textContent === name && p.kind === "city",
    );
    if (!label) return;
    const request = new AbortController();
    cityRequest = request;
    try {
      const { capital } = await import("./capital");
      const city = await capital(
        name,
        [label.longitude, label.latitude],
        request.signal,
      );
      if (disposed || request.signal.aborted || !lab) {
        release(city.group);
        return;
      }
      destinationCity = city;
      const centre = lab.earth.point(label.longitude, label.latitude);
      const up = centre.clone().sub(lab.globe.position).normalize();
      const east = lab.earth
        .point(label.longitude + 0.001, label.latitude)
        .sub(centre)
        .normalize();
      const south = east.clone().cross(up).normalize();
      east.copy(up).cross(south).normalize();
      city.group.quaternion.setFromRotationMatrix(
        new THREE.Matrix4().makeBasis(east, up, south),
      );
      city.group.position.copy(centre);
      object.add(city.group);
      city.group.updateMatrixWorld(true);
      const target = city.group.localToWorld(
        new THREE.Vector3(0, city.height(0, 0) + 1, 0),
      );
      const to = city.group.localToWorld(
        new THREE.Vector3(40, city.height(0, 0) + 28, 42),
      );
      cityFlight = {
        started: performance.now(),
        from: eye.clone(),
        at: at.clone(),
        to,
        target,
        up,
      };
      host.dataset.city = name;
      updateSolar();
      wake();
    } catch (error) {
      if (!request.signal.aborted && cityStatus)
        cityStatus.textContent = `${name} map unavailable`;
      if (!request.signal.aborted)
        console.warn("City fly-in unavailable", error);
    }
  };
  const projected = new THREE.Vector3();
  const updateSolar = () => {
    if (!lab || disposed || lost || !visible || document.hidden) return;
    sun.copy(solarDirection(new Date(), lab.globe.quaternion));
    lab.earth.sun.value.copy(sun);
    const localSun = cityFlight ? sun.dot(cityFlight.up) : sun.y;
    const daylight = THREE.MathUtils.smoothstep(localSun, -0.1, 0.28);
    const cloud = (live?.conditions(journey)?.cloud ?? 0) / 100;
    key.intensity = 2.6 * daylight * (1 - cloud * 0.6);
    key.color.set(daylight > 0.6 ? 0xfff1d7 : 0xffb783);
    sky.intensity = 0.08 + daylight * 0.65;
    rim.intensity = 0.08 + daylight * 0.35;
    fill.intensity = 0.06 + daylight * 0.18;
    scene.environmentIntensity = 0.06 + daylight * 0.35;
    dusk.set(0x07131e).lerp(new THREE.Color(0x7595a0), daylight);
    lab.lampGlow.emissiveIntensity = (1 - daylight) * 4;
    for (const window of [
      ...lab.windows,
      ...(destinationCity?.windows ?? []),
    ]) {
      window.emissive.set(0xffcf86);
      window.emissiveIntensity = (1 - daylight) * 0.5;
    }
    const centre =
      journey > 0.3 ? new THREE.Vector2(30, -76) : new THREE.Vector2(0, 0);
    const field = lab.field;
    const nearby = [...lab.lampPositions].sort(
      (a, b) => a.distanceToSquared(centre) - b.distanceToSquared(centre),
    );
    lab.pools.forEach((light, i) => {
      const p = nearby[i];
      light.intensity = p ? (1 - daylight) * 0.28 : 0;
      if (p) light.position.set(p.x, field.heightAt(p.x, p.y) + 0.18, p.y);
    });
    key.shadow.needsUpdate = true;
    host.dataset.phase =
      daylight > 0.85 ? "day" : daylight < 0.15 ? "night" : "twilight";
  };

  const render = () => {
    frame = 0;
    if (disposed || lost || !visible || document.hidden) return;
    const elapsed = (performance.now() - started) / 1000;
    if (paused || travelling || elapsed - lastFrame >= frameInterval) {
      const step = Math.min(0.25, elapsed - lastFrame);
      lastFrame = elapsed;
      if (lab) {
        const rate = paused ? 1 : 1 - Math.exp(-step * 8);
        journey = progress;
        const area = journey > 0.28 ? 1 : 0;
        if (weatherArea !== area) {
          weatherArea = area;
          updateSolar();
        }
        if (selected === "home") {
          if (cityFlight) {
            const t = THREE.MathUtils.smoothstep(
              (performance.now() - cityFlight.started) / 3000,
              0,
              1,
            );
            const start = cityFlight.from.clone().sub(lab.globe.position),
              end = cityFlight.to.clone().sub(lab.globe.position);
            const rotation = new THREE.Quaternion().setFromUnitVectors(
              start.clone().normalize(),
              end.clone().normalize(),
            );
            const direction = start
              .clone()
              .normalize()
              .applyQuaternion(new THREE.Quaternion().slerp(rotation, t));
            const altitude =
              Math.max(20, start.length() - earthRadius) *
              (Math.max(20, end.length() - earthRadius) /
                Math.max(20, start.length() - earthRadius)) **
                t;
            destination
              .copy(lab.globe.position)
              .addScaledVector(direction, earthRadius + altitude);
            if (t === 1) destination.copy(cityFlight.to);
            host.dataset.flight = t === 1 ? "landed" : "arriving";
            focus.copy(cityFlight.at).lerp(cityFlight.target, t);
          } else travel(journey, lab.earth, destination, focus);
          const orbit = THREE.MathUtils.smoothstep(journey, 0.58, 0.75);
          lab.globe.visible = journey > 0.57 || !!cityFlight;
          lab.landscape.visible = journey < 0.83 && !cityFlight;
          if (scene.background instanceof THREE.Color)
            scene.background.lerpColors(
              dusk,
              space,
              cityFlight
                ? 1 -
                    THREE.MathUtils.smoothstep(
                      (performance.now() - cityFlight.started) / 3000,
                      0.4,
                      1,
                    )
                : orbit,
            );
          if (scene.fog instanceof THREE.FogExp2) {
            scene.fog.color.lerpColors(dusk, space, orbit);
            scene.fog.density =
              (0.014 - 0.009 * THREE.MathUtils.smoothstep(journey, 0, 0.55)) *
              (cityFlight ? 1 : 1 - orbit);
          }
          lab.transit.update(journey);
          lab.transit.group.children.forEach((vehicle) => {
            if (vehicle.userData.route === "F1")
              vehicle.visible = !live?.liveFerries;
          });
        }
        const response = paused
          ? 1
          : 1 - Math.exp(-step * (selected === "home" ? 40 : 8));
        eye.lerp(destination, response);
        at.lerp(focus, response);
        travelling =
          eye.distanceToSquared(destination) + at.distanceToSquared(focus) >
            Math.max(0.00005, eye.distanceToSquared(at) * 0.0000000004) ||
          Math.abs(progress - journey) > 0.00001;
        if (!travelling) {
          eye.copy(destination);
          at.copy(focus);
          if (host.dataset.pose !== selected) host.dataset.pose = selected;
        }
        camera.position.copy(eye);
        camera.position.x += paused ? 0 : targetX * 0.25;
        camera.position.y += paused ? 0 : targetY * -0.15;
        const hovering = !paused && selected === "home" && journey < 0.18;
        if (hovering) {
          camera.position.x += Math.sin(elapsed * 0.12) * 0.16;
          camera.position.y += Math.sin(elapsed * 0.19) * 0.045;
          camera.position.z += Math.sin(elapsed * 0.1) * 0.12;
        }
        camera.up.set(0, 1, 0);
        if (selected === "home" && journey > 0.6) {
          const radial = at.clone().sub(lab.globe.position).normalize();
          const north = new THREE.Vector3(0, 1, 0).applyQuaternion(
            lab.globe.quaternion,
          );
          north.addScaledVector(radial, -north.dot(radial)).normalize();
          camera.up
            .lerp(north, THREE.MathUtils.smoothstep(journey, 0.6, 0.88))
            .normalize();
        }
        if (cityFlight && performance.now() - cityFlight.started > 2400)
          camera.up.copy(cityFlight.up);
        camera.lookAt(at);
        const distance = eye.distanceTo(at);
        camera.near = Math.max(0.03, distance / 2000);
        camera.far = Math.max(900, distance * 5);
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
        renderer.shadowMap.enabled =
          !softwareRenderer && (journey < 0.6 || !!cityFlight);
        const width = stage.clientWidth,
          height = stage.clientHeight;
        for (const label of labels) {
          const local =
            label.kind === "local" ||
            (label.element.textContent === "Brisbane" && distance < 2000);
          let show =
            selected === "home" &&
            !worldState.getState().city &&
            (local ? journey > 0.12 && journey < 0.77 : distance > 10000);
          if (label.kind === "regional" && (width < 800 || distance > 220000))
            show = false;
          if (show) {
            if (local) {
              const p = locate([label.longitude, label.latitude]);
              projected.set(
                p.x,
                lab.field.heightAt(p.x, p.y) +
                  (label.element.textContent === "Brisbane" ? 8 : 1.25),
                p.y,
              );
            } else {
              projected.copy(lab.earth.point(label.longitude, label.latitude));
              const normal = projected
                .clone()
                .sub(lab.globe.position)
                .normalize();
              show = normal.dot(camera.position.clone().sub(projected)) > 0;
            }
            projected.project(camera);
            const x = ((projected.x + 1) * width) / 2,
              y = ((1 - projected.y) * height) / 2 + label.offset;
            show =
              show &&
              projected.z < 1 &&
              projected.z > -1 &&
              x > 36 &&
              x < width - 36 &&
              y > 70 &&
              y < height - 100;
            if (show)
              label.element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
          }
          label.element.hidden = !show;
        }
        const nextX = paused ? 0 : targetX;
        const nextY = paused ? 0 : targetY;
        lightX += (nextX - lightX) * rate;
        lightY += (nextY - lightY) * rate;
        const movingLight =
          Math.abs(nextX - lightX) + Math.abs(nextY - lightY) > 0.001;
        const raining = live?.update(journey, paused, elapsed, at) ?? false;
        settling = hovering || movingLight || raining;
        key.target.position.copy(at);
        key.target.updateMatrixWorld();
        key.position.copy(at).addScaledVector(sun, 80);
        key.position.x += lightX * 2;
        key.position.z -= lightY;
        if (movingLight || key.shadow.map === null)
          key.shadow.needsUpdate = true;
        const launch = paused
          ? 1
          : THREE.MathUtils.smoothstep(elapsed, 0.15, 2.5);
        const flight = THREE.MathUtils.smoothstep(journey, 0.04, 0.6);
        const near = new THREE.Vector3(
          0,
          lab.launchGround + 0.18 + launch * 0.55,
          0.25,
        );
        const chase = camera.position.clone().lerp(at, 0.77);
        const controls = worldState.getState();
        const limit = Math.max(0.5, Math.min(12, eye.distanceTo(at) * 0.12));
        if (!paused && controls.steering && !controls.palm.brake) {
          drift.x += controls.palm.x * step * limit * 0.6;
          drift.y -= controls.palm.y * step * limit * 0.4;
          if (drift.length() > limit) worldState.setState({ steering: false });
        } else drift.multiplyScalar(Math.exp(-step * 5));
        lab.craft.position.copy(near).lerp(chase, flight).add(drift);
        lab.craft.scale.setScalar(0.16 + flight * eye.distanceTo(at) * 0.007);
        lab.craft.rotation.set(
          -0.04 + flight * 0.12,
          -0.3 + lightX * 0.15 + flight * 0.2,
          lightY * 0.06 - (controls.steering ? controls.palm.x * 0.25 : 0),
        );
        if (cityFlight && destinationCity)
          lab.craft.quaternion.premultiply(destinationCity.group.quaternion);
        lab.ship.update(
          elapsed,
          Math.max(launch, flight),
          launch,
          controls.expression,
          controls.reaction,
          flight,
        );
        settling ||=
          controls.steering ||
          drift.lengthSq() > 0.00001 ||
          (!!cityFlight && performance.now() - cityFlight.started < 3100);
        if (!paused && elapsed < 2.6) settling = true;
        host.dataset.launch =
          launch < 0.1 ? "grounded" : launch < 1 ? "launching" : "flying";
        lab.trees.visible = journey < 0.61;
        lab.photoGroup.visible = selected === "team";
      } else {
        const x = paused ? 0 : targetY * 0.12;
        const y = paused ? 0 : targetX * 0.2;
        object.rotation.x += (x - object.rotation.x) * 0.2;
        object.rotation.y += (y - object.rotation.y) * 0.2;
        // The entrance floats once, then rests without a permanent animation loop
        const float = paused ? 0 : Math.max(0, 1 - elapsed / 4);
        object.rotation.z = -0.12 + Math.sin(elapsed * 1.5) * 0.035 * float;
        object.position.y = Math.sin(elapsed * 2) * 0.07 * float;
        settling =
          Math.abs(x - object.rotation.x) + Math.abs(y - object.rotation.y) >
            0.001 || float > 0;
      }
      renderer.render(scene, camera);
      if (lab) key.shadow.autoUpdate = false;
    }
    if (travelling || settling) frame = requestAnimationFrame(render);
  };
  const wake = () => {
    lastFrame = -1;
    if (ready && !frame && !disposed && !lost && visible && !document.hidden)
      frame = requestAnimationFrame(render);
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };
  const select = (key: string) => {
    if (!lab || !isStation(key)) return;
    selected = key;
    if (key !== "home") {
      journey = progress = 0;
      if (scene.background instanceof THREE.Color) scene.background.copy(dusk);
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(dusk);
        scene.fog.density = 0.014;
      }
    }
    host.dataset.mode = key === "home" ? "journey" : "inspect";
    lab.landscape.scale.setScalar(1);
    lab.landscape.position.set(0, 0, 0);
    lab.landscape.visible = true;
    lab.globe.visible = false;
    destination.fromArray(viewpoints[key].eye);
    focus.fromArray(viewpoints[key].at);
    if (
      paused ||
      (key !== "home" && eye.distanceToSquared(destination) > 1000000)
    ) {
      eye.copy(destination);
      at.copy(focus);
    }
    travelling = true;
    delete host.dataset.pose;
    targetX = 0;
    targetY = 0;
    host.dataset.view = key;
    worldState.setState({ selected: key });
    if (key === "home") onScroll();
    wake();
  };
  const onScroll = () => {
    if (!lab || selected !== "home") return;
    progress = worldState.getState().progress;
    delete host.dataset.pose;
    travelling = true;
    wake();
  };
  const resize = () => {
    delete host.dataset.pose;
    travelling = true;
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        pixelRatioLimit,
        Math.sqrt(2_000_000 / (width * height)),
      ),
    );
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    if (!lab) camera.position.set(0, 0, Math.max(7.7, 7.7 / camera.aspect));
    else camera.fov = host.clientWidth / height < 0.8 ? 49 : 38;
    camera.updateProjectionMatrix();
    wake();
  };
  const onPointer = (event: PointerEvent) => {
    const bounds = stage.getBoundingClientRect();
    if (!paused && (event.pointerType !== "touch" || visual)) {
      targetX = (event.clientX - bounds.left) / bounds.width - 0.5;
      targetY = (event.clientY - bounds.top) / bounds.height - 0.5;
    }
    if (lab && event.target === canvas) {
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
          (-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
        ),
        camera,
      );
      let node: THREE.Object3D | null =
        raycaster.intersectObjects([...lab.rooms.values()], true)[0]?.object ??
        null;
      while (node && !node.userData.station) node = node.parent;
      hovered = node?.userData.station;
      canvas.style.cursor = hovered ? "pointer" : "default";
    }
    wake();
  };
  const onDown = (event: PointerEvent) => {
    if (event.target !== canvas) return;
    pressed = { x: event.clientX, y: event.clientY };
    onPointer(event);
  };
  const onUp = (event: PointerEvent) => {
    if (
      pressed &&
      hovered &&
      Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) < 8
    )
      select(hovered);
    pressed = undefined;
    if (!lab) {
      targetX = 0;
      targetY = 0;
      wake();
    }
  };
  const onLeave = () => {
    hovered = undefined;
    pressed = undefined;
    canvas.style.cursor = "default";
    targetX = 0;
    targetY = 0;
    wake();
  };
  const syncMotion = () => {
    host.dataset.motion = paused ? "paused" : "playing";
    stop();
    wake();
  };
  const onPreference = () => {
    paused = reduced.matches;
    syncMotion();
  };
  const onVisibility = () => {
    updateSolar();
    live?.setActive(ready && visible && !document.hidden && !lost);
    stop();
    wake();
  };
  const onLoss = (event: Event) => {
    event.preventDefault();
    lost = true;
    live?.setActive(false);
    stop();
    host.dataset.scene = "lost";
  };
  const onRestore = () => {
    host.dispatchEvent(new Event("worldrestore"));
  };
  const resizeObserver = new ResizeObserver(resize);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    live?.setActive(ready && visible && !document.hidden && !lost);
    stop();
    wake();
  });

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    clearInterval(solarTimer);
    signal?.removeEventListener("abort", dispose);
    stop();
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    host.removeEventListener("pointermove", onPointer);
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointerup", onUp);
    host.removeEventListener("pointerleave", onLeave);
    host.removeEventListener("pointercancel", onLeave);
    reduced.removeEventListener("change", onPreference);
    document.removeEventListener("visibilitychange", onVisibility);
    unsubscribe?.();
    live?.dispose();
    lab?.cancel();
    cityRequest?.abort();
    canvas.removeEventListener("webglcontextlost", onLoss);
    canvas.removeEventListener("webglcontextrestored", onRestore);
    release(scene, [
      ...(lab?.maps ?? []),
      ...textures.map((item) => item.texture),
    ]);
    environment?.dispose();
    key.shadow.map?.dispose();
    renderer.dispose();
  };
  renderer.onDeviceLost = (info) => {
    if (disposed) return;
    onLoss(new Event("webglcontextlost", { cancelable: true }));
    if (info.api === "WebGPU") host.dispatchEvent(new Event("worldrestore"));
  };
  signal?.addEventListener("abort", dispose, { once: true });
  try {
    await renderer.init();
    host.dataset.renderer =
      renderer.backend instanceof THREE.WebGPUBackend ? "webgpu" : "webgl";
    const context = renderer.getContext();
    if (context instanceof WebGL2RenderingContext) {
      const debug = context.getExtension("WEBGL_debug_renderer_info");
      const gpu = String(
        context.getParameter(
          debug?.UNMASKED_RENDERER_WEBGL ?? context.RENDERER,
        ),
      );
      if (/swiftshader|llvmpipe|software/i.test(gpu)) {
        softwareRenderer = true;
        // Software rasterisers need a bounded fill rate to keep input and navigation responsive
        pixelRatioLimit = 0.75;
        frameInterval = 1 / 10;
        renderer.shadowMap.enabled = false;
        key.castShadow = false;
        // SwiftShader can expose parallel compilation without ever reporting completion
        (
          renderer.backend as typeof renderer.backend & { parallel: null }
        ).parallel = null;
      }
    }
    if (signal?.aborted)
      throw new DOMException("Scene loading cancelled", "AbortError");
    lab = world ? await makeLab(world, signal) : undefined;
    if (disposed || signal?.aborted) {
      if (lab) release(lab.group, lab.maps);
      throw new DOMException("Scene loading cancelled", "AbortError");
    }
    if (lab && !softwareRenderer) {
      const room = new RoomEnvironment();
      const generator = new THREE.PMREMGenerator(renderer);
      try {
        environment = generator.fromScene(room, 0.04);
        scene.environment = environment.texture;
      } finally {
        room.dispose();
        generator.dispose();
      }
    }
    const model = lab ? lab.group : makeAward(visual ?? "trophy");
    if (disposed)
      throw new DOMException("Scene loading cancelled", "AbortError");
    if (lab) {
      eye.fromArray(viewpoints.home.eye);
      at.fromArray(viewpoints.home.at);
      destination.copy(eye);
      focus.copy(at);
      camera.position.copy(eye);
      camera.lookAt(at);
    } else {
      model.rotation.set(0.05, -0.24, 0);
      const bounds = new THREE.Box3().setFromObject(model);
      model.position.sub(bounds.getCenter(new THREE.Vector3()));
      object.scale.setScalar(
        4.7 / Math.max(...bounds.getSize(new THREE.Vector3()).toArray()),
      );
    }
    object.add(model);
    if (lab) {
      host.dataset.parser = lab.group.userData.parser;
      const currentLab = lab;
      const uploads: Promise<void>[] = [];
      for (const [name, color] of [
        ["masonry", true],
        ["masonry-normal", false],
        ["earth", true],
        ["night", true],
      ] as const) {
        uploads.push(
          (async () => {
            const response = await fetch(`/assets/world/${name}.webp`, {
              signal,
            });
            if (!response.ok)
              throw new Error(`Terrain map: ${response.status}`);
            const bitmap = await createImageBitmap(await response.blob(), {
              imageOrientation: "flipY",
            });
            if (disposed) {
              bitmap.close();
              return;
            }
            const texture = new THREE.Texture(bitmap);
            // The bitmap is already oriented, so WebGPU must not flip it a second time
            texture.flipY = false;
            if (color) texture.colorSpace = THREE.SRGBColorSpace;
            if (name === "masonry" || name === "masonry-normal") {
              texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
              texture.repeat.set(8, 8);
            }
            texture.needsUpdate = true;
            textures.push({ texture, bitmap });
            if (name === "night") currentLab.earth.night.value = texture;
            else if (name === "earth") {
              currentLab.earth.material.map = texture;
              currentLab.earth.material.needsUpdate = true;
            } else
              for (const surface of currentLab.masonry) {
                if (name === "masonry") surface.map = texture;
                else {
                  surface.normalMap = texture;
                  surface.normalScale.set(0.25, 0.25);
                }
                surface.needsUpdate = true;
              }
            wake();
          })().catch((error) => {
            if (!signal?.aborted)
              console.warn("The terrain uses its untextured material", error);
          }),
        );
      }
      const urls: string[] = JSON.parse(canvas.dataset.portraits ?? "[]");
      for (const [index, photo] of lab.photos.entries()) {
        const url = urls[index];
        if (!url) continue;
        uploads.push(
          (async () => {
            const response = await fetch(url, { signal });
            if (!response.ok)
              throw new Error(`Portrait request failed: ${response.status}`);
            const bitmap = await createImageBitmap(await response.blob(), {
              imageOrientation: "flipY",
              resizeWidth: 256,
              resizeHeight: 320,
            });
            if (disposed) {
              bitmap.close();
              return;
            }
            const texture = new THREE.Texture(bitmap);
            texture.flipY = false;
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.needsUpdate = true;
            textures.push({ texture, bitmap });
            photo.material.map = texture;
            photo.material.color.set(0xffffff);
            photo.material.needsUpdate = true;
            wake();
          })().catch((error) => {
            if (!signal?.aborted)
              console.warn(
                "The optional portrait remains a static print",
                error,
              );
          }),
        );
      }
      void Promise.all(uploads).then(() => {
        if (!disposed) {
          host.dataset.materials = "ready";
          wake();
        }
      });
    }
    resizeObserver.observe(stage);
    visibilityObserver.observe(host);
    host.addEventListener("pointermove", onPointer);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointercancel", onLeave);
    reduced.addEventListener("change", onPreference);
    document.addEventListener("visibilitychange", onVisibility);
    if (lab) {
      live = liveWorld(host, () => {
        updateSolar();
        wake();
      });
      object.add(live.group);
      unsubscribe = worldState.subscribe((state, previous) => {
        if (state.city !== previous.city) void flyCity(state.city);
        if (state.selected !== selected) select(state.selected);
        if (state.progress !== previous.progress) onScroll();
        if (
          state.palm !== previous.palm ||
          state.expression !== previous.expression ||
          state.reaction !== previous.reaction ||
          state.steering !== previous.steering
        )
          wake();
      });
    }
    if (lab) {
      updateSolar();
      solarTimer = setInterval(() => {
        updateSolar();
        wake();
      }, 60000);
    }
    canvas.addEventListener("webglcontextlost", onLoss);
    canvas.addEventListener("webglcontextrestored", onRestore);
    resize();
    if (!softwareRenderer) await renderer.compileAsync(scene, camera);
    if (disposed || signal?.aborted)
      throw new DOMException("Scene loading cancelled", "AbortError");
    started = performance.now();
    renderer.render(scene, camera);
    ready = true;
    performance.mark("uqrl-world-visible");
    if (lab)
      void lab.enrich(
        () => {
          if (!disposed) {
            host.dataset.parser = lab?.group.userData.parser ?? "unavailable";
            host.dataset.details = lab?.group.userData.details ?? "loading";
            host.dataset.foliage = lab?.group.userData.foliage ?? "loading";
            updateSolar();
            wake();
          }
        },
        (group) =>
          softwareRenderer
            ? Promise.resolve()
            : renderer.compileAsync(group, camera, scene),
      );
    host.dataset.scene = "ready";
    live?.setActive(visible && !document.hidden);
    syncMotion();
    return { dispose, select };
  } catch (error) {
    dispose();
    throw error;
  }
}
