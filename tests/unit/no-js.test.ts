import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findForbiddenJavaScript } from "../../tools/scripts/assert-no-js";

const tmpRoot = join(process.cwd(), ".tmp-no-js-test");

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

describe("no-JS source scanner", () => {
  it.each([".js", ".jsx", ".mjs", ".cjs"])("rejects %s files", (extension) => {
    mkdirSync(tmpRoot, { recursive: true });
    writeFileSync(join(tmpRoot, `bad${extension}`), "");

    expect(findForbiddenJavaScript(tmpRoot)).toEqual([`bad${extension}`]);
  });

  it("ignores generated and dependency folders", () => {
    mkdirSync(join(tmpRoot, "node_modules/pkg"), { recursive: true });
    mkdirSync(join(tmpRoot, "dist"), { recursive: true });
    writeFileSync(join(tmpRoot, "node_modules/pkg/index.js"), "");
    writeFileSync(join(tmpRoot, "dist/app.js"), "");

    expect(findForbiddenJavaScript(tmpRoot)).toEqual([]);
  });
});
