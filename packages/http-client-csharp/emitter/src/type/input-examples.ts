// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

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
import { OperationResponse } from "./operation-response.js";

interface InputExampleBase {
  kind: string;
  name: string;
  description: string;
  filePath: string;
  rawExample: any;
}

export interface InputHttpOperationExample extends InputExampleBase {
  kind: "http";
  parameters: InputParameterExampleValue[];
  responses: Map<number, OperationResponseExample>;
}

export interface InputParameterExampleValue {
  parameter: InputParameter;
  value: InputTypeExampleValue;
}

export interface OperationResponseExample {
  response: OperationResponse;
  // headers: SdkHttpResponseHeaderExample[];
  bodyValue?: InputTypeExampleValue;
}

export type InputTypeExampleValue =
  | InputStringExampleValue
  | InputNumberExampleValue
  | InputBooleanExampleValue
  | InputNullExampleValue
  | InputAnyExampleValue
  | InputArrayExampleValue
  | InputDictionaryExampleValue
  | InputUnionExampleValue
  | InputModelExampleValue;

export interface InputExampleTypeValueBase {
  kind: string;
  type: InputType;
  value: unknown;
}
export interface InputStringExampleValue extends InputExampleTypeValueBase {
  kind: "string";
  type: InputType;
  value: string;
}
export interface InputNumberExampleValue extends InputExampleTypeValueBase {
  kind: "number";
  type: InputType;
  value: number;
}
export interface InputBooleanExampleValue extends InputExampleTypeValueBase {
  kind: "boolean";
  type: InputPrimitiveType | InputLiteralType;
  value: boolean;
}
export interface InputNullExampleValue extends InputExampleTypeValueBase {
  kind: "null";
  type: InputNullableType;
  value: null;
}
export interface InputAnyExampleValue extends InputExampleTypeValueBase {
  kind: "any";
  type: InputPrimitiveType;
  value: unknown;
}
export interface InputArrayExampleValue extends InputExampleTypeValueBase {
  kind: "array";
  type: InputArrayType;
  value: InputTypeExampleValue[];
}
export interface InputDictionaryExampleValue extends InputExampleTypeValueBase {
  kind: "dict";
  type: InputDictionaryType;
  value: Record<string, InputTypeExampleValue>;
}
export interface InputUnionExampleValue extends InputExampleTypeValueBase {
  kind: "union";
  type: InputUnionType;
  value: unknown;
}
export interface InputModelExampleValue extends InputExampleTypeValueBase {
  kind: "model";
  type: InputModelType;
  value: Record<string, InputTypeExampleValue>;
  additionalPropertiesValue?: Record<string, InputTypeExampleValue>;
}
