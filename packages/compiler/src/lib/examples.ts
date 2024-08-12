import { Temporal } from "temporal-polyfill";
import { ignoreDiagnostics } from "../core/diagnostics.js";
import type { Program } from "../core/program.js";
import { getProperty } from "../core/semantic-walker.js";
import { isArrayModelType, isUnknownType } from "../core/type-utils.js";
import {
  type ObjectValue,
  type Scalar,
  type ScalarValue,
  type Type,
  type Value,
} from "../core/types.js";
import { getEncode, type EncodeData } from "./decorators.js";

/**
 * Serialize the given TypeSpec value as a JSON object using the given type and its encoding annotations.
 * The Value MUST be assignable to the given type.
 */
export function serializeValueAsJson(
  program: Program,
  value: Value,
  type: Type,
  encodeAs?: EncodeData
): unknown {
  if (type.kind === "ModelProperty") {
    return serializeValueAsJson(program, value, type.type, encodeAs ?? getEncode(program, type));
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
          type.kind === "Model" && isArrayModelType(program, type)
            ? type.indexer.value
            : program.checker.anyType
        )
      );
    case "ObjectValue":
      return serializeObjectValueAsJson(program, value, type);
    case "ScalarValue":
      return serializeScalarValueAsJson(program, value, type, encodeAs);
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
  for (const variant of type.variants.values()) {
    if (
      variant.type.kind === "Model" &&
      ignoreDiagnostics(
        program.checker.isTypeAssignableTo(
          value,
          { entityKind: "MixedParameterConstraint", valueType: variant.type },
          value
        )
      )
    ) {
      return variant.type;
    }
  }
  return type;
}

function serializeObjectValueAsJson(
  program: Program,
  value: ObjectValue,
  type: Type
): Record<string, unknown> {
  type = resolveUnions(program, value, type) ?? type;
  const obj: Record<string, unknown> = {};
  for (const propValue of value.properties.values()) {
    const definition = getPropertyOfType(type, propValue.name);
    if (definition) {
      obj[propValue.name] = serializeValueAsJson(program, propValue.value, definition);
    }
  }
  return obj;
}

function resolveKnownScalar(
  program: Program,
  scalar: Scalar
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
  encodeAs: EncodeData | undefined
): unknown {
  const result = resolveKnownScalar(program, value.scalar);
  if (result === undefined) {
    return serializeValueAsJson(program, value.value.args[0], value.value.args[0].type);
  }

  encodeAs = encodeAs ?? result.encodeAs;

  switch (result.scalar.name) {
    case "utcDateTime":
      return ScalarSerializers.utcDateTime((value.value.args[0] as any as any).value, encodeAs);
    case "offsetDateTime":
      return ScalarSerializers.offsetDateTime((value.value.args[0] as any).value, encodeAs);
    case "plainDate":
      return ScalarSerializers.plainDate((value.value.args[0] as any).value);
    case "plainTime":
      return ScalarSerializers.plainTime((value.value.args[0] as any).value);
    case "duration":
      return ScalarSerializers.duration((value.value.args[0] as any).value, encodeAs);
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
