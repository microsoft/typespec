import { createCadlLibrary, paramMessage } from "@cadl-lang/compiler";

const libDefinition = {
  name: "@cadl-lang/rest",
  diagnostics: {
    "produces-namespace-only": {
      severity: "error",
      messages: {
        default: "The @produces decorator can only be applied to namespaces.",
      },
    },
    "consumes-namespace-only": {
      severity: "error",
      messages: {
        default: "The @consumes decorator can only be applied to namespaces.",
      },
    },
    "http-verb-duplicate": {
      severity: "error",
      messages: {
        default: paramMessage`HTTP verb already applied to ${"entityName"}`,
      },
    },
    "http-verb-wrong-type": {
      severity: "error",
      messages: {
        default: paramMessage`Cannot use @${"verb"} on a ${"entityKind"}`,
      },
    },
    "decorator-wrong-type": {
      severity: "error",
      messages: {
        default: paramMessage`Cannot use @${"decorator"} on a ${"entityKind"}`,
      },
    },
    "operation-resource-wrong-type": {
      severity: "error",
      messages: {
        default: paramMessage`Cannot register resource operation "${"operation"}" on a ${"kind"}`,
      },
    },
    "not-key-type": {
      severity: "error",
      messages: {
        default: "Cannot copy keys from a non-key type (KeysOf<T> or ParentKeysOf<T>)",
      },
    },
  },
} as const;

const restLib = createCadlLibrary(libDefinition);
const reportDiagnostic = restLib.reportDiagnostic;

export { restLib, reportDiagnostic };
