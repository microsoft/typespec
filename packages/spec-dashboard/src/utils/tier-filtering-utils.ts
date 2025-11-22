/**
 * Configuration for classifying scenarios into tiers.
 */
export interface TierConfig {
  default: string;
  tiers: Record<string, string[]>; // only arrays allowed
}

/**
 * Compiled tier config for efficient classification.
 */
export interface CompiledTierConfig {
  exact: Map<string, string>;
  prefixes: { tier: string; prefix: string }[];
  defaultTier: string;
}

/**
 *  Compiles a TierConfig into a CompiledTierConfig for efficient classification.
 */
export function compileTierConfig(config: TierConfig): CompiledTierConfig {
  const exact = new Map<string, string>();
  const prefixes: { tier: string; prefix: string }[] = [];

  const { tiers, default: defaultTier } = config;

  if (!tiers[defaultTier]) {
    throw new Error(`Invalid tierConfig.default: "${defaultTier}" not found in tiers`);
  }

  for (const [tier, patterns] of Object.entries(tiers)) {
    for (const pattern of patterns) {
      if (pattern.includes("*")) {
        const prefix = pattern.slice(0, pattern.indexOf("*"));
        prefixes.push({ tier, prefix });
      } else {
        exact.set(pattern, tier);
      }
    }
  }

  return { exact, prefixes, defaultTier };
}

/**
 * Classifies a scenario name into a tier using the compiled tier config.
 */
export function classifyScenario(name: string, config: CompiledTierConfig): string {
  const { exact, prefixes, defaultTier } = config;

  const tier = exact.get(name);
  if (tier) return tier;

  for (const { tier, prefix } of prefixes) {
    if (name.startsWith(prefix)) return tier;
  }

  return defaultTier; // fallback
}
