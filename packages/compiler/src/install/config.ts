export interface PackageManagerConfig {
  commands: {
    install: string[];
  };
}

export type SupportedPackageManager = "npm";

const SupportedPackageManagersConfig: Record<SupportedPackageManager, PackageManagerConfig> = {
  npm: {
    commands: {
      install: ["install"],
    },
  },
  // pnpm: {},
  // yarn: {},
} as const;

export function isSupportedPackageManager(value: string): value is SupportedPackageManager {
  return value in SupportedPackageManagersConfig;
}
export function getPackageManagerConfig(name: SupportedPackageManager): PackageManagerConfig {
  return SupportedPackageManagersConfig[name];
}
