import { once } from "node:events";
import { createServer } from "node:http";
import Gtfs from "gtfs-realtime-bindings";
import { expect, it, vi } from "vitest";
import { parseSnapshot, parseWeather } from "../../src/world/feeds";
import { settings } from "../../tools/scripts/settings";
import { trafficFeed } from "../../tools/scripts/traffic";

it("rejects malformed, out-of-region or expired feed data and preserves zero observations", () => {
  const now = Math.floor(Date.now() / 1000);
  const value = {
    updated: now,
    vehicles: [
      {
        id: "CityCat",
        longitude: 153,
        latitude: -27.4,
        altitude: 0,
        bearing: 0,
        updated: now,
      },
    ],
  };
  expect(parseSnapshot(value).vehicles[0].altitude).toBe(0);
  expect(() => parseSnapshot({ ...value, updated: now - 90000 })).toThrow();
  expect(() =>
    parseSnapshot({
      ...value,
      vehicles: [{ ...value.vehicles[0], latitude: "-27.4" }],
    }),
  ).toThrow();
  expect(() =>
    parseSnapshot({
      ...value,
      vehicles: [{ ...value.vehicles[0], longitude: 0 }],
    }),
  ).toThrow();
  const current = {
    time: now,
    temperature_2m: 20,
    precipitation: 0,
    cloud_cover: 0,
    wind_speed_10m: 0,
    wind_direction_10m: 0,
    weather_code: 0,
  };
  expect(parseWeather([{ current }, { current }])[0].rain).toBe(0);
  expect(() =>
    parseWeather([{ current: { ...current, precipitation: -1 } }, { current }]),
  ).toThrow();
  expect(Object.getPrototypeOf(settings("build").output)).toBe(
    Object.prototype,
  );
});

it("coalesces traffic fetches, caches snapshots, enforces methods and backs off failed providers", async () => {
  const now = Math.floor(Date.now() / 1000);
  let fail = false;
  const fetcher = vi.fn(async (url: string | URL | Request) => {
    if (fail) return new Response("Unavailable", { status: 503 });
    if (String(url).includes("opensky"))
      return Response.json({
        time: now,
        states: [
          [
            "abc",
            "QF1",
            "AU",
            now,
            now,
            153.02,
            -27.48,
            600,
            false,
            100,
            150,
            0,
            null,
            650,
          ],
        ],
      });
    const bytes = Gtfs.transit_realtime.FeedMessage.encode({
      header: { gtfsRealtimeVersion: "2.0", timestamp: now },
      entity: [
        {
          id: "cat",
          vehicle: {
            timestamp: now,
            position: { longitude: 153.02, latitude: -27.48 },
          },
        },
      ],
    }).finish();
    return new Response(Uint8Array.from(bytes));
  });
  const adapter = trafficFeed(fetcher as typeof fetch);
  const server = createServer((request, response) => {
    void adapter(request, response, () => {
      response.writeHead(404);
      response.end();
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing test listener");
  const url = `http://127.0.0.1:${address.port}/api/world/traffic`;
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  try {
    const responses = await Promise.all([fetch(url), fetch(url)]);
    const snapshot = await responses[0].json();
    expect(snapshot.aircraft.status).toBe("live");
    expect(snapshot.ferries.vehicles).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect((await fetch(url, { method: "POST" })).status).toBe(405);
    fail = true;
    vi.spyOn(Date, "now").mockReturnValue((now + 500) * 1000);
    const stale = await (await fetch(url)).json();
    expect(stale.aircraft.status).toBe("stale");
    expect(fetcher).toHaveBeenCalledTimes(4);
    await fetch(url);
    expect(fetcher).toHaveBeenCalledTimes(4);
  } finally {
    vi.restoreAllMocks();
    warn.mockRestore();
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
