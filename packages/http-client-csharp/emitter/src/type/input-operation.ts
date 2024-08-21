// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { DecoratorInfo } from "@azure-tools/typespec-client-generator-core";
import { BodyMediaType } from "./body-media-type.js";
import { InputParameter } from "./input-parameter.js";
import {
  InputArrayType,
  InputDictionaryType,
  InputLiteralType,
  InputModelType,
  InputNullableType,
  InputPrimitiveType,
  InputType,
  InputUnionType,
} from "./input-type.js";
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
  Examples?: InputHttpOperationExample[];
  CrossLanguageDefinitionId: string;
  Decorators?: DecoratorInfo[];
}

interface InputExampleBase {
  kind: string;
  name: string;
  description: string;
  filePath: string;
  rawExample: any;
}

export interface InputHttpOperationExample extends InputExampleBase {
  kind: "http";
  parameters: InputParameterExample[];
  responses: Map<number, OperationResponseExample>;
}

export interface InputParameterExample {
  parameter: InputParameter;
  value: InputTypeExample;
}

export interface OperationResponseExample {
    response: OperationResponse;
    // headers: SdkHttpResponseHeaderExample[];
    bodyValue?: InputTypeExample;
}

export type InputTypeExample =
  | InputStringExample
  | InputNumberExample
  | InputBooleanExample
  | InputNullExample
  | InputAnyExample
  | InputArrayExample
  | InputDictionaryExample
  | InputUnionExample
  | InputModelExample;

export interface InputExampleTypeBase {
  kind: string;
  type: InputType;
  value: unknown;
}
export interface InputStringExample extends InputExampleTypeBase {
  kind: "string";
  type: InputType;
  value: string;
}
export interface InputNumberExample extends InputExampleTypeBase {
  kind: "number";
  type: InputType;
  value: number;
}
export interface InputBooleanExample extends InputExampleTypeBase {
  kind: "boolean";
  type: InputPrimitiveType | InputLiteralType;
  value: boolean;
}
export interface InputNullExample extends InputExampleTypeBase {
  kind: "null";
  type: InputNullableType;
  value: null;
}
export interface InputAnyExample extends InputExampleTypeBase {
  kind: "any";
  type: InputPrimitiveType;
  value: unknown;
}
export interface InputArrayExample extends InputExampleTypeBase {
  kind: "array";
  type: InputArrayType;
  value: InputTypeExample[];
}
export interface InputDictionaryExample extends InputExampleTypeBase {
  kind: "dict";
  type: InputDictionaryType;
  value: Record<string, InputTypeExample>;
}
export interface InputUnionExample extends InputExampleTypeBase {
  kind: "union";
  type: InputUnionType;
  value: unknown;
}
export interface InputModelExample extends InputExampleTypeBase {
  kind: "model";
  type: InputModelType;
  value: Record<string, InputTypeExample>;
  additionalPropertiesValue?: Record<string, InputTypeExample>;
}
