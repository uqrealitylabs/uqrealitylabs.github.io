import { appendFileSync, readFileSync } from "node:fs";
import { basename } from "node:path";

export const ALLOWED_LABELS = [
  "bug",
  "documentation",
  "duplicate",
  "enhancement",
  "good first issue",
  "help wanted",
  "invalid",
  "question",
  "wontfix",
] as const;

export type AllowedLabel = (typeof ALLOWED_LABELS)[number];

export interface LabelDecision {
  label: AllowedLabel;
  confidence: number;
  reason: string;
}

interface IssueEvent {
  action: string;
  issue: {
    number: number;
    title: string;
    body: string | null;
    html_url: string;
  };
  repository: {
    full_name: string;
  };
}

interface ChatChoice {
  message?: {
    content?: string | null;
  };
}

function readJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function writeSummary(lines: string[]): void {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  appendFileSync(summaryPath, `${lines.join("\n")}\n`);
}

function normalizeLabel(raw: string): AllowedLabel | null {
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return (ALLOWED_LABELS as readonly string[]).includes(normalized)
    ? (normalized as AllowedLabel)
    : null;
}

export function normalizeLabelDecision(value: unknown): LabelDecision | null {
  if (typeof value !== "object" || value === null) return null;

  const record = value as Record<string, unknown>;
  const label = typeof record.label === "string" ? normalizeLabel(record.label) : null;
  const confidence = typeof record.confidence === "number" ? record.confidence : Number.NaN;
  const reason = typeof record.reason === "string" ? record.reason.trim() : "";

  if (!label || !Number.isFinite(confidence) || confidence < 0 || confidence > 1 || !reason) {
    return null;
  }

  return { label, confidence, reason };
}

async function callOpenAiCompatibleChat(
  messages: Array<{ role: string; content: string }>,
): Promise<string | null> {
  const apiKey = process.env.AI_LABELER_API_KEY;
  const baseUrl = process.env.AI_LABELER_BASE_URL;
  const model = process.env.AI_LABELER_MODEL;

  if (!apiKey || !baseUrl || !model) return null;

  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature: 0 }),
  });

  if (!response.ok) {
    throw new Error(`Label model request failed with ${response.status}`);
  }

  const payload = (await response.json()) as { choices?: ChatChoice[] };
  const content = payload.choices?.[0]?.message?.content ?? null;
  return typeof content === "string" ? content : null;
}

function buildPrompt(issue: IssueEvent["issue"]): Array<{ role: string; content: string }> {
  return [
    {
      role: "system",
      content: [
        "You label GitHub issues for a society website.",
        "Return strict JSON only.",
        `Allowed labels: ${ALLOWED_LABELS.join(", ")}`,
        "Choose exactly one label.",
        "Fields: label, confidence, reason.",
        "Be conservative when the issue is unclear.",
      ].join(" "),
    },
    {
      role: "user",
      content: `Title: ${issue.title}\n\nBody:\n${issue.body?.trim() || "(empty)"}`,
    },
  ];
}

async function githubJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!token || !repo) throw new Error("Missing GitHub token or repository");
  const hasBody = typeof init?.body !== "undefined";

  const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed with ${response.status} for ${path}`);
  }

  return (await response.json()) as T;
}

async function main(): Promise<void> {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) throw new Error("Missing GITHUB_EVENT_PATH");

  const event = readJsonFile(eventPath) as IssueEvent;
  if (!["opened", "edited", "reopened"].includes(event.action)) {
    writeSummary([`Skipped ${basename(eventPath)} because action ${event.action} is not handled.`]);
    return;
  }

  if (!process.env.AI_LABELER_API_KEY) {
    writeSummary([
      "AI issue labeler skipped.",
      "- Reason: AI_LABELER_API_KEY is not set.",
      "- No label was applied.",
    ]);
    return;
  }

  const raw = await callOpenAiCompatibleChat(buildPrompt(event.issue));
  if (!raw) {
    writeSummary([
      "AI issue labeler skipped.",
      "- Reason: model returned no content.",
      "- No label was applied.",
    ]);
    return;
  }

  let decision: LabelDecision | null = null;
  try {
    decision = normalizeLabelDecision(JSON.parse(raw) as unknown);
  } catch {
    decision = null;
  }

  if (!decision) {
    writeSummary([
      "AI issue labeler skipped.",
      "- Reason: model output was invalid JSON.",
      "- No label was applied.",
    ]);
    return;
  }

  const currentLabels = await githubJson<Array<{ name: string }>>(
    `/issues/${event.issue.number}/labels`,
  );
  const removable = currentLabels
    .map((label) => label.name)
    .filter(
      (name) => (ALLOWED_LABELS as readonly string[]).includes(name) && name !== decision.label,
    );

  if (removable.length > 0) {
    await githubJson(`/issues/${event.issue.number}/labels`, {
      method: "DELETE",
      body: JSON.stringify({ labels: removable }),
    });
  }

  const hasLabel = currentLabels.some((label) => label.name === decision.label);
  if (!hasLabel) {
    await githubJson(`/issues/${event.issue.number}/labels`, {
      method: "POST",
      body: JSON.stringify({ labels: [decision.label] }),
    });
  }

  writeSummary([
    "AI issue labeler applied one label.",
    `- Label: ${decision.label}`,
    `- Confidence: ${decision.confidence.toFixed(2)}`,
    `- Reason: ${decision.reason}`,
    `- Issue: ${event.issue.html_url}`,
  ]);
}

main().catch((error) => {
  writeSummary([
    `AI issue labeler failed: ${error instanceof Error ? error.message : String(error)}`,
  ]);
  process.exitCode = 1;
});
