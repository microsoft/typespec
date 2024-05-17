// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { getLroMetadata } from "@azure-tools/typespec-azure-core";
import {
  SdkContext,
  getAllModels,
  getClientType,
  getSdkModelPropertyType,
} from "@azure-tools/typespec-client-generator-core";
import {
  Model,
  ModelProperty,
  Operation,
  Type,
  UsageFlags,
  getEffectiveModelType,
  ignoreDiagnostics,
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
import {
  InputEnumType,
  InputModelType,
  InputType,
  isInputEnumType,
  isInputLiteralType,
} from "../type/input-type.js";
import { LiteralTypeContext } from "../type/literal-type-context.js";
import {
  fromSdkEnumType,
  fromSdkModelPropertyType,
  fromSdkModelType,
  fromSdkType,
} from "./converter.js";
import { Logger } from "./logger.js";
import { capitalize, getTypeName } from "./utils.js";

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
  type: Type,
  models: Map<string, InputModelType>,
  enums: Map<string, InputEnumType>,
  operation?: Operation,
  literalTypeContext?: LiteralTypeContext
): InputType {
  Logger.getInstance().debug(`getInputType for kind: ${type.kind}`);

  // TODO -- we might could remove this workaround when we adopt getAllOperations
  //         or when we decide not to honor the `@format` decorators on parameters
  // this is specifically dealing with the case of an operation parameter
  if (type.kind === "ModelProperty") {
    const propertyType = ignoreDiagnostics(getSdkModelPropertyType(context, type, operation));
    return fromSdkModelPropertyType(propertyType, context, models, enums, literalTypeContext);
  }

  const sdkType = getClientType(context, type, operation);
  return fromSdkType(sdkType, context, models, enums, literalTypeContext);
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
      const clientType = getClientType(context, type); // TODO -- we should also pass in an operation as well
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
      let effectiveBodyType: Type | undefined = undefined;
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
