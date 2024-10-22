import type { Program, UnionVariant } from "@typespec/compiler";
import { isEvents } from "@typespec/events";
import { reportDiagnostic, SSEStateKeys } from "./lib.js";

export function $onValidate(program: Program) {
  checkForIncorrectlyAssignedTerminalEvents(program);
}

function checkForIncorrectlyAssignedTerminalEvents(program: Program) {
  program.stateSet(SSEStateKeys.terminalEvent).forEach((terminalEvent) => {
    if (!("union" in terminalEvent)) {
      return;
    }
    validateTerminalEvent(program, terminalEvent);
  });
}

export function validateTerminalEvent(program: Program, target: UnionVariant) {
  // Check that the union is decorated with `@TypeSpec.Events.events`.
  if (!isEvents(program, target.union)) {
    reportDiagnostic(program, {
      code: "terminal-event-not-in-events",
      target,
    });
  }
}
