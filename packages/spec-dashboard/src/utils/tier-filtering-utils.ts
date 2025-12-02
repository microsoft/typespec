/**
 * Configuration for classifying scenarios into tiers.
 *
 * @example
 * ```typescript
 * const config: TierConfig = {
 *   default: "core",
 *   tiers: {
 *     // Single configuration (applies to all emitters)
 *     core: {
 *       patterns: ["Type.*", "Authentication.Basic.*"],
 *     },
 *     // Multiple configurations for the same tier
 *     advanced: [
 *       {
 *         patterns: ["Advanced.*", "Streaming.*"],
 *         emitters: ["emitter-python", "emitter-typescript"],
 *       },
 *       {
 *         patterns: ["AdvancedGlobal.*"],
 *         // applies to all emitters
 *       },
 *     ],
 *     experimental: {
 *       patterns: ["Experimental.*"],
 *       emitters: ["emitter-rust"],
 *     },
 *   },
 * };
 * ```
 */
export interface TierConfig {
  default: string;
  tiers: Record<
    string,
    | {
        patterns: string[];
        emitters?: string[]; // if undefined, applies to all emitters
      }
    | {
        patterns: string[];
        emitters?: string[];
      }[]
  >;
}

/**
 * Compiled tier config for efficient classification.
 */
export interface CompiledTierConfig {
  exact: Map<string, { tier: string; emitters?: string[] }>;
  patterns: { tier: string; regex: RegExp; emitters?: string[] }[];
  defaultTier: string;
}

/**
 *  Compiles a TierConfig into a CompiledTierConfig for efficient classification.
 */
export function compileTierConfig(config: TierConfig): CompiledTierConfig {
  const exact = new Map<string, { tier: string; emitters?: string[] }>();
  const patterns: { tier: string; regex: RegExp; emitters?: string[] }[] = [];

  const { tiers, default: defaultTier } = config;

  if (!tiers[defaultTier]) {
    throw new Error(`Invalid tierConfig.default: "${defaultTier}" not found in tiers`);
  }

  for (const [tier, tierConfig] of Object.entries(tiers)) {
    // Handle both single config object and array of config objects
    const configs = Array.isArray(tierConfig) ? tierConfig : [tierConfig];

    for (const config of configs) {
      const { patterns: patternList, emitters } = config;
      for (const pattern of patternList) {
        if (pattern.includes("*")) {
          const regexPattern = pattern
            .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // escape regex special chars
            .replace(/\*/g, ".*"); // replace * with .*
          patterns.push({ tier, regex: new RegExp(`^${regexPattern}$`), emitters });
        } else {
          exact.set(pattern, { tier, emitters });
        }
      }
    }
  }

  return { exact, patterns, defaultTier };
}

/**
 * Classifies a scenario name into a tier using the compiled tier config.
 * @param name - The scenario name to classify
 * @param config - The compiled tier configuration
 * @param emitterName - Optional emitter name to apply emitter-specific rules
 */
export function classifyScenario(
  name: string,
  config: CompiledTierConfig,
  emitterName?: string,
): string {
  const { exact, patterns, defaultTier } = config;

  // Helper function to check if emitter matches
  const matchesEmitter = (emitters?: string[]): boolean => {
    if (!emitters) return true; // applies to all emitters
    if (!emitterName) return false; // no emitter specified, skip emitter-specific rules
    return emitters.includes(emitterName);
  };

  const exactMatch = exact.get(name);
  if (exactMatch && matchesEmitter(exactMatch.emitters)) {
    return exactMatch.tier;
  }

  for (const { tier, regex, emitters } of patterns) {
    if (regex.test(name) && matchesEmitter(emitters)) {
      return tier;
    }
  }

  return defaultTier; // fallback
}
