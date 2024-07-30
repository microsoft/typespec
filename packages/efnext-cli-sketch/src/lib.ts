import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "typespec-cli",
  diagnostics: {},
  state: {
    cli: {},
    short: {},
    positional: {},
    invertable: {},
  },
});

export const { reportDiagnostic, createDiagnostic, stateKeys } = $lib;
