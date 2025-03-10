// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

<<<<<<< HEAD
import {
  SdkContext,
  SdkHttpParameter,
  SdkHttpResponse,
  SdkType,
} from "@azure-tools/typespec-client-generator-core";
=======
import { SdkContext, SdkType } from "@azure-tools/typespec-client-generator-core";
import { Type } from "@typespec/compiler";
>>>>>>> origin/main
import { Logger } from "./lib/logger.js";
import { CSharpEmitterOptions } from "./options.js";
import { InputParameter } from "./type/input-parameter.js";
import { InputEnumType, InputModelType, InputType } from "./type/input-type.js";
import { OperationResponse } from "./type/operation-response.js";

/**
 * The emitter context for the CSharp emitter.
 * @beta
 */
export interface CSharpEmitterContext extends SdkContext<CSharpEmitterOptions> {
  logger: Logger;
  __typeCache: SdkTypeCache;
}

export function createSdkTypeCache(): SdkTypeCache {
  return {
    parameters: new Map<SdkHttpParameter, InputParameter>(),
    responses: new Map<SdkHttpResponse, OperationResponse>(),
    types: new Map<SdkType, InputType>(),
    models: new Map<string, InputModelType>(),
    enums: new Map<string, InputEnumType>(),
    updateSdkParameterReferences(sdkParameter: SdkHttpParameter, inputParameter: InputParameter) {
      this.parameters.set(sdkParameter, inputParameter);
    },
    updateSdkResponseReferences(sdkResponse: SdkHttpResponse, response: OperationResponse) {
      this.responses.set(sdkResponse, response);
    },
    updateSdkTypeReferences(sdkType: SdkType, inputType: InputType) {
      this.types.set(sdkType, inputType);
    },
    updateTypeCache(typeName: string, type: InputType) {
      if (type.kind === "model") {
        this.models.set(typeName, type);
      } else if (type.kind === "enum") {
        this.enums.set(typeName, type);
      }
    },
  };
}

export interface SdkTypeCache {
  parameters: Map<SdkHttpParameter, InputParameter>;
  responses: Map<SdkHttpResponse, OperationResponse>;
  types: Map<SdkType, InputType>;
  models: Map<string, InputModelType>;
  enums: Map<string, InputEnumType>;

  updateSdkParameterReferences(sdkParameter: SdkHttpParameter, parameter: InputParameter): void;
  updateSdkResponseReferences(sdkResponse: SdkHttpResponse, response: OperationResponse): void;
  updateSdkTypeReferences(sdkType: SdkType, inputType: InputType): void;
  updateTypeCache(typeName: string, type: InputType): void;
}
