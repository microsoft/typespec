// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { DecoratorInfo } from "@azure-tools/typespec-client-generator-core";
import { InputConstant } from "./input-constant.js";
import { InputOperationParameterKind } from "./input-operation-parameter-kind.js";
import { InputType } from "./input-type.js";
import { RequestLocation } from "./request-location.js";

export interface InputParameter {
  name: string;
  nameInRequest: string;
  summary?: string;
  doc?: string;
  type: InputType;
  location: RequestLocation;
  defaultValue?: InputConstant;
  groupedBy?: InputParameter;
  kind: InputOperationParameterKind;
  isRequired: boolean;
  isApiVersion: boolean;
  isContentType: boolean;
  isEndpoint: boolean;
  skipUrlEncoding: boolean;
  explode: boolean;
  arraySerializationDelimiter?: string;
  headerCollectionPrefix?: string;
  decorators?: DecoratorInfo[];
}
