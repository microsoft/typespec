import * as ay from "@alloy-js/core";
import type { Program } from "@typespec/compiler";
import { TspContext } from "../context/tsp-context.js";

export interface OutputProps extends ay.OutputProps {
  /**
   * TypeSpec program.
   */
  program: Program;
}

export function Output(props: OutputProps) {
  const [{ program }, rest] = ay.splitProps(props, ["program"]);
  return (
    <TspContext.Provider value={{ program }}>
      <ay.Output {...rest} />
    </TspContext.Provider>
  );
}
