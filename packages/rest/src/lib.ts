import { createCadlLibrary, paramMessage } from "@cadl-lang/compiler";

const libDefinition = {
  name: "@cadl-lang/rest",
  diagnostics: {
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
    "resource-missing-key": {
      severity: "error",
      messages: {
        default: paramMessage`Type '${"modelName"}' is used as a resource and therefore must have a key. Use @key to designate a property as the key.`,
      },
    },
    "resource-missing-error": {
      severity: "error",
      messages: {
        default: paramMessage`Type '${"modelName"}' is used as an error and therefore must have the @error decorator applied.`,
      },
    },
    "duplicate-key": {
      severity: "error",
      messages: {
        default: paramMessage`More than one key found on model type ${"resourceName"}`,
      },
    },
    "duplicate-parent-key": {
      severity: "error",
      messages: {
        default: paramMessage`Resource type '${"resourceName"}' has a key property named '${"keyName"}' which is already used by parent type '${"parentName"}'.`,
      },
    },
    "missing-path-param": {
      severity: "error",
      messages: {
        default: paramMessage`Path contains parameter ${"param"} but wasn't found in given parameters`,
      },
    },
    "optional-path-param": {
      severity: "error",
      messages: {
        default: paramMessage`Path parameter '${"paramName"}' cannot be optional without a default value.`,
      },
    },
    "missing-server-param": {
      severity: "error",
      messages: {
        default: paramMessage`Server url contains parameter '${"param"}' but wasn't found in given parameters`,
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
    "duplicate-route-decorator": {
      severity: "error",
      messages: {
        operation: "@route was defined twice on this operation.",
        interface: "@route was defined twice on this interface.",
        namespace: "@route was defined twice on this namespace and has different values.",
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
        default: paramMessage`Duplicate operation "${"operationName"}" routed at "${"verb"} ${"path"}".`,
      },
    },
    "status-code-invalid": {
      severity: "error",
      messages: {
        default:
          "statusCode value must be a numeric or string literal or union of numeric or string literals",
        value: "statusCode value must be a three digit code between 100 and 599",
      },
    },
    "content-type-string": {
      severity: "error",
      messages: {
        default: "contentType parameter must be a string literal or union of string literals",
      },
    },
    "duplicate-response": {
      severity: "error",
      messages: {
        default: paramMessage`Multiple return types for content type ${"contentType"} and status code ${"statusCode"}`,
      },
    },
    "content-type-ignored": {
      severity: "warning",
      messages: {
        default: "content-type header ignored because return type has no body",
      },
    },
    "no-routes": {
      severity: "warning",
      messages: {
        default:
          "Current spec is not exposing any routes. This could be to not having the service namespace marked with @serviceTitle.",
      },
    },

    "invalid-type-for-auth": {
      severity: "error",
      messages: {
        default: paramMessage`@useAuth ${"kind"} only accept Auth model, Tuple of auth model or union of auth model.`,
      },
    },
  },
} as const;

const restLib = createCadlLibrary(libDefinition);
const { reportDiagnostic, createDiagnostic, createStateSymbol } = restLib;

export { restLib, reportDiagnostic, createDiagnostic, createStateSymbol };
