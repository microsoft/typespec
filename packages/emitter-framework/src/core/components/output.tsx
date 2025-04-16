import * as ay from "@alloy-js/core";
import { Program } from "@typespec/compiler";
import { TspContext } from "../context/tsp-context.js";

export interface OutputProps extends ay.OutputProps {
  /**
   * TypeSpec program.
   */
  program: Program;
}

export function Output({ program, ...rest }: OutputProps) {
  return (
    <TspContext.Provider value={{ program }}>
      <ay.Output {...rest} />
    </TspContext.Provider>
  );
}
