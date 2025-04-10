// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { InputOperation } from "./input-operation.js";
import { InputParameter } from "./input-parameter.js";
import { InputType } from "./input-type.js";

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
}

export interface InputLongRunningServiceMethod extends InputServiceMethodBase {
  kind: "lro";
}

export interface InputLongRunningPagingServiceMethod extends InputServiceMethodBase {
  kind: "lropaging";
}

export interface InputServiceMethodResponse {
  type?: InputType;
  resultSegments?: string[];
}
