import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";
import { opReferenceContainerRouteRule } from "./rules/op-reference-container-route.js";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/http",
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
    "missing-path-param": {
      severity: "error",
      messages: {
        default: paramMessage`Path contains parameter ${"param"} but wasn't found in given parameters`,
      },
    },
    "optional-path-param": {
      severity: "error",
      messages: {
        default: paramMessage`Path parameter '${"paramName"}' cannot be optional.`,
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
    "multiple-status-codes": {
      severity: "error",
      messages: {
        default: "Multiple `@statusCode` decorators defined for this operation response.",
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
    "content-type-ignored": {
      severity: "warning",
      messages: {
        default: "`Content-Type` header ignored because there is no body.",
      },
    },
    "no-routes": {
      severity: "warning",
      messages: {
        default:
          "Current spec is not exposing any routes. This could be to not having the service namespace marked with @service.",
      },
    },
    "invalid-type-for-auth": {
      severity: "error",
      messages: {
        default: paramMessage`@useAuth ${"kind"} only accept Auth model, Tuple of auth model or union of auth model.`,
      },
    },
    "shared-inconsistency": {
      severity: "error",
      messages: {
        default: "All shared routes must agree on the value of the shared parameter.",
      },
    },
    "write-visibility-not-supported": {
      severity: "warning",
      messages: {
        default: `@visibility("write") is not supported. Use @visibility("update"), @visibility("create") or @visibility("create", "update") as appropriate.`,
      },
    },
    "multipart-model": {
      severity: "error",
      messages: {
        default: "Multipart request body must be a model.",
      },
    },
    "header-format-required": {
      severity: "error",
      messages: {
        default: `A format must be specified for @header when type is an array. e.g. @header({format: "csv"})`,
      },
    },
    "query-format-required": {
      severity: "error",
      messages: {
        default: `A format must be specified for @query when type is an array. e.g. @query({format: "multi"})`,
      },
    },
  },
  linter: {
    rules: [opReferenceContainerRouteRule],
    ruleSets: {
      all: {
        enable: {
          [`@typespec/http/${opReferenceContainerRouteRule.name}`]: true,
        },
      },
    },
  },
});

export const { reportDiagnostic, createDiagnostic, createStateSymbol } = $lib;
