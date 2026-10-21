import type { Program, Union } from "@typespec/compiler";
import { unsafe_getEventDefinitions } from "./experimental/index.js";
import { EventsStateKeys } from "./lib.js";

/**
 * Compiler validation hook that checks each union marked with `@events` and
 * reports diagnostics for invalid payload paths and content-type annotations.
 */
export function $onValidate(program: Program) {
  checkForInvalidEvents(program);
}

function checkForInvalidEvents(program: Program) {
  program.stateSet(EventsStateKeys.events).forEach((events) => {
    const [, diagnostics] = unsafe_getEventDefinitions(program, events as Union);
    program.reportDiagnostics(diagnostics);
  });
}
