// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import type { DecoratorInfo } from "@azure-tools/typespec-client-generator-core";
import type { InputHttpOperationExample } from "./input-examples.js";
import type { InputHttpParameter } from "./input-type.js";
import type { OperationResponse } from "./operation-response.js";
import type { RequestMethod } from "./request-method.js";

export interface InputOperation {
  name: string;
  isExactName?: boolean;
  /**
   * The name as written in the spec, prior to any C# name normalization applied to `name`. Always
   * set by the converters; it is the same value as `name` when no normalization rule applied.
   */
  originalName?: string;
  resourceName?: string;
  summary?: string;
  deprecated?: string;
  doc?: string;
  accessibility?: string;
  parameters: InputHttpParameter[];
  responses: OperationResponse[];
  httpMethod: RequestMethod;
  uri: string;
  path: string;
  externalDocsUrl?: string;
  requestMediaTypes?: string[];
  bufferResponse: boolean;
  generateProtocolMethod: boolean;
  generateConvenienceMethod: boolean;
  examples?: InputHttpOperationExample[];
  crossLanguageDefinitionId: string;
  decorators?: DecoratorInfo[];
  namespace?: string;
}
