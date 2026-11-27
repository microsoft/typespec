// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import type { InputOperation } from "./input-operation.js";
import type {
  InputMethodParameter,
  InputModelProperty,
  InputModelType,
  InputParameter,
  InputType,
} from "./input-type.js";
import type { OperationFinalStateVia } from "./operation-final-state-via.js";
import type { OperationResponse } from "./operation-response.js";
import type { ResponseLocation } from "./response-location.js";

export type InputServiceMethod =
  | InputBasicServiceMethod
  | InputPagingServiceMethod
  | InputLongRunningServiceMethod
  | InputLongRunningPagingServiceMethod;

interface InputServiceMethodBase {
  kind: string;
  name: string;
  isExactName?: boolean;
  accessibility?: string;
  apiVersions: string[];
  doc?: string;
  summary?: string;
  operation: InputOperation;
  parameters: InputMethodParameter[];
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
  pageSizeParameterSegments?: string[];
}

export interface InputNextLink {
  operation?: InputServiceMethod;
  verb?: "GET" | "POST";
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
  /** The status-monitor (polling) response model. Present when `statusMetadata` is present. */
  pollingResponseModel?: InputModelType;
  /** Values selected by `@lroStatusMetadata` from the latest status-monitor response. */
  statusMetadata?: InputLroStatusMetadata[];
}

export interface InputLroStatusMetadata {
  /** The selected property of `pollingResponseModel` (or one of its base models). */
  property: InputModelProperty;
  /** Property path from `pollingResponseModel` to the selected value. */
  propertySegments: InputModelProperty[];
}

export interface InputLongRunningPagingServiceMethod extends InputServiceMethodBase {
  kind: "lropaging";
  lroMetadata: InputLongRunningServiceMetadata;
  pagingMetadata?: InputPagingServiceMetadata;
}
