import { createTypeSpecLibrary } from "@typespec/compiler";

/**
 * Defines the streams library's identity and stream-data state key for the
 * TypeSpec compiler.
 */
export const $lib = createTypeSpecLibrary({
  name: "@typespec/streams",
  diagnostics: {},
  state: {
    streamOf: { description: "State for the @streamOf decorator." },
  },
});

export const { reportDiagnostic, createDiagnostic, stateKeys: StreamStateKeys } = $lib;
