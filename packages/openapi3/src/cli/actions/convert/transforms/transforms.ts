import {
  OpenAPI3PathItem,
  OpenAPI3RequestBody,
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

function collectDataTypes(context: Context): TypeSpecModel[] {
  const models: TypeSpecModel[] = [];
  // get models from `#/components/schema
  transformComponentSchemas(context, models);
  // get models from `#/components/parameters
  transformComponentParameters(context, models);

  return models;
}
