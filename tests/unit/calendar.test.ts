import { describe, expect, it } from "vitest";
import {
  calendarFeed,
  eventDay,
  monthDays,
} from "../../src/content/calendar.ts";
import { parseDocument, parseEvent } from "../../src/content/records.ts";

describe("calendar subscription contract", () => {
  it("keeps Brisbane dates and Monday-first leap months", () => {
    expect(eventDay("2026-10-20T15:00:00Z")).toBe("2026-10-21");
    expect(monthDays(2024, 2).filter(Boolean)).toHaveLength(29);
    expect(monthDays(2024, 1)[0]).toBe(1);
    expect(() => monthDays(2024, 13)).toThrow();
  });
  it("produces stable, escaped, UTF-8 folded feeds with updates and cancellations", () => {
    const doc = parseDocument(
      '+++\ntitle="Lab"\ndescription="Description"\nid="stable"\nlocation="UQ"\nstartDate="2026-10-21T18:00:00+10:00"\nendDate="2026-10-21T20:00:00+10:00"\nupdatedAt="2026-10-20T00:00:00Z"\n+++\n',
      "lab.md",
    );
    const event = {
      ...parseEvent(doc),
      title: "🎮".repeat(60),
      description: "One, two; three\\four\nNew line",
      cancelled: true,
    };
    const feed = calendarFeed([event]);
    expect(feed).toContain("UID:stable@uqrealitylabs.com\r\n");
    expect(feed).toContain("DTSTART:20261021T080000Z");
    expect(feed).toContain("LAST-MODIFIED:20261020T000000Z");
    expect(feed).toContain(
      "DESCRIPTION:One\\, two\\; three\\\\four\\nNew line",
    );
    expect(feed).toContain("STATUS:CANCELLED");
    expect(feed).toContain("URL:https://uqrealitylabs.com/events/lab/");
    for (const line of feed.split("\r\n"))
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(feed.replaceAll("\r\n ", "")).toContain(
      `SUMMARY:${event.title}\r\n`,
    );
    expect(calendarFeed([{ ...event, draft: true }])).not.toContain(
      "BEGIN:VEVENT",
    );
  });
});
