export type Vehicle = {
  id: string;
  longitude: number;
  latitude: number;
  altitude: number;
  bearing: number;
  updated: number;
};
export type Snapshot = { updated: number; vehicles: Vehicle[] };
export type Conditions = {
  name: string;
  updated: number;
  temperature: number;
  cloud: number;
  rain: number;
  wind: number;
  direction: number;
  code: number;
};
const bounded = (n: unknown, min: number, max: number): n is number =>
  typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;

export function parseSnapshot(value: unknown, now = Date.now()): Snapshot {
  const data = value as Snapshot;
  if (
    !data ||
    !bounded(data.updated, now / 1000 - 86400, now / 1000 + 300) ||
    !Array.isArray(data.vehicles) ||
    data.vehicles.length > 300 ||
    data.vehicles.some(
      (v) =>
        !v ||
        typeof v.id !== "string" ||
        v.id.length > 80 ||
        !bounded(v.longitude, 152.5, 154) ||
        !bounded(v.latitude, -28.2, -26.8) ||
        !bounded(v.altitude, 0, 18000) ||
        !bounded(v.bearing, 0, 360) ||
        !bounded(v.updated, now / 1000 - 86400, now / 1000 + 300),
    )
  )
    throw new Error("Invalid traffic snapshot");
  return data;
}

export function parseWeather(value: unknown): Conditions[] {
  const sources = Array.isArray(value) ? value : [value];
  if (sources.length !== 2)
    throw new Error("Missing local weather observations");
  return sources.map((source, i) => {
    const c = source?.current;
    if (
      !c ||
      !bounded(c.temperature_2m, -20, 60) ||
      !bounded(c.cloud_cover, 0, 100) ||
      !bounded(c.precipitation, 0, 500) ||
      !bounded(c.wind_speed_10m, 0, 400) ||
      !bounded(c.wind_direction_10m, 0, 360) ||
      !bounded(c.weather_code, 0, 99) ||
      !bounded(c.time, Date.now() / 1000 - 86400, Date.now() / 1000 + 1800)
    )
      throw new Error("Invalid local weather observation");
    return {
      name: i ? "Brisbane" : "St Lucia",
      updated: c.time,
      temperature: c.temperature_2m,
      cloud: c.cloud_cover,
      rain: c.precipitation,
      wind: c.wind_speed_10m,
      direction: c.wind_direction_10m,
      code: c.weather_code,
    };
  });
}

export const weatherUrl =
  "https://api.open-meteo.com/v1/forecast?latitude=-27.4974,-27.4698&longitude=153.013,153.0251&current=temperature_2m,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m&timeformat=unixtime&timezone=UTC&forecast_days=1";
