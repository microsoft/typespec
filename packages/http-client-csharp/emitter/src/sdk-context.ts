// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkClientType,
  SdkConstantType,
  SdkContext,
  SdkHttpOperation,
  SdkHttpParameter,
  SdkHttpResponse,
  SdkMethodParameter,
  SdkModelPropertyType,
  SdkServiceMethod,
  SdkType,
} from "@azure-tools/typespec-client-generator-core";
import { Type } from "@typespec/compiler";
import { Logger } from "./lib/logger.js";
import { CSharpEmitterOptions } from "./options.js";
import { InputOperation } from "./type/input-operation.js";
import { InputParameter } from "./type/input-parameter.js";
import { InputServiceMethod } from "./type/input-service-method.js";
import { InputClient, InputLiteralType, InputModelProperty, InputType } from "./type/input-type.js";
import { OperationResponse } from "./type/operation-response.js";

/**
 * The emitter context for the CSharp emitter.
 * @beta
 */
export interface CSharpEmitterContext extends SdkContext<CSharpEmitterOptions> {
  logger: Logger;
  __typeCache: SdkTypeCache;
}

/**
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
  methods: Map<SdkServiceMethod<SdkHttpOperation>, InputServiceMethod>;
  operations: Map<SdkHttpOperation, InputOperation>;
  methodParmeters: Map<SdkMethodParameter, InputParameter>; // TODO -- in the near future, we should replace `InputParameter` with those `InputQueryParameter`, etc.
  operationParameters: Map<SdkHttpParameter | SdkModelPropertyType, InputParameter>; // TODO -- in the near future, we should replace `InputParameter` with those `InputQueryParameter`, etc.
  properties: Map<SdkModelPropertyType, InputModelProperty>;
  responses: Map<SdkHttpResponse, OperationResponse>;
  types: Map<SdkType, InputType>;
  constants: Map<SdkConstantType, InputLiteralType>;
  crossLanguageDefinitionIds: Map<string, Type | undefined>;

  constructor() {
    this.clients = new Map<SdkClientType<SdkHttpOperation>, InputClient>();
    this.methods = new Map<SdkServiceMethod<SdkHttpOperation>, InputServiceMethod>();
    this.operations = new Map<SdkHttpOperation, InputOperation>();
    this.methodParmeters = new Map<SdkMethodParameter, InputParameter>();
    this.operationParameters = new Map<SdkHttpParameter, InputParameter>();
    this.properties = new Map<SdkModelPropertyType, InputModelProperty>();
    this.responses = new Map<SdkHttpResponse, OperationResponse>();
    this.types = new Map<SdkType, InputType>();
    this.constants = new Map<SdkConstantType, InputLiteralType>();
    this.crossLanguageDefinitionIds = new Map<string, Type | undefined>();
  }

  updateSdkClientReferences(sdkClient: SdkClientType<SdkHttpOperation>, inputClient: InputClient) {
    this.clients.set(sdkClient, inputClient);
    this.crossLanguageDefinitionIds.set(sdkClient.crossLanguageDefinitionId, sdkClient.__raw.type);
  }

  updateSdkMethodReferences(
    sdkMethod: SdkServiceMethod<SdkHttpOperation>,
    inputMethod: InputServiceMethod,
  ) {
    this.methods.set(sdkMethod, inputMethod);
    this.crossLanguageDefinitionIds.set(sdkMethod.crossLanguageDefinitionId, sdkMethod.__raw);
  }

  updateSdkOperationReferences(sdkOperation: SdkHttpOperation, inputMethod: InputOperation) {
    this.operations.set(sdkOperation, inputMethod);
  }

  updateSdkPropertyReferences(
    sdkProperty: SdkModelPropertyType,
    inputProperty: InputModelProperty,
  ) {
    this.properties.set(sdkProperty, inputProperty);
    this.crossLanguageDefinitionIds.set(sdkProperty.crossLanguageDefinitionId, sdkProperty.__raw);
  }

  updateSdkOperationParameterReferences(
    sdkParameter: SdkHttpParameter | SdkModelPropertyType,
    inputParameter: InputParameter,
  ) {
    this.operationParameters.set(sdkParameter, inputParameter);
    this.crossLanguageDefinitionIds.set(sdkParameter.crossLanguageDefinitionId, sdkParameter.__raw);
  }

  updateSdkMethodParameterReferences(
    sdkMethodParameter: SdkMethodParameter,
    inputParameter: InputParameter,
  ) {
    this.methodParmeters.set(sdkMethodParameter, inputParameter);
    this.crossLanguageDefinitionIds.set(
      sdkMethodParameter.crossLanguageDefinitionId,
      sdkMethodParameter.__raw,
    );
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

  updateConstantCache(sdkType: SdkConstantType, type: InputLiteralType) {
    this.constants.set(sdkType, type);
  }
}
