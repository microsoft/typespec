import {
  ModelProperty,
  Program,
  Scalar,
  Type,
  getEncode,
  getFormat,
  getMaxLength,
  getMinLength,
  getPattern,
} from "@typespec/compiler";
import { Attribute, CSharpType, HelperNamespace } from "./interfaces.js";
import { getCSharpIdentifier, getCSharpTypeForScalar } from "./utils.js";

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
  return {
    name: "Pattern",
    namespace: HelperNamespace,
    parameters: [
      {
        value: pattern,
        type: new CSharpType({
          name: "string",
          namespace: "System",
          isBuiltIn: true,
          isValueType: false,
        }),
      },
    ],
  };
}

export function getLengthAttribute(
  program: Program,
  type: ModelProperty | Scalar
): Attribute | undefined {
  let minLength: number | undefined = getMinLength(program, type);
  const maxLength = getMaxLength(program, type);
  if (!minLength && !maxLength) return undefined;
  const attr: Attribute = {
    name: "Length",
    namespace: HelperNamespace,
    parameters: [],
  };

  minLength = minLength ?? 0;
  attr.parameters.push({
    value: minLength,
    type: new CSharpType({ name: "int", namespace: "System", isBuiltIn: true, isValueType: true }),
  });

  if (maxLength) {
    attr.parameters.push({
      value: maxLength,
      type: new CSharpType({
        name: "int",
        namespace: "System",
        isBuiltIn: true,
        isValueType: true,
      }),
    });
  }

  return attr;
}

export function getSafeIntAttribute(type: Scalar): Attribute | undefined {
  if (type.name.toLowerCase() !== "safeint") return undefined;
  return {
    name: "SafeInt",
    namespace: HelperNamespace,
    parameters: [],
  };
}

export function getAttributes(program: Program, type: Type): Attribute[] {
  const result: Set<Attribute> = new Set<Attribute>();
  switch (type.kind) {
    case "Enum":
      result.add({
        name: `JsonCoverter`,
        namespace: "Newtonsoft.Json",
        parameters: [
          {
            type: new CSharpType({
              name: "EnumJsonConverter",
              namespace: HelperNamespace,
              isBuiltIn: false,
              isValueType: false,
            }),
            value: `typeof(EnumJsonConverter<${getCSharpIdentifier(type.name)}>)`,
          },
        ],
      });
      break;
    case "Model":
      break;
    case "ModelProperty": {
      const pattern = getPatternAttribute(program, type);
      const length = getLengthAttribute(program, type);
      if (pattern) result.add(pattern);
      if (length) result.add(length);
      if (
        getEncodingValue(program, type) === "base64Url" ||
        getFormatValue(program, type) === "base64Url"
      )
        result.add({
          name: "Base64UrlJsonConverter",
          namespace: HelperNamespace,
          parameters: [],
        });
      const typeAttributes = getAttributes(program, type.type);
      for (const typeAttribute of typeAttributes) {
        result.add(typeAttribute);
      }
      break;
    }
    case "Scalar": {
      const pattern = getPatternAttribute(program, type);
      const length = getLengthAttribute(program, type);
      const safeInt = getSafeIntAttribute(type);
      if (pattern) result.add(pattern);
      if (length) result.add(length);
      if (safeInt) result.add(safeInt);
      const scalarType = getCSharpTypeForScalar(program, type);
      switch (scalarType.name) {
        case "TimeSpan":
          result.add({
            name: "XsdTimeSpanConverter",
            namespace: HelperNamespace,
            parameters: [],
          });
          break;
        case "byte[]":
          if (
            getEncodingValue(program, type) === "base64Url" ||
            getFormatValue(program, type) === "base64Url"
          )
            result.add({
              name: "Base64UrlJsonConverter",
              namespace: HelperNamespace,
              parameters: [],
            });
          break;
      }

      break;
    }
  }

  return [...result.values()];
}
