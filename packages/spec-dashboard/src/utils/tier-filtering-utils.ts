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
  patterns: { tier: string; regex: RegExp }[];
  defaultTier: string;
}

/**
 *  Compiles a TierConfig into a CompiledTierConfig for efficient classification.
 */
export function compileTierConfig(config: TierConfig): CompiledTierConfig {
  const exact = new Map<string, string>();
  const patterns: { tier: string; regex: RegExp }[] = [];

  const { tiers, default: defaultTier } = config;

  if (!tiers[defaultTier]) {
    throw new Error(`Invalid tierConfig.default: "${defaultTier}" not found in tiers`);
  }

  for (const [tier, patternList] of Object.entries(tiers)) {
    for (const pattern of patternList) {
      if (pattern.includes("*")) {
        const regexPattern = pattern
          .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // escape regex special chars
          .replace(/\*/g, ".*"); // replace * with .*
        patterns.push({ tier, regex: new RegExp(`^${regexPattern}$`) });
      } else {
        exact.set(pattern, tier);
      }
    }
  }

  return { exact, patterns, defaultTier };
}

/**
 * Classifies a scenario name into a tier using the compiled tier config.
 */
export function classifyScenario(name: string, config: CompiledTierConfig): string {
  const { exact, patterns, defaultTier } = config;

  const tier = exact.get(name);
  if (tier) return tier;

  for (const { tier, regex } of patterns) {
    if (regex.test(name)) return tier;
  }

  return defaultTier; // fallback
}
