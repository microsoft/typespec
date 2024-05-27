// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkArrayType,
  SdkBodyModelPropertyType,
  SdkBuiltInType,
  SdkConstantType,
  SdkContext,
  SdkDatetimeType,
  SdkDictionaryType,
  SdkDurationType,
  SdkEnumType,
  SdkEnumValueType,
  SdkModelPropertyType,
  SdkModelType,
  SdkTupleType,
  SdkType,
  SdkUnionType,
  UsageFlags,
  isReadOnly,
  isSdkBuiltInKind,
} from "@azure-tools/typespec-client-generator-core";
import {
  DateTimeKnownEncoding,
  DurationKnownEncoding,
  EncodeData,
  IntrinsicType,
  Model,
  Program,
  Type,
  getFormat,
} from "@typespec/compiler";
import { InputEnumTypeValue } from "../type/input-enum-type-value.js";
import { InputIntrinsicTypeKind } from "../type/input-intrinsic-type-kind.js";
import { InputModelProperty } from "../type/input-model-property.js";
import { InputPrimitiveTypeKind } from "../type/input-primitive-type-kind.js";
import { InputTypeKind } from "../type/input-type-kind.js";
import {
  InputDictionaryType,
  InputEnumType,
  InputIntrinsicType,
  InputListType,
  InputLiteralType,
  InputModelType,
  InputPrimitiveType,
  InputType,
  InputUnionType,
} from "../type/input-type.js";
import { LiteralTypeContext } from "../type/literal-type-context.js";
import { Usage } from "../type/usage.js";
import { Logger } from "./logger.js";
import { getFullNamespaceString } from "./utils.js";

export function fromSdkType(
  sdkType: SdkType,
  context: SdkContext,
  models: Map<string, InputModelType>,
  enums: Map<string, InputEnumType>,
  literalTypeContext?: LiteralTypeContext
): InputType {
  if (sdkType.kind === "model") return fromSdkModelType(sdkType, context, models, enums);
  if (sdkType.kind === "enum") return fromSdkEnumType(sdkType, context, enums);
  if (sdkType.kind === "enumvalue")
    return fromSdkEnumValueTypeToConstantType(sdkType, context, enums, literalTypeContext);
  if (sdkType.kind === "dict") return fromSdkDictionaryType(sdkType, context, models, enums);
  if (sdkType.kind === "array") return fromSdkArrayType(sdkType, context, models, enums);
  if (sdkType.kind === "constant")
    return fromSdkConstantType(sdkType, context, models, enums, literalTypeContext);
  if (sdkType.kind === "union") return fromUnionType(sdkType, context, models, enums);
  if (sdkType.kind === "utcDateTime") return fromSdkDatetimeType(sdkType);
  if (sdkType.kind === "duration") return fromSdkDurationType(sdkType as SdkDurationType);
  if (sdkType.kind === "bytes") return fromBytesType(sdkType as SdkBuiltInType);
  if (sdkType.kind === "string") return fromStringType(context.program, sdkType);
  // TODO: offsetDateTime
  if (sdkType.kind === "tuple") return fromTupleType(sdkType);
  if (sdkType.__raw?.kind === "Scalar") return fromScalarType(sdkType);
  // this happens for discriminator type, normally all other primitive types should be handled in scalar above
  // TODO: can we improve the type in TCGC around discriminator
  if (sdkType.__raw?.kind === "Intrinsic") return fromIntrinsicType(sdkType);
  if (isSdkBuiltInKind(sdkType.kind)) return fromSdkBuiltInType(sdkType as SdkBuiltInType);
  return {} as InputType;
}

// TODO -- this is workaround because TCGC ignore format, we need to remove this after a discussion on format.
// this function is only for the case when we get a type from a parameter, because in typespec, the parameters share the same type as the properties
export function fromSdkModelPropertyType(
  propertyType: SdkModelPropertyType,
  context: SdkContext,
  models: Map<string, InputModelType>,
  enums: Map<string, InputEnumType>,
  literalTypeContext?: LiteralTypeContext
): InputType {
  // when the type is string, we need to add the format
  if (propertyType.type.kind === "string") {
    return fromStringType(context.program, propertyType.type, propertyType.__raw);
  }
  return fromSdkType(propertyType.type, context, models, enums, literalTypeContext);
}

export function fromSdkModelType(
  modelType: SdkModelType,
  context: SdkContext,
  models: Map<string, InputModelType>,
  enums: Map<string, InputEnumType>
): InputModelType {
  const modelTypeName = modelType.name;
  let inputModelType = models.get(modelTypeName);
  if (!inputModelType) {
    const baseModelHasDiscriminator = hasDiscriminator(modelType.baseModel);
    inputModelType = {
      Kind: InputTypeKind.Model,
      Name: modelTypeName,
      Namespace: getFullNamespaceString((modelType.__raw as Model).namespace),
      Accessibility: modelType.access,
      Deprecated: modelType.deprecation,
      Description: modelType.description,
      IsNullable: modelType.nullable,
      DiscriminatorPropertyName: baseModelHasDiscriminator
        ? undefined
        : getDiscriminatorPropertyNameFromCurrentModel(modelType),
      DiscriminatorValue: modelType.discriminatorValue,
      Usage: fromUsageFlags(modelType.usage),
    } as InputModelType;

    models.set(modelTypeName, inputModelType);

    inputModelType.BaseModel = modelType.baseModel
      ? fromSdkModelType(modelType.baseModel, context, models, enums)
      : undefined;

    inputModelType.InheritedDictionaryType = modelType.additionalProperties
      ? ({
          Kind: InputTypeKind.Dictionary,
          Name: InputTypeKind.Dictionary,
          KeyType: {
            Kind: InputTypeKind.Primitive,
            Name: InputPrimitiveTypeKind.String,
            IsNullable: false,
          } as InputPrimitiveType,
          ValueType: fromSdkType(modelType.additionalProperties, context, models, enums),
          IsNullable: false,
        } as InputDictionaryType)
      : undefined;
    inputModelType.Properties = modelType.properties
      .filter((p) => !(p as SdkBodyModelPropertyType).discriminator || !baseModelHasDiscriminator)
      .filter((p) => p.kind !== "header" && p.kind !== "query" && p.kind !== "path")
      .map((p) =>
        fromSdkModelProperty(p, {
          ModelName: inputModelType?.Name,
          Namespace: inputModelType?.Namespace,
        } as LiteralTypeContext)
      );
  }

  return inputModelType;

  function fromSdkModelProperty(
    propertyType: SdkModelPropertyType,
    literalTypeContext: LiteralTypeContext
  ): InputModelProperty {
    const serializedName =
      propertyType.kind === "property"
        ? (propertyType as SdkBodyModelPropertyType).serializedName
        : "";
    literalTypeContext.PropertyName = serializedName;

    const isRequired =
      propertyType.kind === "path" || propertyType.kind === "body" ? true : !propertyType.optional; // TO-DO: SdkBodyParameter lacks of optional
    const isDiscriminator =
      propertyType.kind === "property" && propertyType.discriminator ? true : false;
    const modelProperty: InputModelProperty = {
      Name: propertyType.name,
      SerializedName: serializedName,
      Description: propertyType.description ?? (isDiscriminator ? "Discriminator" : ""),
      Type: fromSdkType(propertyType.type, context, models, enums, literalTypeContext),
      IsRequired: isRequired,
      IsReadOnly: propertyType.kind === "property" && isReadOnly(propertyType),
      IsDiscriminator: isDiscriminator === true ? true : undefined, // TODO: keep backward compatible to ease comparison. remove this after TCGC is merged
    };

    return modelProperty;
  }
}

function getDiscriminatorPropertyNameFromCurrentModel(model?: SdkModelType): string | undefined {
  if (model == null) return undefined;

  const discriminatorProperty = model.properties.find(
    (p) => (p as SdkBodyModelPropertyType).discriminator
  );
  if (discriminatorProperty) return discriminatorProperty.name;

  return undefined;
}

function hasDiscriminator(model?: SdkModelType): boolean {
  if (model == null) return false;

  if (model.properties.some((p) => (p as SdkBodyModelPropertyType).discriminator)) return true;

  return hasDiscriminator(model.baseModel);
}

export function fromSdkEnumType(
  enumType: SdkEnumType,
  context: SdkContext,
  enums: Map<string, InputEnumType>,
  addToCollection: boolean = true
): InputEnumType {
  const enumName = enumType.name;
  let inputEnumType = enums.get(enumName);
  if (inputEnumType === undefined) {
    const newInputEnumType: InputEnumType = {
      Kind: InputTypeKind.Enum,
      Name: enumName,
      EnumValueType: fromScalarType(enumType.valueType).Name,
      AllowedValues: enumType.values.map((v) => fromSdkEnumValueType(v)),
      Namespace: getFullNamespaceString(
        // Enum and Union have optional namespace property
        (enumType.__raw! as any).namespace
      ),
      Accessibility: enumType.access,
      Deprecated: enumType.deprecation,
      Description: enumType.description,
      IsExtensible: enumType.isFixed ? false : true,
      IsNullable: enumType.nullable,
      Usage: fromUsageFlags(enumType.usage),
    };
    if (addToCollection) enums.set(enumName, newInputEnumType);
    inputEnumType = newInputEnumType;
  }
  inputEnumType.IsNullable = enumType.nullable; // TO-DO: https://github.com/Azure/autorest.csharp/issues/4314
  return inputEnumType;
}

function fromSdkDatetimeType(dateTimeType: SdkDatetimeType): InputPrimitiveType {
  function fromDateTimeKnownEncoding(encoding: DateTimeKnownEncoding): InputPrimitiveTypeKind {
    switch (encoding) {
      case "rfc3339":
        return InputPrimitiveTypeKind.DateTimeRFC3339;
      case "rfc7231":
        return InputPrimitiveTypeKind.DateTimeRFC7231;
      case "unixTimestamp":
        return InputPrimitiveTypeKind.DateTimeUnix;
    }
  }

  return {
    Kind: InputTypeKind.Primitive,
    Name: fromDateTimeKnownEncoding(dateTimeType.encode),
    IsNullable: dateTimeType.nullable,
  } as InputPrimitiveType;
}

function fromSdkDurationType(durationType: SdkDurationType): InputPrimitiveType {
  function fromDurationKnownEncoding(
    encode: DurationKnownEncoding,
    wireType: SdkBuiltInType
  ): InputPrimitiveTypeKind {
    switch (encode) {
      case "ISO8601":
        return InputPrimitiveTypeKind.DurationISO8601;
      case "seconds":
        if (wireType.kind === "float" || wireType.kind === "float32") {
          return InputPrimitiveTypeKind.DurationSecondsFloat;
        }
        if (wireType.kind === "float64") {
          return InputPrimitiveTypeKind.DurationSecondsDouble;
        }
        return InputPrimitiveTypeKind.DurationSeconds;
      default:
        Logger.getInstance().warn(
          `invalid encode '${encode}' and wireType '${wireType.kind}' for duration.`
        );
        return InputPrimitiveTypeKind.DurationISO8601;
    }
  }

  return {
    Kind: InputTypeKind.Primitive,
    Name: fromDurationKnownEncoding(durationType.encode, durationType.wireType),
    IsNullable: durationType.nullable,
  } as InputPrimitiveType;
}

// TODO: tuple is not officially supported
function fromTupleType(tupleType: SdkTupleType): InputIntrinsicType {
  return {
    Kind: InputTypeKind.Intrinsic,
    Name: InputIntrinsicTypeKind.Unknown,
    IsNullable: tupleType.nullable,
  } as InputIntrinsicType;
}

function fromBytesType(bytesType: SdkBuiltInType): InputPrimitiveType {
  function fromBytesEncoding(encode: string): InputPrimitiveTypeKind {
    switch (encode) {
      case undefined:
      case "base64":
        return InputPrimitiveTypeKind.Bytes;
      case "base64url":
        return InputPrimitiveTypeKind.BytesBase64Url;
      default:
        Logger.getInstance().warn(`invalid encode ${encode} for bytes.`);
        return InputPrimitiveTypeKind.Bytes;
    }
  }

  return {
    Kind: InputTypeKind.Primitive,
    Name: fromBytesEncoding(bytesType.encode),
    IsNullable: bytesType.nullable,
  };
}

function fromStringType(
  program: Program,
  stringType: SdkType,
  // we need the extra raw here because the format decorator is added to the property/parameter, but the raw in stringType is the type itself, and it does not have the format decorator we want.
  // only when we get the type from a parameter, we need to pass the the parameter as raw here to get the format
  // TODO -- we should remove this entirely later because TCGC ignores format in these cases, we add it now because we have old test projects, and we did not discuss the impact yet
  raw?: Type
): InputPrimitiveType {
  function fromStringFormat(rawStringType?: Type): InputPrimitiveTypeKind {
    if (!rawStringType) return InputPrimitiveTypeKind.String;

    const format = getFormat(program, rawStringType);
    switch (format) {
      case "date":
        // TODO: remove
        return InputPrimitiveTypeKind.DateTime;
      case "uri":
      case "url":
        return InputPrimitiveTypeKind.Uri;
      case "uuid":
        return InputPrimitiveTypeKind.Guid;
      default:
        if (format) {
          Logger.getInstance().warn(`Invalid string format '${format}'`);
        }
        return InputPrimitiveTypeKind.String;
    }
  }

  raw = raw ?? stringType.__raw;
  return {
    Kind: InputTypeKind.Primitive,
    Name: fromStringFormat(raw),
    IsNullable: stringType.nullable,
  };
}

function fromSdkBuiltInType(builtInType: SdkBuiltInType): InputType {
  const builtInKind: InputPrimitiveTypeKind = mapTcgcTypeToCSharpInputTypeKind(builtInType);
  return {
    Kind: InputTypeKind.Primitive,
    Name: builtInKind,
    IsNullable: builtInType.nullable,
  } as InputPrimitiveType;
}

function mapTcgcTypeToCSharpInputTypeKind(type: SdkBuiltInType): InputPrimitiveTypeKind {
  switch (type.kind) {
    case "numeric":
      return InputPrimitiveTypeKind.Float128;
    case "integer":
      return InputPrimitiveTypeKind.Int64;
    case "safeint":
      return InputPrimitiveTypeKind.SafeInt;
    case "int8":
      return InputPrimitiveTypeKind.SByte;
    case "int32":
      return InputPrimitiveTypeKind.Int32;
    case "int64":
      return InputPrimitiveTypeKind.Int64;
    case "uint8":
      return InputPrimitiveTypeKind.Byte;
    case "bytes":
      switch (type.encode) {
        case undefined:
        case "":
        case "base64":
          return InputPrimitiveTypeKind.Bytes;
        case "base64url":
          return InputPrimitiveTypeKind.BytesBase64Url;
        default:
          Logger.getInstance().warn(`invalid encode '${type.encode}' for bytes.`);
          return InputPrimitiveTypeKind.Bytes;
      }
    case "float":
      return InputPrimitiveTypeKind.Float64;
    case "float32":
      return InputPrimitiveTypeKind.Float32;
    case "float64":
      return InputPrimitiveTypeKind.Float64;
    case "decimal":
      return InputPrimitiveTypeKind.Decimal;
    case "decimal128":
      return InputPrimitiveTypeKind.Decimal128;
    case "uuid":
      return InputPrimitiveTypeKind.Guid;
    case "eTag":
      return InputPrimitiveTypeKind.String;
    case "azureLocation":
      return InputPrimitiveTypeKind.AzureLocation;
    case "string":
      return InputPrimitiveTypeKind.String;
    case "guid": // TODO: is this the same as uuid?
      return InputPrimitiveTypeKind.Guid;
    case "uri":
    case "url":
      return InputPrimitiveTypeKind.Uri;
    case "boolean":
      return InputPrimitiveTypeKind.Boolean;
    case "plainDate":
      return InputPrimitiveTypeKind.Date;
    case "plainTime":
      return InputPrimitiveTypeKind.Time;
    case "any":
      return InputPrimitiveTypeKind.Object;
    case "int16": // TODO: add support for those types
    case "uint16":
    case "uint32":
    case "uint64":
    case "ipV4Address":
    case "ipV6Address":
    case "password":
    case "armId":
    case "ipAddress":
    default:
      throw new Error(`Unsupported built-in type kind '${type.kind}'`);
  }
}

function fromScalarType(scalarType: SdkType): InputPrimitiveType {
  return {
    Kind: InputTypeKind.Primitive,
    Name: getCSharpInputTypeKindByPrimitiveModelName(
      scalarType.kind,
      scalarType.kind,
      undefined // To-DO: encode not compatible
    ),
    IsNullable: scalarType.nullable,
  };

  function getCSharpInputTypeKindByPrimitiveModelName(
    name: string,
    format?: string,
    encode?: EncodeData
  ): InputPrimitiveTypeKind {
    switch (name) {
      case "bytes":
        switch (encode?.encoding) {
          case undefined:
          case "base64":
            return InputPrimitiveTypeKind.Bytes;
          case "base64url":
            return InputPrimitiveTypeKind.BytesBase64Url;
          default:
            Logger.getInstance().warn(`invalid encode ${encode?.encoding} for bytes.`);
            return InputPrimitiveTypeKind.Bytes;
        }
      case "int8":
        return InputPrimitiveTypeKind.SByte;
      case "uint8":
        return InputPrimitiveTypeKind.Byte;
      case "int32":
        return InputPrimitiveTypeKind.Int32;
      case "int64":
        return InputPrimitiveTypeKind.Int64;
      case "integer":
        return InputPrimitiveTypeKind.Int64;
      case "safeint":
        return InputPrimitiveTypeKind.SafeInt;
      case "float32":
        return InputPrimitiveTypeKind.Float32;
      case "float64":
        return InputPrimitiveTypeKind.Float64;
      case "decimal":
        return InputPrimitiveTypeKind.Decimal;
      case "decimal128":
        return InputPrimitiveTypeKind.Decimal128;
      case "uri":
      case "url":
        return InputPrimitiveTypeKind.Uri;
      case "uuid":
        return InputPrimitiveTypeKind.Guid;
      case "eTag":
        return InputPrimitiveTypeKind.String;
      case "string":
        switch (format?.toLowerCase()) {
          case "date":
            return InputPrimitiveTypeKind.DateTime;
          case "uri":
          case "url":
            return InputPrimitiveTypeKind.Uri;
          case "uuid":
            return InputPrimitiveTypeKind.Guid;
          default:
            if (format) {
              Logger.getInstance().warn(`invalid format ${format}`);
            }
            return InputPrimitiveTypeKind.String;
        }
      case "boolean":
        return InputPrimitiveTypeKind.Boolean;
      case "date":
        return InputPrimitiveTypeKind.Date;
      case "plainDate":
        return InputPrimitiveTypeKind.Date;
      case "plainTime":
        return InputPrimitiveTypeKind.Time;
      case "datetime":
      case "utcDateTime":
        switch (encode?.encoding) {
          case undefined:
            return InputPrimitiveTypeKind.DateTime;
          case "rfc3339":
            return InputPrimitiveTypeKind.DateTimeRFC3339;
          case "rfc7231":
            return InputPrimitiveTypeKind.DateTimeRFC7231;
          case "unixTimestamp":
            return InputPrimitiveTypeKind.DateTimeUnix;
          default:
            Logger.getInstance().warn(`invalid encode ${encode?.encoding} for date time.`);
            return InputPrimitiveTypeKind.DateTime;
        }
      case "time":
        return InputPrimitiveTypeKind.Time;
      case "duration":
        switch (encode?.encoding) {
          case undefined:
          case "ISO8601":
            return InputPrimitiveTypeKind.DurationISO8601;
          case "seconds":
            if (encode.type?.name === "float" || encode.type?.name === "float32") {
              return InputPrimitiveTypeKind.DurationSecondsFloat;
            } else {
              return InputPrimitiveTypeKind.DurationSeconds;
            }
          default:
            Logger.getInstance().warn(`invalid encode ${encode?.encoding} for duration.`);
            return InputPrimitiveTypeKind.DurationISO8601;
        }
      case "azureLocation":
        return InputPrimitiveTypeKind.AzureLocation;
      default:
        return InputPrimitiveTypeKind.Object;
    }
  }
}

function fromIntrinsicType(scalarType: SdkType): InputIntrinsicType {
  return {
    Kind: InputTypeKind.Intrinsic,
    Name: getCSharpInputTypeKindByIntrinsic(scalarType.__raw! as IntrinsicType),
    IsNullable: false,
  };
}

function fromUnionType(
  union: SdkUnionType,
  context: SdkContext,
  models: Map<string, InputModelType>,
  enums: Map<string, InputEnumType>
): InputUnionType | InputType {
  const itemTypes: InputType[] = [];
  for (const value of union.values) {
    const inputType = fromSdkType(value, context, models, enums);
    itemTypes.push(inputType);
  }

  return itemTypes.length > 1
    ? {
        Kind: InputTypeKind.Union,
        Name: InputTypeKind.Union,
        UnionItemTypes: itemTypes,
        IsNullable: false,
      }
    : itemTypes[0];
}

function fromSdkConstantType(
  constantType: SdkConstantType,
  context: SdkContext,
  models: Map<string, InputModelType>,
  enums: Map<string, InputEnumType>,
  literalTypeContext?: LiteralTypeContext
): InputLiteralType {
  return {
    Kind: InputTypeKind.Literal,
    Name: InputTypeKind.Literal,
    LiteralValueType:
      constantType.valueType.kind === "boolean" || literalTypeContext === undefined
        ? fromSdkBuiltInType(constantType.valueType)
        : // TODO: this might change in the near future
          // we might keep constant as-is, instead of creating an enum for it.
          convertConstantToEnum(constantType, enums, literalTypeContext),
    Value: constantType.value,
    IsNullable: false,
  };

  function convertConstantToEnum(
    constantType: SdkConstantType,
    enums: Map<string, InputEnumType>,
    literalTypeContext: LiteralTypeContext
  ) {
    // otherwise we need to wrap this into an extensible enum
    // we use the model name followed by the property name as the enum name to ensure it is unique
    const enumName = `${literalTypeContext.ModelName}_${literalTypeContext.PropertyName}`;
    const valueType = fromSdkType(
      constantType.valueType,
      context,
      models,
      enums,
      literalTypeContext
    ) as InputPrimitiveType;
    const enumValueType = valueType.Name;
    const enumValueName = constantType.value === null ? "Null" : constantType.value.toString();
    const allowValues: InputEnumTypeValue[] = [
      {
        Name: enumValueName,
        Value: constantType.value,
        Description: enumValueName,
      },
    ];
    const enumType: InputEnumType = {
      Kind: InputTypeKind.Enum,
      Name: enumName,
      EnumValueType: enumValueType, //EnumValueType and AllowedValues should be the first field after id and name, so that it can be corrected serialized.
      AllowedValues: allowValues,
      Namespace: literalTypeContext.Namespace,
      Accessibility: undefined,
      Deprecated: undefined,
      Description: `The ${enumName}`, // TODO -- what should we put here?
      IsExtensible: true,
      IsNullable: false,
      Usage: "None", // will be updated later
    };
    enums.set(enumName, enumType);
    return enumType;
  }
}

function fromSdkEnumValueTypeToConstantType(
  enumValueType: SdkEnumValueType,
  context: SdkContext,
  enums: Map<string, InputEnumType>,
  literalTypeContext?: LiteralTypeContext
): InputLiteralType {
  return {
    Kind: InputTypeKind.Literal,
    Name: InputTypeKind.Literal,
    LiteralValueType:
      enumValueType.valueType.kind === "boolean" || literalTypeContext === undefined
        ? fromSdkBuiltInType(enumValueType.valueType as SdkBuiltInType) // TODO: TCGC fix
        : fromSdkEnumType(enumValueType.enumType, context, enums),
    Value: enumValueType.value,
    IsNullable: false,
  };
}

function fromSdkEnumValueType(enumValueType: SdkEnumValueType): InputEnumTypeValue {
  return {
    Name: enumValueType.name,
    Value: enumValueType.value,
    Description: enumValueType.description,
  };
}

function fromSdkDictionaryType(
  dictionaryType: SdkDictionaryType,
  context: SdkContext,
  models: Map<string, InputModelType>,
  enums: Map<string, InputEnumType>
): InputDictionaryType {
  return {
    Kind: InputTypeKind.Dictionary,
    Name: InputTypeKind.Dictionary,
    KeyType: fromSdkType(dictionaryType.keyType, context, models, enums),
    ValueType: fromSdkType(dictionaryType.valueType, context, models, enums),
    IsNullable: dictionaryType.nullable,
  };
}

function fromSdkArrayType(
  arrayType: SdkArrayType,
  context: SdkContext,
  models: Map<string, InputModelType>,
  enums: Map<string, InputEnumType>
): InputListType {
  return {
    Kind: InputTypeKind.Array,
    Name: InputTypeKind.Array,
    ElementType: fromSdkType(arrayType.valueType, context, models, enums),
    IsNullable: arrayType.nullable,
  };
}

function fromUsageFlags(usage: UsageFlags): Usage {
  if (usage === UsageFlags.Input) return Usage.Input;
  else if (usage === UsageFlags.Output) return Usage.Output;
  else if (usage === (UsageFlags.Input | UsageFlags.Output)) return Usage.RoundTrip;
  else return Usage.None;
}

function getCSharpInputTypeKindByIntrinsic(type: IntrinsicType): InputIntrinsicTypeKind {
  switch (type.name) {
    case "ErrorType":
      return InputIntrinsicTypeKind.Error;
    case "void":
      return InputIntrinsicTypeKind.Void;
    case "never":
      return InputIntrinsicTypeKind.Never;
    case "unknown":
      return InputIntrinsicTypeKind.Unknown;
    case "null":
      return InputIntrinsicTypeKind.Null;
    default:
      throw new Error(`Unsupported intrinsic type name '${type.name}'`);
  }
}
