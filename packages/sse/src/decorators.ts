import type { TerminalEventDecorator } from "../generated-defs/TypeSpec.SSE.js";
import { SSEStateKeys } from "./lib.js";

/** @internal */
export const namespace = "TypeSpec.SSE";

export const $terminalEvent: TerminalEventDecorator = (context, target) => {
  // TODO: Add a check that the target's parent Union is decorated with `@events`.
  // validateTerminalEvent(context.program, target);

  context.program.stateSet(SSEStateKeys.terminalEvent).add(target);
};
