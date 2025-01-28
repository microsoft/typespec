import type { Program } from "@typespec/compiler";
import { createContext, useContext } from "react";

const ProgramContext = createContext<Program | undefined>(undefined);

export const ProgramProvider = ProgramContext.Provider;

export function useProgram() {
  const program = useContext(ProgramContext);
  if (program === undefined) {
    throw new Error(`Expect to be used inside a ProgramProvider`);
  }
  return program;
}
