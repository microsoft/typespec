import createDebug from "debug";

export const StartFileName = "main.tsp";
export const TspConfigFileName = "tspconfig.yaml";
export const EmptyGuid = "00000000-0000-0000-0000-000000000000";

/**
 * Debug logger for Language Model operations.
 * Can be enabled via DEBUG environment variable.
 * Usage: DEBUG=typespec:lm
 */
export const debugLoggers = {
  lm: createDebug("typespec:lm"),
} as const;
