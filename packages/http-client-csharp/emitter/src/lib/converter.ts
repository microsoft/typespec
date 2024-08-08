// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkArrayType,
  SdkBodyModelPropertyType,
  SdkBuiltInType,
  SdkConstantType,
  SdkContext,
  SdkDateTimeType,
  SdkDictionaryType,
  SdkDurationType,
  SdkEnumType,
  SdkEnumValueType,
  SdkModelPropertyType,
  SdkModelType,
  SdkTupleType,
  SdkType,
  SdkUnionType,
  getAccessOverride,
  isReadOnly,
} from "@azure-tools/typespec-client-generator-core";
import { Model } from "@typespec/compiler";
import { InputEnumTypeValue } from "../type/input-enum-type-value.js";
import { InputModelProperty } from "../type/input-model-property.js";
import {
  InputArrayType,
  InputDateTimeType,
  InputDictionaryType,
  InputDurationType,
  InputEnumType,
  InputLiteralType,
  InputModelType,
  InputNullableType,
  InputPrimitiveType,
  InputType,
  InputUnionType,
} from "../type/input-type.js";
import { LiteralTypeContext } from "../type/literal-type-context.js";

export function fromSdkType(
  sdkType: SdkType,
  context: SdkContext,
  models: Map<string, InputModelType>,
  enums: Map<string, InputEnumType>,
  literalTypeContext?: LiteralTypeContext
): InputType {
  if (sdkType.kind === "nullable") {
    const inputType = fromSdkType(sdkType.type, context, models, enums);
    return {
      Kind: "nullable",
      Type: inputType,
    } as InputNullableType;
  }
  if (sdkType.kind === "model") return fromSdkModelType(sdkType, context, models, enums);
  if (sdkType.kind === "endpoint") return fromSdkEndpointType();
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
  if (sdkType.kind === "duration") return fromSdkDurationType(sdkType);
  if (sdkType.kind === "tuple") return fromTupleType(sdkType);
  // TODO -- endpoint and credential are handled separately in emitter, since we have specific locations for them in input model.
  // We can handle unify the way we handle them in the future, probably by chaning the input model schema and do the conversion in generator.
  if (sdkType.kind === "credential") throw new Error("Credential type is not supported yet.");

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
    inputModelType = {
      Kind: "model",
      Name: modelTypeName,
      CrossLanguageDefinitionId: modelType.crossLanguageDefinitionId,
      Access: getAccessOverride(
        context,
        modelType.__raw as Model
      ) /* when tcgc provide a way to identify if the access is override or not, we can get the accessibility from the modelType.access */,
      Usage: modelType.usage,
      Deprecation: modelType.deprecation,
      Description: modelType.description,
      DiscriminatorValue: modelType.discriminatorValue,
      Decorators: modelType.decorators,
    } as InputModelType;

    models.set(modelTypeName, inputModelType);

    inputModelType.AdditionalProperties = modelType.additionalProperties
      ? fromSdkType(modelType.additionalProperties, context, models, enums)
      : undefined;

    const propertiesDict = new Map<SdkModelPropertyType, InputModelProperty[]>();
    for (const property of modelType.properties) {
      if (property.kind !== "property") {
        continue;
      }
      const ourProperties = fromSdkModelProperty(
        property,
        {
          ModelName: modelTypeName,
          Usage: modelType.usage,
        } as LiteralTypeContext,
        []
      );
      propertiesDict.set(property, ourProperties);
    }

    inputModelType.DiscriminatorProperty = modelType.discriminatorProperty
      ? propertiesDict.get(modelType.discriminatorProperty)![0]
      : undefined;

    inputModelType.BaseModel = modelType.baseModel
      ? fromSdkModelType(modelType.baseModel, context, models, enums)
      : undefined;

    inputModelType.Properties = Array.from(propertiesDict.values()).flat();

    if (modelType.discriminatedSubtypes) {
      const discriminatedSubtypes: Record<string, InputModelType> = {};
      for (const key in modelType.discriminatedSubtypes) {
        const subtype = modelType.discriminatedSubtypes[key];
        discriminatedSubtypes[key] = fromSdkModelType(subtype, context, models, enums);
      }
      inputModelType.DiscriminatedSubtypes = discriminatedSubtypes;
    }
  }

  return inputModelType;

  function fromSdkModelProperty(
    property: SdkBodyModelPropertyType,
    literalTypeContext: LiteralTypeContext,
    flattenedNamePrefixes: string[]
  ): InputModelProperty[] {
    // TODO -- we should consolidate the flatten somewhere else
    if (!property.flatten) {
      const serializedName = property.serializedName;
      literalTypeContext.PropertyName = serializedName;

      const isRequired = !property.optional;
      const isDiscriminator = property.discriminator;
      const modelProperty: InputModelProperty = {
        Name: property.name,
        SerializedName: serializedName,
        Description: property.description ?? (isDiscriminator ? "Discriminator" : ""),
        Type: fromSdkType(
          property.type,
          context,
          models,
          enums,
          isDiscriminator ? undefined : literalTypeContext // this is a workaround because the type of discriminator property in derived models is always literal and we wrap literal into enums, which leads to a lot of extra enum types, adding this check to avoid them
        ),
        IsRequired: isRequired,
        IsReadOnly: isReadOnly(property),
        IsDiscriminator: isDiscriminator === true ? true : undefined,
        FlattenedNames:
          flattenedNamePrefixes.length > 0
            ? flattenedNamePrefixes.concat(property.name)
            : undefined,
      };

      return [modelProperty];
    }

    const flattenedProperties: InputModelProperty[] = [];
    const childPropertiesToFlatten = (property.type as SdkModelType).properties;
    const newFlattenedNamePrefixes = flattenedNamePrefixes.concat(property.serializedName);
    for (const childProperty of childPropertiesToFlatten) {
      if (childProperty.kind !== "property") continue;
      flattenedProperties.push(
        ...fromSdkModelProperty(childProperty, literalTypeContext, newFlattenedNamePrefixes)
      );
    }

    return flattenedProperties;
  }
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
      CrossLanguageDefinitionId: enumType.crossLanguageDefinitionId,
      ValueType: fromSdkBuiltInType(enumType.valueType),
      Values: enumType.values.map((v) => fromSdkEnumValueType(v)),
      Accessibility: getAccessOverride(
        context,
        enumType.__raw as any
      ) /* when tcgc provide a way to identify if the access is override or not, we can get the accessibility from the enumType.access,*/,
      Deprecated: enumType.deprecation,
      Description: enumType.description,
      IsExtensible: enumType.isFixed ? false : true,
      Usage: enumType.usage,
    };
    if (addToCollection) enums.set(enumName, newInputEnumType);
    inputEnumType = newInputEnumType;
  }
  return inputEnumType;
}

function fromSdkDateTimeType(dateTimeType: SdkDateTimeType): InputDateTimeType {
  return {
    Kind: dateTimeType.kind,
    Name: dateTimeType.name,
    Encode: dateTimeType.encode,
    WireType: fromSdkBuiltInType(dateTimeType.wireType),
    CrossLanguageDefinitionId: dateTimeType.crossLanguageDefinitionId,
    BaseType: dateTimeType.baseType ? fromSdkDateTimeType(dateTimeType.baseType) : undefined,
  };
}

function fromSdkDurationType(durationType: SdkDurationType): InputDurationType {
  return {
    Kind: durationType.kind,
    Name: durationType.name,
    Encode: durationType.encode,
    WireType: fromSdkBuiltInType(durationType.wireType),
    CrossLanguageDefinitionId: durationType.crossLanguageDefinitionId,
    BaseType: durationType.baseType ? fromSdkDurationType(durationType.baseType) : undefined,
  };
}

// TODO: tuple is not officially supported
function fromTupleType(tupleType: SdkTupleType): InputPrimitiveType {
  return {
    Kind: "any",
    Name: "tuple",
    CrossLanguageDefinitionId: "",
  };
}

function fromSdkBuiltInType(builtInType: SdkBuiltInType): InputPrimitiveType {
  return {
    Kind: builtInType.kind,
    Name: builtInType.name,
    Encode: builtInType.encode !== builtInType.kind ? builtInType.encode : undefined, // In TCGC this is required, and when there is no encoding, it just has the same value as kind, we could remove this when TCGC decides to simplify
    CrossLanguageDefinitionId: builtInType.crossLanguageDefinitionId,
    BaseType: builtInType.baseType ? fromSdkBuiltInType(builtInType.baseType) : undefined,
  };
}

function fromUnionType(
  union: SdkUnionType,
  context: SdkContext,
  models: Map<string, InputModelType>,
  enums: Map<string, InputEnumType>
): InputUnionType {
  const variantTypes: InputType[] = [];
  for (const value of union.values) {
    const variantType = fromSdkType(value, context, models, enums);
    variantTypes.push(variantType);
  }

  return {
    Kind: "union",
    Name: union.name,
    VariantTypes: variantTypes,
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
      CrossLanguageDefinitionId: "",
      Accessibility: undefined,
      Deprecated: undefined,
      Description: `The ${enumName}`, // TODO -- what should we put here?
      IsExtensible: true,
      Usage: literalTypeContext.Usage,
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
    Kind: "dict",
    KeyType: fromSdkType(dictionaryType.keyType, context, models, enums),
    ValueType: fromSdkType(dictionaryType.valueType, context, models, enums),
  };
}

function fromSdkArrayType(
  arrayType: SdkArrayType,
  context: SdkContext,
  models: Map<string, InputModelType>,
  enums: Map<string, InputEnumType>
): InputArrayType {
  return {
    Kind: "array",
    Name: arrayType.name,
    ValueType: fromSdkType(arrayType.valueType, context, models, enums),
    CrossLanguageDefinitionId: arrayType.crossLanguageDefinitionId,
  };
}

function fromSdkEndpointType(): InputPrimitiveType {
  return {
    Kind: "string",
    Name: "string",
    CrossLanguageDefinitionId: "TypeSpec.string",
  };
}
