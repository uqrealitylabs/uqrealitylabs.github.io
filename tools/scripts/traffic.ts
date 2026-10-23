import type { IncomingMessage, ServerResponse } from "node:http";
import Gtfs from "gtfs-realtime-bindings";
import {
  parseSnapshot,
  type Snapshot,
  type Vehicle,
} from "../../src/world/feeds.ts";
import { ships } from "./ais.ts";

/** Fixed upstreams, one in-flight request per source and bounded stale recovery */
export function trafficFeed(fetcher = fetch) {
  const ais = ships();
  let token = "",
    tokenDue = 0;
  let authenticating: Promise<string> | undefined;
  const credentials = async () => {
    if (!process.env.OPENSKY_CLIENT_ID || !process.env.OPENSKY_CLIENT_SECRET)
      return "";
    if (Date.now() < tokenDue) return token;
    authenticating ??= (async () => {
      const response = await fetcher(
        "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token",
        {
          method: "POST",
          signal: AbortSignal.timeout(10000),
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: process.env.OPENSKY_CLIENT_ID!,
            client_secret: process.env.OPENSKY_CLIENT_SECRET!,
          }),
        },
      );
      if (!response.ok)
        throw new Error(`OpenSky authentication: ${response.status}`);
      const data = await response.json();
      if (
        typeof data.access_token !== "string" ||
        data.access_token.length > 16_000 ||
        !Number.isFinite(data.expires_in)
      )
        throw new Error("Invalid OpenSky token response");
      token = `Bearer ${data.access_token}`;
      tokenDue =
        Date.now() + Math.max(0, Math.min(3600, data.expires_in - 60)) * 1000;
      return token;
    })().finally(() => {
      authenticating = undefined;
    });
    return authenticating;
  };
  const entries = new Map<
    string,
    { value?: Snapshot; next: number; pending?: Promise<void> }
  >();
  async function get(name: "aircraft" | "ferries") {
    const interval = name === "aircraft" ? 240_000 : 60_000;
    const entry = entries.get(name) ?? { next: 0 };
    entries.set(name, entry);
    if (Date.now() >= entry.next && !entry.pending) {
      entry.next = Date.now() + interval;
      entry.pending = (async () => {
        const authorization = name === "aircraft" ? await credentials() : "";
        const response = await fetcher(
          name === "aircraft"
            ? "https://opensky-network.org/api/states/all?lamin=-28&lomin=152.7&lamax=-27&lomax=153.5"
            : "https://gtfsrt.api.translink.com.au/api/realtime/SEQ/VehiclePositions/Ferry",
          {
            signal: AbortSignal.timeout(10000),
            headers: {
              ...(authorization ? { Authorization: authorization } : {}),
              Accept:
                name === "aircraft"
                  ? "application/json"
                  : "application/x-protobuf",
            },
          },
        );
        if (!response.ok || !response.body)
          throw new Error(`Traffic provider: ${response.status}`);
        const chunks: Uint8Array[] = [];
        let size = 0;
        const reader = response.body.getReader();
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 2_000_000)
              throw new Error("Traffic response exceeds budget");
            chunks.push(value);
          }
        } finally {
          await reader.cancel();
        }
        const bytes = Buffer.concat(chunks);
        let value: Snapshot;
        if (name === "aircraft") {
          const data = JSON.parse(bytes.toString());
          if (!data || !Array.isArray(data.states) || data.states.length > 300)
            throw new Error("Invalid aircraft response");
          value = {
            updated: data.time,
            vehicles: data.states
              .filter(
                (s: unknown) =>
                  Array.isArray(s) && s[6] != null && s[5] != null && !s[8],
              )
              .map((s: unknown[]) => ({
                id: String(s[1] || s[0]).trim(),
                longitude: s[5],
                latitude: s[6],
                altitude: s[13] ?? s[7] ?? 0,
                bearing: s[10] ?? 0,
                updated: s[3] ?? data.time,
              })) as Vehicle[],
          };
        } else {
          const feed = Gtfs.transit_realtime.FeedMessage.decode(bytes);
          const stamp = Number(feed.header.timestamp);
          value = {
            updated: stamp,
            vehicles: feed.entity
              .filter((e) => e.vehicle?.position)
              .slice(0, 300)
              .map((e) => {
                const v = e.vehicle!;
                return {
                  id: v.vehicle?.label || v.vehicle?.id || e.id,
                  longitude: v.position!.longitude,
                  latitude: v.position!.latitude,
                  altitude: 0,
                  bearing: v.position!.bearing ?? 0,
                  updated: Number(v.timestamp ?? stamp),
                };
              }),
          };
        }
        entry.value = parseSnapshot(value);
      })()
        .catch((error) => {
          console.warn(
            `${name} feed unavailable: ${error instanceof Error ? error.message : error}`,
          );
        })
        .finally(() => {
          entry.pending = undefined;
        });
    }
    await entry.pending;
    const value = entry.value;
    if (!value || Date.now() / 1000 - value.updated > 900)
      return { status: "unavailable" as const };
    return {
      status:
        Date.now() / 1000 - value.updated > (interval / 1000) * 2
          ? ("stale" as const)
          : ("live" as const),
      ...value,
    };
  }
  const handle = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ) => {
    if (request.url?.split("?")[0] !== "/api/world/traffic") return next();
    if (request.method !== "GET") {
      response.writeHead(405, { Allow: "GET" });
      response.end();
      return;
    }
    const [aircraft, ferries] = await Promise.all([
      get("aircraft"),
      get("ferries"),
    ]);
    if (response.destroyed) return;
    response.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=30",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(JSON.stringify({ aircraft, ferries, ships: ais.snapshot() }));
  };
  return Object.assign(handle, { dispose: () => ais.close() });
}
