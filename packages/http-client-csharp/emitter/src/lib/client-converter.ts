// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkClientType as SdkClientTypeOfT,
  SdkHttpOperation,
} from "@azure-tools/typespec-client-generator-core";
import { CSharpEmitterContext } from "../sdk-context.js";
import { InputClientType } from "../type/input-type.js";

type SdkClientType = SdkClientTypeOfT<SdkHttpOperation>;

export function fromSdkClients(
  sdkContext: CSharpEmitterContext,
  clients: SdkClientType[],
): InputClientType[] {
  const inputClients: InputClientType[] = [];
  for (const client of clients) {
    const inputClient = fromSdkClient(sdkContext, client);
    inputClients.push(inputClient);
  }

  return inputClients;
}

function fromSdkClient(sdkContext: CSharpEmitterContext, client: SdkClientType): InputClientType {
  let inputClient: InputClientType | undefined = sdkContext.__typeCache.clients.get(client);
  if (inputClient) {
    return inputClient;
  }

  inputClient = {
    kind: "client",
    name: client.name,
    namespace: client.namespace,
    doc: client.doc,
    summary: client.summary,
    operations: [],
    apiVersions: client.apiVersions,
    crossLanguageDefinitionId: client.crossLanguageDefinitionId,
    parent: undefined,
    children: undefined,
  };

  updateSdkClientTypeReferences(sdkContext, client, inputClient);

  // fill operations - TODO
  // fill parent
  if (client.parent) {
    const parent = fromSdkClient(sdkContext, client.parent);
    inputClient.parent = parent;
  }
  // fill children
  if (client.children) {
    const children: InputClientType[] = [];
    for (const child of client.children) {
      children.push(fromSdkClient(sdkContext, child));
    }
    inputClient.children = children;
  }

  return inputClient;
}

function updateSdkClientTypeReferences(
  sdkContext: CSharpEmitterContext,
  sdkClient: SdkClientType,
  inputClient: InputClientType,
) {
  sdkContext.__typeCache.clients.set(sdkClient, inputClient);
  sdkContext.__typeCache.crossLanguageDefinitionIds.set(
    sdkClient.crossLanguageDefinitionId,
    sdkClient.__raw.type,
  );
}
