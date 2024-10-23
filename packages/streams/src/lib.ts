import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/streams",
  diagnostics: {},
  state: {
    streamOf: { description: "State for the @streamOf decorator." },
  },
});

export const { reportDiagnostic, createDiagnostic, stateKeys: StreamStateKeys } = $lib;
