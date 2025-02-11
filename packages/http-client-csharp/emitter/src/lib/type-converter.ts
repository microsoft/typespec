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
import { Model } from "@typespec/compiler";
import { CSharpEmitterContext } from "../emitter-context.js";
import { LiteralTypeContext } from "../type/literal-type-context.js";
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
} from "../type/type-interfaces.js";

export function fromSdkType(
  sdkType: SdkType,
  context: CSharpEmitterContext,
  literalTypeContext?: LiteralTypeContext,
): InputType {
  if (context.__typeCache.types.has(sdkType)) {
    return context.__typeCache.types.get(sdkType)!;
  }

  let retVar: InputType;
  switch (sdkType.kind) {
    case "nullable":
      const inputType = fromSdkType(sdkType.type, context);
      retVar = {
        kind: "nullable",
        type: inputType,
        clientNamespace: sdkType.clientNamespace,
      };
      break;
    case "model":
      retVar = fromSdkModelType(sdkType, context);
      break;
    case "enum":
      retVar = fromSdkEnumType(sdkType, context);
      break;
    case "enumvalue":
      retVar = fromSdkEnumValueTypeToConstantType(sdkType, context, literalTypeContext);
      break;
    case "dict":
      retVar = fromSdkDictionaryType(sdkType, context);
      break;
    case "array":
      retVar = fromSdkArrayType(sdkType, context);
      break;
    case "constant":
      retVar = fromSdkConstantType(sdkType, context, literalTypeContext);
      break;
    case "union":
      retVar = fromUnionType(sdkType, context);
      break;
    case "utcDateTime":
    case "offsetDateTime":
      retVar = fromSdkDateTimeType(sdkType);
      break;
    case "duration":
      retVar = fromSdkDurationType(sdkType);
      break;
    case "tuple":
      retVar = fromTupleType(sdkType);
      break;
    // TODO -- endpoint and credential are handled separately in emitter, since we have specific locations for them in input model.
    // We can handle unify the way we handle them in the future, probably by chaning the input model schema and do the conversion in generator.
    case "endpoint":
      retVar = fromSdkEndpointType();
      break;
    case "credential":
      reportDiagnostic(context.program, {
        code: "unsupported-sdk-type",
        format: { sdkType: "Credential" },
        target: NoTarget,
      });
      return { kind: "unknown", name: "credential", crossLanguageDefinitionId: "" };
    default:
      retVar = fromSdkBuiltInType(sdkType);
      break;
  }

  context.__typeCache.types.set(sdkType, retVar);
  return retVar;
}

function updateContextTypeMap(context: CSharpEmitterContext, typeName: string, type: InputType) {
  if (type.kind === "model") {
    context.__typeCache.models.set(typeName, type);
  } else if (type.kind === "enum") {
    context.__typeCache.enums.set(typeName, type);
  }
}

export function fromSdkModelType(
  modelType: SdkModelType,
  context: CSharpEmitterContext,
): InputModelType {
  const modelTypeName = modelType.name;
  let inputModelType = context.__typeCache.models.get(modelTypeName);
  if (!inputModelType) {
    inputModelType = {
      kind: "model",
      name: modelTypeName,
      clientNamespace: modelType.clientNamespace,
      crossLanguageDefinitionId: modelType.crossLanguageDefinitionId,
      access: getAccessOverride(
        context,
        modelType.__raw as Model,
      ) /* when tcgc provide a way to identify if the access is override or not, we can get the accessibility from the modelType.access */,
      usage: modelType.usage,
      deprecation: modelType.deprecation,
      doc: modelType.doc,
      summary: modelType.summary,
      discriminatorValue: modelType.discriminatorValue,
      decorators: modelType.decorators,
    } as InputModelType;

    updateContextTypeMap(context, modelTypeName, inputModelType);

    inputModelType.additionalProperties = modelType.additionalProperties
      ? fromSdkType(modelType.additionalProperties, context)
      : undefined;

    const propertiesDict = new Map<SdkModelPropertyType, InputModelProperty>();
    for (const property of modelType.properties) {
      if (property.kind !== "property") {
        continue;
      }
      const ourProperty = fromSdkModelProperty(property, {
        ModelName: modelTypeName,
        Usage: modelType.usage,
        ClientNamespace: modelType.clientNamespace,
      } as LiteralTypeContext);
      propertiesDict.set(property, ourProperty);
    }

    inputModelType.discriminatorProperty = modelType.discriminatorProperty
      ? propertiesDict.get(modelType.discriminatorProperty)
      : undefined;

    inputModelType.baseModel = modelType.baseModel
      ? fromSdkModelType(modelType.baseModel, context)
      : undefined;

    inputModelType.properties = Array.from(propertiesDict.values()).flat();

    if (modelType.discriminatedSubtypes) {
      const discriminatedSubtypes: Record<string, InputModelType> = {};
      for (const key in modelType.discriminatedSubtypes) {
        const subtype = modelType.discriminatedSubtypes[key];
        discriminatedSubtypes[key] = fromSdkModelType(subtype, context);
      }
      inputModelType.discriminatedSubtypes = discriminatedSubtypes;
    }
  }

  return inputModelType;

  function fromSdkModelProperty(
    property: SdkBodyModelPropertyType,
    literalTypeContext: LiteralTypeContext,
  ): InputModelProperty {
    /* remove this when https://github.com/Azure/typespec-azure/issues/1483 and https://github.com/Azure/typespec-azure/issues/1488 are resolved. */
    let targetType = property.type;
    if (targetType.kind === "model") {
      const body = targetType.properties.find((x) => x.kind === "body");
      if (body) targetType = body.type;
    }

    const serializedName = property.serializedName;
    literalTypeContext.PropertyName = serializedName;

    const modelProperty: InputModelProperty = {
      kind: property.kind,
      name: property.name,
      serializedName: serializedName,
      summary: property.summary,
      doc: property.doc,
      type: fromSdkType(
        targetType,
        context,
        property.discriminator ? undefined : literalTypeContext, // this is a workaround because the type of discriminator property in derived models is always literal and we wrap literal into enums, which leads to a lot of extra enum types, adding this check to avoid them
      ),
      optional: property.optional,
      readOnly: isReadOnly(property), // TODO -- we might pass the visibility through and then check if there is only read to know if this is readonly
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
  enumType: SdkEnumType,
  context: CSharpEmitterContext,
  addToCollection: boolean = true,
): InputEnumType {
  const enumName = enumType.name;
  let inputEnumType = context.__typeCache.enums.get(enumName);
  if (!inputEnumType) {
    const values: InputEnumTypeValue[] = [];
    inputEnumType = {
      kind: "enum",
      name: enumName,
      crossLanguageDefinitionId: enumType.crossLanguageDefinitionId,
      valueType: fromSdkBuiltInType(enumType.valueType),
      values: values,
      access: getAccessOverride(
        context,
        enumType.__raw as any,
      ) /* when tcgc provide a way to identify if the access is override or not, we can get the accessibility from the enumType.access,*/,
      clientNamespace: enumType.clientNamespace,
      deprecation: enumType.deprecation,
      summary: enumType.summary,
      doc: enumType.doc,
      isFixed: enumType.isFixed,
      isFlags: enumType.isFlags,
      usage: enumType.usage,
      decorators: enumType.decorators,
    };
    if (addToCollection) {
      updateContextTypeMap(context, enumName, inputEnumType);
    }
    for (const v of enumType.values) {
      values.push(fromSdkEnumValueType(v, context));
    }
  }

  return inputEnumType;
}

function fromSdkDateTimeType(dateTimeType: SdkDateTimeType): InputDateTimeType {
  return {
    kind: dateTimeType.kind,
    name: dateTimeType.name,
    encode: dateTimeType.encode,
    wireType: fromSdkBuiltInType(dateTimeType.wireType),
    crossLanguageDefinitionId: dateTimeType.crossLanguageDefinitionId,
    baseType: dateTimeType.baseType ? fromSdkDateTimeType(dateTimeType.baseType) : undefined,
    decorators: dateTimeType.decorators,
  };
}

function fromSdkDurationType(durationType: SdkDurationType): InputDurationType {
  return {
    kind: durationType.kind,
    name: durationType.name,
    encode: durationType.encode,
    wireType: fromSdkBuiltInType(durationType.wireType),
    crossLanguageDefinitionId: durationType.crossLanguageDefinitionId,
    baseType: durationType.baseType ? fromSdkDurationType(durationType.baseType) : undefined,
    decorators: durationType.decorators,
  };
}

// TODO: tuple is not officially supported
function fromTupleType(tupleType: SdkTupleType): InputType {
  return {
    kind: "unknown",
    name: "tuple",
    crossLanguageDefinitionId: "",
    decorators: tupleType.decorators,
  };
}

function fromSdkBuiltInType(builtInType: SdkBuiltInType): InputPrimitiveType {
  return {
    kind: builtInType.kind,
    name: builtInType.name,
    encode: builtInType.encode !== builtInType.kind ? builtInType.encode : undefined, // In TCGC this is required, and when there is no encoding, it just has the same value as kind, we could remove this when TCGC decides to simplify
    crossLanguageDefinitionId: builtInType.crossLanguageDefinitionId,
    baseType: builtInType.baseType ? fromSdkBuiltInType(builtInType.baseType) : undefined,
    decorators: builtInType.decorators,
  };
}

function fromUnionType(union: SdkUnionType, context: CSharpEmitterContext): InputUnionType {
  const variantTypes: InputType[] = [];
  for (const value of union.variantTypes) {
    const variantType = fromSdkType(value, context);
    variantTypes.push(variantType);
  }

  return {
    kind: "union",
    name: union.name,
    variantTypes: variantTypes,
    clientNamespace: union.clientNamespace,
    decorators: union.decorators,
  };
}

function fromSdkConstantType(
  constantType: SdkConstantType,
  context: CSharpEmitterContext,
  literalTypeContext?: LiteralTypeContext,
): InputLiteralType {
  return {
    kind: constantType.kind,
    valueType:
      constantType.valueType.kind === "boolean" || literalTypeContext === undefined
        ? fromSdkBuiltInType(constantType.valueType)
        : // TODO: this might change in the near future
          // we might keep constant as-is, instead of creating an enum for it.
          convertConstantToEnum(constantType, literalTypeContext),
    value: constantType.value,
    decorators: constantType.decorators,
  };

  function convertConstantToEnum(
    constantType: SdkConstantType,
    literalTypeContext: LiteralTypeContext,
  ) {
    // otherwise we need to wrap this into an extensible enum
    // we use the model name followed by the property name as the enum name to ensure it is unique
    const enumName = `${literalTypeContext.ModelName}_${literalTypeContext.PropertyName}`;
    const enumValueName = constantType.value === null ? "Null" : constantType.value.toString();
    const values: InputEnumTypeValue[] = [];
    const enumType: InputEnumType = {
      kind: "enum",
      name: enumName,
      valueType: fromSdkBuiltInType(constantType.valueType),
      values: values,
      crossLanguageDefinitionId: "",
      access: undefined,
      clientNamespace: literalTypeContext.ClientNamespace,
      doc: `The ${enumName}`, // TODO -- what should we put here?
      isFixed: false,
      isFlags: false,
      usage: literalTypeContext.Usage,
      decorators: constantType.decorators,
    };

    updateContextTypeMap(context, enumName, enumType);

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
  enumValueType: SdkEnumValueType,
  context: CSharpEmitterContext,
  literalTypeContext?: LiteralTypeContext,
): InputLiteralType {
  return {
    kind: "constant",
    valueType:
      enumValueType.valueType.kind === "boolean" || literalTypeContext === undefined
        ? fromSdkBuiltInType(enumValueType.valueType)
        : fromSdkEnumType(enumValueType.enumType, context),
    value: enumValueType.value,
    decorators: enumValueType.decorators,
  };
}

function fromSdkEnumValueType(
  enumValueType: SdkEnumValueType,
  context: CSharpEmitterContext,
): InputEnumTypeValue {
  return {
    kind: "enumvalue",
    name: enumValueType.name,
    value: enumValueType.value,
    valueType: fromSdkBuiltInType(enumValueType.valueType),
    enumType: fromSdkEnumType(enumValueType.enumType, context),
    summary: enumValueType.summary,
    doc: enumValueType.doc,
    decorators: enumValueType.decorators,
  };
}

function fromSdkDictionaryType(
  dictionaryType: SdkDictionaryType,
  context: CSharpEmitterContext,
): InputDictionaryType {
  return {
    kind: "dict",
    keyType: fromSdkType(dictionaryType.keyType, context),
    valueType: fromSdkType(dictionaryType.valueType, context),
    decorators: dictionaryType.decorators,
  };
}

function fromSdkArrayType(arrayType: SdkArrayType, context: CSharpEmitterContext): InputArrayType {
  return {
    kind: "array",
    name: arrayType.name,
    valueType: fromSdkType(arrayType.valueType, context),
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
