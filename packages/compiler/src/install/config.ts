export const SupportedPackageManagersConfig = {
  npm: {
    commands: {
      install: ["install"],
    },
  },
  // pnpm: {},
  // yarn: {},
} as const;

export type SupportedPackageManager = keyof typeof SupportedPackageManagersConfig;

export function isSupportedPackageManager(value: string): value is SupportedPackageManager {
  return value in SupportedPackageManagersConfig;
}
