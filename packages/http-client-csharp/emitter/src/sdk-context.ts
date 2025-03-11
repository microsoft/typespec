// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkClientType,
  SdkContext,
  SdkModelPropertyType,
  SdkHttpOperation,
  SdkHttpParameter,
  SdkHttpResponse,
  SdkType,
  SdkBodyModelPropertyType,
} from "@azure-tools/typespec-client-generator-core";
import { Logger } from "./lib/logger.js";
import { CSharpEmitterOptions } from "./options.js";
import { InputParameter } from "./type/input-parameter.js";
import { InputEnumType, InputModelProperty, InputModelType, InputType } from "./type/input-type.js";
import { OperationResponse } from "./type/operation-response.js";
import { Type } from "@typespec/compiler";
import { InputClient } from "./type/input-client.js";

/**
 * The emitter context for the CSharp emitter.
 * @beta
 */
export interface CSharpEmitterContext extends SdkContext<CSharpEmitterOptions> {
  logger: Logger;
  __typeCache: SdkTypeCache;
}

export class SdkTypeCache {
  clients: Map<SdkClientType<SdkHttpOperation>, InputClient>;
  properties: Map<SdkModelPropertyType, InputParameter | InputModelProperty>;
  responses: Map<SdkHttpResponse, OperationResponse>;
  types: Map<SdkType, InputType>;
  models: Map<string, InputModelType>;
  enums: Map<string, InputEnumType>;
  crossLanguageDefinitionIds: Map<string, Type | undefined>;

  constructor() {
    this.clients = new Map<SdkClientType<SdkHttpOperation>, InputClient>();
    this.properties = new Map<SdkModelPropertyType, InputParameter | InputModelProperty>();
    this.responses = new Map<SdkHttpResponse, OperationResponse>();
    this.types = new Map<SdkType, InputType>();
    this.models = new Map<string, InputModelType>();
    this.enums = new Map<string, InputEnumType>();
    this.crossLanguageDefinitionIds = new Map<string, Type | undefined>();
  }

  updateSdkClientReferences(sdkClient: SdkClientType<SdkHttpOperation>, inputClient: InputClient) {
    this.clients.set(sdkClient, inputClient);
    this.crossLanguageDefinitionIds.set(sdkClient.crossLanguageDefinitionId, sdkClient.__raw.type);
  }

  updateSdkPropertyReferences(sdkProperty: SdkModelPropertyType, inputProperty: InputParameter | InputModelProperty) {
    this.properties.set(sdkProperty, inputProperty);
    this.crossLanguageDefinitionIds.set(sdkProperty.crossLanguageDefinitionId, sdkProperty.__raw);
  }

  updateSdkResponseReferences(sdkResponse: SdkHttpResponse, response: OperationResponse) {
    this.responses.set(sdkResponse, response);
    // this.crossLanguageDefinitionIds.set(sdkResponse.crossLanguageDefinitionId, sdkResponse.__raw); // TODO: issue tracking https://github.com/Azure/typespec-azure/issues/2350
  }

  updateSdkTypeReferences(sdkType: SdkType, inputType: InputType) {
    this.types.set(sdkType, inputType);
    if ("crossLanguageDefinitionId" in sdkType) {
      this.crossLanguageDefinitionIds.set(sdkType.crossLanguageDefinitionId, sdkType.__raw);
    }
  }

  updateTypeCache(typeName: string, type: InputType) {
    if (type.kind === "model") {
      this.models.set(typeName, type);
    } else if (type.kind === "enum") {
      this.enums.set(typeName, type);
    }
  }
}
