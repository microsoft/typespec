// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { DecoratorInfo } from "@azure-tools/typespec-client-generator-core";
import { InputHttpOperationExample } from "./input-examples.js";
import { InputHttpParameter } from "./input-type.js";
import { OperationResponse } from "./operation-response.js";
import { RequestMethod } from "./request-method.js";

export interface InputOperation {
  name: string;
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
}
