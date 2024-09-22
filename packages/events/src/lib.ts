import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/events",
  diagnostics: {},
  state: {
    events: { description: "State for the @events decorator." },
    contentType: { description: "State for the @contentType decorator." },
    data: { description: "State for the @data decorator." },
  },
});

export const { reportDiagnostic, createDiagnostic, stateKeys: EventsStateKeys } = $lib;
