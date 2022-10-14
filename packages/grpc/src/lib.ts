// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { createCadlLibrary, JSONSchemaType, paramMessage } from "@cadl-lang/compiler";

/**
 * Options that the gRPC emitter accepts.
 */
export interface GrpcEmitterOptions {
  /**
   * The directory where the emitter will write the Protobuf output tree.
   */
  outputDirectory?: string;
}

const EmitterOptionsSchema: JSONSchemaType<GrpcEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    outputDirectory: { type: "string", nullable: true },
  },
  required: [],
};

export const CadlGrpcLibrary = createCadlLibrary({
  name: "cadl-grpc",
  diagnostics: {
    "field-index": {
      severity: "error",
      messages: {
        invalid: paramMessage`field index ${"index"} is invalid (must be an integer greater than zero)`,
        "out-of-bounds": paramMessage`field index ${"index"} is out of bounds (must be less than ${"max"})`,
        reserved: paramMessage`field index ${"index"} falls within the implementation-reserved range of 19000-19999 (try an index value of 20,000 or higher)`,
      },
    },
    "root-operation": {
      severity: "error",
      messages: {
        default: "operations in the root namespace are not supported (no associated gRPC service)",
      },
    },
    "unsupported-return-type": {
      severity: "error",
      messages: {
        default: "gRPC operations must return a named Model",
      },
    },
    "unsupported-input-type": {
      severity: "error",
      messages: {
        "wrong-number":
          "gRPC operations must accept exactly one Model input (an empty model will do)",
        "wrong-type": "gRPC operations may only accept a named Model as an input",
        unconvertible: "input parameters cannot be converted to a gRPC model",
      },
    },
    "unsupported-field-type": {
      severity: "error",
      messages: {
        unconvertible: paramMessage`cannot convert a ${"type"} to a protobuf type (only intrinsic types and models are supported)`,
        "unknown-intrinsic": paramMessage`no known protobuf scalar for intrinsic type ${"name"}`,
        "recursive-map": "a protobuf map's 'value' type may not refer to another map",
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
          "enums must explicitly assign exactly one integer to each member to be used in a gRPC message",
      },
    },
    "nested-array": {
      severity: "error",
      messages: {
        default: "nested arrays are not supported by the gRPC emitter",
      },
    },
    "invalid-package-name": {
      severity: "error",
      messages: {
        default: paramMessage`${"name"} is not a valid package name (must consist of letters and numbers separated by ".")`,
      },
    },
  },
  emitter: { options: EmitterOptionsSchema },
});

export const { reportDiagnostic } = CadlGrpcLibrary;

export type CadlGrpcLibrary = typeof CadlGrpcLibrary;

const keys = ["fieldIndex", "service", "package"] as const;

export const state = Object.fromEntries(keys.map((k) => [k, Symbol(`cadl-grpc::${k}`)])) as {
  [K in typeof keys[number]]: symbol;
};
