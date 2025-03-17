// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  getAllModels,
  getClientType,
  isAzureCoreModel,
} from "@azure-tools/typespec-client-generator-core";
import { Operation, Type } from "@typespec/compiler";
import { CSharpEmitterContext } from "../sdk-context.js";
import { InputType } from "../type/input-type.js";
import { LiteralTypeContext } from "../type/literal-type-context.js";
import { fromSdkEnumType, fromSdkModelType, fromSdkType } from "./type-converter.js";

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
  context: CSharpEmitterContext,
  type: Type,
  operation?: Operation,
  literalTypeContext?: LiteralTypeContext,
): InputType {
  context.logger.debug(`getInputType for kind: ${type.kind}`);

  const sdkType = getClientType(context, type, operation);
  return fromSdkType(context, sdkType, literalTypeContext);
}

export function navigateModels(sdkContext: CSharpEmitterContext) {
  for (const type of getAllModels(sdkContext)) {
    if (type.name === "" || isAzureCoreModel(type)) {
      continue;
    }
    if (type.kind === "model") {
      fromSdkModelType(sdkContext, type);
    } else {
      fromSdkEnumType(sdkContext, type);
    }
  }
}
