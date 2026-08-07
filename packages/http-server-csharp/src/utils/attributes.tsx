import { code, type Children } from "@alloy-js/core";
import { Attribute } from "@alloy-js/csharp";
import { Serialization } from "@alloy-js/csharp/global/System/Text/Json";
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
  type Scalar,
  type Type,
} from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { isUnionEnum } from "../components/enums/enums.jsx";
import { tryGetServerScalarName } from "../components/type-expression/scalar-overrides.js";

function getStdBase($: Typekit, scalar: Scalar): Scalar | undefined {
  return $.scalar.getStdBase(scalar) ?? undefined;
}

type WireEncoding = { encoding: string; type: Type };

function getScalarEncoding($: Typekit, type: Scalar | ModelProperty): WireEncoding | undefined {
  const encode = getEncode($.program, type);
  if (encode) return { encoding: encode.encoding ?? "string", type: encode.type };
  if (type.kind === "ModelProperty" && type.type.kind === "Scalar") {
    return getScalarEncoding($, type.type);
  }
  if (type.kind === "Scalar" && type.baseScalar) {
    return getScalarEncoding($, type.baseScalar);
  }
  return undefined;
}

/**
 * Get all C# attributes for a model property.
 * Returns an array of attribute strings like `[JsonConverter(typeof(TimeSpanDurationConverter))]`
 */
export function getPropertyAttributes($: Typekit, property: ModelProperty): Children[] {
  const attrs: Children[] = [];

  // Encoding attributes (JsonConverter)
  const encodingAttrs = getEncodingAttributes($, property);
  attrs.push(...encodingAttrs);

  // JsonStringEnumConverter for enum and union-as-enum properties
  if (
    property.type.kind === "Enum" ||
    (property.type.kind === "Union" && isUnionEnum(property.type))
  ) {
    attrs.push(
      <Attribute
        name={Serialization.JsonConverterAttribute}
        args={[code`typeof(${Serialization.JsonStringEnumConverter})`]}
      />,
    );
  }

  // Constraint attributes
  const numericAttr = getNumericConstraintAttribute($, property);
  if (numericAttr) attrs.push(numericAttr);

  const stringAttr = getStringConstraintAttribute($, property);
  if (stringAttr) attrs.push(stringAttr);

  const arrayAttr = getArrayConstraintAttribute($, property);
  if (arrayAttr) attrs.push(arrayAttr);

  // JsonPropertyName (only when encoded name differs)
  const nameAttr = getEncodedNameAttribute($, property);
  if (nameAttr) attrs.push(nameAttr);

  // SafeInt constraint
  if (property.type.kind === "Scalar") {
    const safeIntAttr = getSafeIntAttribute($, property.type);
    if (safeIntAttr) attrs.push(safeIntAttr);
  }

  return attrs;
}

function getEncodingAttributes($: Typekit, property: ModelProperty): Children[] {
  const result: Children[] = [];
  if (property.type.kind !== "Scalar") return result;

  const stdBase = getStdBase($, property.type);
  if (!stdBase) return result;

  const encoding = getScalarEncoding($, property);

  switch (stdBase.name) {
    case "duration":
      result.push(
        <Attribute
          name={Serialization.JsonConverterAttribute}
          args={["typeof(TimeSpanDurationConverter)"]}
        />,
      );
      break;
    case "unixTimestamp32":
      result.push(
        <Attribute
          name={Serialization.JsonConverterAttribute}
          args={["typeof(UnixEpochDateTimeOffsetConverter)"]}
        />,
      );
      break;
    case "bytes":
      if (encoding && encoding.encoding.toLowerCase() === "base64url") {
        result.push(
          <Attribute
            name={Serialization.JsonConverterAttribute}
            args={["typeof(Base64UrlJsonConverter)"]}
          />,
        );
      }
      break;
    case "utcDateTime":
    case "offsetDateTime":
      if (encoding && encoding.encoding.toLowerCase() === "unixtimestamp") {
        result.push(
          <Attribute
            name={Serialization.JsonConverterAttribute}
            args={["typeof(UnixEpochDateTimeOffsetConverter)"]}
          />,
        );
      }
      break;
  }

  return result;
}

function getNumericConstraintAttribute($: Typekit, property: ModelProperty): Children | undefined {
  if (property.type.kind !== "Scalar") return undefined;

  const minVal = getMinValue($.program, property);
  const maxVal = getMaxValue($.program, property);
  const minExcl = getMinValueExclusive($.program, property);
  const maxExcl = getMaxValueExclusive($.program, property);

  if (
    minVal === undefined &&
    maxVal === undefined &&
    minExcl === undefined &&
    maxExcl === undefined
  ) {
    return undefined;
  }

  const csharpType = tryGetServerScalarName($, property.type);
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

function getStringConstraintAttribute($: Typekit, property: ModelProperty): Children | undefined {
  const minLen = getMinLength($.program, property);
  const maxLen = getMaxLength($.program, property);
  const pattern = getPattern($.program, property);

  if (minLen === undefined && maxLen === undefined && pattern === undefined) return undefined;

  const params: string[] = [];
  if (minLen !== undefined) params.push(`MinLength = ${minLen}`);
  if (maxLen !== undefined) params.push(`MaxLength = ${maxLen}`);
  if (pattern !== undefined) params.push(`Pattern = "${pattern}"`);

  return <Attribute name="StringConstraint" args={params} />;
}

function getArrayConstraintAttribute($: Typekit, property: ModelProperty): Children | undefined {
  const minItems = getMinItems($.program, property);
  const maxItems = getMaxItems($.program, property);

  if (minItems === undefined && maxItems === undefined) return undefined;
  if (property.type.kind !== "Model" || !isArrayModelType(property.type)) return undefined;

  const elementType = property.type.indexer.value;
  if (elementType.kind !== "Scalar") return undefined;

  const csharpType = tryGetServerScalarName($, elementType);
  if (!csharpType) return undefined;

  const params: string[] = [];
  if (minItems !== undefined) params.push(`MinItems = ${minItems}`);
  if (maxItems !== undefined) params.push(`MaxItems = ${maxItems}`);

  return <Attribute name={`ArrayConstraint<${csharpType}>`} args={params} />;
}

function getEncodedNameAttribute($: Typekit, property: ModelProperty): Children | undefined {
  const encodedName = resolveEncodedName($.program, property, "application/json");
  if (encodedName !== property.name) {
    return <Attribute name={Serialization.JsonPropertyNameAttribute} args={[`"${encodedName}"`]} />;
  }
  return undefined;
}

function getSafeIntAttribute($: Typekit, scalar: Scalar): Children | undefined {
  const stdBase = getStdBase($, scalar);
  if (!stdBase || stdBase.name !== "safeint") return undefined;
  return (
    <Attribute
      name="NumericConstraint<long>"
      args={["MinValue = -9007199254740991", "MaxValue = 9007199254740991"]}
    />
  );
}
