import { createTypeSpecLibrary, paramMessage } from "../../core/library.js";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/compiler/experimental/typekit",
  diagnostics: {
    "model-not-array": {
      severity: "warning",
      messages: {
        default: paramMessage`Expected a model to be an array. Make sure to check $.array.is(type) before calling ${"arrayTypekit"}. Returning the model type as is.`,
      },
    },
    "model-not-record": {
      severity: "warning",
      messages: {
        default: paramMessage`Expected a model to be an array. Make sure to check $.record.is(type) before calling ${"recordTypekit"}. Returning the model type as is.`,
      },
    },
    "enum-from-anonymous-union": {
      severity: "warning",
      messages: {
        default: `Enum created from an anonymous union. Consider using a named union instead. This will generate an enum with a generated name.`,
      },
    },
    "union-variant-not-convertible-to-enum": {
      severity: "warning",
      messages: {
        default: `Union variant is not convertible to an enum. Union variants have to be named and have a string or numeric literal value. This variant will be ignored.`,
      },
    },
  },
});

export const {
  reportDiagnostic: reportTypekitDiagnostic,
  createDiagnostic: createTypekitDiagnostic,
} = $lib;
