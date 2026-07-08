import { describe, expect, it } from "vitest";
import {
  materialForSocial,
  socialMaterialMatrix,
} from "../../src/features/social-materials/materialConfig";

describe("social material matrix", () => {
  it("covers every required material including mail/email", () => {
    expect(new Set(socialMaterialMatrix.map((item) => item.material))).toEqual(
      new Set(["cloth", "rubber", "glass", "grass"]),
    );
    expect(materialForSocial("email")).toBe("grass");
  });
});
