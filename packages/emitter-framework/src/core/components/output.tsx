import {
  Output as CoreOutput,
  splitProps,
  type OutputProps as CoreOutputProps,
} from "@alloy-js/core";
import type { Program } from "@typespec/compiler";
import { TspContext } from "../context/tsp-context.js";

/** Alloy output options with the TypeSpec program made available to descendant components. */
export interface OutputProps extends CoreOutputProps {
  /**
   * TypeSpec program.
   */
  program: Program;
}

/**
 * Creates an Alloy output root and provides {@link TspContext} to its descendants.
 * All options other than `program`, including children and naming policies, are
 * forwarded to Alloy's Output. Use {@link writeOutput} to persist the rendered files.
 */
export function Output(props: OutputProps) {
  const [{ program }, rest] = splitProps(props, ["program"]);
  return (
    <TspContext.Provider value={{ program }}>
      <CoreOutput {...rest} />
    </TspContext.Provider>
  );
}
