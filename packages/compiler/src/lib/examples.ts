import { Temporal } from "temporal-polyfill";
import { ignoreDiagnostics } from "../core/diagnostics.js";
import type { Program } from "../core/program.js";
import { getProperty } from "../core/semantic-walker.js";
import { isArrayModelType, isUnknownType } from "../core/type-utils.js";
import {
  DiagnosticTarget,
  NoTarget,
  type ObjectValue,
  type Scalar,
  type ScalarValue,
  type Type,
  type Value,
} from "../core/types.js";
import { getEncode, resolveEncodedName, type EncodeData } from "./decorators.js";

/**
 * Error thrown when a value cannot be serialized.
 */
export class UnserializableValueError extends Error {
  constructor(public readonly reason: string = "Cannot serialize value as JSON.") {
    super(reason);
    this.name = "UnserializableValueError";
  }
}

/**
 * Error thrown when a scalar value cannot be serialized because it uses an unsupported constructor.
 */
export class UnsupportedScalarConstructorError extends UnserializableValueError {
  constructor(
    public readonly scalarName: string,
    public readonly constructorName: string,
    public readonly supportedConstructors: readonly string[],
  ) {
    super(
      `Cannot serialize scalar '${scalarName}' with constructor '${constructorName}'. Supported constructors: ${supportedConstructors.join(", ")}`,
    );
    this.name = "UnsupportedScalarConstructorError";
  }
}

export interface ValueJsonSerializers {
  /** Custom handler to serialize a scalar value
   * @param value The scalar value to serialize
   * @param type The type of the scalar value in the current context
   * @param encodeAs The encoding information for the scalar value, if any
   * @param originalFn The original serialization function to fall back to. Throws `UnsupportedScalarConstructorError` if the scalar constructor is not supported.
   * @returns The serialized value
   */
  serializeScalarValue?: (
    value: ScalarValue,
    type: Type,
    encodeAs: EncodeData | undefined,
    originalFn: (value: ScalarValue, type: Type, encodeAs: EncodeData | undefined) => unknown,
  ) => unknown;
}

/**
 * Serialize the given TypeSpec value as a JSON object using the given type and its encoding annotations.
 * The Value MUST be assignable to the given type.
 */
export function serializeValueAsJson(
  program: Program,
  value: Value,
  type: Type,
  encodeAs?: EncodeData,
  handlers?: ValueJsonSerializers,
  diagnosticTarget?: DiagnosticTarget | typeof NoTarget,
): unknown {
  if (type.kind === "ModelProperty") {
    return serializeValueAsJson(
      program,
      value,
      type.type,
      encodeAs ?? getEncode(program, type),
      handlers,
      diagnosticTarget,
    );
  }
  switch (value.valueKind) {
    case "NullValue":
      return null;
    case "BooleanValue":
    case "StringValue":
      return value.value;
    case "NumericValue":
      return value.value.asNumber();
    case "EnumValue":
      return value.value.value ?? value.value.name;
    case "ArrayValue":
      return value.values.map((v) =>
        serializeValueAsJson(
          program,
          v,
          type.kind === "Model" && isArrayModelType(type)
            ? type.indexer.value
            : program.checker.anyType,
          /* encodeAs: */ undefined,
          handlers,
          diagnosticTarget,
        ),
      );
    case "ObjectValue":
      return serializeObjectValueAsJson(program, value, type, handlers, diagnosticTarget);
    case "ScalarValue":
      return serializeScalarValueAsJson(program, value, type, encodeAs, handlers);
    case "Function":
      throw new UnserializableValueError("Cannot serialize a function value as JSON.");
  }
}

/** Try to get the property of the type */
function getPropertyOfType(type: Type, name: string): Type | undefined {
  switch (type.kind) {
    case "Model":
      return getProperty(type, name) ?? type.indexer?.value;
    case "Intrinsic":
      if (isUnknownType(type)) {
        return type;
      } else {
        return;
      }
    default:
      return undefined;
  }
}

function resolveUnions(program: Program, value: ObjectValue, type: Type): Type | undefined {
  if (type.kind !== "Union") {
    return type;
  }
  const exactValueType = program.checker.getValueExactType(value);
  for (const variant of type.variants.values()) {
    if (
      ignoreDiagnostics(
        program.checker.isTypeAssignableTo(exactValueType ?? value.type, variant.type, value),
      )
    ) {
      // If the variant is itself a union, recursively resolve it
      if (variant.type.kind === "Union") {
        const resolvedNested = resolveUnions(program, value, variant.type);
        if (resolvedNested && resolvedNested !== variant.type) {
          return resolvedNested;
        }
      }
      return variant.type;
    }
  }
  return type;
}

function serializeObjectValueAsJson(
  program: Program,
  value: ObjectValue,
  type: Type,
  handlers?: ValueJsonSerializers,
  diagnosticTarget?: DiagnosticTarget | typeof NoTarget,
): Record<string, unknown> {
  type = resolveUnions(program, value, type) ?? type;
  const obj: Record<string, unknown> = {};
  for (const propValue of value.properties.values()) {
    const definition = getPropertyOfType(type, propValue.name);
    if (definition) {
      const name =
        definition.kind === "ModelProperty"
          ? resolveEncodedName(program, definition, "application/json")
          : propValue.name;
      obj[name] = serializeValueAsJson(
        program,
        propValue.value,
        definition,
        /* encodeAs: */ undefined,
        handlers,
        propValue.node,
      );
    }
  }
  return obj;
}

function resolveKnownScalar(
  program: Program,
  scalar: Scalar,
):
  | {
      scalar: Scalar & {
        name: "utcDateTime" | "offsetDateTime" | "plainDate" | "plainTime" | "duration";
      };
      encodeAs: EncodeData | undefined;
    }
  | undefined {
  const encode = getEncode(program, scalar);
  if (program.checker.isStdType(scalar)) {
    switch (scalar.name as any) {
      case "utcDateTime":
      case "offsetDateTime":
      case "plainDate":
      case "plainTime":
      case "duration":
        return { scalar: scalar as any, encodeAs: encode };
      case "unixTimestamp32":
        break;
      default:
        return undefined;
    }
  }
  if (scalar.baseScalar) {
    const result = resolveKnownScalar(program, scalar.baseScalar);
    return result && { scalar: result.scalar, encodeAs: encode };
  }
  return undefined;
}
function serializeScalarValueAsJson(
  program: Program,
  value: ScalarValue,
  type: Type,
  encodeAs: EncodeData | undefined,
  handlers?: ValueJsonSerializers,
): unknown {
  if (handlers?.serializeScalarValue) {
    return handlers.serializeScalarValue(
      value,
      type,
      encodeAs,
      serializeScalarValueAsJson.bind(null, program, value, type, encodeAs, undefined),
    );
  }

  const result = resolveKnownScalar(program, value.scalar);
  if (result === undefined) {
    const firstArg = value.value.args[0];
    if (firstArg === undefined) {
      return undefined;
    }
    return serializeValueAsJson(program, firstArg, firstArg.type);
  }

  encodeAs = encodeAs ?? result.encodeAs;

  switch (result.scalar.name) {
    case "utcDateTime":
      if (value.value.name === "fromISO") {
        return ScalarSerializers.utcDateTime((value.value.args[0] as any).value, encodeAs);
      }
      throw new UnsupportedScalarConstructorError("utcDateTime", value.value.name, ["fromISO"]);
    case "offsetDateTime":
      if (value.value.name === "fromISO") {
        return ScalarSerializers.offsetDateTime((value.value.args[0] as any).value, encodeAs);
      }
      throw new UnsupportedScalarConstructorError("offsetDateTime", value.value.name, ["fromISO"]);
    case "plainDate":
      if (value.value.name === "fromISO") {
        return ScalarSerializers.plainDate((value.value.args[0] as any).value);
      }
      throw new UnsupportedScalarConstructorError("plainDate", value.value.name, ["fromISO"]);
    case "plainTime":
      if (value.value.name === "fromISO") {
        return ScalarSerializers.plainTime((value.value.args[0] as any).value);
      }
      throw new UnsupportedScalarConstructorError("plainTime", value.value.name, ["fromISO"]);
    case "duration":
      if (value.value.name === "fromISO") {
        return ScalarSerializers.duration((value.value.args[0] as any).value, encodeAs);
      }
      throw new UnsupportedScalarConstructorError("duration", value.value.name, ["fromISO"]);
  }
}

const ScalarSerializers = {
  utcDateTime: (value: string, encodeAs: EncodeData | undefined): unknown => {
    if (encodeAs === undefined || encodeAs.encoding === "rfc3339") {
      return value;
    }

    const date = new Date(value);

    switch (encodeAs.encoding) {
      case "unixTimestamp":
        return Math.floor(date.getTime() / 1000);
      case "rfc7231":
        return date.toUTCString();
      default:
        return date.toISOString();
    }
  },
  offsetDateTime: (value: string, encodeAs: EncodeData | undefined): unknown => {
    if (encodeAs === undefined || encodeAs.encoding === "rfc3339") {
      return value;
    }

    const date = new Date(value);

    switch (encodeAs.encoding) {
      case "rfc7231":
        return date.toUTCString();
      default:
        return date.toISOString();
    }
  },
  plainDate: (value: string): unknown => {
    return value;
  },
  plainTime: (value: string): unknown => {
    return value;
  },
  duration: (value: string, encodeAs: EncodeData | undefined): unknown => {
    const duration = Temporal.Duration.from(value);

    switch (encodeAs?.encoding) {
      case "seconds":
        if (isInteger(encodeAs.type)) {
          return Math.floor(duration.total({ unit: "seconds" }));
        } else {
          return duration.total({ unit: "seconds" });
        }
      default:
        return duration.toString();
    }
  },
};

function isInteger(scalar: Scalar) {
  while (scalar.baseScalar) {
    scalar = scalar.baseScalar;
    if (scalar.name === "integer") {
      return true;
    }
  }
  return false;
}
