import { createContext, useContext } from "react";
import type { BrowserHost } from "../../types.js";

export interface PlaygroundContext {
  readonly host: BrowserHost;
  readonly setContent: (content: string) => void;
}

const PlaygroundContext = createContext<PlaygroundContext | undefined>(undefined);

export const PlaygroundContextProvider = PlaygroundContext.Provider;

export function usePlaygroundContext(): PlaygroundContext {
  const context = useContext(PlaygroundContext);
  if (context === undefined) {
    throw new Error("usePlaygroundContext must be used within a PlaygroundContextProvider");
  }
  return context;
}
