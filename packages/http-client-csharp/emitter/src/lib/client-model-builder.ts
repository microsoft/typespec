// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { UsageFlags } from "@azure-tools/typespec-client-generator-core";
import { NoTarget } from "@typespec/compiler";
import { CSharpEmitterContext } from "../sdk-context.js";
import { CodeModel } from "../type/code-model.js";
import { fromSdkClients } from "./client-converter.js";
import { navigateModels } from "./model.js";
import { processServiceAuthentication } from "./service-authentication.js";

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
  if (rootClients.length === 0) {
    sdkContext.logger.reportDiagnostic({
      code: "no-root-client",
      format: {},
      target: NoTarget,
    });
    return {} as CodeModel;
  }

  const rootApiVersions =
    sdkApiVersionEnums.length > 0
      ? sdkApiVersionEnums[0].values.map((v) => v.value as string).flat()
      : rootClients[0].apiVersions;

  const inputClients = fromSdkClients(sdkContext, rootClients, rootApiVersions);

  const clientModel: CodeModel = {
    // rootNamespace is really coalescing the `package-name` option and the first namespace found.
    name: sdkPackage.rootNamespace,
    apiVersions: rootApiVersions,
    enums: Array.from(sdkContext.__typeCache.enums.values()),
    models: Array.from(sdkContext.__typeCache.models.values()),
    clients: inputClients,
    auth: processServiceAuthentication(sdkContext, sdkPackage),
  };

  return clientModel;
}
