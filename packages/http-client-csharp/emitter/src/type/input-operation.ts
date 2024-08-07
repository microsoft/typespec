// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { BodyMediaType } from "./body-media-type.js";
import { InputParameter } from "./input-parameter.js";
import { OperationLongRunning } from "./operation-long-running.js";
import { OperationPaging } from "./operation-paging.js";
import { OperationResponse } from "./operation-response.js";
import { RequestMethod } from "./request-method.js";

export interface Paging {
  NextLinkName?: string;
  ItemName: string;
  NextPageMethod?: string;
}

export interface InputOperation {
  Name: string;
  ResourceName?: string;
  Summary?: string;
  Deprecated?: string;
  Description?: string;
  Accessibility?: string;
  Parameters: InputParameter[];
  Responses: OperationResponse[];
  HttpMethod: RequestMethod;
  RequestBodyMediaType: BodyMediaType;
  Uri: string;
  Path: string;
  ExternalDocsUrl?: string;
  RequestMediaTypes?: string[];
  BufferResponse: boolean;
  LongRunning?: OperationLongRunning;
  Paging?: OperationPaging;
  GenerateProtocolMethod: boolean;
  GenerateConvenienceMethod: boolean;
  CrossLanguageDefinitionId: string;
}
