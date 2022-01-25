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
    "http-verb-missing-with-body": {
      severity: "error",
      messages: {
        default: paramMessage`Operation ${"operationName"} has a body but doesn't specify a verb.`,
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
    "duplicate-key": {
      severity: "error",
      messages: {
        default: paramMessage`More than one key found on model type ${"resourceName"}`,
      },
    },
    "missing-path-param": {
      severity: "error",
      messages: {
        default: paramMessage`Path contains parameter ${"param"} but wasn't found in given parameters`,
      },
    },
    "duplicate-body": {
      severity: "error",
      messages: {
        default: "Operation has multiple @body parameters declared",
        duplicateUnannotated:
          "Operation has multiple unannotated parameters. There can only be one representing the body",
        bodyAndUnannotated:
          "Operation has a @body and an unannotated parameter. There can only be one representing the body",
      },
    },
    "operation-param-duplicate-type": {
      severity: "error",
      messages: {
        default: paramMessage`Param ${"paramName"} has multiple types: [${"types"}]`,
      },
    },
    "duplicate-operation": {
      severity: "error",
      messages: {
        default: paramMessage`Duplicate operation routed at "${"verb"} ${"path"}".`,
      },
    },
  },
} as const;

const restLib = createCadlLibrary(libDefinition);
const reportDiagnostic = restLib.reportDiagnostic;

export { restLib, reportDiagnostic };
