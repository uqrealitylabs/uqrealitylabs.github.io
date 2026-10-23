import React, { useEffect, useState } from "react";
import type { Root } from "react-dom/client";
import {
  type CalendarEvent,
  eventDay,
  monthDays,
} from "../content/calendar.ts";

type Props = {
  locale: string;
  events: CalendarEvent[];
  initialDay: string;
  labels: { today: string; previous: string; next: string; emptyMonth: string };
};
export function Calendar({
  locale,
  events,
  initialDay,
  labels,
  onReady,
}: Props & { onReady?(): void }) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  const [today, setToday] = useState(initialDay);
  const [selected, setSelected] = useState(initialDay.slice(0, 7));
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let current = eventDay(new Date().toISOString());
    let timer = 0;
    setToday(current);
    setSelected(current.slice(0, 7));
    setEnabled(true);
    const refresh = () => {
      window.clearTimeout(timer);
      if (document.hidden) return;
      const next = eventDay(new Date().toISOString());
      if (next !== current) {
        const previousMonth = current.slice(0, 7);
        setToday(next);
        setSelected((value) =>
          value === previousMonth ? next.slice(0, 7) : value,
        );
        current = next;
      }
      // Brisbane stays at UTC+10, so only the next local midnight needs a timer
      const midnight = Date.parse(`${current}T00:00:00+10:00`) + 86_400_000;
      timer = window.setTimeout(
        refresh,
        Math.max(1000, midnight - Date.now() + 100),
      );
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("pageshow", refresh);
    refresh();
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, []);
  const [year, month] = selected.split("-").map(Number);
  const cells = monthDays(year, month);
  while (cells.length % 7) cells.push(0);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) =>
    cells.slice(i * 7, i * 7 + 7),
  );
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2024, 0, 1 + i))),
  );
  const title = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1)));
  const dated = events.map((event) => ({
    event,
    start: eventDay(event.startDate),
    end: eventDay(new Date(Date.parse(event.endDate) - 1).toISOString()),
  }));
  const changeMonth = (step: number) => {
    const date = new Date(Date.UTC(year, month - 1 + step));
    setSelected(date.toISOString().slice(0, 7));
  };
  return (
    <>
      <div className="calendar-controls" hidden={!enabled}>
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          disabled={year === 1900 && month === 1}
          aria-label={labels.previous}
        >
          ←
        </button>
        <button type="button" onClick={() => setSelected(today.slice(0, 7))}>
          {labels.today}
        </button>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          disabled={year === 2200 && month === 12}
          aria-label={labels.next}
        >
          →
        </button>
      </div>
      <div id="month-view" aria-live="polite">
        <table className="calendar-table">
          <caption>{title}</caption>
          <thead>
            <tr>
              {weekdays.map((day) => (
                <th key={day} scope="col">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week.find(Boolean)}>
                {week.map((day, j) => {
                  const key = `${selected}-${String(day).padStart(2, "0")}`;
                  return day ? (
                    <td
                      key={weekdays[j]}
                      className={key === today ? "is-today" : undefined}
                    >
                      <span>
                        {day}
                        {key === today && (
                          <span className="sr-only"> {labels.today}</span>
                        )}
                      </span>
                      {dated
                        .filter(({ start, end }) => start <= key && end >= key)
                        .map(({ event }) => (
                          <a
                            key={event.slug}
                            href={`#event-${event.slug}`}
                            className={
                              event.cancelled ? "is-cancelled" : undefined
                            }
                          >
                            {event.title}
                          </a>
                        ))}
                    </td>
                  ) : (
                    <td key={weekdays[j]} className="calendar-table__blank" />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p
        id="month-empty"
        className="annotation"
        hidden={dated.some(
          ({ start, end }) =>
            start.slice(0, 7) <= selected && end.slice(0, 7) >= selected,
        )}
      >
        {labels.emptyMonth}
      </p>
    </>
  );
}
export async function mountCalendar(host: HTMLElement, signal?: AbortSignal) {
  const { hydrateRoot } = await import("react-dom/client");
  if (signal?.aborted || !host.isConnected) return;
  const props: Props = JSON.parse(host.dataset.calendar ?? "{}");
  let root: Root | undefined;
  // A route can disappear before hydration commits, so cleanup waits for that commit
  await new Promise<void>((resolve) => {
    root = hydrateRoot(host, <Calendar {...props} onReady={resolve} />);
  });
  return root;
}
