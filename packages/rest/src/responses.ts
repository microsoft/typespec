import {
  getDoc,
  isIntrinsic,
  isVoidType,
  ModelType,
  ModelTypeProperty,
  OperationType,
  Program,
  Type,
} from "@cadl-lang/compiler";
import { reportDiagnostic } from "./diagnostics.js";
import {
  getHeaderFieldName,
  getStatusCodeDescription,
  getStatusCodes,
  isBody,
  isHeader,
  isStatusCode,
} from "./http.js";

export interface HttpOperationResponse {
  statusCode: string | undefined;
  type: Type;
  description?: string;
  headers?: Record<string, ModelTypeProperty>;
  body?: Record<string, Type>;
}

const NoStatusCode = Symbol("NoStatusCode");

/**
 * Get the responses for a given operation.
 */
export function getResponsesForOperation(
  program: Program,
  operation: OperationType
): HttpOperationResponse[] {
  const responseType = operation.returnType;
  const responses: Record<string | symbol, HttpOperationResponse> = {};
  if (responseType.kind === "Union") {
    for (const option of responseType.options) {
      processResponseType(program, responses, option);
    }
  } else {
    processResponseType(program, responses, responseType);
  }

  const result = Object.values(responses);
  if (responses[NoStatusCode]) {
    result.push(responses[NoStatusCode]);
  }
  return result;
}

function processResponseType(
  program: Program,
  responses: Record<string | typeof NoStatusCode, HttpOperationResponse>,
  responseModel: Type
) {
  // Get explicity defined status codes
  const statusCodes: Array<string | typeof NoStatusCode> = getResponseStatusCodes(
    program,
    responseModel
  );

  // Get explicitly defined content types
  const contentTypes = getResponseContentTypes(program, responseModel);

  // Get response headers
  const headers = getResponseHeaders(program, responseModel);

  // Get explicitly defined body
  let bodyModel = getResponseBody(program, responseModel);
  // If there is no explicit body, it should be conjured from the return type
  // if it is a primitive type or it contains more than just response metadata
  if (!bodyModel) {
    if (responseModel.kind === "Model") {
      if (isIntrinsic(program, responseModel)) {
        bodyModel = responseModel;
      } else {
        const isResponseMetadata = (p: ModelTypeProperty) =>
          isHeader(program, p) || isStatusCode(program, p);
        const allProperties = (p: ModelType): ModelTypeProperty[] => {
          return [...p.properties.values(), ...(p.baseModel ? allProperties(p.baseModel) : [])];
        };
        if (allProperties(responseModel).some((p) => !isResponseMetadata(p))) {
          bodyModel = responseModel;
        }
      }
    } else {
      // body is array or possibly something else
      bodyModel = responseModel;
    }
  }

  // If there is no explicit status code, check if it should be 204
  if (statusCodes.length === 0) {
    if (bodyModel === undefined || isVoidType(bodyModel)) {
      statusCodes.push("204");
    } else {
      statusCodes.push(NoStatusCode);
    }
  }

  // If there is a body but no explicit content types, use application/json
  if (bodyModel && !isVoidType(bodyModel) && contentTypes.length === 0) {
    contentTypes.push("application/json");
  }

  // Assertion: bodyModel <=> contentTypes.length > 0

  // Put them into currentEndpoint.responses

  for (const statusCode of statusCodes) {
    // the first model for this statusCode/content type pair carries the
    // description for the endpoint. This could probably be improved.
    const response: HttpOperationResponse = responses[statusCode] ?? {
      statusCode: statusCode === NoStatusCode ? undefined : statusCode,
      type: responseModel,
      description: getResponseDescription(program, responseModel, statusCode),
    };

    // check for duplicates
    if (response.body) {
      for (const contentType of contentTypes) {
        if (response.body[contentType]) {
          reportDiagnostic(program, {
            code: "duplicate-response",
            format: { statusCode: statusCode.toString(), contentType },
            target: responseModel,
          });
        }
      }
    }

    if (Object.keys(headers).length > 0) {
      response.headers ??= {};

      // OpenAPI can't represent different headers per content type.
      // So we merge headers here, and report any duplicates.
      // It may be possible in principle to not error for identically declared
      // headers.
      for (const [key, value] of Object.entries(headers)) {
        if (response.headers[key]) {
          reportDiagnostic(program, {
            code: "duplicate-header",
            format: { header: key },
            target: responseModel,
          });
          continue;
        }

        response.headers[key] = value;
      }
    }

    if (bodyModel !== undefined) {
      for (const contentType of contentTypes) {
        response.body ??= {};
        response.body[contentType] = bodyModel;
      }
    } else if (contentTypes.length > 0) {
      reportDiagnostic(program, {
        code: "content-type-ignored",
        target: responseModel,
      });
    }
    responses[statusCode] = response;
  }
}

/**
 * Get explicity defined status codes from response Model
 * Return is an array of strings, possibly empty, which indicates no explicitly defined status codes.
 * We do not check for duplicates here -- that will be done by the caller.
 */
function getResponseStatusCodes(program: Program, responseModel: Type): string[] {
  const codes: string[] = [];
  if (responseModel.kind === "Model") {
    if (responseModel.baseModel) {
      codes.push(...getResponseStatusCodes(program, responseModel.baseModel));
    }
    for (const prop of responseModel.properties.values()) {
      if (isStatusCode(program, prop)) {
        codes.push(...getStatusCodes(program, prop));
      }
    }
  }
  return codes;
}

/**
 * Get explicity defined content-types from response Model
 * Return is an array of strings, possibly empty, which indicates no explicitly defined content-type.
 * We do not check for duplicates here -- that will be done by the caller.
 */
function getResponseContentTypes(program: Program, responseModel: Type): string[] {
  const contentTypes: string[] = [];
  if (responseModel.kind === "Model") {
    if (responseModel.baseModel) {
      contentTypes.push(...getResponseContentTypes(program, responseModel.baseModel));
    }
    for (const prop of responseModel.properties.values()) {
      if (isHeader(program, prop) && getHeaderFieldName(program, prop) === "content-type") {
        contentTypes.push(...getContentTypes(program, prop));
      }
    }
  }
  return contentTypes;
}

function getContentTypes(program: Program, param: ModelTypeProperty): string[] {
  if (param.type.kind === "String") {
    return [param.type.value];
  } else if (param.type.kind === "Union") {
    const contentTypes = [];
    for (const option of param.type.options) {
      if (option.kind === "String") {
        contentTypes.push(option.value);
      } else {
        reportDiagnostic(program, {
          code: "content-type-string",
          target: param,
        });
        continue;
      }
    }

    return contentTypes;
  }

  reportDiagnostic(program, { code: "content-type-string", target: param });

  return [];
}

/**
 * Get response headers from response Model
 */
function getResponseHeaders(
  program: Program,
  responseModel: Type
): Record<string, ModelTypeProperty> {
  if (responseModel.kind === "Model") {
    const responseHeaders: any = responseModel.baseModel
      ? getResponseHeaders(program, responseModel.baseModel)
      : {};
    for (const prop of responseModel.properties.values()) {
      const headerName = getHeaderFieldName(program, prop);
      if (isHeader(program, prop) && headerName !== "content-type") {
        responseHeaders[headerName] = prop;
      }
    }
    return responseHeaders;
  }
  return {};
}

function getResponseBody(program: Program, responseModel: Type): Type | undefined {
  if (responseModel.kind === "Model") {
    const getAllBodyProps = (m: ModelType): ModelTypeProperty[] => {
      const bodyProps = [...m.properties.values()].filter((t) => isBody(program, t));
      if (m.baseModel) {
        bodyProps.push(...getAllBodyProps(m.baseModel));
      }
      return bodyProps;
    };
    const bodyProps = getAllBodyProps(responseModel);
    if (bodyProps.length > 0) {
      // Report all but first body as duplicate
      for (const prop of bodyProps.slice(1)) {
        reportDiagnostic(program, { code: "duplicate-body", target: prop });
      }
      return bodyProps[0].type;
    }
  }
  return undefined;
}

function getResponseDescription(
  program: Program,
  responseModel: Type,
  statusCode: string | typeof NoStatusCode
) {
  if (statusCode === NoStatusCode) {
    return undefined;
  }
  const desc = getDoc(program, responseModel);
  if (desc) {
    return desc;
  }

  return getStatusCodeDescription(statusCode) ?? "unknown";
}
