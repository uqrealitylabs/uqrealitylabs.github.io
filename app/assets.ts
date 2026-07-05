export function withBasePath(basePath: string, path = ""): string {
  if (/^(https?:|mailto:)/.test(path)) return path;
  return `${basePath}${path.replace(/^\/+/, "")}`;
}

export function resolveTexturePath(basePath: string, assetPath: string): string {
  return withBasePath(basePath, assetPath);
}

export function resolveContentPath(basePath: string, relativePath: string): string {
  return withBasePath(basePath, relativePath);
}
