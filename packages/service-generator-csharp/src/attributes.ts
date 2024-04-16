import {
  Enum,
  ModelProperty,
  Program,
  Scalar,
  Type,
  getEncode,
  getFormat,
  getMaxLength,
  getMinLength,
  getPattern,
  resolveEncodedName,
} from "@typespec/compiler";
import {
  Attribute,
  AttributeType,
  CSharpType,
  HelperNamespace,
  NumericValue,
  Parameter,
  RawValue,
  StringValue,
} from "./interfaces.js";
import { getCSharpIdentifier } from "./utils.js";

export const JsonNamespace: string = "System.Text.Json";

export function getEncodingValue(
  program: Program,
  type: Scalar | ModelProperty
): string | undefined {
  const value = getEncode(program, type);
  return value ? value.encoding : undefined;
}

export function getFormatValue(program: Program, type: Scalar | ModelProperty): string | undefined {
  return getFormat(program, type);
}

export function getPatternAttribute(
  program: Program,
  type: ModelProperty | Scalar
): Attribute | undefined {
  const pattern = getPattern(program, type);
  if (!pattern) return undefined;
  return new Attribute(new AttributeType({ name: "Pattern", namespace: HelperNamespace }), [
    new Parameter({
      name: "pattern",
      optional: false,
      value: new StringValue(pattern),
      type: new CSharpType({
        name: "string",
        namespace: "System",
        isBuiltIn: true,
        isValueType: false,
      }),
    }),
  ]);
}

/**
 * Return name encoding attributes
 * @param program The program being processed
 * @param type The type to check
 * @returns The attributes associated with the type, or none
 */
export function getEncodedNameAttribute(
  program: Program,
  type: ModelProperty
): Attribute | undefined {
  const encodedName = resolveEncodedName(program, type, "application/json");
  if (encodedName !== type.name) {
    const attr: Attribute = new Attribute(
      new AttributeType({
        name: "JsonPropertyName",
        namespace: JsonNamespace,
      }),
      []
    );

    attr.parameters.push(
      new Parameter({
        name: "name",
        value: new StringValue(encodedName),
        optional: false,
        type: new CSharpType({
          name: "string",
          namespace: "System",
          isBuiltIn: true,
          isValueType: true,
        }),
      })
    );

    return attr;
  }

  return undefined;
}

/**
 * Return the encoding attributes for model properties
 * @param program The program being processed
 * @param type The type to check
 * @returns The appropriate serialization attributes for the type, or none
 */
export function getEncodingAttributes(program: Program, type: ModelProperty): Attribute[] {
  const result: Attribute[] = [];
  const propertyType = getScalarType(program, type);
  if (propertyType !== undefined) {
    switch (propertyType.scalar.name) {
      case "unixTimestamp32":
        result.push(getJsonConverterAttribute("UnixEpochDateTimeOffsetConverter"));
        break;
      case "duration":
        result.push(getJsonConverterAttribute("TimeSpanDurationConverter"));
        break;
      default:
        if (propertyType.encoding !== undefined) {
          switch (propertyType.encoding.name.toLowerCase()) {
            case "base64url":
              result.push(getJsonConverterAttribute("Base64UrlConverter"));
              break;
            case "unixtimestamp":
              result.push(getJsonConverterAttribute("UnixEpochDateTimeOffsetConverter"));
              break;
          }
        }
    }
  }

  return result;
}

type WireEncoding = { name: string; wireType: Type };

type ScalarWithEncoding = { scalar: Scalar; encoding?: WireEncoding };

function getScalarType(program: Program, property: ModelProperty): ScalarWithEncoding | undefined {
  if (property.type.kind !== "Scalar") return undefined;
  let scalarType = property.type;
  let encoding: WireEncoding | undefined =
    getScalarEncoding(program, property) || getScalarEncoding(program, scalarType);
  while (scalarType.baseScalar !== undefined) {
    scalarType = scalarType.baseScalar;
    if (encoding === undefined) {
      encoding = getScalarEncoding(program, scalarType);
    }
  }
  return { scalar: scalarType, encoding: encoding };
}

function getScalarEncoding(
  program: Program,
  scalar: Scalar | ModelProperty
): WireEncoding | undefined {
  const encode = getEncode(program, scalar);
  if (encode === undefined) return undefined;
  return { name: encode.encoding, wireType: encode.type };
}

function getTypeType(): CSharpType {
  return new CSharpType({ name: "Type", namespace: "System", isValueType: false, isBuiltIn: true });
}
function getJsonConverterAttributeType(): CSharpType {
  return new CSharpType({
    name: "JsonConverter",
    namespace: "System.Text.Json",
    isValueType: false,
    isBuiltIn: true,
  });
}

function getJsonConverterAttribute(converterType: string): Attribute {
  return new Attribute(getJsonConverterAttributeType(), [
    new Parameter({
      name: "",
      type: getTypeType(),
      optional: false,
      value: new RawValue(`typeof(${converterType})`),
    }),
  ]);
}

/**
 * Return min and max length attributes
 * @param program The program being processed
 * @param type The type to check
 * @returns The attributes associated with the type, or none
 */
export function getLengthAttribute(
  program: Program,
  type: ModelProperty | Scalar
): Attribute | undefined {
  let minLength: number | undefined = getMinLength(program, type);
  const maxLength = getMaxLength(program, type);
  if (!minLength && !maxLength) return undefined;
  const attr: Attribute = new Attribute(
    new AttributeType({
      name: "Length",
      namespace: HelperNamespace,
    }),
    []
  );

  minLength = minLength ?? 0;
  attr.parameters.push(
    new Parameter({
      name: "minLength",
      value: new NumericValue(minLength),
      optional: false,
      type: new CSharpType({
        name: "int",
        namespace: "System",
        isBuiltIn: true,
        isValueType: true,
      }),
    })
  );

  if (maxLength) {
    attr.parameters.push(
      new Parameter({
        name: "maxLength",
        value: new NumericValue(maxLength),
        optional: false,
        type: new CSharpType({
          name: "int",
          namespace: "System",
          isBuiltIn: true,
          isValueType: true,
        }),
      })
    );
  }

  return attr;
}

export function getSafeIntAttribute(type: Scalar): Attribute | undefined {
  if (type.name.toLowerCase() !== "safeint") return undefined;
  return new Attribute(
    new AttributeType({
      name: "SafeInt",
      namespace: HelperNamespace,
    }),
    []
  );
}

function getEnumAttribute(type: Enum, cSharpName?: string): Attribute {
  return new Attribute(
    new AttributeType({
      name: `StringEnumConverter<${cSharpName !== undefined ? cSharpName : getCSharpIdentifier(type.name)}>`,
      namespace: "System.Text.Json",
    }),
    []
  );
}

export function getAttributes(program: Program, type: Type, cSharpName?: string): Attribute[] {
  const result: Set<Attribute> = new Set<Attribute>();
  switch (type.kind) {
    case "Enum":
      result.add(getEnumAttribute(type, cSharpName));
      break;
    case "Model":
      break;
    case "ModelProperty": {
      const pattern = getPatternAttribute(program, type);
      const length = getLengthAttribute(program, type);
      const name = getEncodedNameAttribute(program, type);
      if (pattern) result.add(pattern);
      if (length) result.add(length);
      if (name) result.add(name);
      const encodingAttributes = getEncodingAttributes(program, type);
      for (const encoder of encodingAttributes) {
        result.add(encoder);
      }
      const typeAttributes = getAttributes(program, type.type);
      for (const typeAttribute of typeAttributes) {
        result.add(typeAttribute);
      }
      break;
    }
    case "Scalar":
      {
        const pattern = getPatternAttribute(program, type);
        const length = getLengthAttribute(program, type);
        const safeInt = getSafeIntAttribute(type);
        if (pattern) result.add(pattern);
        if (length) result.add(length);
        if (safeInt) result.add(safeInt);
      }

      break;
  }

  return [...result.values()];
}
