import type { Model, Program, UnionVariant } from "@typespec/compiler";
import { navigateProgram } from "@typespec/compiler";
import { isEvents } from "@typespec/events";
import { getContentTypes } from "@typespec/http";
import { getStreamOf } from "@typespec/streams";
import { reportDiagnostic, SSEStateKeys } from "./lib.js";

export function $onValidate(program: Program) {
  checkForIncorrectlyAssignedTerminalEvents(program);
  checkForSSEStreamWithoutEventsDecorator(program);
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

function checkForSSEStreamWithoutEventsDecorator(program: Program) {
  navigateProgram(program, {
    model: (model) => {
      validateSSEStream(program, model);
    },
  });
}

function validateSSEStream(program: Program, model: Model) {
  // Check if this model is a stream
  const streamOf = getStreamOf(program, model);
  if (!streamOf) {
    return;
  }

  // Check if the stream has the text/event-stream content type
  const contentTypeProperty = model.properties.get("contentType");
  if (!contentTypeProperty) {
    return;
  }

  const [contentTypes] = getContentTypes(contentTypeProperty);
  const isSSEStream = contentTypes.includes("text/event-stream");

  if (!isSSEStream) {
    return;
  }

  // The stream is an SSEStream, validate that streamOf is a union with @events
  if (streamOf.kind !== "Union") {
    // If streamOf is not a union, it's invalid for SSE streams
    reportDiagnostic(program, {
      code: "sse-stream-union-not-events",
      target: model,
    });
    return;
  }

  if (!isEvents(program, streamOf)) {
    reportDiagnostic(program, {
      code: "sse-stream-union-not-events",
      target: model,
    });
  }
}
