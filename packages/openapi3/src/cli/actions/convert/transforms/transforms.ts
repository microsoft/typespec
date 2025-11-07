import {
  OpenAPI3PathItem,
  OpenAPI3RequestBody,
  OpenAPI3Response,
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

function scanPathForMultipartSchemas(path: OpenAPI3PathItem, context: Context): void {
  const methods = ["get", "post", "put", "patch", "delete", "head"] as const;

  for (const method of methods) {
    const operation = path[method];
    if (!operation?.requestBody) continue;

    scanOperationForMultipartSchemas(operation.requestBody, context);
  }
}

function scanOperationForMultipartSchemas(
  requestBodyRef: Refable<OpenAPI3RequestBody>,
  context: Context,
): void {
  let requestBody = requestBodyRef;
  if ("$ref" in requestBody) {
    const resolved = context.getByRef<OpenAPI3RequestBody>(requestBody.$ref);
    if (!resolved) return;
    requestBody = resolved;
  }

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

function scanPathForSSESchemas(path: OpenAPI3PathItem, context: Context): void {
  const methods = ["get", "post", "put", "patch", "delete", "head"] as const;

  for (const method of methods) {
    const operation = path[method];
    if (!operation?.responses) continue;

    // Handle responses which could be a reference or actual responses
    let responses = operation.responses;
    if ("$ref" in responses) {
      const ref = responses.$ref;
      if (typeof ref === "string") {
        const resolvedResponses = context.getByRef(ref);
        if (!resolvedResponses) continue;
        responses = resolvedResponses as any;
      } else {
        continue;
      }
    }

    scanOperationForSSESchemas(responses as any, context);
  }
}

function scanOperationForSSESchemas(
  responses: Record<string, Refable<OpenAPI3Response>>,
  context: Context,
): void {
  for (const response of Object.values(responses)) {
    if (!response) continue;

    let resolvedResponse = response;
    if ("$ref" in response) {
      const ref = response.$ref;
      if (typeof ref === "string") {
        const resolved = context.getByRef<OpenAPI3Response>(ref);
        if (!resolved) continue;
        resolvedResponse = resolved;
      } else {
        continue;
      }
    }

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
