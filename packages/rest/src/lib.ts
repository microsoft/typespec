import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/rest",
  diagnostics: {
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
        default: paramMessage`Resource type '${"resourceName"}' has a key property named '${"keyName"}' which conflicts with the key name of a parent or child resource.`,
      },
    },
    "invalid-action-name": {
      severity: "error",
      messages: {
        default: "Action name cannot be empty string.",
      },
    },
    "shared-route-unspecified-action-name": {
      severity: "error",
      messages: {
        default: paramMessage`An operation marked as '@sharedRoute' must have an explicit collection action name passed to '${"decoratorName"}'.`,
      },
    },
  },
});

export const { reportDiagnostic, createDiagnostic, createStateSymbol } = $lib;
