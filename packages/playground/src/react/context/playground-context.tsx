import { createContext, useContext } from "react";
import type { BrowserHost } from "../../types.js";

/** Services made available to descendants of a {@link Playground} component. */
export interface PlaygroundContext {
  /** Browser host used for this playground's compilation and loaded-library metadata. */
  readonly host: BrowserHost;
  /** Replace editor content and notify the playground's state owner. */
  readonly setContent: (content: string) => void;
}

const PlaygroundContext = createContext<PlaygroundContext | undefined>(undefined);

export const PlaygroundContextProvider = PlaygroundContext.Provider;

/**
 * Read the containing playground's host and content setter.
 * Throws when called outside a playground context provider.
 */
export function usePlaygroundContext(): PlaygroundContext {
  const context = useContext(PlaygroundContext);
  if (context === undefined) {
    throw new Error("usePlaygroundContext must be used within a PlaygroundContextProvider");
  }
  return context;
}
