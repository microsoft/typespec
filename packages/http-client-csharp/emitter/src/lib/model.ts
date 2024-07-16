// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkContext,
  getAllModels,
  getClientType
} from "@azure-tools/typespec-client-generator-core";
import {
  ModelProperty,
  Operation,
  Type,
  getEffectiveModelType,
  getNamespaceFullName
} from "@typespec/compiler";
import {
  getHeaderFieldName,
  getPathParamName,
  getQueryParamName,
  isStatusCode
} from "@typespec/http";
import { NetEmitterOptions } from "../options.js";
import { fromSdkEnumType, fromSdkModelType, fromSdkType } from "./converter.js";
import {
  InputEnumType,
  InputModelType,
  InputType
} from "../type/input-type.js";
import { LiteralTypeContext } from "../type/literal-type-context.js";
import { Logger } from "./logger.js";
import { capitalize } from "./utils.js";

/**
* If type is an anonymous model, tries to find a named model that has the same
* set of properties when non-schema properties are excluded.
*/
export function getEffectiveSchemaType(context: SdkContext, type: Type): Type {
  let target = type;
  if (type.kind === "Model" && !type.name) {
      const effective = getEffectiveModelType(
          context.program,
          type,
          isSchemaPropertyInternal
      );
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

  const sdkType = getClientType(context, type, operation);

  // TODO -- remove when https://github.com/Azure/typespec-azure/issues/1150 is resolved
  // TCGC has a bug that sometimes the name of body type constructed back from spread parameters does not have a name, here we add a name for it.
  if (operation && sdkType.kind === "model" && sdkType.name === "") {
      sdkType.name = `${getOperationFullName(operation)}Request`;
  }

  return fromSdkType(sdkType, context, models, enums, literalTypeContext);
}

function getOperationFullName(operation: Operation): string {
  let name = capitalize(operation.name);
  if (operation.interface) {
      name = `${capitalize(operation.interface.name)}${name}`;
      if (operation.interface.namespace) {
          name = `${capitalize(
              getNamespaceFullName(operation.interface.namespace)
          )}${name}`;
      }
  } else if (operation.namespace) {
      const ns = getNamespaceFullName(operation.namespace);
      name = `${capitalize(ns)}${name}`;
  }

  return name;
}

export function navigateModels(
  context: SdkContext<NetEmitterOptions>,
  models: Map<string, InputModelType>,
  enums: Map<string, InputEnumType>
) {
  for (const type of getAllModels(context)) {
      if (type.name === "") {
          continue;
      }
      if (type.kind === "model") {
          fromSdkModelType(type, context, models, enums);
      } else {
          fromSdkEnumType(type, context, enums);
      }
  }
}
