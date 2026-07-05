import { describe, expect, test } from "vitest";
import { normalizeLabelDecision } from "../tools/agents/issue-label-agent";

describe("issue label agent normalization", () => {
  test("accepts allowed labels with simple cleanup", () => {
    expect(
      normalizeLabelDecision({
        label: "  Enhancement ",
        confidence: 0.84,
        reason: "fits the request",
      }),
    ).toEqual({
      label: "enhancement",
      confidence: 0.84,
      reason: "fits the request",
    });
  });

  test("rejects labels outside the allowed set", () => {
    expect(
      normalizeLabelDecision({
        label: "feature",
        confidence: 0.91,
        reason: "not allowed",
      }),
    ).toBeNull();
  });
});
