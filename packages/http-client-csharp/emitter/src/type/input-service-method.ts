// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.


import { InputParameter } from "./input-parameter.js";
import { InputOperation } from "./input-operation.js";
import { InputServiceMethodResponse } from "./input-service-method-response.js";

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

export interface InputBasicServiceMethod extends InputServiceMethodBase {
  kind: "basic";
}

export interface InputPagingServiceMethod extends InputServiceMethodBase {
  kind: "paging";
  // TO-DO: Add paging properties
}

export interface InputLongRunningServiceMethod extends InputServiceMethodBase {
  kind: "lro";
  // TO-DO: Add LRO properties 
}

export interface InputLongRunningPagingServiceMethod extends InputServiceMethodBase {
  kind: "lropaging";
  // TO-DO: Add LRO paging properties
}
