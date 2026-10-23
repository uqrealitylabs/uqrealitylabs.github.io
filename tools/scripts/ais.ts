import WebSocket from "ws";
import { parseSnapshot, type Vehicle } from "../../src/world/feeds.ts";

/** The server owns the AIS key and a single bounded stream, shared by active visitors */
export function ships(key = process.env.AISSTREAM_KEY) {
  let socket: WebSocket | undefined;
  let idle: ReturnType<typeof setTimeout> | undefined;
  let due = 0;
  const positions = new Map<string, Vehicle>();
  const close = () => {
    clearTimeout(idle);
    socket?.terminate();
    socket = undefined;
    positions.clear();
  };
  return {
    close,
    snapshot() {
      if (!key) return { status: "unavailable" };
      clearTimeout(idle);
      idle = setTimeout(close, 120_000);
      if (!socket && Date.now() >= due) {
        due = Date.now() + 60_000;
        const current = new WebSocket("wss://stream.aisstream.io/v0/stream", {
          perMessageDeflate: true,
          maxPayload: 64_000,
          handshakeTimeout: 10_000,
        });
        socket = current;
        current.on("open", () => {
          if (!current.extensions.includes("permessage-deflate")) {
            current.close();
            return;
          }
          current.send(
            JSON.stringify({
              APIKey: key,
              BoundingBoxes: [
                [
                  [-28.2, 152.5],
                  [-26.8, 154],
                ],
              ],
              FilterMessageTypes: ["PositionReport"],
            }),
          );
        });
        current.on("message", (bytes) => {
          try {
            const data = JSON.parse(bytes.toString());
            const report = data.Message?.PositionReport;
            if (!report) return;
            const vehicle = {
              id: String(report.UserID),
              longitude: report.Longitude,
              latitude: report.Latitude,
              altitude: 0,
              bearing: report.Cog,
              updated: Math.floor(
                Date.parse(
                  String(data.MetaData?.time_utc)
                    .replace(" +0000 UTC", "Z")
                    .replace(" ", "T")
                    .replace(/(\.\d{3})\d+/, "$1"),
                ) / 1000,
              ),
            };
            parseSnapshot({ updated: vehicle.updated, vehicles: [vehicle] });
            if (!positions.has(vehicle.id) && positions.size >= 300)
              positions.delete(positions.keys().next().value!);
            positions.set(vehicle.id, vehicle);
          } catch {
            /* Invalid or out-of-region reports never enter the public snapshot */
          }
        });
        current.on("error", () => current.terminate());
        current.on("close", () => {
          if (socket === current) socket = undefined;
        });
      }
      const vehicles = [...positions.values()].filter(
        (v) => Date.now() / 1000 - v.updated < 600,
      );
      return vehicles.length
        ? {
            status: "live",
            updated: Math.max(...vehicles.map((v) => v.updated)),
            vehicles,
          }
        : { status: "unavailable" };
    },
  };
}
