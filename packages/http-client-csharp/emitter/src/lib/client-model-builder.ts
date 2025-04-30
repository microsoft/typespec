// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { UsageFlags } from "@azure-tools/typespec-client-generator-core";
import { CSharpEmitterContext } from "../sdk-context.js";
import { CodeModel } from "../type/code-model.js";
import { fromSdkClients } from "./client-converter.js";
import { navigateModels } from "./model.js";
import { processServiceAuthentication } from "./service-authentication.js";
import { firstLetterToUpperCase, getClientNamespaceString } from "./utils.js";

/**
 * Creates the code model from the SDK context.
 * @param sdkContext - The SDK context
 * @returns The code model
 * @beta
 */
export function createModel(sdkContext: CSharpEmitterContext): CodeModel {
  const sdkPackage = sdkContext.sdkPackage;

  navigateModels(sdkContext);

  const sdkApiVersionEnums = sdkPackage.enums.filter((e) => e.usage === UsageFlags.ApiVersionEnum);

  const rootClients = sdkPackage.clients;

  const rootApiVersions =
    sdkApiVersionEnums.length > 0
      ? sdkApiVersionEnums[0].values.map((v) => v.value as string).flat()
      : rootClients[0].apiVersions;

  const inputClients = fromSdkClients(sdkContext, rootClients, rootApiVersions);

  // TODO - TCGC has two issues which come from the same root cause: the name determination algorithm based on the typespec node of the constant.
  // typespec itself will always use the same node/Type instance for the same value constant, therefore a lot of names are not correct.
  // issues:
  // - https://github.com/Azure/typespec-azure/issues/2572 (constants in operations)
  // - https://github.com/Azure/typespec-azure/issues/2563 (constants in models)
  // First we correct the names of the constants in models.
  for (const model of sdkContext.__typeCache.models.values()) {
    // because this `models` list already contains all the models, therefore we just need to iterate all of them to find if any their properties is constant
    for (const property of model.properties) {
      const type = property.type;
      if (type.kind === "constant") {
        // if a property is constant, we need to override its name, namespace, access and usage.
        type.name = `${model.name}${firstLetterToUpperCase(property.name)}`;
        type.namespace = model.namespace;
        type.access = model.access;
        type.usage = model.usage;
      }
    }
  }
  // hopefully the above would resolve all those name conflicts in those constants used in models.
  // but it would not cover the constant used as operation parameters
  // therefore here we just number them if we find other name collisions.
  const constantNameMap = new Map<string, number>();
  for (const constant of sdkContext.__typeCache.constants.values()) {
    const count = constantNameMap.get(constant.name);
    if (count) {
      constantNameMap.set(constant.name, count + 1);
      constant.name = `${constant.name}${count}`;
    } else {
      constantNameMap.set(constant.name, 1);
    }
  }

  const clientModel: CodeModel = {
    // To ensure deterministic library name, customers would need to set the package-name property as the ordering of the namespaces could change
    // if the typespec is changed.
    name: getClientNamespaceString(sdkContext)!,
    apiVersions: rootApiVersions,
    enums: Array.from(sdkContext.__typeCache.enums.values()),
    constants: Array.from(sdkContext.__typeCache.constants.values()),
    models: Array.from(sdkContext.__typeCache.models.values()),
    clients: inputClients,
    auth: processServiceAuthentication(sdkContext, sdkPackage),
  };

  return clientModel;
}
