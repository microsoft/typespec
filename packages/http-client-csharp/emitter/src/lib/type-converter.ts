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
  SdkHttpParameter,
  SdkModelPropertyType,
  SdkModelType,
  SdkTupleType,
  SdkType,
  SdkUnionType,
  getAccessOverride,
  isReadOnly as tcgcIsReadOnly,
} from "@azure-tools/typespec-client-generator-core";
import { Model, NoTarget } from "@typespec/compiler";
import { Visibility } from "@typespec/http";
import { CSharpEmitterContext } from "../sdk-context.js";
import {
  InputArrayType,
  InputDateTimeType,
  InputDictionaryType,
  InputDurationType,
  InputEnumType,
  InputEnumValueType,
  InputLiteralType,
  InputModelProperty,
  InputModelType,
  InputPrimitiveType,
  InputType,
  InputUnionType,
} from "../type/input-type.js";

export function fromSdkType(sdkContext: CSharpEmitterContext, sdkType: SdkType): InputType {
  let retVar = sdkContext.__typeCache.types.get(sdkType);
  if (retVar) {
    return retVar;
  }

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
      retVar = fromSdkEnumValueType(sdkContext, sdkType);
      break;
    case "dict":
      retVar = fromSdkDictionaryType(sdkContext, sdkType);
      break;
    case "array":
      retVar = fromSdkArrayType(sdkContext, sdkType);
      break;
    case "constant":
      retVar = fromSdkConstantType(sdkContext, sdkType);
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

  sdkContext.__typeCache.updateSdkTypeReferences(sdkType, retVar);
  return retVar;
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

    sdkContext.__typeCache.updateTypeCache(modelType, inputModelType);

    inputModelType.additionalProperties = modelType.additionalProperties
      ? fromSdkType(sdkContext, modelType.additionalProperties)
      : undefined;

    const propertiesDict = new Map<SdkModelPropertyType, InputModelProperty>();
    for (const property of modelType.properties) {
      const ourProperty = fromSdkModelProperty(sdkContext, property);

      if (!ourProperty) {
        continue;
      }
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
    property: SdkModelPropertyType,
  ): InputModelProperty | undefined {
    switch (property.kind) {
      case "property":
        return fromSdkBodyModelProperty(sdkContext, property);
      case "header":
      case "query":
      case "path":
        return fromSdkHttpParameterModelProperty(sdkContext, property);
      default:
        return undefined;
    }
  }

  function fromSdkHttpParameterModelProperty(
    sdkContext: CSharpEmitterContext,
    property: SdkHttpParameter,
  ): InputModelProperty {
    const targetType = property.type;

    const modelHeaderProperty: InputModelProperty = {
      kind: property.kind,
      name: property.name,
      serializedName: property.serializedName,
      summary: property.summary,
      doc: property.doc,
      type: fromSdkType(sdkContext, targetType),
      optional: property.optional,
      readOnly: isReadOnly(property),
      decorators: property.decorators,
      crossLanguageDefinitionId: property.crossLanguageDefinitionId,
      discriminator: false,
      flatten: false,
    };

    return modelHeaderProperty;
  }

  function fromSdkBodyModelProperty(
    sdkContext: CSharpEmitterContext,
    property: SdkBodyModelPropertyType,
  ): InputModelProperty {
    let targetType = property.type;
    if (targetType.kind === "model") {
      const body = targetType.properties.find((x) => x.kind === "body");
      if (body) targetType = body.type;
    }

    const modelProperty: InputModelProperty = {
      kind: property.kind,
      name: property.name,
      serializedName: property.serializedName,
      summary: property.summary,
      doc: property.doc,
      type: fromSdkType(sdkContext, targetType),
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
): InputEnumType {
  const enumName = enumType.name;
  let inputEnumType = sdkContext.__typeCache.enums.get(enumName);
  if (!inputEnumType) {
    const values: InputEnumValueType[] = [];
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
    sdkContext.__typeCache.updateTypeCache(enumType, inputEnumType);
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
): InputLiteralType {
  const name = constantType.name;
  let literalType = sdkContext.__typeCache.constants.get(constantType);
  if (literalType) {
    return literalType;
  }

  literalType = {
    kind: constantType.kind,
    name: constantType.name,
    valueType: fromSdkBuiltInType(sdkContext, constantType.valueType),
    value: constantType.value,
    decorators: constantType.decorators,
  };

  sdkContext.__typeCache.updateTypeCache(constantType, literalType);

  return literalType;
}

function fromSdkEnumValueType(
  sdkContext: CSharpEmitterContext,
  enumValueType: SdkEnumValueType,
): InputEnumValueType {
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

function isReadOnly(prop: SdkModelPropertyType): boolean {
  if (prop.kind === "property") {
    return tcgcIsReadOnly(prop);
  }

  if (prop.visibility?.includes(Visibility.Read) && prop.visibility.length === 1) {
    return true;
  } else {
    return false;
  }
}
