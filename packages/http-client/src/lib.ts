import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/http-client-library",
  // Define diagnostics for the library. This will provide a typed API to report diagnostic as well as a auto doc generation.
  diagnostics: {
    "use-client-context-without-provider": {
      severity: "error",
      messages: {
        default: "useClientLibrary used without ClientLibraryProvider.",
      },
      description:
        "useClientLibrary used without ClientLibraryProvider. Make sure to wrap your component tree with ClientLibraryProvider or a ClientLibrary component.",
    },
    "cant-find-client": {
      severity: "error",
      messages: {
        default: "Can't find any clients in the spec",
      },
      description:
        "Can't find any clients in the spec. This can happen when there are no operations defined in the spec.",
    },
    "client-url-template-unknown": {
      severity: "error",
      messages: {
        default: paramMessage`Client URL template unknown for client ${"clientName"}.`,
      },
    },
    "invalid-discriminator-type": {
      severity: "warning",
      messages: {
        default: paramMessage`Invalid discriminator type ${"type"}. Ignoring as discriminator.`,
      },
    },
  },
});

export const { reportDiagnostic, createDiagnostic, stateKeys: StateKeys } = $lib;
