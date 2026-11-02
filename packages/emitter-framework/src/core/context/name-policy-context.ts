import { type ComponentContext, createNamedContext, useContext } from "@alloy-js/core";
import type { TransformNamePolicy } from "../transport-name-policy.js";

/**
 * Separates wire names from generated application names for a component subtree.
 * Without a provider, string names pass through unchanged and symbol names become
 * empty strings; language components can install a language-specific policy.
 */
export const TransformNamePolicyContext: ComponentContext<TransformNamePolicy> =
  createNamedContext<TransformNamePolicy>("TransfromNamePolicy", {
    getApplicationName(type) {
      return typeof type.name === "string" ? type.name : "";
    },
    getTransportName(type) {
      return typeof type.name === "string" ? type.name : "";
    },
  });

/** Gets the nearest transformation policy, falling back to the identity policy in {@link TransformNamePolicyContext}. */
export function useTransformNamePolicy() {
  return useContext(TransformNamePolicyContext)!;
}
