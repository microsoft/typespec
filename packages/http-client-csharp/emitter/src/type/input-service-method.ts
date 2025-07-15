// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { InputOperation } from "./input-operation.js";
import { InputParameter } from "./input-parameter.js";
import { InputType } from "./input-type.js";
import { OperationFinalStateVia } from "./operation-final-state-via.js";
import { OperationResponse } from "./operation-response.js";
import { ResponseLocation } from "./response-location.js";

export type InputServiceMethod =
  | InputBasicServiceMethod
  | InputPagingServiceMethod
  | InputLongRunningServiceMethod
  | InputLongRunningPagingServiceMethod;

interface InputServiceMethodBase {
  kind: string;
  name: string;
  accessibility?: string;
  apiVersions: string[];
  doc?: string;
  summary?: string;
  operation: InputOperation;
  parameters: InputParameter[];
  response: InputServiceMethodResponse;
  exception?: InputServiceMethodResponse;
  isOverride: boolean;
  generateConvenient: boolean;
  generateProtocol: boolean;
  crossLanguageDefinitionId: string;
}

export interface InputServiceMethodResponse {
  type?: InputType;
  resultSegments?: string[];
}

export interface InputBasicServiceMethod extends InputServiceMethodBase {
  kind: "basic";
}

export interface InputPagingServiceMethod extends InputServiceMethodBase {
  kind: "paging";
  pagingMetadata: InputPagingServiceMetadata;
}

export interface InputPagingServiceMetadata {
  nextLink?: InputNextLink;
  continuationToken?: InputContinuationToken;
  itemPropertySegments: string[];
}

export interface InputNextLink {
  operation?: InputServiceMethod;
  responseSegments: string[];
  responseLocation: ResponseLocation;
  reInjectedParameters?: InputParameter[];
}

export interface InputContinuationToken {
  parameter: InputParameter;
  responseSegments: string[];
  responseLocation: ResponseLocation;
}

export interface InputLongRunningServiceMethod extends InputServiceMethodBase {
  kind: "lro";
  lroMetadata: InputLongRunningServiceMetadata;
}

export interface InputLongRunningServiceMetadata {
  finalStateVia: OperationFinalStateVia;
  finalResponse: OperationResponse;
  resultPath?: string;
}

export interface InputLongRunningPagingServiceMethod extends InputServiceMethodBase {
  kind: "lropaging";
  lroMetadata: InputLongRunningServiceMetadata;
  pagingMetadata?: InputPagingServiceMetadata;
}
