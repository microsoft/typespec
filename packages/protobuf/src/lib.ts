// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { createTypeSpecLibrary, JSONSchemaType, paramMessage } from "@typespec/compiler";

/**
 * Options that the Protobuf emitter accepts.
 */
export interface ProtobufEmitterOptions {
  /**
   * Don't emit anything.
   */
  noEmit?: boolean;
}

const EmitterOptionsSchema: JSONSchemaType<ProtobufEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    noEmit: { type: "boolean", nullable: true },
  },
  required: [],
};

const PACKAGE_NAME = "@typespec/protobuf";

export const TypeSpecProtobufLibrary = createTypeSpecLibrary({
  name: PACKAGE_NAME,
  requireImports: [PACKAGE_NAME],
  diagnostics: {
    "field-index": {
      severity: "error",
      messages: {
        missing: paramMessage`field ${"name"} does not have a field index, but one is required (try using the '@field' decorator)`,
        invalid: paramMessage`field index ${"index"} is invalid (must be an integer greater than zero)`,
        "out-of-bounds": paramMessage`field index ${"index"} is out of bounds (must be less than ${"max"})`,
        reserved: paramMessage`field index ${"index"} falls within the implementation-reserved range of 19000-19999 inclusive`,
        "user-reserved": paramMessage`field index ${"index"} was reserved by a call to @reserve on this model`,
        "user-reserved-range": paramMessage`field index ${"index"} falls within a range reserved by a call to @reserve on this model`,
      },
    },
    "field-name": {
      severity: "error",
      messages: {
        "user-reserved": paramMessage`field name '${"name"}' was reserved by a call to @reserve on this model`,
      },
    },
    "root-operation": {
      severity: "error",
      messages: {
        default:
          "operations in the root namespace are not supported (no associated Protobuf service)",
      },
    },
    "unsupported-intrinsic": {
      severity: "error",
      messages: {
        default: paramMessage`intrinsic type ${"name"} is not supported in Protobuf`,
      },
    },
    "unsupported-return-type": {
      severity: "error",
      messages: {
        default: "Protobuf methods must return a named Model",
      },
    },
    "unsupported-input-type": {
      severity: "error",
      messages: {
        "wrong-number":
          "Protobuf methods must accept exactly one Model input (an empty model will do)",
        "wrong-type": "Protobuf methods may only accept a named Model as an input",
        unconvertible: "input parameters cannot be converted to a Protobuf message",
      },
    },
    "unsupported-field-type": {
      severity: "error",
      messages: {
        unconvertible: paramMessage`cannot convert a ${"type"} to a protobuf type (only intrinsic types and models are supported)`,
        "unknown-intrinsic": paramMessage`no known protobuf scalar for intrinsic type ${"name"}`,
        "unknown-scalar": paramMessage`no known protobuf scalar for TypeSpec scalar type ${"name"}`,
        "recursive-map": "a protobuf map's 'value' type may not refer to another map",
        union: "a message field's type may not be a union",
      },
    },
    "namespace-collision": {
      severity: "error",
      messages: {
        default: paramMessage`the package name ${"name"} has already been used`,
      },
    },
    "unconvertible-enum": {
      severity: "error",
      messages: {
        default:
          "enums must explicitly assign exactly one integer to each member to be used in a Protobuf message",
        "no-zero-first":
          "the first variant of an enum must be set to zero to be used in a Protobuf message",
      },
    },
    "nested-array": {
      severity: "error",
      messages: {
        default: "nested arrays are not supported by the Protobuf emitter",
      },
    },
    "invalid-package-name": {
      severity: "error",
      messages: {
        default: paramMessage`${"name"} is not a valid package name (must consist of letters and numbers separated by ".")`,
      },
    },
    "illegal-reservation": {
      severity: "error",
      messages: {
        default:
          "reservation value must be a string literal, uint32 literal, or a tuple of two uint32 literals denoting a range",
      },
    },
    "model-not-in-package": {
      severity: "error",
      messages: {
        default: paramMessage`model ${"name"} is not in a namespace that uses the '@Protobuf.package' decorator`,
      },
    },
    "anonymous-model": {
      severity: "error",
      messages: {
        default: "anonymous models cannot be used in Protobuf messages",
      },
    },
    package: {
      severity: "error",
      messages: {
        "disallowed-option-type": paramMessage`option '${"name"}' with type '${"type"}' is not allowed in a package declaration (only string, boolean, and numeric types are allowed)`,
      },
    },
  },
  emitter: { options: EmitterOptionsSchema },
});

export const { reportDiagnostic } = TypeSpecProtobufLibrary;

export type TypeSpecProtobufLibrary = typeof TypeSpecProtobufLibrary;

const keys = [
  "fieldIndex",
  "package",
  "service",
  "externRef",
  "stream",
  "reserve",
  "message",
  "_map",
] as const;

export const state = Object.fromEntries(
  keys.map((k) => [k, TypeSpecProtobufLibrary.createStateSymbol(k)])
) as {
  [K in (typeof keys)[number]]: symbol;
};
