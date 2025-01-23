import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/http-client-library",
  // Define diagnostics for the library. This will provide a typed API to report diagnostic as well as a auto doc generation.
  diagnostics: {
    "banned-alternate-name": {
      severity: "error",
      messages: {
        default: paramMessage`Banned alternate name "${"name"}".`,
      },
    },
    "use-client-context-without-provider": {
      severity: "error",
      messages: {
        default: "useClientLibrary used without ClientLibraryProvider.",
      },
      description:
        "useClientLibrary used without ClientLibraryProvider. Make sure to wrap your component tree with ClientLibraryProvider or a ClientLibrary component.",
    },
  },
  // Defined state keys for storing metadata in decorator.
  state: {
    alternateName: { description: "alternateName" },
  },
});

export const { reportDiagnostic, createDiagnostic, stateKeys: StateKeys } = $lib;
