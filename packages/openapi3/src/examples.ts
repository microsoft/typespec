import {
  Example,
  getOpExamples,
  ignoreDiagnostics,
  OpExample,
  Program,
  serializeValueAsJson,
  Type,
  Value,
} from "@typespec/compiler";
import type {
  HttpOperation,
  HttpOperationResponse,
  HttpOperationResponseContent,
  HttpProperty,
  HttpStatusCodeRange,
} from "@typespec/http";
import { getOpenAPI3StatusCodes } from "./status-codes.js";
import { OpenAPI3Example, OpenAPI3MediaType } from "./types.js";
import { isSharedHttpOperation, SharedHttpOperation } from "./util.js";

export interface OperationExamples {
  requestBody: Record<string, [Example, Type][]>;
  responses: Record<string, Record<string, [Example, Type][]>>;
}

export function resolveOperationExamples(
  program: Program,
  operation: HttpOperation | SharedHttpOperation
): OperationExamples {
  const examples = findOperationExamples(program, operation);
  const result: OperationExamples = { requestBody: {}, responses: {} };
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
  operation: HttpOperation | SharedHttpOperation
): [HttpOperation, OpExample][] {
  if (isSharedHttpOperation(operation)) {
    return operation.operations.flatMap((op) =>
      getOpExamples(program, op.operation).map((x): [HttpOperation, OpExample] => [op, x])
    );
  } else {
    return getOpExamples(program, operation.operation).map((x) => [operation, x]);
  }
}

function isStatusCodeIn(
  exampleStatusCode: number,
  statusCodes: number | HttpStatusCodeRange | "*"
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
  responses: HttpOperationResponse[]
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
            getOpenAPI3StatusCodes(program, statusCodeResponse.statusCodes, statusCodeResponse.type)
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
                statusCodeResponse.type
              )
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

export function getExampleOrExamples(
  program: Program,
  examples: [Example, Type][]
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
    return { example: serializeValueAsJson(program, example.value, type) };
  } else {
    const exampleObj: Record<string, OpenAPI3Example> = {};
    for (const [index, [example, type]] of examples.entries()) {
      exampleObj[example.title ?? `example${index}`] = {
        summary: example.title,
        description: example.description,
        value: serializeValueAsJson(program, example.value, type),
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
