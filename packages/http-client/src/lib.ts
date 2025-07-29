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
    "undefined-namespace-for-client": {
      severity: "error",
      messages: {
        default: "Undefined namespace for client.",
      },
    },
    "cant-find-client": {
      severity: "error",
      messages: {
        default: "Can't find any clients in the spec",
      },
      description:
        "Can't find any clients in the spec. This can happen when there are no operations defined in the spec.",
    },
    "multiple-services": {
      severity: "warning",
      messages: {
        default:
          "Multiple services found. Only the first service will be used; others will be ignored.",
      },
    },
    "no-client-defined": {
      severity: "warning",
      messages: {
        default: "No client defined in the spec. To define a client see TODO: add link to docs",
      },
      description:
        "No client defined for the operation. This can happen when there are no operations defined in the spec or when the operations are not grouped under a client.",
    },
    "client-without-service": {
      severity: "error",
      messages: {
        default: `Client "${"clientName"}" does not have an associated service.`,
      },
      description: `Client "${"clientName"}" does not have an associated service. Make sure the client is defined under a service.`,
    },
  },
  // Defined state keys for storing metadata in decorator.
  state: {
    alternateName: { description: "alternateName" },
  },
});

export const { reportDiagnostic, createDiagnostic, stateKeys: StateKeys, createStateSymbol } = $lib;
