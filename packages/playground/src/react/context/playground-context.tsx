import { createContext, useContext } from "react";
import { BrowserHost } from "../../types.js";

export interface PlaygroundContext {
  host: BrowserHost;
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
