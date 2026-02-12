import { createContext, useContext, type ComponentContext } from "@alloy-js/core";
import type { Experimental_ComponentOverridesConfig } from "./config.js";

export interface ComponentOverridesContext {
  overrides?: Experimental_ComponentOverridesConfig;
}
/**
 * Context for setting overrides for components
 */
export const OverridesContext: ComponentContext<ComponentOverridesContext> = createContext({});

export function useOverrides(): ComponentOverridesContext {
  return useContext(OverridesContext)!;
}
