import {
  BooleanValue,
  EncodeData,
  Example,
  getEncode,
  getOpExamples,
  ignoreDiagnostics,
  ModelProperty,
  NumericValue,
  OpExample,
  Program,
  serializeValueAsJson,
  StringValue,
  Type,
  Value,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import {
  isHeader,
  type HttpOperation,
  type HttpOperationResponse,
  type HttpOperationResponseContent,
  type HttpProperty,
  type HttpStatusCodeRange,
} from "@typespec/http";
import { ExperimentalParameterExamplesStrategy } from "./lib.js";
import { getParameterStyle } from "./parameters.js";
import { getOpenAPI3StatusCodes } from "./status-codes.js";
import { OpenAPI3Example, OpenAPI3MediaType } from "./types.js";
import {
  HttpParameterProperties,
  isHttpParameterProperty,
  isSharedHttpOperation,
  SharedHttpOperation,
} from "./util.js";

export interface OperationExamples {
  requestBody: Record<string, [Example, Type][]>;
  parameters: Record<string, [Example, Type][]>;
  responses: Record<string, Record<string, [Example, Type][]>>;
}

type ResolveOperationExamplesOptions = {
  parameterExamplesStrategy?: ExperimentalParameterExamplesStrategy;
};

export function resolveOperationExamples(
  program: Program,
  operation: HttpOperation | SharedHttpOperation,
  { parameterExamplesStrategy }: ResolveOperationExamplesOptions,
): OperationExamples {
  const examples = findOperationExamples(program, operation);
  const result: OperationExamples = { requestBody: {}, parameters: {}, responses: {} };
  if (examples.length === 0) {
    return result;
  }
  for (const [op, example] of examples) {
    if (example.parameters && op.parameters.body) {
      const contentTypeValue =
        getContentTypeValue(example.parameters, op.parameters.properties) ?? "application/json";
      result.requestBody[contentTypeValue] ??= [];
      const value = getBodyValue(example.parameters, op.parameters.properties);
      if (value) {
        result.requestBody[contentTypeValue].push([
          {
            value,
            title: example.title,
            description: example.description,
          },
          op.parameters.body.type,
        ]);
      }
    }

    if (example.parameters) {
      // iterate over properties
      for (const property of op.parameters.properties) {
        if (!isHttpParameterProperty(property)) continue;

        const value = getParameterValue(
          program,
          example.parameters,
          property,
          parameterExamplesStrategy,
        );
        if (value) {
          const parameterName = property.options.name;
          result.parameters[parameterName] ??= [];
          result.parameters[parameterName].push([
            {
              value,
              title: example.title,
              description: example.description,
            },
            property.property as Type,
          ]);
        }
      }
    }

    if (example.returnType && op.responses) {
      const match = findResponseForExample(program, example.returnType, op.responses);
      if (match) {
        const value = getBodyValue(example.returnType, match.response.properties);
        if (value) {
          for (const statusCode of match.statusCodes) {
            result.responses[statusCode] ??= {};
            result.responses[statusCode][match.contentType] ??= [];
            result.responses[statusCode][match.contentType].push([
              {
                value,
                title: example.title,
                description: example.description,
              },
              match.response.body!.type,
            ]);
          }
        }
      }
    }
  }
  return result;
}

function findOperationExamples(
  program: Program,
  operation: HttpOperation | SharedHttpOperation,
): [HttpOperation, OpExample][] {
  if (isSharedHttpOperation(operation)) {
    return operation.operations.flatMap((op) =>
      getOpExamples(program, op.operation).map((x): [HttpOperation, OpExample] => [op, x]),
    );
  } else {
    return getOpExamples(program, operation.operation).map((x) => [operation, x]);
  }
}

function isStatusCodeIn(
  exampleStatusCode: number,
  statusCodes: number | HttpStatusCodeRange | "*",
) {
  if (statusCodes === "*") {
    return true;
  }
  if (typeof statusCodes === "number") {
    return exampleStatusCode === statusCodes;
  }

  return exampleStatusCode >= statusCodes.start && exampleStatusCode <= statusCodes.end;
}
function findResponseForExample(
  program: Program,
  exampleValue: Value,
  responses: HttpOperationResponse[],
):
  | { contentType: string; statusCodes: string[]; response: HttpOperationResponseContent }
  | undefined {
  const tentatives: [
    { response: HttpOperationResponseContent; contentType?: string; statusCodes?: string[] },
    number,
  ][] = [];
  for (const statusCodeResponse of responses) {
    for (const response of statusCodeResponse.responses) {
      if (response.body === undefined) {
        continue;
      }
      const contentType = getContentTypeValue(exampleValue, response.properties);
      const statusCode = getStatusCodeValue(exampleValue, response.properties);
      const contentTypeProp = response.properties.find((x) => x.kind === "contentType"); // if undefined MUST be application/json
      const statusCodeProp = response.properties.find((x) => x.kind === "statusCode"); // if undefined MUST be 200

      const statusCodeMatch =
        statusCode && statusCodeProp && isStatusCodeIn(statusCode, statusCodeResponse.statusCodes);
      const contentTypeMatch = contentType && response.body?.contentTypes.includes(contentType);
      if (statusCodeMatch && contentTypeMatch) {
        return {
          contentType,
          statusCodes: ignoreDiagnostics(
            getOpenAPI3StatusCodes(
              program,
              statusCodeResponse.statusCodes,
              statusCodeResponse.type,
            ),
          ),
          response,
        };
      } else if (statusCodeMatch && contentTypeProp === undefined) {
        tentatives.push([
          {
            response,
            statusCodes: ignoreDiagnostics(
              getOpenAPI3StatusCodes(
                program,
                statusCodeResponse.statusCodes,
                statusCodeResponse.type,
              ),
            ),
          },
          1,
        ]);
      } else if (contentTypeMatch && statusCodeMatch === undefined) {
        tentatives.push([{ response, contentType }, 1]);
      } else if (contentTypeProp === undefined && statusCodeProp === undefined) {
        tentatives.push([{ response }, 0]);
      }
    }
  }
  const tentative = tentatives.sort((a, b) => a[1] - b[1]).pop();
  if (tentative) {
    return {
      contentType: tentative[0].contentType ?? "application/json",
      statusCodes: tentative[0].statusCodes ?? ["200"],
      response: tentative[0].response,
    };
  }
  return undefined;
}

/**
 * Only returns an encoding if one is not explicitly defined
 */
function getDefaultHeaderEncodeAs(program: Program, header: ModelProperty): EncodeData | undefined {
  // Get existing encoded data if it has been explicitly defined
  const encodeData = getEncode(program, header);
  // If there's an explicit encoding, return undefined
  if (encodeData) return;

  const tk = $(program);

  if (!tk.scalar.isUtcDateTime(header.type) && tk.scalar.isOffsetDateTime(header.type)) {
    return;
  }

  if (!tk.scalar.is(header.type)) return;

  // Use the default encoding for date-time headers
  return {
    encoding: "rfc7231",
    type: header.type,
  };
}

/**
 * This function should only be used for special default encodings.
 */
function getEncodeAs(program: Program, type: Type): EncodeData | undefined {
  if (isHeader(program, type)) {
    return getDefaultHeaderEncodeAs(program, type as ModelProperty);
  }

  return undefined;
}

export function getExampleOrExamples(
  program: Program,
  examples: [Example, Type][],
): Pick<OpenAPI3MediaType, "example" | "examples"> {
  if (examples.length === 0) {
    return {};
  }

  if (
    examples.length === 1 &&
    examples[0][0].title === undefined &&
    examples[0][0].description === undefined
  ) {
    const [example, type] = examples[0];
    const encodeAs = getEncodeAs(program, type);
    return { example: serializeValueAsJson(program, example.value, type, encodeAs) };
  } else {
    const exampleObj: Record<string, OpenAPI3Example> = {};
    for (const [index, [example, type]] of examples.entries()) {
      const encodeAs = getEncodeAs(program, type);
      exampleObj[example.title ?? `example${index}`] = {
        summary: example.title,
        description: example.description,
        value: serializeValueAsJson(program, example.value, type, encodeAs),
      };
    }
    return { examples: exampleObj };
  }
}

export function getStatusCodeValue(value: Value, properties: HttpProperty[]): number | undefined {
  const statusCodeProperty = properties.find((p) => p.kind === "statusCode");
  if (statusCodeProperty === undefined) {
    return undefined;
  }

  const statusCode = getValueByPath(value, statusCodeProperty.path);
  if (statusCode?.valueKind === "NumericValue") {
    return statusCode.value.asNumber() ?? undefined;
  }
  return undefined;
}

export function getContentTypeValue(value: Value, properties: HttpProperty[]): string | undefined {
  const contentTypeProperty = properties.find((p) => p.kind === "contentType");
  if (contentTypeProperty === undefined) {
    return undefined;
  }

  const statusCode = getValueByPath(value, contentTypeProperty.path);
  if (statusCode?.valueKind === "StringValue") {
    return statusCode.value;
  }
  return undefined;
}

export function getBodyValue(value: Value, properties: HttpProperty[]): Value | undefined {
  const bodyProperty = properties.find((p) => p.kind === "body" || p.kind === "bodyRoot");
  if (bodyProperty !== undefined) {
    return getValueByPath(value, bodyProperty.path);
  }

  return value;
}

function getParameterValue(
  program: Program,
  parameterExamples: Value,
  property: HttpParameterProperties,
  parameterExamplesStrategy?: ExperimentalParameterExamplesStrategy,
): Value | undefined {
  if (!parameterExamplesStrategy) {
    return;
  }

  const value = getValueByPath(parameterExamples, property.path);
  if (!value) return;

  if (parameterExamplesStrategy === "data") {
    return value;
  }

  // Depending on the parameter type, we may need to serialize the value differently.
  // https://spec.openapis.org/oas/v3.0.4.html#style-examples
  /*
  Supported styles per location: https://spec.openapis.org/oas/v3.0.4.html#style-values
  | Location | Default Style | Supported Styles                                |
  | -------- | ------------- | ----------------------------------------------- |
  | query    | form          | form, spaceDelimited, pipeDelimited, deepObject |
  | header   | simple        | simple                                          |
  | path     | simple        | simple, label, matrix                           |
  | cookie   | form          | form                                            |
  */
  // explode is only relevant for array/object types

  if (property.kind === "query") {
    return getQueryParameterValue(program, value, property);
  } else if (property.kind === "header") {
    return getHeaderParameterValue(program, value, property);
  } else if (property.kind === "path") {
    return getPathParameterValue(program, value, property);
  } else if (property.kind === "cookie") {
    return getCookieParameterValue(program, value, property);
  }

  return value;
}

function getQueryParameterValue(
  program: Program,
  originalValue: Value,
  property: Extract<HttpParameterProperties, { kind: "query" }>,
): Value | undefined {
  const style = getParameterStyle(program, property.property) ?? "form";

  switch (style) {
    case "form":
      return getParameterFormValue(program, originalValue, property);
    case "spaceDelimited":
      return getParameterDelimitedValue(program, originalValue, property, " ");
    case "pipeDelimited":
      return getParameterDelimitedValue(program, originalValue, property, "|");
  }
}

function getHeaderParameterValue(
  program: Program,
  originalValue: Value,
  property: Extract<HttpParameterProperties, { kind: "header" }>,
): Value | undefined {
  return getParameterSimpleValue(program, originalValue, property);
}

function getPathParameterValue(
  program: Program,
  originalValue: Value,
  property: Extract<HttpParameterProperties, { kind: "path" }>,
): Value | undefined {
  const { style } = property.options;

  if (style === "label") {
    return getParameterLabelValue(program, originalValue, property);
  } else if (style === "matrix") {
    return getParameterMatrixValue(program, originalValue, property);
  } else if (style === "simple") {
    return getParameterSimpleValue(program, originalValue, property);
  }

  return undefined;
}

function getCookieParameterValue(
  program: Program,
  originalValue: Value,
  property: Extract<HttpParameterProperties, { kind: "cookie" }>,
): Value | undefined {
  return getParameterFormValue(program, originalValue, property);
}

function getParameterLabelValue(
  program: Program,
  originalValue: Value,
  property: Extract<HttpParameterProperties, { kind: "path" }>,
): Value | undefined {
  const { explode } = property.options;
  const tk = $(program);

  /*
    https://spec.openapis.org/oas/v3.0.4.html#style-examples
      string -> "blue"
      array -> ["blue", "black", "brown"]
      object -> { "R": 100, "G": 200, "B": 150 }

    | explode | string  | array             | object             |
    | ------- | ------- | ----------------- | ------------------ |
    | false   | .blue   | .blue,black,brown | .R,100,G,200,B,150 |
    | true    | .blue   | .blue.black.brown | .R=100.G=200.B=150 |
  */

  const joiner = explode ? "." : ",";
  if (tk.value.isArray(originalValue)) {
    const pairs: string[] = [];
    for (const value of originalValue.values) {
      if (!isSerializableScalarValue(value)) continue;
      pairs.push(`${value.value}`);
    }
    return tk.value.createString(`.${pairs.join(joiner)}`);
  }

  if (tk.value.isObject(originalValue)) {
    const pairs: string[] = [];
    for (const [key, { value }] of originalValue.properties) {
      if (!isSerializableScalarValue(value)) continue;
      const sep = explode ? "=" : ",";
      pairs.push(`${key}${sep}${value.value}`);
    }
    return tk.value.createString(`.${pairs.join(joiner)}`);
  }

  // null (undefined) is treated as a a dot
  if (tk.value.isNull(originalValue)) {
    return tk.value.createString(".");
  }

  if (isSerializableScalarValue(originalValue)) {
    return tk.value.createString(`.${originalValue.value}`);
  }

  return;
}

function getParameterMatrixValue(
  program: Program,
  originalValue: Value,
  property: Extract<HttpParameterProperties, { kind: "path" }>,
): Value | undefined {
  const { explode, name } = property.options;
  const tk = $(program);

  /*
    https://spec.openapis.org/oas/v3.0.4.html#style-examples
      string -> "blue"
      array -> ["blue", "black", "brown"]
      object -> { "R": 100, "G": 200, "B": 150 }

    | explode | string        | array                               | object                   |
    | ------- | ------------- | ----------------------------------- | ------------------------ |
    | false   | ;color=blue   | ;color=blue,black,brown             | ;color=R,100,G,200,B,150 |
    | true    | ;color=blue   | ;color=blue;color=black;color=brown | ;R=100;G=200;B=150       |
  */

  const joiner = explode ? ";" : ",";
  const prefix = explode ? "" : `${name}=`;
  if (tk.value.isArray(originalValue)) {
    const pairs: string[] = [];
    for (const value of originalValue.values) {
      if (!isSerializableScalarValue(value)) continue;
      pairs.push(explode ? `${name}=${value.value}` : `${value.value}`);
    }
    return tk.value.createString(`;${prefix}${pairs.join(joiner)}`);
  }

  if (tk.value.isObject(originalValue)) {
    const sep = explode ? "=" : ",";
    const pairs: string[] = [];
    for (const [key, { value }] of originalValue.properties) {
      if (!isSerializableScalarValue(value)) continue;
      pairs.push(`${key}${sep}${value.value}`);
    }
    return tk.value.createString(`;${prefix}${pairs.join(joiner)}`);
  }

  if (tk.value.isNull(originalValue)) {
    return tk.value.createString(`;${name}`);
  }

  if (isSerializableScalarValue(originalValue)) {
    return tk.value.createString(`;${name}=${originalValue.value}`);
  }

  return;
}

function getParameterDelimitedValue(
  program: Program,
  originalValue: Value,
  property: Extract<HttpParameterProperties, { kind: "query" }>,
  delimiter: " " | "|",
): Value | undefined {
  const { explode, name } = property.options;
  // Serialization is undefined for explode=true
  if (explode) return undefined;

  const tk = $(program);
  // cspell: ignore Cblack Cbrown
  /*
    https://spec.openapis.org/oas/v3.0.4.html#style-examples
      array -> ["blue", "black", "brown"]
      object -> { "R": 100, "G": 200, "B": 150 }

    | style | explode | string | array                      | object                            |
    | ----- | ------- | ------ | -------------------------- | ----------------------------------|
    | pipe  | false   | n/a    | color=blue%7Cblack%7Cbrown | color=R%7C100%7CG%7C200%7CB%7C150 |
    | pipe  | true    | n/a    | n/a                        | n/a                               |
    | space | false   | n/a    | color=blue%20black%20brown | color=R%20100%20G%20200%20B%20150 |
    | space | true    | n/a    | n/a                        | n/a                               |
  */

  if (tk.value.isArray(originalValue)) {
    const pairs: string[] = [];
    for (const value of originalValue.values) {
      if (!isSerializableScalarValue(value)) continue;
      pairs.push(`${value.value}`);
    }
    return tk.value.createString(`${name}=${encodeURIComponent(pairs.join(delimiter))}`);
  }

  if (tk.value.isObject(originalValue)) {
    const pairs: string[] = [];
    for (const [key, { value }] of originalValue.properties) {
      if (!isSerializableScalarValue(value)) continue;
      pairs.push(`${key}${delimiter}${value.value}`);
    }
    return tk.value.createString(`${name}=${encodeURIComponent(pairs.join(delimiter))}`);
  }

  return undefined;
}

function getParameterFormValue(
  program: Program,
  originalValue: Value,
  property: Extract<HttpParameterProperties, { kind: "query" | "cookie" }>,
): Value | undefined {
  const { name } = property.options;
  const isCookie = property.kind === "cookie";
  const explode = isCookie ? false : property.options.explode;
  const tk = $(program);
  /*
    https://spec.openapis.org/oas/v3.0.4.html#style-examples
      string -> "blue"
      array -> ["blue", "black", "brown"]
      object -> { "R": 100, "G": 200, "B": 150 }

    | explode | string       | array                              | object                  |
    | ------- | ------------ | ---------------------------------- | ----------------------- |
    | false   | color=blue   | color=blue,black,brown             | color=R,100,G,200,B,150 |
    | true    | color=blue   | color=blue&color=black&color=brown | R=100&G=200&B=150       |
  */

  const prefix = explode ? "" : `${name}=`;
  if (tk.value.isArray(originalValue)) {
    const sep = explode ? "&" : ",";
    const pairs: string[] = [];
    for (const value of originalValue.values) {
      if (!isSerializableScalarValue(value)) continue;
      pairs.push(explode ? `${name}=${value.value}` : `${value.value}`);
    }
    return tk.value.createString(`${prefix}${pairs.join(sep)}`);
  }

  if (tk.value.isObject(originalValue)) {
    const sep = explode ? "=" : ",";
    const joiner = explode ? "&" : ",";
    const pairs: string[] = [];
    for (const [key, { value }] of originalValue.properties) {
      if (!isSerializableScalarValue(value)) continue;
      pairs.push(`${key}${sep}${value.value}`);
    }
    return tk.value.createString(`${prefix}${pairs.join(joiner)}`);
  }

  if (isSerializableScalarValue(originalValue)) {
    return tk.value.createString(`${name}=${originalValue.value}`);
  }

  // null is treated as the 'undefined' value
  if (tk.value.isNull(originalValue)) {
    return tk.value.createString(`${name}=`);
  }

  return;
}

function getParameterSimpleValue(
  program: Program,
  originalValue: Value,
  property: Extract<HttpParameterProperties, { kind: "path" | "header" }>,
): Value | undefined {
  const { explode } = property.options;
  const tk = $(program);

  /*
    https://spec.openapis.org/oas/v3.0.4.html#style-examples
      string -> "blue"
      array -> ["blue", "black", "brown"]
      object -> { "R": 100, "G": 200, "B": 150 }

    | explode | string | array            | object            |
    | ------- | ------ | ---------------- | ----------------- |
    | false   | blue   | blue,black,brown | R,100,G,200,B,150 |
    | true    | blue   | blue,black,brown | R=100,G=200,B=150 |
  */

  if (tk.value.isArray(originalValue)) {
    const serializedValue = originalValue.values
      .filter(isSerializableScalarValue)
      .map((v) => v.value)
      .join(",");
    return tk.value.createString(serializedValue);
  }

  if (tk.value.isObject(originalValue)) {
    const pairs: string[] = [];
    for (const [key, { value }] of originalValue.properties) {
      if (!isSerializableScalarValue(value)) continue;
      const sep = explode ? "=" : ",";
      pairs.push(`${key}${sep}${value.value}`);
    }
    return tk.value.createString(pairs.join(","));
  }

  // null (undefined) is treated as an empty string - unrelated to allowEmptyValue
  if (tk.value.isNull(originalValue)) {
    return tk.value.createString("");
  }

  if (isSerializableScalarValue(originalValue)) {
    return originalValue;
  }

  return;
}

function isSerializableScalarValue(
  value: Value,
): value is BooleanValue | NumericValue | StringValue {
  return ["BooleanValue", "NumericValue", "StringValue"].includes(value.valueKind);
}

function getValueByPath(value: Value, path: (string | number)[]): Value | undefined {
  let current: Value | undefined = value;
  for (const key of path) {
    switch (current?.valueKind) {
      case "ObjectValue":
        current = current.properties.get(key.toString())?.value;
        break;
      case "ArrayValue":
        current = current.values[key as number];
        break;
      default:
        return undefined;
    }
  }
  return current;
}
