import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/sse",
  diagnostics: {
    "terminal-event-not-in-events": {
      severity: "error",
      messages: {
        default:
          "A field marked as '@terminalEvent' must be a member of a type decorated with '@TpeSpec.Events.events'.",
      },
    },
  },
  state: {
    terminalEvent: { description: "State for the @terminalEvent decorator." },
  },
});

export const { reportDiagnostic, createDiagnostic, stateKeys: SSEStateKeys } = $lib;
