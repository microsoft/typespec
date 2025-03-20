// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { InputOperation } from "./input-operation.js";
import { InputParameter } from "./input-parameter.js";
import { ResponseLocation } from "./response-location.js";

export interface InputOperationPaging {
  nextLink?: InputNextLink;
  continuationToken?: InputContinuationToken;
  itemPropertySegments: string[];
}

export interface InputNextLink {
  operation?: InputOperation;
  responseSegments: string[];
  responseLocation: ResponseLocation;
}

export interface InputContinuationToken {
  parameter: InputParameter;
  responseSegments: string[];
  responseLocation: ResponseLocation;
}
