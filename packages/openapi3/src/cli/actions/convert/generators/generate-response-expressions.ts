import type { OpenAPI3MediaType, OpenAPI3Response, Refable } from "../../../../types.js";
import type { TypeSpecModelProperty, TypeSpecOperation } from "../interfaces.js";
import type { Context } from "../utils/context.js";
import type { StatusCodes } from "../utils/response-properties.js";
import {
  convertHeaderToProperty,
  convertStatusCodeToProperty,
  isValidLiteralStatusCode,
} from "../utils/response-properties.js";
import { generateModelExpression } from "./generate-model.js";

/**
 * Generates a union expression of all possible responses for an operation
 */
export function generateOperationReturnType(
  operation: TypeSpecOperation,
  context: Context,
): string {
  const expressions: string[] = [];
  for (const [statusCode, response] of Object.entries(operation.responses)) {
    expressions.push(
      ...generateReturnTypeForStatusCode({
        statusCode,
        response,
        context,
        operationScope: operation.scope,
      }),
    );
  }

  return expressions.join(" | ");
}

type GenerateReturnTypeForStatusCodeProps = {
  statusCode: StatusCodes;
  response: Refable<OpenAPI3Response>;
  operationScope: string[];
  context: Context;
};

function generateReturnTypeForStatusCode(props: GenerateReturnTypeForStatusCodeProps): string[] {
  const { statusCode, context } = props;

  if ("$ref" in props.response && props.response.$ref.startsWith("#/components/responses/")) {
    return [context.getRefName(props.response.$ref, props.operationScope)];
  }

  const response =
    "$ref" in props.response
      ? context.getByRef<OpenAPI3Response>(props.response.$ref)
      : props.response;

  if (!response) {
    return [];
  }

  const description = props.response.description ?? response.description;

  // collect headers
  const headerProperties: TypeSpecModelProperty[] = Object.entries(response.headers ?? {})
    .map(([name, header]) => {
      return convertHeaderToProperty({ name, header, context });
    })
    .filter((h) => !!h);

  const contentEntries = Object.entries(response.content ?? {});

  return generateResponseExpressions({
    statusCode,
    description,
    headers: headerProperties,
    contents: contentEntries,
    operationScope: props.operationScope,
    context,
  });
}

type StatusCodeMetadata = {
  /**
   * Original StatusCode from Open API spec
   */
  statusCode: StatusCodes;
  /**
   * Whether this status code represents the default response
   */
  isDefault: boolean;
  /**
   * Literal status code if single value between 100-599
   */
  literalStatusCode?: number;
  /**
   * The name of the Http model that maps to this status code
   */
  httpLibModel?: string;
  /**
   * The status code represented as a model property
   */
  modelProperty?: TypeSpecModelProperty;
};

function getStatusCodeMetadata(statusCode: StatusCodes): StatusCodeMetadata {
  const isDefault = statusCode === "default";
  if (isDefault) {
    return { statusCode, isDefault };
  }
  const metadata: StatusCodeMetadata = {
    statusCode,
    isDefault,
    modelProperty: convertStatusCodeToProperty(statusCode),
  };

  if (isValidLiteralStatusCode(statusCode)) {
    metadata.literalStatusCode = parseInt(statusCode, 10);
    metadata.httpLibModel = statusCodeToResponse.get(metadata.literalStatusCode);
  }

  return metadata;
}

type HandleDefaultResponseProps = {
  description?: string;
  headers: TypeSpecModelProperty[];
  contents: [string, OpenAPI3MediaType][];
  operationScope: string[];
  context: Context;
};

function handleDefaultResponse({
  contents,
  context,
  headers,
  operationScope,
  description,
}: HandleDefaultResponseProps): string[] {
  if (!contents.length) {
    return [
      generateDefaultResponse({
        context,
        headers,
        operationScope,
        description,
      }),
    ];
  }

  return contents.map(([mediaType, content]) => {
    const bodySchema = content.schema;
    const headerProps: TypeSpecModelProperty[] = [...headers];
    // application/json is default contentType so can ignore it
    if (mediaType !== "application/json") {
      headerProps.push({
        name: "contentType",
        decorators: [{ name: "header", args: [] }],
        isOptional: false,
        schema: { type: "string", enum: [mediaType] },
      });
    }

    return generateDefaultResponse({
      context,
      headers: headerProps,
      operationScope,
      body: bodySchema && context.generateTypeFromRefableSchema(bodySchema, operationScope),
      description,
    });
  });
}

type GenerateResponseExpressionsProps = {
  statusCode: StatusCodes;
  description?: string;
  headers: TypeSpecModelProperty[];
  contents: [string, OpenAPI3MediaType][];
  operationScope: string[];
  context: Context;
};

function generateResponseExpressions({
  statusCode,
  contents,
  context,
  headers,
  operationScope,
  description,
}: GenerateResponseExpressionsProps): string[] {
  const hasContents = contents.length > 0;

  const statusCodeMetadata = getStatusCodeMetadata(statusCode);

  if (statusCodeMetadata.isDefault) {
    return handleDefaultResponse({ headers, contents, operationScope, context, description });
  }

  // Scenario 1 - only have a mapped status code - use it directly
  // Example: OkResponse
  if (statusCodeMetadata.httpLibModel && !hasContents && !headers.length) {
    return [statusCodeMetadata.httpLibModel];
  }

  // 200 statusCode is default, we can ignore it since we know we have headers or body to fill out response
  if (statusCodeMetadata.literalStatusCode === 200) {
    statusCodeMetadata.httpLibModel = undefined;
    statusCodeMetadata.modelProperty = undefined;
  }

  // Scenario 2 - have a status code and headers, but no bodies.
  // Example: CreatedResponse & { @header xFoo: string }
  // Example: { @statusCode statusCode: 203, @header xFoo: string }
  if (!hasContents) {
    if (statusCodeMetadata.httpLibModel) {
      return [
        `${statusCodeMetadata.httpLibModel} & ${generateModelExpression(headers, operationScope, context)}`,
      ];
    }
    const modelProps = [...headers];
    if (statusCodeMetadata.modelProperty) {
      modelProps.push(statusCodeMetadata.modelProperty);
    }
    return [generateModelExpression(modelProps, operationScope, context)];
  }

  return contents.map(([mediaType, content]) => {
    // Special handling for Server-Sent Events
    if (
      !context.openApi3Doc.openapi.startsWith("3.0") &&
      !context.openApi3Doc.openapi.startsWith("3.1") &&
      mediaType === "text/event-stream" &&
      "itemSchema" in content &&
      content.itemSchema &&
      typeof content.itemSchema === "object" &&
      "$ref" in content.itemSchema
    ) {
      // Check for itemSchema (OpenAPI 3.2 extension)
      const eventUnionType = context.generateTypeFromRefableSchema(
        content.itemSchema,
        operationScope,
      );
      context.markSSEUsage();
      return `SSEStream<${eventUnionType}>`;
      // If no proper schema reference, fall through to regular handling
    }

    // Attempt to emit just the Body or an intersection of Body & MappedResponse
    // if there aren't any custom headers.
    const bodySchema = content.schema;
    if (bodySchema && mediaType === "application/json" && !headers.length) {
      // Scenario 3 - have a mapped status code and body schema is a ref using application/json - intersection!
      // Example: CreatedResponse & Widget
      if ("$ref" in bodySchema && statusCodeMetadata.httpLibModel) {
        return `${statusCodeMetadata.httpLibModel} & ${context.generateTypeFromRefableSchema(
          bodySchema,
          operationScope,
        )}`;
      }
      // Scenario 4 - 200 status code and using application/json - return just the body
      // Example: Widget
      // Example: Body<string>
      if (statusCodeMetadata.literalStatusCode === 200) {
        const body = context.generateTypeFromRefableSchema(bodySchema, operationScope);
        if ("$ref" in bodySchema) {
          return body;
        }
        return `Body<${body}>`;
      }
    }

    // Scenario 5 - any combination of headers/statusCode/body - common expression
    const modelExpressionProps: TypeSpecModelProperty[] = [];
    if (statusCodeMetadata.modelProperty) {
      modelExpressionProps.push(statusCodeMetadata.modelProperty);
    }
    modelExpressionProps.push(...headers);

    // application/json is default contentType so can ignore it
    if (mediaType !== "application/json") {
      modelExpressionProps.push({
        name: "contentType",
        decorators: [{ name: "header", args: [] }],
        isOptional: false,
        schema: { type: "string", enum: [mediaType] },
      });
    }
    if (bodySchema) {
      modelExpressionProps.push({
        name: "body",
        isOptional: false,
        decorators: [{ name: "body", args: [] }],
        schema: bodySchema,
      });
    }

    return generateModelExpression(modelExpressionProps, operationScope, context);
  });
}

type GenerateDefaultResponseProps = {
  description?: string;
  headers: TypeSpecModelProperty[];
  body?: string;
  operationScope: string[];
  context: Context;
};

function generateDefaultResponse({
  operationScope,
  context,
  ...props
}: GenerateDefaultResponseProps): string {
  const hasTemplateParams = !!(props.description || props.headers.length || props.body);
  if (!hasTemplateParams) return "GeneratedHelpers.DefaultResponse";

  const description = props.description ? `Description = "${props.description}", ` : "";
  const headers = props.headers.length
    ? `Headers = ${generateModelExpression(props.headers, operationScope, context)}, `
    : "";
  const body = props.body ? `Body = ${props.body}, ` : "";

  return `GeneratedHelpers.DefaultResponse<${description}${headers}${body}>`;
}

// Map of statusCodes to their Response
const statusCodeToResponse = new Map([
  [200, "OkResponse"],
  [201, "CreatedResponse"],
  [202, "AcceptedResponse"],
  [204, "NoContentResponse"],
  [304, "NotModifiedResponse"],
  [400, "BadRequestResponse"],
  [401, "UnauthorizedResponse"],
  [403, "ForbiddenResponse"],
  [404, "NotFoundResponse"],
  [409, "ConflictResponse"],
]);
