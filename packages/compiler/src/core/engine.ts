export type TypeSpecEngine = "node" | "tsp";

/**
 * Expose how TypeSpec is being run.
 */
export function getTypeSpecEngine(): TypeSpecEngine {
  return (globalThis as any).TYPESPEC_ENGINE ?? "node";
}
