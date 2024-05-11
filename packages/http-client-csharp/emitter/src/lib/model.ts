// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { getLroMetadata, isFixed } from "@azure-tools/typespec-azure-core";
import {
  SdkContext,
  SdkEnumType,
  SdkModelType,
  getAllModels,
  getClientType,
} from "@azure-tools/typespec-client-generator-core";
import {
  EncodeData,
  Enum,
  IntrinsicType,
  Model,
  ModelProperty,
  Operation,
  Program,
  ProjectedProgram,
  Scalar,
  Type,
  Union,
  UsageFlags,
  getDeprecated,
  getDoc,
  getEffectiveModelType,
  getEncode,
  getFormat,
  getKnownValues,
  isArrayModelType,
  isRecordModelType,
  resolveUsages,
} from "@typespec/compiler";
import {
  HttpOperation,
  getHeaderFieldName,
  getPathParamName,
  getQueryParamName,
  isStatusCode,
} from "@typespec/http";
import { NetEmitterOptions } from "../options.js";
import { fromSdkEnumType, fromSdkModelType } from "../type/converter.js";
import { FormattedType } from "../type/formatted-type.js";
import { InputEnumTypeValue } from "../type/input-enum-type-value.js";
import { InputIntrinsicTypeKind } from "../type/input-intrinsic-type-kind.js";
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
  isInputEnumType,
  isInputIntrinsicType,
  isInputLiteralType,
} from "../type/input-type.js";
import { LiteralTypeContext } from "../type/literal-type-context.js";
import { logger } from "./logger.js";
import { capitalize, getFullNamespaceString, getTypeName } from "./utils.js";
/**
 * Map calType to csharp InputTypeKind
 */
export function mapTypeSpecTypeToCSharpInputTypeKind(
  typespecType: Type,
  format?: string,
  encode?: EncodeData
): InputPrimitiveTypeKind {
  const kind = typespecType.kind;
  switch (kind) {
    case "Model":
      return getCSharpInputTypeKindByPrimitiveModelName(typespecType.name, format, encode);
    case "ModelProperty":
      return InputPrimitiveTypeKind.Object;
    case "Enum":
      return InputPrimitiveTypeKind.Enum;
    case "Number":
      const numberValue = typespecType.value;
      if (numberValue % 1 === 0) {
        return InputPrimitiveTypeKind.Int32;
      }
      return InputPrimitiveTypeKind.Float64;
    case "Boolean":
      return InputPrimitiveTypeKind.Boolean;
    case "String":
      if (format === "date") return InputPrimitiveTypeKind.DateTime;
      if (format === "uri") return InputPrimitiveTypeKind.Uri;
      return InputPrimitiveTypeKind.String;
    default:
      throw new Error(`Unsupported primitive kind ${kind}`);
  }
}

export function getCSharpInputTypeKindByPrimitiveModelName(
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
          logger.warn(`invalid encode ${encode?.encoding} for bytes.`);
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
            logger.warn(`invalid format ${format}`);
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
          logger.warn(`invalid encode ${encode?.encoding} for date time.`);
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
          logger.warn(`invalid encode ${encode?.encoding} for duration.`);
          return InputPrimitiveTypeKind.DurationISO8601;
      }
    case "azureLocation":
      return InputPrimitiveTypeKind.AzureLocation;
    default:
      return InputPrimitiveTypeKind.Object;
  }
}

/**
 * If type is an anonymous model, tries to find a named model that has the same
 * set of properties when non-schema properties are excluded.
 */
export function getEffectiveSchemaType(context: SdkContext, type: Type): Type {
  let target = type;
  if (type.kind === "Model" && !type.name) {
    const effective = getEffectiveModelType(context.program, type, isSchemaPropertyInternal);
    if (effective.name) {
      target = effective;
    }
  }

  return target;

  function isSchemaPropertyInternal(property: ModelProperty) {
    return isSchemaProperty(context, property);
  }
}

/**
 * A "schema property" here is a property that is emitted to OpenAPI schema.
 *
 * Headers, parameters, status codes are not schema properties even they are
 * represented as properties in TypeSpec.
 */
function isSchemaProperty(context: SdkContext, property: ModelProperty) {
  const program = context.program;
  const headerInfo = getHeaderFieldName(program, property);
  const queryInfo = getQueryParamName(program, property);
  const pathInfo = getPathParamName(program, property);
  const statusCodeInfo = isStatusCode(program, property);
  return !(headerInfo || queryInfo || pathInfo || statusCodeInfo);
}

export function getDefaultValue(type: Type): any {
  switch (type.kind) {
    case "String":
      return type.value;
    case "Number":
      return type.value;
    case "Boolean":
      return type.value;
    case "Tuple":
      return type.values.map(getDefaultValue);
    default:
      return undefined;
  }
}

export function getInputType(
  context: SdkContext<NetEmitterOptions>,
  formattedType: FormattedType,
  models: Map<string, InputModelType>,
  enums: Map<string, InputEnumType>,
  literalTypeContext?: LiteralTypeContext
): InputType {
  const type = getRealType(
    formattedType.type.kind === "ModelProperty" ? formattedType.type.type : formattedType.type,
    context
  );
  logger.debug(`getInputType for kind: ${type.kind}`);
  const program = context.program;

  if (type.kind === "Model") {
    return getInputModelType(type);
  } else if (type.kind === "String" || type.kind === "Number" || type.kind === "Boolean") {
    return getInputLiteralType(formattedType, literalTypeContext);
  } else if (type.kind === "Enum") {
    return getInputTypeForEnum(type);
  } else if (type.kind === "EnumMember") {
    return getInputTypeForEnum(type.enum);
  } else if (type.kind === "Intrinsic") {
    return getInputModelForIntrinsicType(type);
  } else if (type.kind === "Scalar") {
    let effectiveType = type;
    while (!program.checker.isStdType(effectiveType)) {
      if (type.baseScalar) {
        effectiveType = type.baseScalar;
      } else {
        break;
      }
    }
    const intrinsicName = effectiveType.name;
    switch (intrinsicName) {
      case "string":
        const values = getKnownValues(program, type);
        if (values) {
          return getInputModelForEnumByKnowValues(type, values);
        }
      // if the model is one of the typespec Intrinsic type.
      // it's a base typespec "primitive" that corresponds directly to an c# data type.
      // In such cases, we don't want to emit a ref and instead just
      // emit the base type directly.
      // TODO: verify this is good might be a bug
      // eslint-disable-next-line no-fallthrough
      default:
        const sdkType = getClientType(context, type);
        return {
          Kind: InputTypeKind.Primitive,
          Name: getCSharpInputTypeKindByPrimitiveModelName(
            sdkType.kind,
            formattedType.format,
            formattedType.encode
          ),
          IsNullable: false,
        } as InputPrimitiveType;
    }
  } else if (type.kind === "Union") {
    return getInputTypeForUnion(type);
  } else if (type.kind === "UnionVariant") {
    return getInputType(
      context,
      getFormattedType(program, type.type),
      models,
      enums,
      literalTypeContext
    );
  } else if (type.kind === "Tuple") {
    return {
      Kind: InputTypeKind.Intrinsic,
      Name: InputIntrinsicTypeKind.Unknown,
      IsNullable: false,
    } as InputIntrinsicType;
  } else {
    throw new Error(`Unsupported type ${type.kind}`);
  }

  function getInputModelType(m: Model): InputListType | InputDictionaryType | InputModelType {
    /* Array and Map Type. */
    if (isArrayModelType(program, m)) {
      return getInputTypeForArray(m.indexer.value);
    } else if (isRecordModelType(program, m) && m.sourceModel === undefined) {
      // only when the model does not have a source model, it is really a record type
      // when we have `model Foo is Record<string>` this should be a model with additional properties therefore it should not be parsed into a dictionary type
      return getInputTypeForMap(m.indexer.key, m.indexer.value);
    }
    return getInputModelForModel(m);
  }

  function getInputModelForEnumByKnowValues(m: Model | Scalar, e: Enum): InputEnumType {
    const name = getTypeName(context, m);
    let extensibleEnum = enums.get(name);
    if (!extensibleEnum) {
      const innerEnum: InputEnumType = getInputTypeForEnum(e, false);
      if (!innerEnum) {
        throw new Error(`Extensible enum type '${e.name}' has no values defined.`);
      }
      extensibleEnum = {
        Name: name,
        EnumValueType: innerEnum.EnumValueType, //EnumValueType and  AllowedValues should be the first field after id and name, so that it can be corrected serialized.
        AllowedValues: innerEnum.AllowedValues,
        Namespace: getFullNamespaceString(e.namespace),
        Accessibility: undefined, //TODO: need to add accessibility
        Deprecated: getDeprecated(program, m),
        Description: getDoc(program, m),
        IsExtensible: !isFixed(program, e),
        IsNullable: false,
      } as InputEnumType;
      enums.set(name, extensibleEnum);
    }
    return extensibleEnum;
  }

  function getInputLiteralType(
    formattedType: FormattedType,
    literalContext?: LiteralTypeContext
  ): InputLiteralType {
    // For literal types, we just want to emit them directly as well.
    const type = formattedType.type;
    const builtInKind: InputPrimitiveTypeKind = mapTypeSpecTypeToCSharpInputTypeKind(
      type,
      formattedType.format,
      formattedType.encode
    );
    const rawValueType: InputPrimitiveType = {
      Kind: InputTypeKind.Primitive,
      Name: builtInKind,
      IsNullable: false,
    };
    const literalValue = getDefaultValue(type);
    const newValueType = getLiteralValueType();

    if (isInputEnumType(newValueType)) {
      enums.set(newValueType.Name, newValueType);
    }

    return {
      Kind: InputTypeKind.Literal,
      Name: InputTypeKind.Literal,
      LiteralValueType: newValueType,
      Value: literalValue,
      IsNullable: false,
    };

    function getLiteralValueType(): InputPrimitiveType | InputEnumType {
      // we will not wrap it if it comes from outside a model or it is a boolean
      if (literalContext === undefined || rawValueType.Name === InputPrimitiveTypeKind.Boolean)
        return rawValueType;

      // otherwise we need to wrap this into an extensible enum
      // we use the model name followed by the property name as the enum name to ensure it is unique
      const enumName = `${literalContext.ModelName}_${literalContext.PropertyName}`;
      const enumValueType =
        rawValueType.Name === InputPrimitiveTypeKind.String
          ? InputPrimitiveTypeKind.String
          : InputPrimitiveTypeKind.Float32;
      const allowValues: InputEnumTypeValue[] = [
        {
          Name: literalValue.toString(),
          Value: literalValue,
          Description: literalValue.toString(),
        },
      ];
      const enumType: InputEnumType = {
        Kind: InputTypeKind.Enum,
        Name: enumName,
        EnumValueType: enumValueType, //EnumValueType and  AllowedValues should be the first field after id and name, so that it can be corrected serialized.
        AllowedValues: allowValues,
        Namespace: literalContext.Namespace,
        Accessibility: undefined,
        Deprecated: undefined,
        Description: `The ${enumName}`, // TODO -- what should we put here?
        IsExtensible: true,
        IsNullable: false,
        Usage: "None", // will be updated later
      };
      return enumType;
    }
  }

  function getInputTypeForEnum(e: Enum, addToCollection: boolean = true): InputEnumType {
    const name = getTypeName(context, e);
    let enumType = enums.get(name);

    if (enumType) return enumType;

    // if it's in TCGC model cache, then construct from TCGC
    if (context.modelsMap?.has(e)) {
      return fromSdkEnumType(
        context.modelsMap!.get(e) as SdkEnumType,
        context,
        enums,
        addToCollection
      );
    }

    const createdSdkEnumType = getClientType(context, e) as SdkEnumType;
    context.modelsMap!.set(e, createdSdkEnumType);
    enumType = fromSdkEnumType(createdSdkEnumType, context, enums);
    if (addToCollection) enums.set(name, enumType);

    return enumType;
  }

  function getInputTypeForArray(elementType: Type): InputListType {
    return {
      Kind: InputTypeKind.Array,
      Name: InputTypeKind.Array,
      ElementType: getInputType(context, getFormattedType(program, elementType), models, enums),
      IsNullable: false,
    };
  }

  function getInputTypeForMap(key: Type, value: Type): InputDictionaryType {
    return {
      Kind: InputTypeKind.Dictionary,
      Name: InputTypeKind.Dictionary,
      KeyType: getInputType(context, getFormattedType(program, key), models, enums),
      ValueType: getInputType(context, getFormattedType(program, value), models, enums),
      IsNullable: false,
    };
  }

  function getInputModelForModel(m: Model): InputModelType {
    if (context.modelsMap!.has(m)) {
      return fromSdkModelType(context.modelsMap!.get(m) as SdkModelType, context, models, enums);
    }
    const createdSdkModelType = getClientType(context, m) as SdkModelType;
    context.modelsMap!.set(m, createdSdkModelType);
    return fromSdkModelType(createdSdkModelType, context, models, enums);
  }

  function getInputModelForIntrinsicType(type: IntrinsicType): InputIntrinsicType {
    switch (type.name) {
      case "unknown":
        return {
          Kind: InputTypeKind.Intrinsic,
          Name: InputIntrinsicTypeKind.Unknown,
          IsNullable: false,
        } as InputIntrinsicType;
      case "null":
        return {
          Kind: InputTypeKind.Intrinsic,
          Name: InputIntrinsicTypeKind.Null,
          IsNullable: false,
        } as InputIntrinsicType;
      default:
        throw new Error(`Unsupported type ${type.name}`);
    }
  }

  function getInputTypeForUnion(union: Union): InputUnionType | InputType {
    const clientType = getClientType(context, union);
    if (clientType.kind === "enum" && clientType.isFixed === false) {
      return fromSdkEnumType(clientType, context, enums);
    }

    let itemTypes: InputType[] = [];
    const variants = Array.from(union.variants.values());

    let hasNullType = false;
    for (const variant of variants) {
      const inputType = getInputType(
        context,
        getFormattedType(program, variant.type),
        models,
        enums
      );
      if (isInputIntrinsicType(inputType) && inputType.Name === InputIntrinsicTypeKind.Null) {
        hasNullType = true;
        continue;
      }
      itemTypes.push(inputType);
    }

    if (hasNullType) {
      itemTypes = itemTypes.map((i) => {
        i.IsNullable = true;
        return i;
      });
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
}

export function getUsages(
  context: SdkContext,
  ops?: HttpOperation[],
  modelMap?: Map<string, InputModelType>
): { inputs: string[]; outputs: string[]; roundTrips: string[] } {
  const program = context.program;
  const result: {
    inputs: string[];
    outputs: string[];
    roundTrips: string[];
  } = { inputs: [], outputs: [], roundTrips: [] };
  if (!ops) {
    return result;
  }

  const operations: Operation[] = ops.map((op) => op.operation);
  const usages = resolveUsages(operations);
  const usagesMap: Map<string, UsageFlags> = new Map<string, UsageFlags>();
  for (const type of usages.types) {
    let typeName = "";
    if ("name" in type) typeName = type.name ?? "";
    const effectiveType = type;
    if (type.kind === "Enum") {
      typeName = getTypeName(context, type);
    }
    if (type.kind === "Model") {
      typeName = getTypeName(context, effectiveType as Model);
    }
    if (type.kind === "Union") {
      const clientType = getClientType(context, type);
      if (clientType.kind === "enum" && clientType.isFixed === false) {
        typeName = clientType.name;
      }
    }
    const affectTypes: Set<string> = new Set<string>();
    if (typeName !== "") {
      affectTypes.add(typeName);
      if (effectiveType.kind === "Model" && (!modelMap || modelMap.has(typeName))) {
        /*propagate to sub models and composite models*/
        getAllEffectedModels(effectiveType, new Set<string>()).forEach((element) => {
          affectTypes.add(element);
        });
      }
    }

    for (const name of affectTypes) {
      let value = usagesMap.get(name);
      if (!value) value = UsageFlags.None;
      if (usages.isUsedAs(type, UsageFlags.Input)) value = value | UsageFlags.Input;
      if (usages.isUsedAs(type, UsageFlags.Output)) value = value | UsageFlags.Output;
      usagesMap.set(name, value);
    }
  }

  for (const op of ops) {
    if (!op.parameters.body?.parameter && op.parameters.body?.type) {
      let effectiveBodyType = undefined;
      const affectTypes: Set<string> = new Set<string>();
      effectiveBodyType = getEffectiveSchemaType(context, op.parameters.body.type);
      if (effectiveBodyType.kind === "Model") {
        /* handle spread. */
        if (effectiveBodyType.name === "") {
          effectiveBodyType.name = `${capitalize(op.operation.name)}Request`;
        }
      }
      if (effectiveBodyType.kind === "Model") {
        /*propagate to sub models and composite models*/
        getAllEffectedModels(effectiveBodyType, new Set<string>()).forEach((element) => {
          affectTypes.add(element);
        });
      }
      for (const name of affectTypes) {
        appendUsage(name, UsageFlags.Input);
      }
    }
    /* handle response type usage. */
    const affectedReturnTypes: Set<string> = new Set<string>();
    for (const res of op.responses) {
      const resBody = res.responses[0]?.body;
      if (resBody?.type) {
        let returnType = "";
        const effectiveReturnType = getEffectiveSchemaType(context, resBody.type);
        if (effectiveReturnType.kind === "Model" && effectiveReturnType.name !== "") {
          returnType = getTypeName(context, effectiveReturnType);
        }
        /*propagate to sub models and composite models*/
        if (effectiveReturnType.kind === "Model") {
          getAllEffectedModels(effectiveReturnType, new Set<string>()).forEach((element) => {
            affectedReturnTypes.add(element);
          });
        }
        affectedReturnTypes.add(returnType);
        for (const name of affectedReturnTypes) {
          appendUsage(name, UsageFlags.Output);
        }
      }
      /* calculate the usage of the LRO result type. */
      const metadata = getLroMetadata(program, op.operation);
      if (metadata !== undefined) {
        let bodyType: Model;
        if (
          op.verb !== "delete" &&
          metadata.finalResult !== undefined &&
          metadata.finalResult !== "void"
        ) {
          bodyType = metadata.finalEnvelopeResult as Model;
          if (bodyType) {
            getAllEffectedModels(bodyType, new Set<string>()).forEach((element) => {
              affectedReturnTypes.add(element);
            });
          }
        }
      }
    }
  }

  // handle the types introduces by us
  if (modelMap) {
    // iterate all models to find if it contains literal type properties
    for (const [name, model] of modelMap) {
      // get the usage of this model
      const usage = usagesMap.get(name);
      for (const prop of model.Properties) {
        const type = prop.Type;
        if (!isInputLiteralType(type)) continue;
        // now type should be a literal type
        // find its corresponding enum type
        const literalValueType = type.LiteralValueType;
        if (!isInputEnumType(literalValueType)) continue;
        // now literalValueType should be an enum type
        // apply the usage on this model to the usagesMap
        appendUsage(literalValueType.Name, usage!);
      }
    }
  }

  for (const [key, value] of usagesMap) {
    if (value === (UsageFlags.Input | UsageFlags.Output)) {
      result.roundTrips.push(key);
    } else if (value === UsageFlags.Input) {
      result.inputs.push(key);
    } else if (value === UsageFlags.Output) {
      result.outputs.push(key);
    }
  }
  return result;

  function appendUsage(name: string, flag: UsageFlags) {
    let value = usagesMap.get(name);
    if (!value) value = flag;
    else value = value | flag;
    usagesMap.set(name, value);
  }

  function getAllEffectedModels(model: Model, visited: Set<string>): string[] {
    const result: string[] = [];
    if (
      (isArrayModelType(program, model) || isRecordModelType(program, model)) &&
      model.indexer.value.kind === "Model"
    ) {
      result.push(...getAllEffectedModels(model.indexer.value, visited));
    } else {
      const name = getTypeName(context, model);
      if (model.kind !== "Model" || visited.has(name)) return result;
      result.push(name);
      visited.add(name);
      const derivedModels = model.derivedModels;
      for (const derivedModel of derivedModels) {
        result.push(getTypeName(context, derivedModel));
        result.push(...getAllEffectedModels(derivedModel, visited));
      }
      for (const [_, prop] of model.properties) {
        if (prop.type.kind === "Model") {
          result.push(...getAllEffectedModels(prop.type, visited));
        }
      }
      /*propagate usage to the property type of the base model. */
      if (model.baseModel) {
        for (const [_, prop] of model.baseModel.properties) {
          if (prop.type.kind === "Model") {
            result.push(...getAllEffectedModels(prop.type, visited));
          }
        }
      }
    }

    return result;
  }
}

export function getFormattedType(program: Program, type: Type): FormattedType {
  let targetType = type;
  const format = getFormat(program, type);
  if (type.kind === "ModelProperty") {
    targetType = type.type;
  }
  const encodeData =
    type.kind === "Scalar" || type.kind === "ModelProperty" ? getEncode(program, type) : undefined;

  return {
    type: targetType,
    format: format,
    encode: encodeData,
  };
}

export function navigateModels(
  context: SdkContext<NetEmitterOptions>,
  models: Map<string, InputModelType>,
  enums: Map<string, InputEnumType>
) {
  getAllModels(context).forEach((model) =>
    model.kind === "model"
      ? fromSdkModelType(model, context, models, enums)
      : fromSdkEnumType(model, context, enums)
  );
}

// TODO: we should try to remove this when we adopt getAllOperations
// we should avoid handling raw type definitions because they could be not correctly projected
// in the given api version
function getRealType(type: Type, context: SdkContext<NetEmitterOptions>): Type {
  if ("projector" in context.program)
    return (context.program as ProjectedProgram).projector.projectedTypes.get(type) ?? type;
  return type;
}
