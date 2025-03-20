// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkClientType,
  SdkContext,
  SdkHttpOperation,
  SdkType,
} from "@azure-tools/typespec-client-generator-core";
import { Type } from "@typespec/compiler";
import { Logger } from "./lib/logger.js";
import { CSharpEmitterOptions } from "./options.js";
import { InputClient, InputEnumType, InputModelType, InputType } from "./type/input-type.js";

/**
 * The emitter context for the CSharp emitter.
 * @beta
 */
export interface CSharpEmitterContext extends SdkContext<CSharpEmitterOptions> {
  logger: Logger;
  __typeCache: SdkTypeMap;
}

export interface SdkTypeMap {
  crossLanguageDefinitionIds: Map<string, Type | undefined>;
  clients: Map<SdkClientType<SdkHttpOperation>, InputClient>;
  types: Map<SdkType, InputType>;
  models: Map<string, InputModelType>;
  enums: Map<string, InputEnumType>;
}
