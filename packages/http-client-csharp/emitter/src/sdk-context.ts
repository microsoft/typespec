// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkClientType,
  SdkConstantType,
  SdkContext,
  SdkEnumType,
  SdkHttpOperation,
  SdkHttpResponse,
  SdkModelPropertyType,
  SdkModelType,
  SdkServiceMethod,
  SdkType,
} from "@azure-tools/typespec-client-generator-core";
import { Type } from "@typespec/compiler";
import { Logger } from "./lib/logger.js";
import { CSharpEmitterOptions } from "./options.js";
import { InputOperation } from "./type/input-operation.js";
import { InputParameter } from "./type/input-parameter.js";
import { InputServiceMethod } from "./type/input-service-method.js";
import {
  InputClient,
  InputEnumType,
  InputLiteralType,
  InputModelType,
  InputProperty,
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
  properties: Map<SdkModelPropertyType, InputParameter | InputProperty>; // TODO -- in the near future, we should replace `InputParameter` with those `InputQueryParameter`, etc.
  responses: Map<SdkHttpResponse, OperationResponse>;
  types: Map<SdkType, InputType>;
  models: Map<string, InputModelType>;
  enums: Map<string, InputEnumType>;
  constants: Map<SdkConstantType, InputLiteralType>;
  crossLanguageDefinitionIds: Map<string, Type | undefined>;

  constructor() {
    this.clients = new Map<SdkClientType<SdkHttpOperation>, InputClient>();
    this.methods = new Map<SdkServiceMethod<SdkHttpOperation>, InputServiceMethod>();
    this.operations = new Map<SdkHttpOperation, InputOperation>();
    this.properties = new Map<SdkModelPropertyType, InputParameter | InputProperty>();
    this.responses = new Map<SdkHttpResponse, OperationResponse>();
    this.types = new Map<SdkType, InputType>();
    this.models = new Map<string, InputModelType>();
    this.enums = new Map<string, InputEnumType>();
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
    inputProperty: InputParameter | InputProperty,
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

  updateTypeCache(sdkType: SdkModelType | SdkEnumType | SdkConstantType, type: InputType) {
    if (type.kind === "model" && sdkType.kind === "model") {
      this.models.set(sdkType.name, type);
    } else if (type.kind === "enum" && sdkType.kind === "enum") {
      this.enums.set(sdkType.name, type);
    } else if (type.kind === "constant" && sdkType.kind === "constant") {
      this.constants.set(sdkType, type);
    }
  }
}
