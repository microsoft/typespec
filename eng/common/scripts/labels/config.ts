import type { RepoConfig } from "./types.ts";

export function defineConfig(config: RepoConfig) {
  return config;
}

export function defineLabels<const T extends string>(
  labels: Record<T, { color: string; description: string }>,
) {
  return labels;
}
