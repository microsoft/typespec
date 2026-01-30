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
  SdkModelPropertyTypeBase,
  SdkModelType,
  SdkType,
  SdkUnionType,
  UsageFlags,
  getAccessOverride,
  isHttpMetadata,
} from "@azure-tools/typespec-client-generator-core";
import { createDiagnosticCollector, Diagnostic, Model, NoTarget } from "@typespec/compiler";
import { createDiagnostic } from "./lib.js";
import { CSharpEmitterContext } from "../sdk-context.js";
import {
  InputArrayType,
  InputDateTimeType,
  InputDictionaryType,
  InputDurationType,
  InputEnumType,
  InputEnumValueType,
  InputExternalTypeMetadata,
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
  sdkProperty?: SdkModelPropertyTypeBase,
  namespace?: string,
): [InputReturnType<T>, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  let retVar = sdkContext.__typeCache.types.get(sdkType);
  if (retVar) {
    return diagnostics.wrap(retVar as any);
  }

  switch (sdkType.kind) {
    case "nullable":
      const nullableType: InputNullableType = {
        kind: "nullable",
        type: diagnostics.pipe(fromSdkType(sdkContext, sdkType.type, sdkProperty, namespace)),
        namespace: sdkType.namespace,
        external: fromSdkExternalTypeInfo(sdkType),
      };
      retVar = nullableType;
      break;
    case "model":
      retVar = diagnostics.pipe(fromSdkModelType(sdkContext, sdkType));
      break;
    case "enum":
      retVar = diagnostics.pipe(fromSdkEnumType(sdkContext, sdkType));
      break;
    case "enumvalue":
      retVar = diagnostics.pipe(fromSdkEnumValueType(sdkContext, sdkType));
      break;
    case "dict":
      retVar = diagnostics.pipe(fromSdkDictionaryType(sdkContext, sdkType));
      break;
    case "array":
      retVar = diagnostics.pipe(fromSdkArrayType(sdkContext, sdkType));
      break;
    case "constant":
      // Don't transform optional Content-Type headers into enums - keep them as constants
      const isContentTypeHeader =
        sdkProperty &&
        "kind" in sdkProperty &&
        sdkProperty.kind === "header" &&
        "serializedName" in sdkProperty &&
        typeof sdkProperty.serializedName === "string" &&
        sdkProperty.serializedName.toLocaleLowerCase() === "content-type";

      if (
        sdkProperty &&
        !isContentTypeHeader &&
        (sdkProperty.optional || sdkProperty?.type.kind === "nullable") &&
        sdkProperty?.type.kind !== "boolean" &&
        sdkType.valueType.kind !== "boolean"
      ) {
        // turn the constant into an extensible enum
        retVar = diagnostics.pipe(createEnumType(sdkContext, sdkType, namespace!));
      } else {
        retVar = diagnostics.pipe(fromSdkConstantType(sdkContext, sdkType));
      }
      break;
    case "union":
      retVar = diagnostics.pipe(fromUnionType(sdkContext, sdkType));
      break;
    case "utcDateTime":
    case "offsetDateTime":
      retVar = diagnostics.pipe(fromSdkDateTimeType(sdkContext, sdkType));
      break;
    case "duration":
      retVar = diagnostics.pipe(fromSdkDurationType(sdkContext, sdkType));
      break;
    case "tuple":
      diagnostics.add(
        createDiagnostic({
          code: "unsupported-sdk-type",
          format: { sdkType: "tuple" },
          target: sdkType.__raw ?? NoTarget,
        }),
      );
      const tupleType: InputPrimitiveType = {
        kind: "unknown",
        name: "tuple",
        crossLanguageDefinitionId: "",
        decorators: sdkType.decorators,
        external: fromSdkExternalTypeInfo(sdkType),
      };
      retVar = tupleType;
      break;
    // TODO -- endpoint and credential are handled separately in emitter, since we have specific locations for them in input model.
    // We can handle unify the way we handle them in the future, probably by chaning the input model schema and do the conversion in generator.
    case "endpoint":
      retVar = fromSdkEndpointType();
      break;
    case "credential":
      diagnostics.add(
        createDiagnostic({
          code: "unsupported-sdk-type",
          format: { sdkType: "credential" },
          target: sdkType.__raw ?? NoTarget,
        }),
      );
      const credentialType: InputPrimitiveType = {
        kind: "unknown",
        name: "credential",
        crossLanguageDefinitionId: "",
        decorators: sdkType.decorators,
        external: fromSdkExternalTypeInfo(sdkType),
      };
      retVar = credentialType;
      break;
    default:
      retVar = diagnostics.pipe(fromSdkBuiltInType(sdkContext, sdkType));
      break;
  }

  sdkContext.__typeCache.updateSdkTypeReferences(sdkType, retVar);
  // we have to cast to any because TypeScript's type narrowing does not automatically infer the return type for conditional types
  return diagnostics.wrap(retVar as any);
}

function fromSdkModelType(
  sdkContext: CSharpEmitterContext,
  modelType: SdkModelType,
): [InputModelType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
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
    external: fromSdkExternalTypeInfo(modelType),
    serializationOptions: modelType.serializationOptions,
  } as InputModelType;

  sdkContext.__typeCache.updateSdkTypeReferences(modelType, inputModelType);

  inputModelType.additionalProperties = modelType.additionalProperties
    ? diagnostics.pipe(fromSdkType(sdkContext, modelType.additionalProperties))
    : undefined;

  const properties: InputModelProperty[] = [];
  for (const property of modelType.properties) {
    const ourProperty = diagnostics.pipe(fromSdkModelProperty(sdkContext, property, modelType));

    if (ourProperty) {
      properties.push(ourProperty);
    }
  }

  inputModelType.discriminatorProperty = modelType.discriminatorProperty
    ? diagnostics.pipe(fromSdkModelProperty(sdkContext, modelType.discriminatorProperty, modelType))
    : undefined;

  inputModelType.baseModel = modelType.baseModel
    ? diagnostics.pipe(fromSdkType(sdkContext, modelType.baseModel))
    : undefined;

  inputModelType.properties = properties;

  if (modelType.discriminatedSubtypes) {
    const discriminatedSubtypes: Record<string, InputModelType> = {};
    for (const key in modelType.discriminatedSubtypes) {
      const subtype = modelType.discriminatedSubtypes[key];
      discriminatedSubtypes[key] = diagnostics.pipe(fromSdkType(sdkContext, subtype));
    }
    inputModelType.discriminatedSubtypes = discriminatedSubtypes;
  }

  return diagnostics.wrap(inputModelType);
}

function fromSdkModelProperty(
  sdkContext: CSharpEmitterContext,
  sdkProperty: SdkModelPropertyType,
  sdkModel: SdkModelType,
): [InputModelProperty | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  // TODO -- this returns undefined because some properties we do not support yet.
  let property = sdkContext.__typeCache.properties.get(sdkProperty) as
    | InputModelProperty
    | undefined;
  if (property) {
    return diagnostics.wrap(property);
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
    type: diagnostics.pipe(fromSdkType(sdkContext, sdkProperty.type, sdkProperty, sdkModel.namespace)),
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

  return diagnostics.wrap(property);
}

function fromSdkEnumType(sdkContext: CSharpEmitterContext, enumType: SdkEnumType): [InputEnumType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  return diagnostics.wrap(diagnostics.pipe(createEnumType(sdkContext, enumType, enumType.namespace)));
}

function createEnumType(
  sdkContext: CSharpEmitterContext,
  sdkType: SdkConstantType | SdkEnumType,
  namespace: string,
): [InputEnumType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const values: InputEnumValueType[] = [];

  const inputEnumType: InputEnumType = {
    kind: "enum",
    name: sdkType.name,
    crossLanguageDefinitionId: sdkType.kind === "enum" ? sdkType.crossLanguageDefinitionId : "",
    valueType:
      sdkType.kind === "enum"
        ? (diagnostics.pipe(fromSdkType(sdkContext, sdkType.valueType)) as InputPrimitiveType)
        : diagnostics.pipe(fromSdkBuiltInType(sdkContext, sdkType.valueType)),
    values: values,
    // constantType.access, TODO - constant type now does not have access. TCGC will add it later
    access:
      sdkType.kind === "enum" ? getAccessOverride(sdkContext, sdkType.__raw as any) : undefined,
    namespace: namespace,
    deprecation: sdkType.deprecation,
    summary: sdkType.summary,
    doc: sdkType.doc,
    isFixed: sdkType.kind === "enum" ? sdkType.isFixed : false,
    isFlags: sdkType.kind === "enum" ? sdkType.isFlags : false,
    // constantType.usage, TODO - constant type now does not have usage. TCGC will add it later
    usage: sdkType.kind === "enum" ? sdkType.usage : UsageFlags.None,
    decorators: sdkType.decorators,
    external: fromSdkExternalTypeInfo(sdkType),
  };

  sdkContext.__typeCache.updateSdkTypeReferences(sdkType, inputEnumType);

  if (sdkType.kind === "enum") {
    for (const v of sdkType.values) {
      values.push(diagnostics.pipe(createEnumValueType(sdkContext, v, inputEnumType)));
    }
  } else {
    values.push(diagnostics.pipe(createEnumValueType(sdkContext, sdkType, inputEnumType)));
  }

  return diagnostics.wrap(inputEnumType);
}

function fromSdkDateTimeType(
  sdkContext: CSharpEmitterContext,
  dateTimeType: SdkDateTimeType,
): [InputDateTimeType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  return diagnostics.wrap({
    kind: dateTimeType.kind,
    name: dateTimeType.name,
    encode: dateTimeType.encode,
    wireType: diagnostics.pipe(fromSdkType(sdkContext, dateTimeType.wireType)),
    crossLanguageDefinitionId: dateTimeType.crossLanguageDefinitionId,
    baseType: dateTimeType.baseType ? diagnostics.pipe(fromSdkType(sdkContext, dateTimeType.baseType)) : undefined,
    decorators: dateTimeType.decorators,
    external: fromSdkExternalTypeInfo(dateTimeType),
  });
}

function fromSdkDurationType(
  sdkContext: CSharpEmitterContext,
  durationType: SdkDurationType,
): [InputDurationType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  return diagnostics.wrap({
    kind: durationType.kind,
    name: durationType.name,
    encode: durationType.encode,
    wireType: diagnostics.pipe(fromSdkType(sdkContext, durationType.wireType)),
    crossLanguageDefinitionId: durationType.crossLanguageDefinitionId,
    baseType: durationType.baseType ? diagnostics.pipe(fromSdkType(sdkContext, durationType.baseType)) : undefined,
    decorators: durationType.decorators,
    external: fromSdkExternalTypeInfo(durationType),
  });
}

function fromSdkBuiltInType(
  sdkContext: CSharpEmitterContext,
  builtInType: SdkBuiltInType,
): [InputPrimitiveType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  return diagnostics.wrap({
    kind: builtInType.kind,
    name: builtInType.name,
    encode: builtInType.encode !== builtInType.kind ? builtInType.encode : undefined,
    crossLanguageDefinitionId: builtInType.crossLanguageDefinitionId,
    baseType: builtInType.baseType ? diagnostics.pipe(fromSdkType(sdkContext, builtInType.baseType)) : undefined,
    decorators: builtInType.decorators,
    external: fromSdkExternalTypeInfo(builtInType),
  });
}

function fromUnionType(sdkContext: CSharpEmitterContext, union: SdkUnionType): [InputUnionType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const variantTypes: InputType[] = [];
  for (const value of union.variantTypes) {
    const variantType = diagnostics.pipe(fromSdkType(sdkContext, value));
    variantTypes.push(variantType);
  }

  return diagnostics.wrap({
    kind: "union",
    name: union.name,
    variantTypes: variantTypes,
    namespace: union.namespace,
    decorators: union.decorators,
    external: fromSdkExternalTypeInfo(union),
  });
}

function fromSdkConstantType(
  sdkContext: CSharpEmitterContext,
  constantType: SdkConstantType,
): [InputLiteralType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const literalType = {
    kind: constantType.kind,
    name: constantType.name,
    namespace: "", // constantType.namespace, TODO - constant type now does not have namespace. TCGC will add it later
    access: undefined, // constantType.access, TODO - constant type now does not have access. TCGC will add it later
    usage: UsageFlags.None, // constantType.usage, TODO - constant type now does not have usage. TCGC will add it later
    valueType: diagnostics.pipe(fromSdkType(sdkContext, constantType.valueType)),
    value: constantType.value,
    decorators: constantType.decorators,
  };

  sdkContext.__typeCache.updateConstantCache(constantType, literalType);

  return diagnostics.wrap(literalType);
}

function fromSdkEnumValueType(
  sdkContext: CSharpEmitterContext,
  enumValueType: SdkEnumValueType,
): [InputEnumValueType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  return diagnostics.wrap(diagnostics.pipe(createEnumValueType(sdkContext, enumValueType, enumValueType.enumType)));
}

function createEnumValueType(
  sdkContext: CSharpEmitterContext,
  sdkType: SdkEnumValueType | SdkConstantType,
  enumType: InputEnumType,
): [InputEnumValueType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  return diagnostics.wrap({
    kind: "enumvalue",
    name:
      sdkType.kind === "constant"
        ? sdkType.value === null
          ? "Null"
          : sdkType.value.toString()
        : sdkType.name,
    value: typeof sdkType.value === "boolean" ? (sdkType.value ? 1 : 0) : sdkType.value,
    valueType:
      sdkType.kind === "constant" ? sdkType.valueType : diagnostics.pipe(fromSdkType(sdkContext, sdkType.valueType)),
    enumType: enumType,
    summary: sdkType.summary,
    doc: sdkType.doc,
    decorators: sdkType.decorators,
  });
}

function fromSdkDictionaryType(
  sdkContext: CSharpEmitterContext,
  dictionaryType: SdkDictionaryType,
): [InputDictionaryType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  return diagnostics.wrap({
    kind: "dict",
    keyType: diagnostics.pipe(fromSdkType(sdkContext, dictionaryType.keyType)),
    valueType: diagnostics.pipe(fromSdkType(sdkContext, dictionaryType.valueType)),
    decorators: dictionaryType.decorators,
    external: fromSdkExternalTypeInfo(dictionaryType),
  });
}

function fromSdkArrayType(
  sdkContext: CSharpEmitterContext,
  arrayType: SdkArrayType,
): [InputArrayType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  return diagnostics.wrap({
    kind: "array",
    name: arrayType.name,
    valueType: diagnostics.pipe(fromSdkType(sdkContext, arrayType.valueType)),
    crossLanguageDefinitionId: arrayType.crossLanguageDefinitionId,
    decorators: arrayType.decorators,
    external: fromSdkExternalTypeInfo(arrayType),
  });
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

/**
 * Converts TCGC external type information to InputExternalTypeMetadata
 * @param sdkType - The SDK type that may have external type information
 * @returns InputExternalTypeMetadata if the type has external info, undefined otherwise
 */
function fromSdkExternalTypeInfo(sdkType: SdkType): InputExternalTypeMetadata | undefined {
  const external = (sdkType as any).external;
  if (!external) {
    return undefined;
  }

  return {
    identity: external.identity,
    package: external.package,
    minVersion: external.minVersion,
  };
}
