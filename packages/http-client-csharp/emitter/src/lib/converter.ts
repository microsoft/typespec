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
import { TypeCache } from "../type/type-cache.js";

export function fromSdkType(
  sdkType: SdkType,
  context: SdkContext,
  typeCache: TypeCache,
  literalTypeContext?: LiteralTypeContext
): InputType {
  // TODO -- we need to add a global cache here to track the TCGC type vs our type
  if (sdkType.kind === "nullable") {
    const inputType = fromSdkType(sdkType.type, context, typeCache);
    return {
      Kind: "nullable",
      Type: inputType,
    } as InputNullableType;
  }
  if (sdkType.kind === "model") return fromSdkModelType(sdkType, context, typeCache);
  if (sdkType.kind === "endpoint") return fromSdkEndpointType();
  if (sdkType.kind === "enum") return fromSdkEnumType(sdkType, context, typeCache);
  if (sdkType.kind === "enumvalue")
    return fromSdkEnumValueTypeToConstantType(sdkType, context, typeCache, literalTypeContext);
  if (sdkType.kind === "dict") return fromSdkDictionaryType(sdkType, context, typeCache);
  if (sdkType.kind === "array") return fromSdkArrayType(sdkType, context, typeCache);
  if (sdkType.kind === "constant")
    return fromSdkConstantType(sdkType, typeCache, literalTypeContext);
  if (sdkType.kind === "union") return fromUnionType(sdkType, context, typeCache);
  if (sdkType.kind === "utcDateTime" || sdkType.kind === "offsetDateTime")
    return fromSdkDateTimeType(typeCache, sdkType);
  if (sdkType.kind === "duration") return fromSdkDurationType(typeCache, sdkType);
  if (sdkType.kind === "tuple") return fromTupleType(typeCache, sdkType);
  // TODO -- endpoint and credential are handled separately in emitter, since we have specific locations for them in input model.
  // We can handle unify the way we handle them in the future, probably by chaning the input model schema and do the conversion in generator.
  if (sdkType.kind === "credential") throw new Error("Credential type is not supported yet.");

  return fromSdkBuiltInType(typeCache, sdkType);
}

export function fromSdkModelType(
  modelType: SdkModelType,
  context: SdkContext,
  typeCache: TypeCache
): InputModelType {
  if (typeCache.has(modelType)) {
    return typeCache.get(modelType) as InputModelType;
  }

  const modelTypeName = modelType.name;
  let inputModelType = typeCache.models.get(modelTypeName);
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

    typeCache.models.set(modelTypeName, inputModelType);

    inputModelType.AdditionalProperties = modelType.additionalProperties
      ? fromSdkType(modelType.additionalProperties, context, typeCache)
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
      ? fromSdkModelType(modelType.baseModel, context, typeCache)
      : undefined;

    inputModelType.Properties = Array.from(propertiesDict.values()).flat();

    if (modelType.discriminatedSubtypes) {
      const discriminatedSubtypes: Record<string, InputModelType> = {};
      for (const key in modelType.discriminatedSubtypes) {
        const subtype = modelType.discriminatedSubtypes[key];
        discriminatedSubtypes[key] = fromSdkModelType(subtype, context, typeCache);
      }
      inputModelType.DiscriminatedSubtypes = discriminatedSubtypes;
    }
  }

  typeCache.set(modelType, inputModelType);
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
          typeCache,
          isDiscriminator ? undefined : literalTypeContext // this is a workaround because the type of discriminator property in derived models is always literal and we wrap literal into enums, which leads to a lot of extra enum types, adding this check to avoid them
        ),
        IsRequired: isRequired,
        IsReadOnly: isReadOnly(property),
        IsDiscriminator: isDiscriminator === true ? true : undefined,
        FlattenedNames:
          flattenedNamePrefixes.length > 0
            ? flattenedNamePrefixes.concat(property.name)
            : undefined,
        Decorators: property.decorators,
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
  typeCache: TypeCache,
  addToCollection: boolean = true
): InputEnumType {
  if (typeCache.has(enumType)) {
    return typeCache.get(enumType) as InputEnumType;
  }

  const enumName = enumType.name;
  let inputEnumType = typeCache.enums.get(enumName);
  if (!inputEnumType) {
    inputEnumType = {
      Kind: "enum",
      Name: enumName,
      CrossLanguageDefinitionId: enumType.crossLanguageDefinitionId,
      ValueType: fromSdkBuiltInType(typeCache, enumType.valueType),
      Values: enumType.values.map((v) => fromSdkEnumValueType(v)),
      Accessibility: getAccessOverride(
        context,
        enumType.__raw as any
      ) /* when tcgc provide a way to identify if the access is override or not, we can get the accessibility from the enumType.access,*/,
      Deprecated: enumType.deprecation,
      Description: enumType.description,
      IsExtensible: enumType.isFixed ? false : true,
      Usage: enumType.usage,
      Decorators: enumType.decorators,
    };
    if (addToCollection) typeCache.enums.set(enumName, inputEnumType);
  }

  typeCache.set(enumType, inputEnumType);
  return inputEnumType;
}

function fromSdkDateTimeType(typeCache: TypeCache, dateTimeType: SdkDateTimeType): InputDateTimeType {
  if (typeCache.has(dateTimeType)) {
    return typeCache.get(dateTimeType) as InputDateTimeType;
  }

  const inputDateTimeType: InputDateTimeType = {
    Kind: dateTimeType.kind,
    Name: dateTimeType.name,
    Encode: dateTimeType.encode,
    WireType: fromSdkBuiltInType(typeCache, dateTimeType.wireType),
    CrossLanguageDefinitionId: dateTimeType.crossLanguageDefinitionId,
    BaseType: dateTimeType.baseType ? fromSdkDateTimeType(typeCache, dateTimeType.baseType) : undefined,
    Decorators: dateTimeType.decorators,
  };

  typeCache.set(dateTimeType, inputDateTimeType);
  return inputDateTimeType;
}

function fromSdkDurationType(typeCache: TypeCache, durationType: SdkDurationType): InputDurationType {
  if (typeCache.has(durationType)) {
    return typeCache.get(durationType) as InputDurationType;
  }

  const inputDurationType: InputDurationType = {
    Kind: durationType.kind,
    Name: durationType.name,
    Encode: durationType.encode,
    WireType: fromSdkBuiltInType(typeCache, durationType.wireType),
    CrossLanguageDefinitionId: durationType.crossLanguageDefinitionId,
    BaseType: durationType.baseType ? fromSdkDurationType(typeCache, durationType.baseType) : undefined,
    Decorators: durationType.decorators,
  };

  typeCache.set(durationType, inputDurationType);
  return inputDurationType;
}

// TODO: tuple is not officially supported
function fromTupleType(typeCache: TypeCache, tupleType: SdkTupleType): InputType {
  if (typeCache.has(tupleType)) {
    return typeCache.get(tupleType) as InputType;
  }

  const inputTupleType: InputType = {
    Kind: "any",
    Name: "tuple",
    CrossLanguageDefinitionId: "",
    Decorators: tupleType.decorators,
  };

  typeCache.set(tupleType, inputTupleType);
  return inputTupleType;
}

function fromSdkBuiltInType(typeCache: TypeCache, builtInType: SdkBuiltInType): InputPrimitiveType {
  if (typeCache.has(builtInType)) {
    return typeCache.get(builtInType) as InputPrimitiveType;
  }

  const inputPrimitiveType: InputPrimitiveType = {
    Kind: builtInType.kind,
    Name: builtInType.name,
    Encode: builtInType.encode !== builtInType.kind ? builtInType.encode : undefined, // In TCGC this is required, and when there is no encoding, it just has the same value as kind, we could remove this when TCGC decides to simplify
    CrossLanguageDefinitionId: builtInType.crossLanguageDefinitionId,
    BaseType: builtInType.baseType ? fromSdkBuiltInType(typeCache, builtInType.baseType) : undefined,
    Decorators: builtInType.decorators,
  };

  typeCache.set(builtInType, inputPrimitiveType);
  return inputPrimitiveType;
}

function fromUnionType(
  union: SdkUnionType,
  context: SdkContext,
  typeCache: TypeCache
): InputUnionType {
  if (typeCache.has(union)) {
    return typeCache.get(union) as InputUnionType;
  }

  const variantTypes: InputType[] = [];
  for (const value of union.values) {
    const variantType = fromSdkType(value, context, typeCache);
    variantTypes.push(variantType);
  }

  const inputUnionType: InputUnionType = {
    Kind: "union",
    Name: union.name,
    VariantTypes: variantTypes,
    Decorators: union.decorators,
  };

  typeCache.set(union, inputUnionType);
  return inputUnionType;
}

function fromSdkConstantType(
  constantType: SdkConstantType,
  typeCache: TypeCache,
  literalTypeContext?: LiteralTypeContext
): InputLiteralType {
  if (typeCache.has(constantType)) {
    return typeCache.get(constantType) as InputLiteralType;
  }

  const inputConstantType: InputLiteralType = {
    Kind: constantType.kind,
    ValueType:
      constantType.valueType.kind === "boolean" || literalTypeContext === undefined
        ? fromSdkBuiltInType(typeCache, constantType.valueType)
        : // TODO: this might change in the near future
          // we might keep constant as-is, instead of creating an enum for it.
          convertConstantToEnum(constantType, literalTypeContext),
    Value: constantType.value,
    Decorators: constantType.decorators,
  };

  typeCache.set(constantType, inputConstantType);
  return inputConstantType;

  function convertConstantToEnum(
    constantType: SdkConstantType,
    literalTypeContext: LiteralTypeContext
  ) {
    if (typeCache.has(constantType)) {
      return typeCache.get(constantType) as InputEnumType;
    }

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
      ValueType: fromSdkBuiltInType(typeCache, constantType.valueType),
      Values: allowValues,
      CrossLanguageDefinitionId: "",
      Accessibility: undefined,
      Deprecated: undefined,
      Description: `The ${enumName}`, // TODO -- what should we put here?
      IsExtensible: true,
      Usage: literalTypeContext.Usage,
      Decorators: constantType.decorators,
    };

    typeCache.enums.set(enumName, enumType);
    typeCache.set(constantType, enumType);
    return enumType;
  }
}

function fromSdkEnumValueTypeToConstantType(
  enumValueType: SdkEnumValueType,
  context: SdkContext,
  typeCache: TypeCache,
  literalTypeContext?: LiteralTypeContext
): InputLiteralType {
  if (typeCache.has(enumValueType)) {
    return typeCache.get(enumValueType) as InputLiteralType;
  }

  const inputConstantType: InputLiteralType = {
    Kind: "constant",
    ValueType:
      enumValueType.valueType.kind === "boolean" || literalTypeContext === undefined
        ? fromSdkBuiltInType(typeCache, enumValueType.valueType)
        : fromSdkEnumType(enumValueType.enumType, context, typeCache),
    Value: enumValueType.value,
    Decorators: enumValueType.decorators,
  };

  typeCache.set(enumValueType, inputConstantType);
  return inputConstantType;
}

function fromSdkEnumValueType(enumValueType: SdkEnumValueType): InputEnumTypeValue {
  return {
    Name: enumValueType.name,
    Value: enumValueType.value,
    Description: enumValueType.description,
    Decorators: enumValueType.decorators,
  };
}

function fromSdkDictionaryType(
  dictionaryType: SdkDictionaryType,
  context: SdkContext,
  typeCache: TypeCache
): InputDictionaryType {
  if (typeCache.has(dictionaryType)) {
    return typeCache.get(dictionaryType) as InputDictionaryType;
  }

  const inputDictionaryType: InputDictionaryType = {
    Kind: "dict",
    KeyType: fromSdkType(dictionaryType.keyType, context, typeCache),
    ValueType: fromSdkType(dictionaryType.valueType, context, typeCache),
    Decorators: dictionaryType.decorators,
  };

  typeCache.set(dictionaryType, inputDictionaryType);
  return inputDictionaryType;
}

function fromSdkArrayType(
  arrayType: SdkArrayType,
  context: SdkContext,
  typeCache: TypeCache
): InputArrayType {
  if (typeCache.has(arrayType)) {
    return typeCache.get(arrayType) as InputArrayType; 
  }
  const inputArrayType: InputArrayType = {
    Kind: "array",
    Name: arrayType.name,
    ValueType: fromSdkType(arrayType.valueType, context, typeCache),
    CrossLanguageDefinitionId: arrayType.crossLanguageDefinitionId,
    Decorators: arrayType.decorators,
  };

  typeCache.set(arrayType, inputArrayType);
  return inputArrayType;
}

function fromSdkEndpointType(): InputPrimitiveType {
  return {
    Kind: "string",
    Name: "string",
    CrossLanguageDefinitionId: "TypeSpec.string",
  };
}
