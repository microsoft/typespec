import type { Program, Union } from "@typespec/compiler";
import { unsafe_getEventDefinitions } from "./experimental/index.js";
import { EventsStateKeys } from "./lib.js";
export function $onValidate(program: Program) {
  checkForInvalidEvents(program);
}

function checkForInvalidEvents(program: Program) {
  program.stateSet(EventsStateKeys.events).forEach((events) => {
    const [, diagnostics] = unsafe_getEventDefinitions(program, events as Union);
    program.reportDiagnostics(diagnostics);
  });
}
