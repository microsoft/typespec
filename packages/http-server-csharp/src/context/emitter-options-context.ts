import { createNamedContext, useContext } from "@alloy-js/core";

export type CollectionType = "array" | "enumerable";

export interface EmitterOptionsContext {
  collectionType: CollectionType;
  serviceNamespace: string;
}

export const EmitterOptions = createNamedContext<EmitterOptionsContext>("EmitterOptions");

/**
 * Returns emitter options from context.
 * Falls back to defaults (array collection type, empty namespace) when used
 * outside a provider — e.g., in unit tests for individual components.
 */
export function useEmitterOptions(): EmitterOptionsContext {
  return useContext(EmitterOptions) ?? { collectionType: "array", serviceNamespace: "" };
}
