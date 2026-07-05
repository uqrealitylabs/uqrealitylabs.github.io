import { appendFileSync, readFileSync } from "node:fs";

interface PullRequestEvent {
  action: string;
  number: number;
  pull_request: {
    title: string;
    body: string | null;
    html_url: string;
    user: { login: string };
  };
  repository: {
    full_name: string;
  };
}

interface PullFile {
  filename: string;
  additions: number;
  deletions: number;
}

interface ReviewDecision {
  summary: string;
  riskLevel: "low" | "medium" | "high";
  filesTouched: string[];
  reviewerAttention: string[];
  testFocus: string[];
}

function readJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function writeSummary(lines: string[]): void {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  appendFileSync(summaryPath, `${lines.join("\n")}\n`);
}

function normalizeReviewDecision(value: unknown): ReviewDecision | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const summary = typeof record.summary === "string" ? record.summary.trim() : "";
  const riskLevel =
    record.riskLevel === "low" || record.riskLevel === "medium" || record.riskLevel === "high"
      ? record.riskLevel
      : null;
  const filesTouched = Array.isArray(record.filesTouched)
    ? record.filesTouched.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      )
    : [];
  const reviewerAttention = Array.isArray(record.reviewerAttention)
    ? record.reviewerAttention.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      )
    : [];
  const testFocus = Array.isArray(record.testFocus)
    ? record.testFocus.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      )
    : [];

  if (
    !summary ||
    !riskLevel ||
    filesTouched.length === 0 ||
    reviewerAttention.length === 0 ||
    testFocus.length === 0
  ) {
    return null;
  }

  return { summary, riskLevel, filesTouched, reviewerAttention, testFocus };
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
    throw new Error(`Dependabot model request failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = payload.choices?.[0]?.message?.content ?? null;
  return typeof content === "string" ? content : null;
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

  const event = readJsonFile(eventPath) as PullRequestEvent;
  if (!["opened", "synchronize", "reopened", "ready_for_review"].includes(event.action)) {
    writeSummary([`Skipped because action ${event.action} is not handled.`]);
    return;
  }

  if (
    event.pull_request.user.login !== "dependabot[bot]" ||
    process.env.GITHUB_ACTOR !== "dependabot[bot]"
  ) {
    writeSummary([
      "Dependabot AI review skipped.",
      "- Reason: this job only runs for dependabot[bot].",
    ]);
    return;
  }

  if (!process.env.AI_LABELER_API_KEY) {
    writeSummary([
      "Dependabot AI review skipped.",
      "- Reason: AI_LABELER_API_KEY is not set.",
      "- No AI comment was posted.",
    ]);
    return;
  }

  const [pullRequest, files] = await Promise.all([
    githubJson<PullRequestEvent["pull_request"]>(`/pulls/${event.number}`),
    githubJson<PullFile[]>(`/pulls/${event.number}/files?per_page=100`),
  ]);

  const fileNames = files.map((file) => `${file.filename} (+${file.additions}/-${file.deletions})`);
  const prompt = [
    {
      role: "system",
      content: [
        "You review Dependabot pull requests for a society website.",
        "Return strict JSON only.",
        "Fields: summary, riskLevel, filesTouched, reviewerAttention, testFocus.",
        'riskLevel must be one of "low", "medium", or "high".',
        "Be practical and direct.",
      ].join(" "),
    },
    {
      role: "user",
      content: [
        `Title: ${pullRequest.title}`,
        `Body: ${pullRequest.body?.trim() || "(empty)"}`,
        `Files:\n- ${fileNames.join("\n- ") || "(none)"}`,
      ].join("\n\n"),
    },
  ];

  const raw = await callOpenAiCompatibleChat(prompt);
  if (!raw) {
    writeSummary([
      "Dependabot AI review skipped.",
      "- Reason: model returned no content.",
      "- No PR comment was posted.",
    ]);
    return;
  }

  let decision: ReviewDecision | null = null;
  try {
    decision = normalizeReviewDecision(JSON.parse(raw) as unknown);
  } catch {
    decision = null;
  }

  if (!decision) {
    writeSummary([
      "Dependabot AI review skipped.",
      "- Reason: model output was invalid JSON.",
      "- No PR comment was posted.",
    ]);
    return;
  }

  const body = [
    "Dependabot AI review",
    `- Update summary: ${decision.summary}`,
    `- Risk level: ${decision.riskLevel}`,
    `- Files touched: ${decision.filesTouched.join(", ")}`,
    `- Reviewer attention: ${decision.reviewerAttention.join(", ")}`,
    `- Test focus: ${decision.testFocus.join(", ")}`,
  ].join("\n");

  await githubJson(`/issues/${event.number}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });

  writeSummary([
    "Dependabot AI review posted a comment.",
    `- Risk level: ${decision.riskLevel}`,
    `- Files touched: ${decision.filesTouched.join(", ")}`,
    `- Review focus: ${decision.testFocus.join(", ")}`,
    `- PR: ${event.pull_request.html_url}`,
  ]);
}

main().catch((error) => {
  writeSummary([
    `Dependabot AI review failed: ${error instanceof Error ? error.message : String(error)}`,
  ]);
  process.exitCode = 1;
});
