// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  DecoratorInfo,
  SdkArrayType,
  SdkBuiltInType,
  SdkConstantType,
  SdkDateTimeType,
  SdkDictionaryType,
  SdkDurationType,
  SdkEnumType,
  SdkEnumValueType,
  SdkModelPropertyType,
  SdkModelType,
  SdkType,
  SdkUnionType,
  UsageFlags,
  getAccessOverride,
  isHttpMetadata,
} from "@azure-tools/typespec-client-generator-core";
import { Model, NoTarget } from "@typespec/compiler";
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
  InputNamespace,
  InputNullableType,
  InputPrimitiveType,
  InputType,
  InputUnionType,
} from "../type/input-type.js";
import { isReadOnly } from "./utils.js";

// we have this complicated type here to let the caller of fromSdkType could infer the real return type of this function.
type InputReturnType<T extends SdkType> = T extends { kind: "nullable" }
  ? InputNullableType
  : T extends { kind: "model" }
    ? InputModelType
    : T extends { kind: "enum" }
      ? InputEnumType
      : T extends { kind: "enumvalue" }
        ? InputEnumValueType
        : T extends { kind: "dict" }
          ? InputDictionaryType
          : T extends { kind: "array" }
            ? InputArrayType
            : T extends { kind: "constant" }
              ? InputLiteralType
              : T extends { kind: "union" }
                ? InputUnionType
                : T extends { kind: "utcDateTime" | "offsetDateTime" }
                  ? InputDateTimeType
                  : T extends { kind: "duration" }
                    ? InputDurationType
                    : T extends { kind: "tuple" }
                      ? InputPrimitiveType & { kind: "unknown" }
                      : T extends { kind: "credential" }
                        ? InputPrimitiveType & { kind: "unknown" }
                        : T extends { kind: "endpoint" }
                          ? InputPrimitiveType & { kind: "string" }
                          : InputPrimitiveType;

export function fromSdkType<T extends SdkType>(
  sdkContext: CSharpEmitterContext,
  sdkType: T,
): InputReturnType<T> {
  let retVar = sdkContext.__typeCache.types.get(sdkType);
  if (retVar) {
    return retVar as any;
  }

  switch (sdkType.kind) {
    case "nullable":
      const nullableType: InputNullableType = {
        kind: "nullable",
        type: fromSdkType(sdkContext, sdkType.type),
        namespace: sdkType.namespace,
      };
      retVar = nullableType;
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
      sdkContext.logger.reportDiagnostic({
        code: "unsupported-sdk-type",
        format: { sdkType: "tuple" },
        target: sdkType.__raw ?? NoTarget,
      });
      const tupleType: InputPrimitiveType = {
        kind: "unknown",
        name: "tuple",
        crossLanguageDefinitionId: "",
        decorators: sdkType.decorators,
      };
      retVar = tupleType;
      break;
    // TODO -- endpoint and credential are handled separately in emitter, since we have specific locations for them in input model.
    // We can handle unify the way we handle them in the future, probably by chaning the input model schema and do the conversion in generator.
    case "endpoint":
      retVar = fromSdkEndpointType();
      break;
    case "credential":
      sdkContext.logger.reportDiagnostic({
        code: "unsupported-sdk-type",
        format: { sdkType: "credential" },
        target: sdkType.__raw ?? NoTarget,
      });
      const credentialType: InputPrimitiveType = {
        kind: "unknown",
        name: "credential",
        crossLanguageDefinitionId: "",
        decorators: sdkType.decorators,
      };
      retVar = credentialType;
      break;
    default:
      retVar = fromSdkBuiltInType(sdkContext, sdkType);
      break;
  }

  sdkContext.__typeCache.updateSdkTypeReferences(sdkType, retVar);
  // we have to cast to any because TypeScript's type narrowing does not automatically infer the return type for conditional types
  return retVar as any;
}

function fromSdkModelType(
  sdkContext: CSharpEmitterContext,
  modelType: SdkModelType,
): InputModelType {
  // get all unique decorators for the model type from the namespace level and the model level
  let decorators: DecoratorInfo[] = modelType.decorators;
  const namespace = sdkContext.__typeCache.namespaces.get(modelType.namespace);
  if (namespace) {
    decorators = getAllModelDecorators(namespace, modelType.decorators);
  }
  const inputModelType: InputModelType = {
    kind: "model",
    name: modelType.name,
    namespace: modelType.namespace,
    crossLanguageDefinitionId: modelType.crossLanguageDefinitionId,
    access: getAccessOverride(sdkContext, modelType.__raw as Model),
    usage: modelType.usage,
    deprecation: modelType.deprecation,
    doc: modelType.doc,
    summary: modelType.summary,
    discriminatorValue: modelType.discriminatorValue,
    decorators: decorators,
  } as InputModelType;

  sdkContext.__typeCache.updateSdkTypeReferences(modelType, inputModelType);

  inputModelType.additionalProperties = modelType.additionalProperties
    ? fromSdkType(sdkContext, modelType.additionalProperties)
    : undefined;

  const properties: InputModelProperty[] = [];
  for (const property of modelType.properties) {
    const ourProperty = fromSdkModelProperty(sdkContext, property);

    if (ourProperty) {
      properties.push(ourProperty);
    }
  }

  inputModelType.discriminatorProperty = modelType.discriminatorProperty
    ? fromSdkModelProperty(sdkContext, modelType.discriminatorProperty)
    : undefined;

  inputModelType.baseModel = modelType.baseModel
    ? fromSdkType(sdkContext, modelType.baseModel)
    : undefined;

  inputModelType.properties = properties;

  if (modelType.discriminatedSubtypes) {
    const discriminatedSubtypes: Record<string, InputModelType> = {};
    for (const key in modelType.discriminatedSubtypes) {
      const subtype = modelType.discriminatedSubtypes[key];
      discriminatedSubtypes[key] = fromSdkType(sdkContext, subtype);
    }
    inputModelType.discriminatedSubtypes = discriminatedSubtypes;
  }

  return inputModelType;
}

function fromSdkModelProperty(
  sdkContext: CSharpEmitterContext,
  sdkProperty: SdkModelPropertyType,
): InputModelProperty | undefined {
  // TODO -- this returns undefined because some properties we do not support yet.
  let property = sdkContext.__typeCache.properties.get(sdkProperty) as
    | InputModelProperty
    | undefined;
  if (property) {
    return property;
  }

  const serializedName =
    sdkProperty.serializationOptions?.json?.name ??
    sdkProperty.serializationOptions?.xml?.name ??
    sdkProperty.serializationOptions?.multipart?.name;
  property = {
    kind: sdkProperty.kind,
    name: sdkProperty.name,
    serializedName: serializedName,
    summary: sdkProperty.summary,
    doc: sdkProperty.doc,
    type: fromSdkType(sdkContext, sdkProperty.type),
    optional: sdkProperty.optional,
    readOnly: isReadOnly(sdkProperty),
    discriminator: sdkProperty.discriminator,
    flatten: sdkProperty.flatten,
    decorators: sdkProperty.decorators,
    crossLanguageDefinitionId: sdkProperty.crossLanguageDefinitionId,
    serializationOptions: sdkProperty.serializationOptions,
    // A property is defined to be metadata if it is marked `@header`, `@cookie`, `@query`, `@path`.
    isHttpMetadata: isHttpMetadata(sdkContext, sdkProperty),
  } as InputModelProperty;

  if (property) {
    sdkContext.__typeCache.updateSdkPropertyReferences(sdkProperty, property);
  }

  return property;
}

function fromSdkEnumType(sdkContext: CSharpEmitterContext, enumType: SdkEnumType): InputEnumType {
  const enumName = enumType.name;
  const values: InputEnumValueType[] = [];
  const inputEnumType: InputEnumType = {
    kind: "enum",
    name: enumName,
    crossLanguageDefinitionId: enumType.crossLanguageDefinitionId,
    valueType: fromSdkType(sdkContext, enumType.valueType) as InputPrimitiveType,
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
  sdkContext.__typeCache.updateSdkTypeReferences(enumType, inputEnumType);
  for (const v of enumType.values) {
    values.push(fromSdkType(sdkContext, v));
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
    wireType: fromSdkType(sdkContext, dateTimeType.wireType),
    crossLanguageDefinitionId: dateTimeType.crossLanguageDefinitionId,
    baseType: dateTimeType.baseType ? fromSdkType(sdkContext, dateTimeType.baseType) : undefined,
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
    wireType: fromSdkType(sdkContext, durationType.wireType),
    crossLanguageDefinitionId: durationType.crossLanguageDefinitionId,
    baseType: durationType.baseType ? fromSdkType(sdkContext, durationType.baseType) : undefined,
    decorators: durationType.decorators,
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
    baseType: builtInType.baseType ? fromSdkType(sdkContext, builtInType.baseType) : undefined,
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
  const literalType = {
    kind: constantType.kind,
    name: constantType.name,
    namespace: "", // constantType.namespace, TODO - constant type now does not have namespace. TCGC will add it later
    access: undefined, // constantType.access, TODO - constant type now does not have access. TCGC will add it later
    usage: UsageFlags.None, // constantType.usage, TODO - constant type now does not have usage. TCGC will add it later
    valueType: fromSdkType(sdkContext, constantType.valueType),
    value: constantType.value,
    decorators: constantType.decorators,
  };

  sdkContext.__typeCache.updateConstantCache(constantType, literalType);

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
    valueType: fromSdkType(sdkContext, enumValueType.valueType),
    enumType: fromSdkType(sdkContext, enumValueType.enumType),
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

/**
 * @beta
 */
export function getAllModelDecorators(
  namespace: InputNamespace,
  modelDecorators?: DecoratorInfo[],
): DecoratorInfo[] {
  const decoratorMap = new Map<string, DecoratorInfo>();

  // Add namespace decorators first
  if (namespace.decorators) {
    for (const decorator of namespace.decorators) {
      decoratorMap.set(decorator.name, decorator);
    }
  }

  // Add model decorators (will override namespace decorators with same name)
  if (modelDecorators) {
    for (const decorator of modelDecorators) {
      decoratorMap.set(decorator.name, decorator);
    }
  }

  return Array.from(decoratorMap.values());
}
