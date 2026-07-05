import { describe, expect, test, vi } from "vitest";
import { createHoverAudioHandle } from "../app/hover-audio";

describe("hover audio controller", () => {
  test("plays one cue at a time and swallows blocked playback", async () => {
    const controller = createHoverAudioHandle();
    const cleanup = vi.fn();
    const play = vi.fn(async () => {});
    const blocked = vi.fn(async () => {
      throw new Error("blocked");
    });

    await controller.play("committee:1", play, cleanup);
    expect(controller.activeKey).toBe("committee:1");
    expect(play).toHaveBeenCalledTimes(1);

    await controller.play("social:1", blocked, cleanup);
    expect(cleanup).toHaveBeenCalled();
    expect(controller.activeKey).toBeNull();

    controller.handleVisibility(true);
    expect(controller.activeKey).toBeNull();
  });
});
