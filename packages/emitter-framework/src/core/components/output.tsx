import {
  Output as CoreOutput,
  splitProps,
  type OutputProps as CoreOutputProps,
} from "@alloy-js/core";
import type { Program } from "@typespec/compiler";
import { TspContext } from "../context/tsp-context.js";

export interface OutputProps extends CoreOutputProps {
  /**
   * TypeSpec program.
   */
  program: Program;
}

export function Output(props: OutputProps) {
  const [{ program }, rest] = splitProps(props, ["program"]);
  return (
    <TspContext.Provider value={{ program }}>
      <CoreOutput {...rest} />
    </TspContext.Provider>
  );
}
