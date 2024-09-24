import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/events",
  diagnostics: {
    "invalid-content-type-target": {
      severity: "error",
      messages: {
        default: `@contentType can only be specified on the top-level event envelope, or the event payload marked with @data`,
      },
    },
    "multiple-event-payloads": {
      severity: "error",
      messages: {
        default: paramMessage`Event payload already applied to ${"dataPath"} but also exists under ${"currentPath"}`,

        payloadInIndexedModel: paramMessage`Event payload applied from inside a Record or Array at ${"dataPath"}`,
      },
    },
  },
  state: {
    events: { description: "State for the @events decorator." },
    contentType: { description: "State for the @contentType decorator." },
    data: { description: "State for the @data decorator." },
  },
});

export const { reportDiagnostic, createDiagnostic, stateKeys: EventsStateKeys } = $lib;
