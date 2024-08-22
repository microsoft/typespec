// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkAnyExample,
  SdkArrayExample,
  SdkBooleanExample,
  SdkContext,
  SdkDictionaryExample,
  SdkHttpOperationExample,
  SdkHttpParameter,
  SdkHttpParameterExample,
  SdkHttpResponse,
  SdkHttpResponseExample,
  SdkModelExample,
  SdkNullExample,
  SdkNumberExample,
  SdkStringExample,
  SdkTypeExample,
  SdkUnionExample,
} from "@azure-tools/typespec-client-generator-core";
import { NetEmitterOptions } from "../options.js";
import {
  InputAnyExampleValue,
  InputArrayExampleValue,
  InputBooleanExampleValue,
  InputDictionaryExampleValue,
  InputExampleValue,
  InputHttpOperationExample,
  InputModelExampleValue,
  InputNullExampleValue,
  InputNumberExampleValue,
  InputParameterExampleValue,
  InputStringExampleValue,
  InputUnionExampleValue,
  OperationResponseExample,
} from "../type/input-examples.js";
import { InputParameter } from "../type/input-parameter.js";
import {
  InputArrayType,
  InputDictionaryType,
  InputModelType,
  InputNullableType,
  InputPrimitiveType,
  InputUnionType,
} from "../type/input-type.js";
import { OperationResponse } from "../type/operation-response.js";
import { SdkTypeMap } from "../type/sdk-type-map.js";
import { fromSdkType } from "./converter.js";

export function fromSdkHttpExamples(
  sdkContext: SdkContext<NetEmitterOptions>,
  examples: SdkHttpOperationExample[],
  parameterMap: Map<SdkHttpParameter, InputParameter>,
  responseMap: Map<SdkHttpResponse, OperationResponse>,
  typeMap: SdkTypeMap
): InputHttpOperationExample[] {
  return examples.map((example) => fromSdkHttpExample(example));

  function fromSdkHttpExample(example: SdkHttpOperationExample): InputHttpOperationExample {
    return {
      kind: "http",
      name: example.name,
      description: example.description,
      filePath: example.filePath,
      rawExample: example.rawExample,
      parameters: example.parameters.map((p) => fromSdkParameterExample(p)),
      responses: fromSdkOperationResponses(example.responses),
    };
  }

  function fromSdkParameterExample(parameter: SdkHttpParameterExample): InputParameterExampleValue {
    return {
      parameter: parameterMap.get(parameter.parameter)!,
      value: fromSdkExample(parameter.value),
    };
  }

  function fromSdkOperationResponses(
    responses: Map<number, SdkHttpResponseExample>
  ): Map<number, OperationResponseExample> {
    const result = new Map<number, OperationResponseExample>();
    for (const [status, response] of responses) {
      result.set(status, fromSdkOperationResponse(response));
    }
    return result;
  }

  function fromSdkOperationResponse(response: SdkHttpResponseExample): OperationResponseExample {
    return {
      response: responseMap.get(response.response)!,
      bodyValue: response.bodyValue ? fromSdkExample(response.bodyValue) : undefined,
    };
  }

  function fromSdkExample(example: SdkTypeExample): InputExampleValue {
    switch (example.kind) {
      case "string":
        return fromSdkStringExample(example);
      case "number":
        return fromSdkNumberExample(example);
      case "boolean":
        return fromSdkBooleanExample(example);
      case "union":
        return fromSdkUnionExample(example);
      case "array":
        return fromSdkArrayExample(example);
      case "dict":
        return fromSdkDictionaryExample(example);
      case "model":
        return fromSdkModelExample(example);
      case "any":
        return fromSdkAnyExample(example);
      case "null":
        return fromSdkNullExample(example);
    }
  }

  function fromSdkStringExample(example: SdkStringExample): InputStringExampleValue {
    return {
      kind: "string",
      type: fromSdkType(example.type, sdkContext, typeMap),
      value: example.value,
    };
  }

  function fromSdkNumberExample(example: SdkNumberExample): InputNumberExampleValue {
    return {
      kind: "number",
      type: fromSdkType(example.type, sdkContext, typeMap),
      value: example.value,
    };
  }

  function fromSdkBooleanExample(example: SdkBooleanExample): InputBooleanExampleValue {
    return {
      kind: example.kind,
      type: fromSdkType(example.type, sdkContext, typeMap) as InputPrimitiveType,
      value: example.value,
    };
  }

  function fromSdkUnionExample(example: SdkUnionExample): InputUnionExampleValue {
    return {
      kind: example.kind,
      type: fromSdkType(example.type, sdkContext, typeMap) as InputUnionType,
      value: example.value,
    };
  }

  function fromSdkArrayExample(example: SdkArrayExample): InputArrayExampleValue {
    return {
      kind: example.kind,
      type: fromSdkType(example.type, sdkContext, typeMap) as InputArrayType,
      value: example.value.map((v) => fromSdkExample(v)),
    };
  }

  function fromSdkDictionaryExample(example: SdkDictionaryExample): InputDictionaryExampleValue {
    return {
      kind: example.kind,
      type: fromSdkType(example.type, sdkContext, typeMap) as InputDictionaryType,
      value: fromExampleRecord(example.value),
    };
  }

  function fromSdkModelExample(example: SdkModelExample): InputModelExampleValue {
    return {
      kind: example.kind,
      type: fromSdkType(example.type, sdkContext, typeMap) as InputModelType,
      value: fromExampleRecord(example.value),
      additionalPropertiesValue: example.additionalPropertiesValue
        ? fromExampleRecord(example.additionalPropertiesValue)
        : undefined,
    };
  }

  function fromSdkAnyExample(example: SdkAnyExample): InputAnyExampleValue {
    return {
      kind: example.kind,
      type: fromSdkType(example.type, sdkContext, typeMap) as InputPrimitiveType,
      value: example.value,
    };
  }

  function fromSdkNullExample(example: SdkNullExample): InputNullExampleValue {
    return {
      kind: example.kind,
      type: fromSdkType(example.type, sdkContext, typeMap) as InputNullableType,
      value: example.value,
    };
  }

  function fromExampleRecord(
    value: Record<string, SdkTypeExample>
  ): Record<string, InputExampleValue> {
    return Object.entries(value).reduce(
      (acc, [key, value]) => {
        acc[key] = fromSdkExample(value);
        return acc;
      },
      {} as Record<string, InputExampleValue>
    );
  }
}
