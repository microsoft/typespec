// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { SdkContext, SdkType } from "@azure-tools/typespec-client-generator-core";
import { Logger } from "./lib/logger.js";
import { CSharpEmitterOptions } from "./options.js";
import { InputEnumType, InputModelType, InputType } from "./type/type-interfaces.js";

export interface CSharpEmitterContext extends SdkContext<CSharpEmitterOptions> {
  __typeCache: SdkTypeMap;
  logger: Logger;
}

export interface SdkTypeMap {
  types: Map<SdkType, InputType>;
  models: Map<string, InputModelType>;
  enums: Map<string, InputEnumType>;
}
