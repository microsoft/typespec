import { type Children } from "@alloy-js/core";
import { Attribute } from "@alloy-js/csharp";
import { JsonSerialization } from "./csharp-libs.jsx";
import {
  getEncode,
  getMaxItems,
  getMaxLength,
  getMaxValue,
  getMaxValueExclusive,
  getMinItems,
  getMinLength,
  getMinValue,
  getMinValueExclusive,
  getPattern,
  isArrayModelType,
  resolveEncodedName,
  type ModelProperty,
  type Program,
  type Scalar,
  type Type,
} from "@typespec/compiler";
import { isUnionEnum } from "../components/enums/enums.jsx";

/**
 * Maps a TypeSpec scalar name to the C# type name used in attributes.
 * This follows the old emitter's mapping.
 */
function scalarToCSharpTypeName(program: Program, scalar: Scalar): string | undefined {
  const stdBase = getStdBase(program, scalar);
  if (!stdBase) return undefined;
  const map: Record<string, string> = {
    int8: "SByte",
    uint8: "Byte",
    int16: "Int16",
    int32: "int",
    int64: "long",
    uint16: "UInt16",
    uint32: "UInt32",
    uint64: "UInt64",
    safeint: "long",
    float32: "float",
    float64: "double",
    decimal: "decimal",
    decimal128: "decimal",
    numeric: "double",
    integer: "int",
    float: "double",
    boolean: "bool",
    string: "string",
    bytes: "byte[]",
    plainDate: "DateTime",
    plainTime: "DateTime",
    utcDateTime: "DateTimeOffset",
    offsetDateTime: "DateTimeOffset",
    duration: "TimeSpan",
    url: "string",
  };
  return map[stdBase.name];
}

function getStdBase(program: Program, scalar: Scalar): Scalar | undefined {
  if (program.checker.isStdType(scalar)) return scalar;
  if (scalar.baseScalar) return getStdBase(program, scalar.baseScalar);
  return undefined;
}

type WireEncoding = { encoding: string; type: Type };

function getScalarEncoding(
  program: Program,
  type: Scalar | ModelProperty,
): WireEncoding | undefined {
  const encode = getEncode(program, type);
  if (encode) return { encoding: encode.encoding ?? "string", type: encode.type };
  if (type.kind === "ModelProperty" && type.type.kind === "Scalar") {
    return getScalarEncoding(program, type.type);
  }
  if (type.kind === "Scalar" && type.baseScalar) {
    return getScalarEncoding(program, type.baseScalar);
  }
  return undefined;
}

/**
 * Get all C# attributes for a model property.
 * Returns an array of attribute strings like `[JsonConverter(typeof(TimeSpanDurationConverter))]`
 */
export function getPropertyAttributes(program: Program, property: ModelProperty): Children[] {
  const attrs: Children[] = [];

  // Encoding attributes (JsonConverter)
  const encodingAttrs = getEncodingAttributes(program, property);
  attrs.push(...encodingAttrs);

  // JsonStringEnumConverter for enum and union-as-enum properties
  if (
    property.type.kind === "Enum" ||
    (property.type.kind === "Union" && isUnionEnum(property.type))
  ) {
    attrs.push(<Attribute name={JsonSerialization.JsonConverterAttribute} args={["typeof(JsonStringEnumConverter)"]} />);
  }

  // Constraint attributes
  const numericAttr = getNumericConstraintAttribute(program, property);
  if (numericAttr) attrs.push(numericAttr);

  const stringAttr = getStringConstraintAttribute(program, property);
  if (stringAttr) attrs.push(stringAttr);

  const arrayAttr = getArrayConstraintAttribute(program, property);
  if (arrayAttr) attrs.push(arrayAttr);

  // JsonPropertyName (only when encoded name differs)
  const nameAttr = getEncodedNameAttribute(program, property);
  if (nameAttr) attrs.push(nameAttr);

  // SafeInt constraint
  if (property.type.kind === "Scalar") {
    const safeIntAttr = getSafeIntAttribute(program, property.type);
    if (safeIntAttr) attrs.push(safeIntAttr);
  }

  return attrs;
}

function getEncodingAttributes(program: Program, property: ModelProperty): Children[] {
  const result: Children[] = [];
  if (property.type.kind !== "Scalar") return result;

  const stdBase = getStdBase(program, property.type);
  if (!stdBase) return result;

  const encoding = getScalarEncoding(program, property);

  switch (stdBase.name) {
    case "duration":
      result.push(
        <Attribute name={JsonSerialization.JsonConverterAttribute} args={["typeof(TimeSpanDurationConverter)"]} />,
      );
      break;
    case "unixTimestamp32":
      result.push(
        <Attribute name={JsonSerialization.JsonConverterAttribute} args={["typeof(UnixEpochDateTimeOffsetConverter)"]} />,
      );
      break;
    case "bytes":
      if (encoding && encoding.encoding.toLowerCase() === "base64url") {
        result.push(
          <Attribute name={JsonSerialization.JsonConverterAttribute} args={["typeof(Base64UrlJsonConverter)"]} />,
        );
      }
      break;
    case "utcDateTime":
    case "offsetDateTime":
      if (encoding && encoding.encoding.toLowerCase() === "unixtimestamp") {
        result.push(
          <Attribute name={JsonSerialization.JsonConverterAttribute} args={["typeof(UnixEpochDateTimeOffsetConverter)"]} />,
        );
      }
      break;
  }

  return result;
}

function getNumericConstraintAttribute(
  program: Program,
  property: ModelProperty,
): Children | undefined {
  if (property.type.kind !== "Scalar") return undefined;

  const minVal = getMinValue(program, property);
  const maxVal = getMaxValue(program, property);
  const minExcl = getMinValueExclusive(program, property);
  const maxExcl = getMaxValueExclusive(program, property);

  if (
    minVal === undefined &&
    maxVal === undefined &&
    minExcl === undefined &&
    maxExcl === undefined
  ) {
    return undefined;
  }

  const csharpType = scalarToCSharpTypeName(program, property.type);
  if (!csharpType) return undefined;

  const params: string[] = [];
  const actualMin = minVal ?? minExcl;
  const actualMax = maxVal ?? maxExcl;

  if (actualMin !== undefined) params.push(`MinValue = ${actualMin}`);
  if (actualMax !== undefined) params.push(`MaxValue = ${actualMax}`);
  if (minExcl !== undefined) params.push(`MinValueExclusive = true`);
  if (maxExcl !== undefined) params.push(`MaxValueExclusive = true`);

  return <Attribute name={`NumericConstraint<${csharpType}>`} args={params} />;
}

function getStringConstraintAttribute(
  program: Program,
  property: ModelProperty,
): Children | undefined {
  const minLen = getMinLength(program, property);
  const maxLen = getMaxLength(program, property);
  const pattern = getPattern(program, property);

  if (minLen === undefined && maxLen === undefined && pattern === undefined) return undefined;

  const params: string[] = [];
  if (minLen !== undefined) params.push(`MinLength = ${minLen}`);
  if (maxLen !== undefined) params.push(`MaxLength = ${maxLen}`);
  if (pattern !== undefined) params.push(`Pattern = "${pattern}"`);

  return <Attribute name="StringConstraint" args={params} />;
}

function getArrayConstraintAttribute(
  program: Program,
  property: ModelProperty,
): Children | undefined {
  const minItems = getMinItems(program, property);
  const maxItems = getMaxItems(program, property);

  if (minItems === undefined && maxItems === undefined) return undefined;
  if (property.type.kind !== "Model" || !isArrayModelType(property.type)) return undefined;

  const elementType = property.type.indexer.value;
  if (elementType.kind !== "Scalar") return undefined;

  const csharpType = scalarToCSharpTypeName(program, elementType);
  if (!csharpType) return undefined;

  const params: string[] = [];
  if (minItems !== undefined) params.push(`MinItems = ${minItems}`);
  if (maxItems !== undefined) params.push(`MaxItems = ${maxItems}`);

  return <Attribute name={`ArrayConstraint<${csharpType}>`} args={params} />;
}

function getEncodedNameAttribute(program: Program, property: ModelProperty): Children | undefined {
  const encodedName = resolveEncodedName(program, property, "application/json");
  if (encodedName !== property.name) {
    return <Attribute name={JsonSerialization.JsonPropertyNameAttribute} args={[`"${encodedName}"`]} />;
  }
  return undefined;
}

function getSafeIntAttribute(program: Program, scalar: Scalar): Children | undefined {
  const stdBase = getStdBase(program, scalar);
  if (!stdBase || stdBase.name !== "safeint") return undefined;
  return <Attribute name="NumericConstraint<long>" args={["MinValue = -9007199254740991", "MaxValue = 9007199254740991"]} />;
}
