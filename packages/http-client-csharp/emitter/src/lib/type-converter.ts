// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkArrayType,
  SdkBodyModelPropertyType,
  SdkBuiltInType,
  SdkConstantType,
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
import { Model, NoTarget } from "@typespec/compiler";
import { CSharpEmitterContext } from "../sdk-context.js";
import {
  InputArrayType,
  InputDateTimeType,
  InputDictionaryType,
  InputDurationType,
  InputEnumType,
  InputEnumTypeValue,
  InputLiteralType,
  InputModelProperty,
  InputModelType,
  InputPrimitiveType,
  InputType,
  InputUnionType,
} from "../type/input-type.js";
import { LiteralTypeContext } from "../type/literal-type-context.js";

export function fromSdkType(
  sdkContext: CSharpEmitterContext,
  sdkType: SdkType,
  literalTypeContext?: LiteralTypeContext,
): InputType {
  if (sdkContext.__typeCache.types.has(sdkType)) {
    return sdkContext.__typeCache.types.get(sdkType)!;
  }

  let retVar: InputType;
  switch (sdkType.kind) {
    case "nullable":
      const inputType = fromSdkType(sdkContext, sdkType.type);
      retVar = {
        kind: "nullable",
        type: inputType,
        namespace: sdkType.namespace,
      };
      break;
    case "model":
      retVar = fromSdkModelType(sdkContext, sdkType);
      break;
    case "enum":
      retVar = fromSdkEnumType(sdkContext, sdkType);
      break;
    case "enumvalue":
      retVar = fromSdkEnumValueTypeToConstantType(sdkContext, sdkType, literalTypeContext);
      break;
    case "dict":
      retVar = fromSdkDictionaryType(sdkContext, sdkType);
      break;
    case "array":
      retVar = fromSdkArrayType(sdkContext, sdkType);
      break;
    case "constant":
      retVar = fromSdkConstantType(sdkContext, sdkType, literalTypeContext);
      break;
    case "union":
      retVar = fromUnionType(sdkContext, sdkType);
      break;
    case "utcDateTime":
    case "offsetDateTime":
      retVar = fromSdkDateTimeType(sdkContext, sdkType);
      break;
    case "duration":
      retVar = fromSdkDurationType(sdkContext, sdkType);
      break;
    case "tuple":
      retVar = fromTupleType(sdkContext, sdkType);
      break;
    // TODO -- endpoint and credential are handled separately in emitter, since we have specific locations for them in input model.
    // We can handle unify the way we handle them in the future, probably by chaning the input model schema and do the conversion in generator.
    case "endpoint":
      retVar = fromSdkEndpointType();
      break;
    case "credential":
      sdkContext.logger.reportDiagnostic({
        code: "unsupported-sdk-type",
        format: { sdkType: "Credential" },
        target: NoTarget,
      });
      return { kind: "unknown", name: "credential", crossLanguageDefinitionId: "" };
    default:
      retVar = fromSdkBuiltInType(sdkContext, sdkType);
      break;
  }

  updateSdkTypeReferences(sdkContext, sdkType, retVar);
  return retVar;
}

function updateTypeCache(sdkContext: CSharpEmitterContext, typeName: string, type: InputType) {
  if (type.kind === "model") {
    sdkContext.__typeCache.models.set(typeName, type);
  } else if (type.kind === "enum") {
    sdkContext.__typeCache.enums.set(typeName, type);
  }
}

function updateSdkTypeReferences(
  sdkContext: CSharpEmitterContext,
  sdkType: SdkType,
  inputType: InputType,
) {
  sdkContext.__typeCache.types.set(sdkType, inputType);
  if ("crossLanguageDefinitionId" in sdkType) {
    sdkContext.__typeCache.crossLanguageDefinitionIds.set(
      sdkType.crossLanguageDefinitionId,
      sdkType.__raw,
    );
  }
}

export function fromSdkModelType(
  sdkContext: CSharpEmitterContext,
  modelType: SdkModelType,
): InputModelType {
  const modelTypeName = modelType.name;
  let inputModelType = sdkContext.__typeCache.models.get(modelTypeName);
  if (!inputModelType) {
    inputModelType = {
      kind: "model",
      name: modelTypeName,
      namespace: modelType.namespace,
      crossLanguageDefinitionId: modelType.crossLanguageDefinitionId,
      access: getAccessOverride(sdkContext, modelType.__raw as Model),
      usage: modelType.usage,
      deprecation: modelType.deprecation,
      doc: modelType.doc,
      summary: modelType.summary,
      discriminatorValue: modelType.discriminatorValue,
      decorators: modelType.decorators,
    } as InputModelType;

    updateTypeCache(sdkContext, modelTypeName, inputModelType);

    inputModelType.additionalProperties = modelType.additionalProperties
      ? fromSdkType(sdkContext, modelType.additionalProperties)
      : undefined;

    const propertiesDict = new Map<SdkModelPropertyType, InputModelProperty>();
    for (const property of modelType.properties) {
      if (property.kind !== "property") {
        continue;
      }
      const ourProperty = fromSdkModelProperty(sdkContext, property, {
        modelName: modelTypeName,
        usage: modelType.usage,
        namespace: modelType.namespace,
      } as LiteralTypeContext);
      propertiesDict.set(property, ourProperty);
    }

    inputModelType.discriminatorProperty = modelType.discriminatorProperty
      ? propertiesDict.get(modelType.discriminatorProperty)
      : undefined;

    inputModelType.baseModel = modelType.baseModel
      ? fromSdkModelType(sdkContext, modelType.baseModel)
      : undefined;

    inputModelType.properties = Array.from(propertiesDict.values()).flat();

    if (modelType.discriminatedSubtypes) {
      const discriminatedSubtypes: Record<string, InputModelType> = {};
      for (const key in modelType.discriminatedSubtypes) {
        const subtype = modelType.discriminatedSubtypes[key];
        discriminatedSubtypes[key] = fromSdkModelType(sdkContext, subtype);
      }
      inputModelType.discriminatedSubtypes = discriminatedSubtypes;
    }
  }

  return inputModelType;

  function fromSdkModelProperty(
    sdkContext: CSharpEmitterContext,
    property: SdkBodyModelPropertyType,
    literalTypeContext: LiteralTypeContext,
  ): InputModelProperty {
    let targetType = property.type;
    if (targetType.kind === "model") {
      const body = targetType.properties.find((x) => x.kind === "body");
      if (body) targetType = body.type;
    }

    const serializedName = property.serializedName;
    literalTypeContext.propertyName = serializedName;

    const modelProperty: InputModelProperty = {
      kind: property.kind,
      name: property.name,
      serializedName: serializedName,
      summary: property.summary,
      doc: property.doc,
      type: fromSdkType(
        sdkContext,
        targetType,
        property.discriminator ? undefined : literalTypeContext,
      ),
      optional: property.optional,
      readOnly: isReadOnly(property),
      discriminator: property.discriminator,
      flatten: property.flatten,
      decorators: property.decorators,
      crossLanguageDefinitionId: property.crossLanguageDefinitionId,
      serializationOptions: property.serializationOptions,
    };

    return modelProperty;
  }
}

export function fromSdkEnumType(
  sdkContext: CSharpEmitterContext,
  enumType: SdkEnumType,
  addToCollection: boolean = true,
): InputEnumType {
  const enumName = enumType.name;
  let inputEnumType = sdkContext.__typeCache.enums.get(enumName);
  if (!inputEnumType) {
    const values: InputEnumTypeValue[] = [];
    inputEnumType = {
      kind: "enum",
      name: enumName,
      crossLanguageDefinitionId: enumType.crossLanguageDefinitionId,
      valueType: fromSdkBuiltInType(sdkContext, enumType.valueType),
      values: values,
      access: getAccessOverride(sdkContext, enumType.__raw as any),
      namespace: enumType.namespace,
      deprecation: enumType.deprecation,
      summary: enumType.summary,
      doc: enumType.doc,
      isFixed: enumType.isFixed,
      isFlags: enumType.isFlags,
      usage: enumType.usage,
      decorators: enumType.decorators,
    };
    if (addToCollection) {
      updateTypeCache(sdkContext, enumName, inputEnumType);
    }
    for (const v of enumType.values) {
      values.push(fromSdkEnumValueType(sdkContext, v));
    }
  }

  return inputEnumType;
}

function fromSdkDateTimeType(
  sdkContext: CSharpEmitterContext,
  dateTimeType: SdkDateTimeType,
): InputDateTimeType {
  return {
    kind: dateTimeType.kind,
    name: dateTimeType.name,
    encode: dateTimeType.encode,
    wireType: fromSdkBuiltInType(sdkContext, dateTimeType.wireType),
    crossLanguageDefinitionId: dateTimeType.crossLanguageDefinitionId,
    baseType: dateTimeType.baseType
      ? fromSdkDateTimeType(sdkContext, dateTimeType.baseType)
      : undefined,
    decorators: dateTimeType.decorators,
  };
}

function fromSdkDurationType(
  sdkContext: CSharpEmitterContext,
  durationType: SdkDurationType,
): InputDurationType {
  return {
    kind: durationType.kind,
    name: durationType.name,
    encode: durationType.encode,
    wireType: fromSdkBuiltInType(sdkContext, durationType.wireType),
    crossLanguageDefinitionId: durationType.crossLanguageDefinitionId,
    baseType: durationType.baseType
      ? fromSdkDurationType(sdkContext, durationType.baseType)
      : undefined,
    decorators: durationType.decorators,
  };
}

function fromTupleType(sdkContext: CSharpEmitterContext, tupleType: SdkTupleType): InputType {
  return {
    kind: "unknown",
    name: "tuple",
    crossLanguageDefinitionId: "",
    decorators: tupleType.decorators,
  };
}

function fromSdkBuiltInType(
  sdkContext: CSharpEmitterContext,
  builtInType: SdkBuiltInType,
): InputPrimitiveType {
  return {
    kind: builtInType.kind,
    name: builtInType.name,
    encode: builtInType.encode !== builtInType.kind ? builtInType.encode : undefined,
    crossLanguageDefinitionId: builtInType.crossLanguageDefinitionId,
    baseType: builtInType.baseType
      ? fromSdkBuiltInType(sdkContext, builtInType.baseType)
      : undefined,
    decorators: builtInType.decorators,
  };
}

function fromUnionType(sdkContext: CSharpEmitterContext, union: SdkUnionType): InputUnionType {
  const variantTypes: InputType[] = [];
  for (const value of union.variantTypes) {
    const variantType = fromSdkType(sdkContext, value);
    variantTypes.push(variantType);
  }

  return {
    kind: "union",
    name: union.name,
    variantTypes: variantTypes,
    namespace: union.namespace,
    decorators: union.decorators,
  };
}

function fromSdkConstantType(
  sdkContext: CSharpEmitterContext,
  constantType: SdkConstantType,
  literalTypeContext?: LiteralTypeContext,
): InputLiteralType {
  return {
    kind: constantType.kind,
    valueType:
      constantType.valueType.kind === "boolean" || literalTypeContext === undefined
        ? fromSdkBuiltInType(sdkContext, constantType.valueType)
        : convertConstantToEnum(sdkContext, constantType, literalTypeContext),
    value: constantType.value,
    decorators: constantType.decorators,
  };

  function convertConstantToEnum(
    sdkContext: CSharpEmitterContext,
    constantType: SdkConstantType,
    literalTypeContext: LiteralTypeContext,
  ) {
    const enumName = `${literalTypeContext.modelName}_${literalTypeContext.propertyName}`;
    const enumValueName = constantType.value === null ? "Null" : constantType.value.toString();
    const values: InputEnumTypeValue[] = [];
    const enumType: InputEnumType = {
      kind: "enum",
      name: enumName,
      valueType: fromSdkBuiltInType(sdkContext, constantType.valueType),
      values: values,
      crossLanguageDefinitionId: "",
      access: undefined,
      namespace: literalTypeContext.namespace,
      doc: `The ${enumName}`,
      isFixed: false,
      isFlags: false,
      usage: literalTypeContext.usage,
      decorators: constantType.decorators,
    };

    updateTypeCache(sdkContext, enumName, enumType);

    values.push({
      kind: "enumvalue",
      name: enumValueName,
      value: constantType.value as string | number,
      doc: enumValueName,
      valueType: enumType.valueType,
      enumType: enumType,
    });
    return enumType;
  }
}

function fromSdkEnumValueTypeToConstantType(
  sdkContext: CSharpEmitterContext,
  enumValueType: SdkEnumValueType,
  literalTypeContext?: LiteralTypeContext,
): InputLiteralType {
  return {
    kind: "constant",
    valueType:
      enumValueType.valueType.kind === "boolean" || literalTypeContext === undefined
        ? fromSdkBuiltInType(sdkContext, enumValueType.valueType)
        : fromSdkEnumType(sdkContext, enumValueType.enumType),
    value: enumValueType.value,
    decorators: enumValueType.decorators,
  };
}

function fromSdkEnumValueType(
  sdkContext: CSharpEmitterContext,
  enumValueType: SdkEnumValueType,
): InputEnumTypeValue {
  return {
    kind: "enumvalue",
    name: enumValueType.name,
    value: enumValueType.value,
    valueType: fromSdkBuiltInType(sdkContext, enumValueType.valueType),
    enumType: fromSdkEnumType(sdkContext, enumValueType.enumType),
    summary: enumValueType.summary,
    doc: enumValueType.doc,
    decorators: enumValueType.decorators,
  };
}

function fromSdkDictionaryType(
  sdkContext: CSharpEmitterContext,
  dictionaryType: SdkDictionaryType,
): InputDictionaryType {
  return {
    kind: "dict",
    keyType: fromSdkType(sdkContext, dictionaryType.keyType),
    valueType: fromSdkType(sdkContext, dictionaryType.valueType),
    decorators: dictionaryType.decorators,
  };
}

function fromSdkArrayType(
  sdkContext: CSharpEmitterContext,
  arrayType: SdkArrayType,
): InputArrayType {
  return {
    kind: "array",
    name: arrayType.name,
    valueType: fromSdkType(sdkContext, arrayType.valueType),
    crossLanguageDefinitionId: arrayType.crossLanguageDefinitionId,
    decorators: arrayType.decorators,
  };
}

function fromSdkEndpointType(): InputPrimitiveType {
  return {
    kind: "string",
    name: "string",
    crossLanguageDefinitionId: "TypeSpec.string",
  };
}
