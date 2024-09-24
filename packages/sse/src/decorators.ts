import type { UnionVariant } from "@typespec/compiler";
import { unsafe_useStateSet } from "@typespec/compiler/experimental";
import type { TerminalEventDecorator } from "../generated-defs/TypeSpec.SSE.js";
import { SSEStateKeys } from "./lib.js";

const [isTerminalEvent, setTerminalEvent] = unsafe_useStateSet<UnionVariant>(
  SSEStateKeys.terminalEvent,
);

export const $terminalEventDecorator: TerminalEventDecorator = (context, target) => {
  setTerminalEvent(context.program, target);
};

export { isTerminalEvent };
