const runtimePath = "/assets/wasm/world.js";
const ready = import(/* webpackIgnore: true */ runtimePath).then(
  async (module) => {
    await module.default({ module_or_path: "/assets/wasm/world_bg.wasm" });
    return module as { inspect_glb(bytes: Uint8Array): number };
  },
);

self.onmessage = async (
  event: MessageEvent<{ id: number; bytes: ArrayBuffer }>,
) => {
  const { id, bytes } = event.data;
  try {
    const runtime = await ready;
    const start = performance.now();
    const vertices = runtime.inspect_glb(new Uint8Array(bytes));
    self.postMessage(
      { id, bytes, vertices, milliseconds: performance.now() - start },
      { transfer: [bytes] },
    );
  } catch (error) {
    self.postMessage({ id, error: String(error) });
  }
};
