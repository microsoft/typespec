import type { OpenAPI3MediaType, OpenAPI3Response, Refable } from "../../../../types.js";
import type { TypeSpecModelProperty, TypeSpecOperation } from "../interfaces.js";
import { getTypeSpecKind } from "../transforms/transform-component-schemas.js";
import type { Context } from "../utils/context.js";
import type { StatusCodes } from "../utils/response-properties.js";
import {
  convertHeaderToProperty,
  convertStatusCodeToProperty,
  getComponentResponseProperties,
  hasResponseExamples,
  isScalarBody,
  isValidLiteralStatusCode,
} from "../utils/response-properties.js";
import { generateModelExpression } from "./generate-model.js";
import { generateResponseExamples } from "./generate-response-examples.js";

/**
 * Generates a union expression of all possible responses for an operation
 */
export function generateOperationReturnType(
  operation: TypeSpecOperation,
  context: Context,
): { returnType: string; examples: string[] } {
  const expressions: string[] = [];
  const examples: string[] = [];
  const explicitStatusCodeFor200 =
    Object.hasOwn(operation.responses, "default") &&
    Object.values(operation.responses).some((entry) => {
      const response = "$ref" in entry ? context.getByRef<OpenAPI3Response>(entry.$ref) : entry;
      return hasResponseExamples(response?.content);
    });
  for (const [statusCode, response] of Object.entries(operation.responses)) {
    expressions.push(
      ...generateReturnTypeForStatusCode({
        statusCode,
        response,
        context,
        operationScope: operation.scope,
        examples,
        explicitStatusCodeFor200,
      }),
    );
  }

  return { returnType: expressions.join(" | "), examples };
}

type GenerateReturnTypeForStatusCodeProps = {
  statusCode: StatusCodes;
  response: Refable<OpenAPI3Response>;
  operationScope: string[];
  context: Context;
  examples: string[];
  explicitStatusCodeFor200: boolean;
};

function generateReturnTypeForStatusCode(props: GenerateReturnTypeForStatusCodeProps): string[] {
  const { statusCode, context } = props;

  if ("$ref" in props.response && props.response.$ref.startsWith("#/components/responses/")) {
    const componentResponseName = context.getComponentResponseName(props.response.$ref, statusCode);
    if (componentResponseName) {
      const response = context.getByRef<OpenAPI3Response>(props.response.$ref);
      if (response) {
        const shape = getComponentResponseProperties(statusCode, response, context);
        for (const [mediaType, content] of Object.entries(response.content ?? {})) {
          props.examples.push(
            ...generateResponseExamples(
              {
                statusCode,
                mediaType,
                content,
                properties: shape.properties,
                unsupportedReason:
                  mediaType !== shape.mediaType
                    ? "this media type is not represented by the generated component response model."
                    : undefined,
              },
              props.operationScope,
              context,
            ),
          );
        }
      }
      return [componentResponseName];
    }
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
    examples: props.examples,
    explicitStatusCodeFor200: props.explicitStatusCodeFor200,
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
  examples: string[];
};

function handleDefaultResponse({
  contents,
  context,
  headers,
  operationScope,
  description,
  examples,
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

  const hasMediaExamples = hasResponseExamples(Object.fromEntries(contents));
  return contents.map(([mediaType, content]) => {
    const bodySchema = content.schema;
    const headerProps: TypeSpecModelProperty[] = [...headers];
    // application/json is default contentType so can ignore it
    if (
      mediaType !== "application/json" ||
      (hasMediaExamples && (contents.length > 1 || isScalarBody(bodySchema, context)))
    ) {
      headerProps.push({
        name: "contentType",
        decorators: [{ name: "header", args: [] }],
        isOptional: false,
        schema: { type: "string", enum: [mediaType] },
      });
    }

    const properties = [...headerProps];
    if (bodySchema) {
      properties.push({
        name: "body",
        decorators: [{ name: "body", args: [] }],
        isOptional: false,
        schema: bodySchema,
      });
    }
    examples.push(
      ...generateResponseExamples(
        { statusCode: "default", mediaType, content, properties },
        operationScope,
        context,
      ),
    );
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
  examples: string[];
  explicitStatusCodeFor200: boolean;
};

function generateResponseExpressions({
  statusCode,
  contents,
  context,
  headers,
  operationScope,
  description,
  examples,
  explicitStatusCodeFor200,
}: GenerateResponseExpressionsProps): string[] {
  const hasContents = contents.length > 0;

  const statusCodeMetadata = getStatusCodeMetadata(statusCode);

  if (statusCodeMetadata.isDefault) {
    return handleDefaultResponse({
      headers,
      contents,
      operationScope,
      context,
      description,
      examples,
    });
  }

  // Scenario 1 - only have a mapped status code - use it directly
  // Example: OkResponse
  if (statusCodeMetadata.httpLibModel && !hasContents && !headers.length) {
    return [statusCodeMetadata.httpLibModel];
  }

  // 200 statusCode is default, we can ignore it since we know we have headers or body to fill out response
  if (statusCodeMetadata.literalStatusCode === 200) {
    statusCodeMetadata.httpLibModel = undefined;
    if (!explicitStatusCodeFor200) statusCodeMetadata.modelProperty = undefined;
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

  const hasMediaExamples = hasResponseExamples(Object.fromEntries(contents));
  return contents.map(([mediaType, content]) => {
    const bodySchema = content.schema;
    const bodyRef = bodySchema && "$ref" in bodySchema ? bodySchema.$ref : undefined;
    const referencedBody = bodyRef ? context.getSchemaByRef(bodyRef) : undefined;
    // Intersections and implicit bodies don't preserve non-model response body types.
    const isModelBody =
      referencedBody &&
      getTypeSpecKind(referencedBody) === "model" &&
      referencedBody.type !== "array" &&
      !referencedBody.items;
    const explicitContentType =
      mediaType !== "application/json" ||
      (referencedBody && !isModelBody && "examples" in referencedBody) ||
      (hasMediaExamples && (contents.length > 1 || isScalarBody(bodySchema, context)));
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
      examples.push(
        ...generateResponseExamples(
          {
            statusCode,
            mediaType,
            content,
            properties: [],
            unsupportedReason: "stream and item examples are not supported.",
          },
          operationScope,
          context,
        ),
      );
      return `SSEStream<${eventUnionType}>`;
      // If no proper schema reference, fall through to regular handling
    }

    // Attempt to emit just the Body or an intersection of Body & MappedResponse
    // if there aren't any custom headers.
    if (bodySchema && !explicitContentType && !headers.length) {
      const canUseImplicitBody =
        isModelBody && (!hasMediaExamples || (bodyRef && canIntersectBody(bodyRef, context)));
      // Scenario 3 - have a mapped status code and body schema is a ref using application/json - intersection!
      // Example: CreatedResponse & Widget
      if (
        canUseImplicitBody &&
        statusCodeMetadata.httpLibModel &&
        statusCodeMetadata.modelProperty
      ) {
        examples.push(
          ...generateResponseExamples(
            {
              statusCode,
              mediaType,
              content,
              properties: [statusCodeMetadata.modelProperty],
              implicitBody: bodySchema,
            },
            operationScope,
            context,
          ),
        );
        return `${statusCodeMetadata.httpLibModel} & ${context.generateTypeFromRefableSchema(
          bodySchema,
          operationScope,
        )}`;
      }
      // Scenario 4 - 200 status code and using application/json - return just the body
      // Example: Widget
      // Example: Body<string>
      if (statusCodeMetadata.literalStatusCode === 200 && !statusCodeMetadata.modelProperty) {
        const body = context.generateTypeFromRefableSchema(bodySchema, operationScope);
        if (canUseImplicitBody) {
          examples.push(
            ...generateResponseExamples(
              { statusCode, mediaType, content, properties: [], implicitBody: bodySchema },
              operationScope,
              context,
            ),
          );
          return body;
        }
        examples.push(
          ...generateResponseExamples(
            {
              statusCode,
              mediaType,
              content,
              properties: [
                {
                  name: "body",
                  decorators: [{ name: "body", args: [] }],
                  isOptional: false,
                  schema: bodySchema,
                },
              ],
            },
            operationScope,
            context,
          ),
        );
        return `Body<${body}>`;
      }
    }

    // Scenario 5 - any combination of headers/statusCode/body - common expression
    const modelExpressionProps: TypeSpecModelProperty[] = [];
    if (statusCodeMetadata.modelProperty) {
      modelExpressionProps.push(statusCodeMetadata.modelProperty);
    }
    modelExpressionProps.push(...headers);

    if (explicitContentType) {
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

    examples.push(
      ...generateResponseExamples(
        { statusCode, mediaType, content, properties: modelExpressionProps },
        operationScope,
        context,
      ),
    );
    return generateModelExpression(modelExpressionProps, operationScope, context);
  });
}

function canIntersectBody(ref: string, context: Context, seen = new Set<string>()): boolean {
  if (seen.has(ref)) return false;
  seen.add(ref);
  const schema = context.getSchemaByRef(ref);
  if (!schema) return false;
  if ("$ref" in schema && typeof schema.$ref === "string") {
    return canIntersectBody(schema.$ref, context, seen);
  }
  return (
    getTypeSpecKind(schema) === "model" &&
    schema.type !== "array" &&
    !schema.items &&
    (Object.keys(schema.properties ?? {}).length > 0 ||
      !!schema.additionalProperties ||
      !!schema.allOf?.length) &&
    !Object.hasOwn(schema.properties ?? {}, "statusCode") &&
    (schema.allOf ?? []).every((member) =>
      "$ref" in member
        ? canIntersectBody(member.$ref, context, new Set(seen))
        : !Object.hasOwn(member.properties ?? {}, "statusCode"),
    )
  );
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
