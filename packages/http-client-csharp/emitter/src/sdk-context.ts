// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkClientType,
  SdkContext,
  SdkHttpOperation,
  SdkHttpResponse,
  SdkModelPropertyType,
  SdkType,
} from "@azure-tools/typespec-client-generator-core";
import { Type } from "@typespec/compiler";
import { Logger } from "./lib/logger.js";
import { CSharpEmitterOptions } from "./options.js";
import { InputParameter } from "./type/input-parameter.js";
import {
  InputClient,
  InputEnumType,
  InputLiteralType,
  InputModelProperty,
  InputModelType,
  InputType,
} from "./type/input-type.js";
import { OperationResponse } from "./type/operation-response.js";

/**
 * The emitter context for the CSharp emitter.
 * @beta
 */
export interface CSharpEmitterContext extends SdkContext<CSharpEmitterOptions> {
  logger: Logger;
  __typeCache: SdkTypeCache;
}

/*
 * Creates a new CSharp emitter context.
 * @param context - The SDK context.
 * @param logger - The logger to use.
 * @returns The CSharp emitter context.
 * @beta
 */
export function createCSharpEmitterContext<
  TOptions extends CSharpEmitterOptions = CSharpEmitterOptions,
>(context: SdkContext<TOptions>, logger: Logger): CSharpEmitterContext {
  return {
    ...context,
    logger,
    __typeCache: new SdkTypeCache(),
  };
}

class SdkTypeCache {
  clients: Map<SdkClientType<SdkHttpOperation>, InputClient>;
  properties: Map<SdkModelPropertyType, InputParameter | InputModelProperty>;
  responses: Map<SdkHttpResponse, OperationResponse>;
  types: Map<SdkType, InputType>;
  models: Map<string, InputModelType>;
  enums: Map<string, InputEnumType>;
  constants: Map<string, InputLiteralType>;
  crossLanguageDefinitionIds: Map<string, Type | undefined>;

  constructor() {
    this.clients = new Map<SdkClientType<SdkHttpOperation>, InputClient>();
    this.properties = new Map<SdkModelPropertyType, InputParameter | InputModelProperty>();
    this.responses = new Map<SdkHttpResponse, OperationResponse>();
    this.types = new Map<SdkType, InputType>();
    this.models = new Map<string, InputModelType>();
    this.enums = new Map<string, InputEnumType>();
    this.constants = new Map<string, InputLiteralType>();
    this.crossLanguageDefinitionIds = new Map<string, Type | undefined>();
  }

  updateSdkClientReferences(sdkClient: SdkClientType<SdkHttpOperation>, inputClient: InputClient) {
    this.clients.set(sdkClient, inputClient);
    this.crossLanguageDefinitionIds.set(sdkClient.crossLanguageDefinitionId, sdkClient.__raw.type);
  }

  updateSdkPropertyReferences(
    sdkProperty: SdkModelPropertyType,
    inputProperty: InputParameter | InputModelProperty,
  ) {
    this.properties.set(sdkProperty, inputProperty);
    this.crossLanguageDefinitionIds.set(sdkProperty.crossLanguageDefinitionId, sdkProperty.__raw);
  }

  updateSdkResponseReferences(sdkResponse: SdkHttpResponse, response: OperationResponse) {
    this.responses.set(sdkResponse, response);
    // the response of an operation is not something defined in the typespec concept therefore it does not have crossLanguageDefinitionId
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
    } else if (type.kind === "constant") {
      this.constants.set(typeName, type);
    }
  }
}
