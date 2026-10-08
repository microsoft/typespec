// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { DiagnosticTarget, JSONSchemaType, Program } from "@typespec/compiler";
import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

/**
 * Options that the Protobuf emitter accepts.
 */
export interface ProtobufEmitterOptions {
  /**
   * Don't emit anything.
   */
  noEmit?: boolean;

  /**
   * Omit unreachable types.
   *
   * By default, types under a package namespace will be emitted if they are fully annotated with `@field` decorators.
   * With this flag on, only types that are explicitly marked with `@message` or that are referenced by an operation
   * in an interface decoarated with `@service` will be emitted.
   */
  "omit-unreachable-types"?: boolean;

  /**
   * Prefix enum values with the enum name in UPPER_SNAKE_CASE.
   *
   * By default, member names are emitted unchanged. This option only changes names;
   * explicit integer values and a first member set to zero are still required.
   */
  "enum-value-prefix"?: "none" | "enum-name";
}

const EmitterOptionsSchema: JSONSchemaType<ProtobufEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    noEmit: {
      type: "boolean",
      nullable: true,
      description:
        "If set to `true`, this emitter will not write any files. It will still validate the TypeSpec sources to ensure they are compatible with Protobuf, but the files will simply not be written to the output directory.",
    },
    "omit-unreachable-types": {
      type: "boolean",
      nullable: true,
      description:
        "By default, the emitter will create `message` declarations for any models in a namespace decorated with `@package` that have an `@field` decorator on every property. If this option is set to true, this behavior will be disabled, and only messages that are explicitly decorated with `@message` or that are reachable from a service operation will be emitted.",
    },
    "enum-value-prefix": {
      type: "string",
      enum: ["none", "enum-name"],
      nullable: true,
      default: "none",
      description:
        "When set to `enum-name`, enum values are prefixed with the enum name in UPPER_SNAKE_CASE. Already-prefixed names are preserved. By default (`none`), member names are emitted unchanged. This option only changes names; explicit integer values and a first member set to zero are still required.",
    },
  },
  required: [],
};

const PACKAGE_NAME = "@typespec/protobuf";

export const TypeSpecProtobufLibrary = createTypeSpecLibrary({
  name: PACKAGE_NAME,
  capabilities: {
    dryRun: true,
  },
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
        duplicate: paramMessage`field '${"name"}' uses field index ${"index"}, which is already used by field '${"other"}' in this message`,
      },
    },
    "field-name": {
      severity: "error",
      messages: {
        "user-reserved": paramMessage`field name '${"name"}' was reserved by a call to @reserve on this model`,
        duplicate: paramMessage`name '${"name"}' is already used by another field or oneof in this message`,
      },
    },
    "invalid-oneof": {
      severity: "error",
      messages: {
        required: paramMessage`property '${"name"}' must be optional to be emitted as a oneof, because a oneof may have no member set (add '?' to the property, or add '@field' to emit a wrapper message instead)`,
        empty: paramMessage`union ${"name"} must have at least one variant to be emitted as a oneof`,
        "unnamed-variant": "every variant of a union emitted as a oneof must be named",
        "repeated-variant": paramMessage`oneof member '${"name"}' cannot be an array, because Protobuf does not allow repeated fields in a oneof`,
        "map-variant": paramMessage`oneof member '${"name"}' cannot be a map, because Protobuf does not allow map fields in a oneof`,
        "invalid-name": paramMessage`oneof name '${"name"}' is not a valid Protobuf identifier (it must start with a letter or '_' and contain only letters, digits, and '_')`,
        "invalid-member-name": paramMessage`oneof member name '${"name"}' is not a valid Protobuf identifier (it must start with a letter or '_' and contain only letters, digits, and '_')`,
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
        union:
          "a message field's type may not be an anonymous union (declare a named union with '@field' on each variant)",
      },
    },
    "optional-array-field": {
      severity: "warning",
      messages: {
        default:
          "optional array fields cannot preserve unset versus empty in protobuf; emitting a repeated field without the 'optional' label",
      },
    },
    "optional-map-field": {
      severity: "warning",
      messages: {
        default:
          "optional map fields cannot preserve unset versus empty in protobuf; emitting a map field without the 'optional' label",
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
    "enum-value-name-collision": {
      severity: "error",
      messages: {
        default: paramMessage`enum value name '${"name"}' collides with ${"kind"} '${"owner"}' in this Protobuf package`,
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
        union: paramMessage`union ${"name"} is not in a namespace that uses the '@Protobuf.package' decorator`,
      },
    },
    "anonymous-model": {
      severity: "error",
      messages: {
        default: "anonymous models cannot be used in Protobuf messages",
      },
    },
    "unspeakable-template-argument": {
      severity: "error",
      messages: {
        default: paramMessage`template ${"name"} cannot be converted to a Protobuf message because it has an unspeakable argument (try using the '@friendlyName' decorator on the template)`,
      },
    },
    package: {
      severity: "error",
      messages: {
        "disallowed-option-type": paramMessage`option '${"name"}' with type '${"type"}' is not allowed in a package declaration (only string, boolean, and numeric types are allowed)`,
      },
    },
    "long-running-type": {
      severity: "error",
      messages: {
        default: paramMessage`the ${"role"} type of 'LongRunningOperation' must be a named model that is emitted as a message, not an array, map, or anonymous model`,
      },
    },
  },
  emitter: { options: EmitterOptionsSchema },
});

export type Diagnostic = Parameters<typeof TypeSpecProtobufLibrary.reportDiagnostic>[1];

const __DIAGNOSTIC_CACHE = new WeakMap<Program, Map<DiagnosticTarget, Set<Diagnostic["code"]>>>();

function getDiagnosticCache(program: Program) {
  let cache = __DIAGNOSTIC_CACHE.get(program);
  if (!cache) {
    cache = new Map();
    __DIAGNOSTIC_CACHE.set(program, cache);
  }
  return cache;
}

function getAppliedCodesForTarget(program: Program, target: DiagnosticTarget) {
  const cache = getDiagnosticCache(program);
  let codes = cache.get(target);
  if (!codes) {
    codes = new Set();
    cache.set(target, codes);
  }
  return codes;
}

export const reportDiagnostic = Object.assign(TypeSpecProtobufLibrary.reportDiagnostic, {
  /**
   * Report a TypeSpec protobuf diagnostic, but only once per target per diagnostic code.
   *
   * This is useful in situations where a function that reports a recoverable diagnostic may be called multiple times.
   */
  once: function (program: Program, diagnostic: Diagnostic & { target: DiagnosticTarget }) {
    const codes = getAppliedCodesForTarget(program, diagnostic.target);

    if (codes.has(diagnostic.code)) {
      return;
    }

    codes.add(diagnostic.code);
    TypeSpecProtobufLibrary.reportDiagnostic(program, diagnostic);
  },
});

export type TypeSpecProtobufLibrary = typeof TypeSpecProtobufLibrary;

const keys = [
  "fieldIndex",
  "package",
  "service",
  "externRef",
  "stream",
  "longRunning",
  "reserve",
  "message",
  "_map",
] as const;

export const state = Object.fromEntries(
  keys.map((k) => [k, TypeSpecProtobufLibrary.createStateSymbol(k)]),
) as {
  [K in (typeof keys)[number]]: symbol;
};
