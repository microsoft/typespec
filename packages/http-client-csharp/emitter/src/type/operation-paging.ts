// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { InputOperation } from "./input-operation.js";
import { InputParameter } from "./input-parameter.js";
import { ResponseLocation } from "./response-location.js";

export interface OperationPaging {
  NextLink?: NextLink;
  ContinuationToken?: ContinuationToken;
  ItemPropertySegments: string[];
}

export interface NextLink {
  Operation?: InputOperation;
  ResponseSegments: string[];
  ResponseLocation: ResponseLocation;
}

export interface ContinuationToken {
  Parameter: InputParameter;
  ResponseSegments: string[];
  ResponseLocation: ResponseLocation;
}
