import {
  OpenAPI3PathItem,
  OpenAPI3RequestBody,
  OpenAPI3Responses,
  OpenAPIPathItem3_2,
  OpenAPIRequestBody3_2,
  OpenAPIResponses3_2,
  Refable,
  SupportedOpenAPIDocuments,
} from "../../../../types.js";
import { TypeSpecModel, TypeSpecProgram } from "../interfaces.js";
import { Context } from "../utils/context.js";
import { transformComponentParameters } from "./transform-component-parameters.js";
import { transformComponentSchemas } from "./transform-component-schemas.js";
import { transformNamespaces } from "./transform-namespaces.js";
import { transformPaths } from "./transform-paths.js";
import { transformServers } from "./transform-servers.js";
import { transformServiceInfo } from "./transform-service-info.js";
import { transformTags } from "./transform-tags.js";

/**
 * Resolves a reference to its actual object, handling both direct objects and $ref references.
 * @param refableObject - Object that might be a reference or the actual object
 * @param context - Context containing the getByRef method
 * @returns The resolved object or undefined if the reference cannot be resolved
 */
function resolveReference<T>(refableObject: Refable<T>, context: Context): T | undefined {
  if (refableObject && typeof refableObject === "object" && "$ref" in refableObject) {
    const ref = refableObject.$ref;
    if (typeof ref === "string") {
      return context.getByRef<T>(ref);
    }
    return undefined;
  }
  return refableObject as T;
}

export function transform(context: Context): TypeSpecProgram {
  const openapi = context.openApi3Doc;

  // Pre-scan for multipart schemas before generating models
  scanForMultipartSchemas(openapi, context);

  // Pre-scan for SSE event schemas before generating models
  scanForSSESchemas(openapi, context);

  const models = collectDataTypes(context);
  const operations = transformPaths(openapi.paths, context);

  return {
    serviceInfo: transformServiceInfo(openapi.info),
    ...transformNamespaces(models, operations),
    augmentations: [],
    servers: transformServers(openapi.servers ?? []),
    tags: transformTags(openapi.tags ?? []),
  };
}

/**
 * Scans all operations in the OpenAPI document to identify schemas used in multipart forms
 * and registers them with their encoding information before model generation.
 */
function scanForMultipartSchemas(openapi: SupportedOpenAPIDocuments, context: Context): void {
  if (!openapi.paths) return;

  for (const path of Object.values(openapi.paths)) {
    if (!path) continue;
    scanPathForMultipartSchemas(path, context);
  }
}

/**
 * Scans all operations in the OpenAPI document to identify schemas used in text/event-stream responses
 * and registers them as SSE event schemas before model generation.
 */
function scanForSSESchemas(openapi: SupportedOpenAPIDocuments, context: Context): void {
  if (!openapi.paths) return;

  for (const path of Object.values(openapi.paths)) {
    if (!path) continue;
    scanPathForSSESchemas(path, context);
  }
}
const methods = ["get", "post", "put", "patch", "delete", "head"] as const;

function scanPathForMultipartSchemas(
  path: OpenAPI3PathItem | OpenAPIPathItem3_2,
  context: Context,
): void {
  for (const method of methods) {
    const operation = path[method];
    if (!operation?.requestBody) continue;

    scanOperationForMultipartSchemas(operation.requestBody, context);
  }
  if ("query" in path && path.query && path.query.requestBody) {
    scanOperationForMultipartSchemas(path.query.requestBody, context);
  }

  if ("additionalOperations" in path && path.additionalOperations) {
    for (const additionalOperation of Object.values(path.additionalOperations)) {
      if (additionalOperation.requestBody) {
        scanOperationForMultipartSchemas(additionalOperation.requestBody, context);
      }
    }
  }
}

function scanOperationForMultipartSchemas(
  requestBodyRef: Refable<OpenAPI3RequestBody> | Refable<OpenAPIRequestBody3_2>,
  context: Context,
): void {
  const requestBody = resolveReference(requestBodyRef, context);
  if (!requestBody) return;

  if (!("content" in requestBody) || !requestBody.content) return;

  for (const [_, contentBody] of Object.entries(requestBody.content).filter(
    ([mediaType, _]) => mediaType === "multipart/form-data",
  )) {
    const schemaReference = contentBody.schema;
    const encoding = contentBody.encoding;
    if (schemaReference && "$ref" in schemaReference) {
      context.registerMultipartSchema(schemaReference.$ref, encoding);
    }
  }
}

function scanPathForSSESchemas(
  path: OpenAPI3PathItem | OpenAPIPathItem3_2,
  context: Context,
): void {
  for (const method of methods) {
    const operation = path[method];
    if (!operation?.responses) continue;

    // Handle responses which could be a reference or actual responses
    const responses = resolveReference(operation.responses, context);
    if (!responses) return;

    scanOperationForSSESchemas(responses, context);
  }
  if ("query" in path && path.query && path.query.responses) {
    // Handle responses which could be a reference or actual responses
    const responses = resolveReference(path.query.responses, context);
    if (!responses) return;

    scanOperationForSSESchemas(responses, context);
  }

  if ("additionalOperations" in path && path.additionalOperations) {
    for (const additionalOperation of Object.values(path.additionalOperations)) {
      if (additionalOperation.responses) {
        // Handle responses which could be a reference or actual responses
        const responses = resolveReference(additionalOperation.responses, context);
        if (!responses) return;

        scanOperationForSSESchemas(responses, context);
      }
    }
  }
}

function scanOperationForSSESchemas(
  responses: OpenAPI3Responses | OpenAPIResponses3_2,
  context: Context,
): void {
  for (const response of Object.values(responses)) {
    if (!response) continue;

    const resolvedResponse = resolveReference(response, context);
    if (!resolvedResponse) continue;

    if (!("content" in resolvedResponse) || !resolvedResponse.content) continue;

    // Look for text/event-stream content type
    for (const [mediaType, contentBody] of Object.entries(resolvedResponse.content)) {
      if (mediaType === "text/event-stream" && contentBody && typeof contentBody === "object") {
        // Check if the content body has itemSchema (OpenAPI 3.2 SSE extension)
        if ("itemSchema" in contentBody && contentBody.itemSchema) {
          const itemSchema = contentBody.itemSchema;
          if (itemSchema && typeof itemSchema === "object" && "$ref" in itemSchema) {
            const ref = itemSchema.$ref;
            if (typeof ref === "string") {
              // Register this as an SSE event schema
              context.registerSSEEventSchema(ref);
              context.markSSEUsage();
            }
          }
        } else if ("schema" in contentBody && contentBody.schema) {
          // Fallback: if the schema itself is a reference, register it
          const schema = contentBody.schema;
          if (schema && typeof schema === "object" && "$ref" in schema) {
            const ref = schema.$ref;
            if (typeof ref === "string") {
              context.registerSSEEventSchema(ref);
              context.markSSEUsage();
            }
          }
        }
      }
    }
  }
}

function collectDataTypes(context: Context): TypeSpecModel[] {
  const models: TypeSpecModel[] = [];
  // get models from `#/components/schema
  transformComponentSchemas(context, models);
  // get models from `#/components/parameters
  transformComponentParameters(context, models);

  return models;
}
