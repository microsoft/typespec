import {
  SdkAnyExample,
  SdkArrayExample,
  SdkBooleanExample,
  SdkContext,
  SdkDictionaryExample,
  SdkHttpOperationExample,
  SdkHttpParameter,
  SdkHttpParameterExample,
  SdkModelExample,
  SdkNullExample,
  SdkNumberExample,
  SdkStringExample,
  SdkTypeExample,
  SdkUnionExample,
} from "@azure-tools/typespec-client-generator-core";
import { NetEmitterOptions } from "../options.js";
import {
  InputAnyExample,
  InputArrayExample,
  InputBooleanExample,
  InputDictionaryExample,
  InputHttpOperationExample,
  InputModelExample,
  InputNullExample,
  InputNumberExample,
  InputParameterExample,
  InputStringExample,
  InputTypeExample,
  InputUnionExample,
} from "../type/input-operation.js";
import { InputParameter } from "../type/input-parameter.js";
import {
  InputArrayType,
  InputDictionaryType,
  InputModelType,
  InputNullableType,
  InputPrimitiveType,
  InputUnionType,
} from "../type/input-type.js";
import { fromSdkType } from "./converter.js";
import { TypeCache } from "../type/type-cache.js";

export function fromSdkHttpExamples(
  sdkContext: SdkContext<NetEmitterOptions>,
  examples: SdkHttpOperationExample[] | undefined,
  parameterMap: Map<SdkHttpParameter, InputParameter>,
  typeCache: TypeCache
): InputHttpOperationExample[] | undefined {
  if (!examples) return undefined;

  return examples.map((example) => fromSdkHttpExample(example));

  function fromSdkHttpExample(example: SdkHttpOperationExample): InputHttpOperationExample {
    return {
      kind: "http",
      name: example.name,
      description: example.description,
      filePath: example.filePath,
      rawExample: example.rawExample,
      parameters: example.parameters.map((p) => fromSdkParameterExample(p)),
    };
  }

  function fromSdkParameterExample(parameter: SdkHttpParameterExample): InputParameterExample {
    return {
      parameter: parameterMap.get(parameter.parameter)!,
      value: fromSdkExample(parameter.value),
    };
  }

  function fromSdkExample(example: SdkTypeExample): InputTypeExample {
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

  function fromSdkStringExample(example: SdkStringExample): InputStringExample {
    return {
      kind: "string",
      type: fromSdkType(example.type, sdkContext, typeCache),
      value: example.value,
    };
  }

  function fromSdkNumberExample(example: SdkNumberExample): InputNumberExample {
    return {
      kind: "number",
      type: fromSdkType(example.type, sdkContext, typeCache),
      value: example.value,
    };
  }

  function fromSdkBooleanExample(example: SdkBooleanExample): InputBooleanExample {
    return {
      kind: example.kind,
      type: fromSdkType(example.type, sdkContext, typeCache) as InputPrimitiveType,
      value: example.value,
    };
  }

  function fromSdkUnionExample(example: SdkUnionExample): InputUnionExample {
    return {
      kind: example.kind,
      type: fromSdkType(example.type, sdkContext, typeCache) as InputUnionType,
      value: example.value,
    };
  }

  function fromSdkArrayExample(example: SdkArrayExample): InputArrayExample {
    return {
      kind: example.kind,
      type: fromSdkType(example.type, sdkContext, typeCache) as InputArrayType,
      value: example.value.map((v) => fromSdkExample(v)),
    };
  }

  function fromSdkDictionaryExample(example: SdkDictionaryExample): InputDictionaryExample {
    return {
      kind: example.kind,
      type: fromSdkType(example.type, sdkContext, typeCache) as InputDictionaryType,
      value: fromExampleRecord(example.value),
    };
  }

  function fromSdkModelExample(example: SdkModelExample): InputModelExample {
    return {
      kind: example.kind,
      type: fromSdkType(example.type, sdkContext, typeCache) as InputModelType,
      value: fromExampleRecord(example.value),
      additionalPropertiesValue: example.additionalPropertiesValue
        ? fromExampleRecord(example.additionalPropertiesValue)
        : undefined,
    };
  }

  function fromSdkAnyExample(example: SdkAnyExample): InputAnyExample {
    return {
      kind: example.kind,
      type: fromSdkType(example.type, sdkContext, typeCache) as InputPrimitiveType,
      value: example.value,
    };
  }

  function fromSdkNullExample(example: SdkNullExample): InputNullExample {
    return {
      kind: example.kind,
      type: fromSdkType(example.type, sdkContext, typeCache) as InputNullableType,
      value: example.value,
    };
  }

  function fromExampleRecord(
    value: Record<string, SdkTypeExample>
  ): Record<string, InputTypeExample> {
    return Object.entries(value).reduce(
      (acc, [key, value]) => {
        acc[key] = fromSdkExample(value);
        return acc;
      },
      {} as Record<string, InputTypeExample>
    );
  }
}
