import type { Event } from "./records.ts";

export type CalendarEvent = Pick<
  Event,
  "slug" | "title" | "startDate" | "endDate" | "cancelled"
>;

export const timeZone = "Australia/Brisbane";

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export function eventDay(value: string) {
  const parts = Object.fromEntries(
    dayFormatter
      .formatToParts(new Date(value))
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function monthDays(year: number, month: number) {
  if (
    !Number.isInteger(year) ||
    year < 1900 ||
    year > 2200 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  )
    throw new Error("Invalid calendar month");
  const first = new Date(Date.UTC(year, month - 1, 1));
  const blanks = (first.getUTCDay() + 6) % 7;
  return [
    ...Array.from({ length: blanks }, () => 0),
    ...Array.from(
      { length: new Date(Date.UTC(year, month, 0)).getUTCDate() },
      (_, i) => i + 1,
    ),
  ];
}

function escapeCalendar(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\r", "")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}
function timestamp(value: string) {
  return new Date(value)
    .toISOString()
    .replaceAll(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export function calendarFeed(
  events: Event[],
  origin = "https://uqrealitylabs.com",
) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UQ Reality Labs//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:UQ Reality Labs",
    "X-WR-TIMEZONE:Australia/Brisbane",
  ];
  for (const event of events.filter((item) => !item.draft))
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@uqrealitylabs.com`,
      `DTSTAMP:${timestamp(event.updatedAt)}`,
      `LAST-MODIFIED:${timestamp(event.updatedAt)}`,
      `DTSTART:${timestamp(event.startDate)}`,
      `DTEND:${timestamp(event.endDate)}`,
      `SUMMARY:${escapeCalendar(event.title)}`,
      `LOCATION:${escapeCalendar(event.location)}`,
      `DESCRIPTION:${escapeCalendar(event.description)}`,
      `URL:${origin}/events/${event.slug}/`,
      `STATUS:${event.cancelled ? "CANCELLED" : "CONFIRMED"}`,
      "END:VEVENT",
    );
  lines.push("END:VCALENDAR");
  return `${lines
    .map((line) => {
      const folded: string[] = [];
      let part = "";
      let bytes = 0;
      for (const char of line) {
        const size = new TextEncoder().encode(char).length;
        if (bytes + size > 75) {
          folded.push(part);
          part = " ";
          bytes = 1;
        }
        part += char;
        bytes += size;
      }
      folded.push(part);
      return folded.join("\r\n");
    })
    .join("\r\n")}\r\n`;
}
