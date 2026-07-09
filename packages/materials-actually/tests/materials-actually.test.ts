import { describe, expect, it, vi } from "vitest";
import {
  applyPoke,
  addContact,
  createContactHistory,
  createMaterialPokeController,
  createPokeState,
  getPointerUv,
  MaterialLogoSurface,
  getMaterialConfig,
  getMaterialEventKind,
  getMaterialHapticPattern,
  getMaterialKind,
  getMaterialResponse,
  getPokeInfluence,
  isMaterialKind,
  PokeSurface,
  releasePoke,
  materialConfigs,
  shouldTriggerMaterialHaptic,
  stepContactHistory,
  stepPoke,
  triggerMaterialHaptic,
  updatePokeModel,
  useMaterialPoke,
} from "../src/index";
import type React from "react";

describe("materials-actually", () => {
  it("parses material kinds without app label coupling", () => {
    expect(isMaterialKind("glass")).toBe(true);
    expect(isMaterialKind("Glass")).toBe(true);
    expect(isMaterialKind("LinkedIn")).toBe(false);
    expect(getMaterialKind("glass")).toBe("glass");
    expect(getMaterialKind("Glass")).toBe("glass");
    expect(getMaterialKind("unknown-kind", "rubber")).toBe("rubber");
    expect(getMaterialKind("constructor")).toBe("cloth");
    expect(getMaterialConfig("mail")).toBe(materialConfigs.mail);
    expect(getMaterialConfig("unknown", "grass")).toBe(materialConfigs.grass);
  });

  it("keeps poke influence local and clamps input", () => {
    const state = createPokeState();
    applyPoke(state, -2, 2, 3);
    stepPoke(state, materialConfigs.rubber);

    expect(state.x).toBe(0);
    expect(state.y).toBe(1);
    expect(getPokeInfluence(state, 0, 1)).toBeGreaterThan(0);
    expect(getPokeInfluence(state, 1, 0)).toBe(0);
  });

  it("distinguishes glass, rubber, cloth, and grass response", () => {
    const glass = createPokeState();
    applyPoke(glass, 0.2, 0.2, 0.8);
    applyPoke(glass, 0.8, 0.2, 0.8);
    stepPoke(glass, materialConfigs.glass);
    expect(getMaterialResponse(materialConfigs.glass, glass).deformation).toBe(0);
    expect(getMaterialResponse(materialConfigs.glass, glass).smear).toBeGreaterThan(0);

    const rubber = createPokeState();
    applyPoke(rubber, 0.1, 0.1, 1);
    applyPoke(rubber, 0.9, 0.9, 1);
    stepPoke(rubber, materialConfigs.rubber);
    expect(rubber.scratches).toBeGreaterThan(0);
    expect(getMaterialResponse(materialConfigs.rubber, rubber).deformation).toBeGreaterThan(0);

    const cloth = createPokeState();
    applyPoke(cloth, 0.2, 0.2, 1);
    applyPoke(cloth, 0.8, 0.8, 1);
    stepPoke(cloth, materialConfigs.cloth);
    expect(cloth.scratches).toBeGreaterThan(0);

    const grass = createPokeState();
    applyPoke(grass, 0.1, 0.1, 1);
    applyPoke(grass, 0.7, 0.7, 1);
    stepPoke(grass, materialConfigs.grass);
    expect(grass.cuts).toBeGreaterThan(0);
  });

  it("decays pressure toward rest", () => {
    const state = createPokeState();
    applyPoke(state, 0.5, 0.5, 1);
    stepPoke(state, materialConfigs.cloth);
    expect(state.pressure).toBeGreaterThan(0);

    for (let i = 0; i < 50; i += 1) stepPoke(state, materialConfigs.cloth);
    expect(state.pressure).toBeLessThan(0.1);
  });

  it("classifies haptic events and consumes swipe velocity once", () => {
    const rubber = createPokeState();
    applyPoke(rubber, 0.1, 0.1, 1);
    applyPoke(rubber, 0.9, 0.9, 1);

    expect(getMaterialEventKind(materialConfigs.rubber, rubber, 1)).toBe(
      "damage",
    );
    stepPoke(rubber, materialConfigs.rubber);
    expect(rubber.scratches).toBe(1);

    for (let i = 0; i < 5; i += 1) stepPoke(rubber, materialConfigs.rubber);
    expect(rubber.scratches).toBe(1);
    expect(getMaterialResponse(materialConfigs.rubber, rubber).scratch).toBe(
      true,
    );

    const glass = createPokeState();
    applyPoke(glass, 0.1, 0.1, 0.4);
    applyPoke(glass, 0.5, 0.1, 0.4);
    expect(getMaterialEventKind(materialConfigs.glass, glass, 0.4)).toBe(
      "fastSwipe",
    );

    const grass = createPokeState();
    applyPoke(grass, 0.1, 0.1, 0.6);
    applyPoke(grass, 0.6, 0.1, 0.6);
    expect(getMaterialEventKind(materialConfigs.grass, grass, 0.6)).toBe("cut");

    const cloth = createPokeState();
    applyPoke(cloth, 0.5, 0.5, 0.7);
    expect(getMaterialEventKind(materialConfigs.cloth, cloth, 0.7)).toBe(
      "press",
    );
    expect(getMaterialEventKind(materialConfigs.cloth, cloth, 0.2)).toBe(
      "contact",
    );
    expect(getMaterialEventKind(materialConfigs.cloth, cloth, 0)).toBe("hover");

    expect(shouldTriggerMaterialHaptic(100, 279)).toBe(false);
    expect(shouldTriggerMaterialHaptic(100, 281)).toBe(true);
  });

  it("maps haptics and safely no-ops", () => {
    expect(getMaterialHapticPattern("glass", "contact", 0)).toEqual([]);
    expect(getMaterialHapticPattern("rubber", "press", 0.5)).toEqual([
      9, 13, 9,
    ]);
    expect(triggerMaterialHaptic("glass", "contact", 1, {})).toBe(false);
    expect(
      triggerMaterialHaptic("glass", "contact", 1, { reducedMotion: true }),
    ).toBe(false);
    const vibrate = vi.fn(() => true);
    expect(
      triggerMaterialHaptic("mail", "contact", 1, {
        navigator: { vibrate },
      }),
    ).toBe(true);
    expect(vibrate).toHaveBeenCalledWith([10, 20, 10]);
    expect(
      triggerMaterialHaptic("glass", "damage", 1, {
        navigator: { vibrate },
      }),
    ).toBe(false);
    expect(
      triggerMaterialHaptic("mail", "contact", 1, {
        navigator: {
          vibrate: () => {
            throw new Error("blocked");
          },
        },
      }),
    ).toBe(false);
  });

  it("tracks contact history and generic poke updates", () => {
    expect(createContactHistory()).toMatchObject({ maxPoints: 8, fadeMs: 1400 });
    const history = createContactHistory({ maxPoints: 1, fadeMs: 20 });
    addContact(history, { x: 0.2, y: 0.4 }, 4, "press");
    addContact(history, { x: 0.8, y: 0.1 }, 0.5, "release");
    expect(history.points).toHaveLength(1);
    expect(history.points[0]).toMatchObject({
      x: 0.8,
      y: 0.1,
      strength: 0.5,
    });
    stepContactHistory(history, 21);
    expect(history.points).toHaveLength(0);

    const state = createPokeState();
    updatePokeModel(state, materialConfigs.mail, { x: 0.7, y: 0.4 }, 33.34);
    expect(state.pressure).toBeGreaterThan(0);
    updatePokeModel(
      state,
      materialConfigs.mail,
      { x: 0.7, y: 0.4, active: false },
      16.67,
    );
    expect(state.targetPressure).toBe(0);
    updatePokeModel(state, materialConfigs.mail, null);
    releasePoke(state);
  });

  it("exposes R3F-compatible pointer helpers without React state", () => {
    expect(getPointerUv({ uv: { x: 0.25, y: 0.75 } })).toEqual({
      x: 0.25,
      y: 0.75,
    });
    expect(
      getPointerUv({
        currentTarget: { clientWidth: 100, clientHeight: 50 },
        nativeEvent: { offsetX: 25, offsetY: 10 },
      }),
    ).toEqual({ x: 0.25, y: 0.8 });
    expect(getPointerUv({})).toEqual({ x: 0.5, y: 0.5 });

    const controller = createMaterialPokeController({ material: "rubber" });
    controller.handlers.onPointerMove({ uv: { x: 0.5, y: 0.5 } });
    controller.handlers.onPointerDown({ uv: { x: 0.9, y: 0.1 } });
    controller.step();
    expect(controller.state.pressure).toBeGreaterThan(0);
    controller.handlers.onPointerUp();
    controller.handlers.onPointerOut();
    controller.step();
    expect(controller.state.targetPressure).toBe(0);

    const hookController = useMaterialPoke({ material: "cloth" });
    hookController.handlers.onPointerDown({ uv: { x: 0.2, y: 0.2 } });
    expect(hookController.state.targetPressure).toBeGreaterThan(0);

    const surface = PokeSurface({ material: "glass", underline: true });
    expect((surface as React.ReactElement).type).toBe("mesh");
    expect((surface as React.ReactElement).props).toMatchObject({
      "data-material": "glass",
      "data-underline": "true",
    });
    expect(
      (MaterialLogoSurface({ material: "mail" }) as React.ReactElement).props,
    ).toMatchObject({ "data-material": "mail" });
  });
});
