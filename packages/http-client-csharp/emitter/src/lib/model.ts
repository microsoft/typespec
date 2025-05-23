// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { getClientType } from "@azure-tools/typespec-client-generator-core";
import { Operation, Type, Value } from "@typespec/compiler";
import { CSharpEmitterContext } from "../sdk-context.js";
import { InputType } from "../type/input-type.js";
import { fromSdkType } from "./type-converter.js";

export function getDefaultValue(value: Value): any {
  switch (value.valueKind) {
    case "StringValue":
      return value.value;
    case "NumericValue":
      return value.value;
    case "BooleanValue":
      return value.value;
    case "ArrayValue":
      return value.values.map(getDefaultValue);
    default:
      return undefined;
  }
}

export function getInputType(
  context: CSharpEmitterContext,
  type: Type,
  operation?: Operation,
): InputType {
  context.logger.debug(`getInputType for kind: ${type.kind}`);

  const sdkType = getClientType(context, type, operation);
  return fromSdkType(context, sdkType);
}
