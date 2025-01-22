import type { UnionVariant } from "@typespec/compiler";
import { useStateSet } from "@typespec/compiler/utils";
import type { TerminalEventDecorator } from "../generated-defs/TypeSpec.SSE.js";
import { SSEStateKeys } from "./lib.js";

const [isTerminalEvent, setTerminalEvent] = useStateSet<UnionVariant>(SSEStateKeys.terminalEvent);

export const $terminalEventDecorator: TerminalEventDecorator = (context, target) => {
  setTerminalEvent(context.program, target);
};

export { isTerminalEvent };
