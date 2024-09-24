import type { Program, Union } from "@typespec/compiler";
import { getEventDefinitions } from "./decorators.js";
import { EventsStateKeys } from "./lib.js";
export function $onValidate(program: Program) {
  checkForInvalidEvents(program);
}

function checkForInvalidEvents(program: Program) {
  program.stateSet(EventsStateKeys.events).forEach((events) => {
    const [, diagnostics] = getEventDefinitions(program, events as Union);
    program.reportDiagnostics(diagnostics);
  });
}
