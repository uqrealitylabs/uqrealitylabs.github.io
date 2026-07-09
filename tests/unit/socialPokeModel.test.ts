import { describe, expect, it } from "vitest";
import { socialMaterialConfigs } from "../../src/features/social-materials/materialConfig";
import {
  applyPoke,
  createPokeState,
  getPokeInfluence,
  stepPoke,
} from "../../src/features/social-materials/socialPokeModel";

describe("social poke model", () => {
  it("keeps pointer response local to the contact point", () => {
    const state = createPokeState();
    applyPoke(state, 0.25, 0.25, 1);
    stepPoke(state, socialMaterialConfigs.rubber);

    expect(getPokeInfluence(state, 0.25, 0.25)).toBeGreaterThan(0);
    expect(getPokeInfluence(state, 0.95, 0.95)).toBe(0);
  });

  it("makes press stronger than hover and decays toward rest", () => {
    const hover = createPokeState();
    const press = createPokeState();

    applyPoke(hover, 0.5, 0.5, 0.25);
    applyPoke(press, 0.5, 0.5, 0.9);
    stepPoke(hover, socialMaterialConfigs.cloth);
    stepPoke(press, socialMaterialConfigs.cloth);

    expect(press.pressure).toBeGreaterThan(hover.pressure);

    for (let i = 0; i < 40; i += 1) {
      stepPoke(press, socialMaterialConfigs.cloth);
    }

    expect(press.pressure).toBeLessThan(0.1);
  });
});
