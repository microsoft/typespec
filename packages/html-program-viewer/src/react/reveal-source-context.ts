import type { Type } from "@typespec/compiler";
import { createContext, useContext } from "react";

/** Reveal where the given type is declared in the host editor. */
export type RevealSourceCallback = (type: Type) => void;

const RevealSourceContext = createContext<RevealSourceCallback | undefined>(undefined);

export const RevealSourceProvider = RevealSourceContext.Provider;

export function useRevealSource(): RevealSourceCallback | undefined {
  return useContext(RevealSourceContext);
}
