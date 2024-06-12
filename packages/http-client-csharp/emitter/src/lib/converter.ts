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
} from "@azure-tools/typespec-client-generator-core";
import { Model } from "@typespec/compiler";
import { InputEnumTypeValue } from "../type/input-enum-type-value.js";
import { InputModelProperty } from "../type/input-model-property.js";
import { InputTypeKind } from "../type/input-type-kind.js";
import {
  InputDateTimeType,
  InputDictionaryType,
  InputDurationType,
  InputEnumType,
  InputListType,
  InputLiteralType,
  InputModelType,
  InputPrimitiveType,
  InputType,
  InputUnionType,
} from "../type/input-type.js";
import { LiteralTypeContext } from "../type/literal-type-context.js";
import { Usage } from "../type/usage.js";
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
  if (sdkType.kind === "utcDateTime" || sdkType.kind === "offsetDateTime")
    return fromSdkDateTimeType(sdkType);
  if (sdkType.kind === "duration") return fromSdkDurationType(sdkType as SdkDurationType);
  if (sdkType.kind === "tuple") return fromTupleType(sdkType);
  // TODO -- only in operations we could have these types, considering we did not adopt getAllOperations from TCGC yet, this should be fine.
  // we need to resolve these conversions when we adopt getAllOperations
  if (sdkType.kind === "credential") throw new Error("Credential type is not supported yet.");
  if (sdkType.kind === "endpoint") throw new Error("Endpoint type is not supported yet.");

  return fromSdkBuiltInType(sdkType);
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
      ? {
          Kind: InputTypeKind.Dictionary,
          Name: InputTypeKind.Dictionary,
          KeyType: {
            Kind: "string",
            IsNullable: false,
          },
          ValueType: fromSdkType(modelType.additionalProperties, context, models, enums),
          IsNullable: false,
        }
      : undefined;
    inputModelType.Properties = modelType.properties
      .filter((p) => !(p as SdkBodyModelPropertyType).discriminator || !baseModelHasDiscriminator)
      .filter((p) => p.kind !== "header" && p.kind !== "query" && p.kind !== "path")
      .map((p) =>
        fromSdkModelProperty(
          p,
          {
            ModelName: inputModelType?.Name,
            Namespace: inputModelType?.Namespace,
          } as LiteralTypeContext,
          []
        )
      )
      .flat();
  }

  return inputModelType;

  function fromSdkModelProperty(
    propertyType: SdkModelPropertyType,
    literalTypeContext: LiteralTypeContext,
    flattenedNamePrefixes: string[]
  ): InputModelProperty[] {
    if (propertyType.kind !== "property" || !propertyType.flatten) {
      const serializedName =
        propertyType.kind === "property"
          ? (propertyType as SdkBodyModelPropertyType).serializedName
          : "";
      literalTypeContext.PropertyName = serializedName;

      const isRequired =
        propertyType.kind === "path" || propertyType.kind === "body"
          ? true
          : !propertyType.optional; // TO-DO: SdkBodyParameter lacks of optional
      const isDiscriminator =
        propertyType.kind === "property" && propertyType.discriminator ? true : false;
      const modelProperty: InputModelProperty = {
        Name: propertyType.name,
        SerializedName: serializedName,
        Description: propertyType.description ?? (isDiscriminator ? "Discriminator" : ""),
        Type: fromSdkType(propertyType.type, context, models, enums, literalTypeContext),
        IsRequired: isRequired,
        IsReadOnly: propertyType.kind === "property" && isReadOnly(propertyType),
        IsDiscriminator: isDiscriminator === true ? true : undefined,
        FlattenedNames:
          flattenedNamePrefixes.length > 0
            ? flattenedNamePrefixes.concat(propertyType.name)
            : undefined,
      };

      return [modelProperty];
    }

    let flattenedProperties: InputModelProperty[] = [];
    const modelPropertyType = propertyType as SdkBodyModelPropertyType;
    const childPropertiesToFlatten = (modelPropertyType.type as SdkModelType).properties;
    const newFlattenedNamePrefixes = flattenedNamePrefixes.concat(modelPropertyType.serializedName);
    for (let index = 0; index < childPropertiesToFlatten.length; index++) {
      flattenedProperties = flattenedProperties.concat(
        fromSdkModelProperty(
          childPropertiesToFlatten[index],
          literalTypeContext,
          newFlattenedNamePrefixes
        )
      );
    }

    return flattenedProperties;
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
      Kind: "enum",
      Name: enumName,
      ValueType: fromSdkBuiltInType(enumType.valueType),
      Values: enumType.values.map((v) => fromSdkEnumValueType(v)),
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

function fromSdkDateTimeType(dateTimeType: SdkDatetimeType): InputDateTimeType {
  return {
    Kind: dateTimeType.kind,
    IsNullable: dateTimeType.nullable,
    Encode: dateTimeType.encode,
    WireType: fromSdkBuiltInType(dateTimeType.wireType),
  };
}

function fromSdkDurationType(durationType: SdkDurationType): InputDurationType {
  return {
    Kind: durationType.kind,
    IsNullable: durationType.nullable,
    Encode: durationType.encode,
    WireType: fromSdkBuiltInType(durationType.wireType),
  };
}

// TODO: tuple is not officially supported
function fromTupleType(tupleType: SdkTupleType): InputPrimitiveType {
  return {
    Kind: "any",
    IsNullable: tupleType.nullable,
  };
}

function fromSdkBuiltInType(builtInType: SdkBuiltInType): InputPrimitiveType {
  return {
    Kind: builtInType.kind,
    IsNullable: builtInType.nullable,
    Encode: builtInType.encode !== builtInType.kind ? builtInType.encode : undefined, // In TCGC this is required, and when there is no encoding, it just has the same value as kind, we could remove this when TCGC decides to simplify
  };
}

function fromUnionType(
  union: SdkUnionType,
  context: SdkContext,
  models: Map<string, InputModelType>,
  enums: Map<string, InputEnumType>
): InputUnionType | InputType {
  const variantTypes: InputType[] = [];
  for (const value of union.values) {
    const variantType = fromSdkType(value, context, models, enums);
    variantTypes.push(variantType);
  }

  return {
    Kind: "union",
    Name: union.name,
    VariantTypes: variantTypes,
    IsNullable: false,
  };
}

function fromSdkConstantType(
  constantType: SdkConstantType,
  context: SdkContext,
  models: Map<string, InputModelType>,
  enums: Map<string, InputEnumType>,
  literalTypeContext?: LiteralTypeContext
): InputLiteralType {
  return {
    Kind: constantType.kind,
    ValueType:
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
    const enumValueName = constantType.value === null ? "Null" : constantType.value.toString();
    const allowValues: InputEnumTypeValue[] = [
      {
        Name: enumValueName,
        Value: constantType.value,
        Description: enumValueName,
      },
    ];
    const enumType: InputEnumType = {
      Kind: "enum",
      Name: enumName,
      ValueType: fromSdkBuiltInType(constantType.valueType),
      Values: allowValues,
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
    Kind: "constant",
    ValueType:
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
