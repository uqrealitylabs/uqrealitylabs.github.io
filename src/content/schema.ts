export type Locale = "en" | "es";

export function isSafeHref(value: string) {
  if (
    [...value].some((char) => char <= " " || char === "\u007f" || char === "\\")
  )
    return false;
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return false;
  }
  if (
    [...decoded].some(
      (char) => char < " " || char === "\u007f" || char === "\\",
    )
  )
    return false;
  if (value.startsWith("/"))
    return (
      !decoded.startsWith("//") &&
      !decoded.split(/[?#]/)[0].split("/").includes("..")
    );
  if (value.startsWith("mailto:"))
    return /^mailto:[^@?]+@[^@?]+(?:\?[^\r\n]*)?$/.test(value);
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
