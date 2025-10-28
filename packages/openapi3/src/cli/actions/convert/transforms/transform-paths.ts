import { printIdentifier } from "@typespec/compiler";
import {
  OpenAPI3Parameter,
  OpenAPI3PathItem,
  OpenAPI3RequestBody,
  OpenAPIParameter3_2,
  OpenAPIPathItem3_2,
  Refable,
} from "../../../../types.js";
import {
  TypeSpecOperation,
  TypeSpecOperationParameter,
  TypeSpecRequestBody,
} from "../interfaces.js";
import { Context } from "../utils/context.js";
import { getExtensions, getParameterDecorators } from "../utils/decorators.js";
import { generateOperationId } from "../utils/generate-operation-id.js";
import { getScopeAndName } from "../utils/get-scope-and-name.js";
import { supportedHttpMethods } from "../utils/supported-http-methods.js";

/**
 * Transforms each operation defined under #/paths/{route}/{httpMethod} into a TypeSpec operation.
 * @params models - The array of models to populate with any new models generated from the operation.
 * @param paths
 * @returns
 */
export function transformPaths(
  paths: Record<string, OpenAPI3PathItem> | Record<string, OpenAPIPathItem3_2>,
  context: Context,
): TypeSpecOperation[] {
  const operations: TypeSpecOperation[] = [];
  const usedOperationIds = new Set<string>();

  for (const route of Object.keys(paths)) {
    const routeParameters = paths[route].parameters?.map(transformOperationParameter) ?? [];
    const path = paths[route];
    for (const verb of supportedHttpMethods) {
      const operation = path[verb];
      if (!operation) continue;

      const parameters = operation.parameters?.map(transformOperationParameter) ?? [];
      const tags = operation.tags?.map((t) => t) ?? [];

      const operationResponses = operation.responses ?? {};

      const decorators = [
        ...getExtensions(operation),
        { name: "route", args: [route] },
        { name: verb, args: [] },
      ];

      if (operation.summary) {
        decorators.push({ name: "summary", args: [operation.summary] });
      }

      const fixmes: string[] = [];

      // Handle missing operationId
      let operationId = operation.operationId;
      if (!operationId) {
        operationId = generateOperationId(verb, route, usedOperationIds);
        const warning = `Open API operation '${verb.toUpperCase()} ${route}' is missing an operationId. Generated: '${operationId}'`;
        context.logger.warn(warning);
        fixmes.push(warning);
      } else {
        usedOperationIds.add(operationId);
      }

      const requestBodies = transformRequestBodies(operation.requestBody, context);

      // Check if we need to split the operation due to incompatible content types
      const splitOperations = splitOperationByContentType(
        operationId,
        decorators,
        dedupeParameters([...routeParameters, ...parameters]),
        operation.description,
        requestBodies,
        operationResponses,
        tags,
        fixmes,
        usedOperationIds,
      );

      operations.push(...splitOperations);
    }
  }

  return operations;
}

function dedupeParameters(
  parameters: Refable<TypeSpecOperationParameter>[],
): Refable<TypeSpecOperationParameter>[] {
  const seen = new Set<string>();
  const dedupeList: Refable<TypeSpecOperationParameter>[] = [];

  // iterate in reverse since more specific-scoped parameters are added last
  for (let i = parameters.length - 1; i >= 0; i--) {
    // ignore resolving the $ref for now, unlikely to be able to resolve
    // issues without user intervention if a duplicate is present except in
    // very simple cases.
    const param = parameters[i];

    const identifier = "$ref" in param ? param.$ref : `${param.in}.${param.name}`;

    if (seen.has(identifier)) continue;
    seen.add(identifier);

    dedupeList.unshift(param);
  }

  return dedupeList;
}

function transformOperationParameter(
  parameter: Refable<OpenAPI3Parameter> | Refable<OpenAPIParameter3_2>,
): Refable<TypeSpecOperationParameter> {
  if ("$ref" in parameter) {
    return { $ref: parameter.$ref };
  }

  return {
    name: printIdentifier(parameter.name),
    in: parameter.in,
    doc: parameter.description,
    decorators: getParameterDecorators(parameter),
    isOptional: !parameter.required,
    schema: parameter.schema,
  };
}

/**
 * Splits an operation into multiple operations if it has incompatible content types
 * (e.g., multipart/form-data and application/json)
 */
function splitOperationByContentType(
  operationId: string,
  decorators: any[],
  parameters: Refable<TypeSpecOperationParameter>[],
  doc: string | undefined,
  requestBodies: TypeSpecRequestBody[],
  responses: any,
  tags: string[],
  fixmes: string[],
  usedOperationIds: Set<string>,
): TypeSpecOperation[] {
  // If no request bodies or only one content type, no splitting needed
  if (requestBodies.length <= 1) {
    return [
      {
        ...getScopeAndName(operationId),
        decorators,
        parameters,
        doc,
        operationId,
        requestBodies,
        responses,
        tags,
        fixmes,
      },
    ];
  }

  // Group request bodies by compatibility
  const multipartBodies = requestBodies.filter((r) => r.contentType.startsWith("multipart/"));
  const nonMultipartBodies = requestBodies.filter((r) => !r.contentType.startsWith("multipart/"));

  // If all are the same type (all multipart or all non-multipart), no splitting needed
  if (multipartBodies.length === 0 || nonMultipartBodies.length === 0) {
    return [
      {
        ...getScopeAndName(operationId),
        decorators,
        parameters,
        doc,
        operationId,
        requestBodies,
        responses,
        tags,
        fixmes,
      },
    ];
  }

  // Need to split into separate operations
  const operations: TypeSpecOperation[] = [];

  // Helper to create a suffix from content type
  const getContentTypeSuffix = (contentType: string): string => {
    if (contentType.startsWith("multipart/")) {
      return "Multipart";
    } else if (contentType === "application/json") {
      return "Json";
    } else if (contentType.startsWith("application/")) {
      // Remove 'application/' and capitalize first letter
      const type = contentType.replace("application/", "");
      return type.charAt(0).toUpperCase() + type.slice(1).replace(/[^a-zA-Z0-9]/g, "");
    } else if (contentType.startsWith("text/")) {
      const type = contentType.replace("text/", "");
      return type.charAt(0).toUpperCase() + type.slice(1).replace(/[^a-zA-Z0-9]/g, "");
    }
    // Default: sanitize content type
    return contentType.replace(/[^a-zA-Z0-9]/g, "");
  };

  // Group bodies that can share an operation (same category)
  const bodyGroups: TypeSpecRequestBody[][] = [];

  if (multipartBodies.length > 0) {
    bodyGroups.push(multipartBodies);
  }

  // For non-multipart, group by exact content type
  for (const body of nonMultipartBodies) {
    bodyGroups.push([body]);
  }

  // Create an operation for each group
  for (const bodyGroup of bodyGroups) {
    const suffix = getContentTypeSuffix(bodyGroup[0].contentType);
    const newOperationId = `${operationId}${suffix}`;

    // Track the new operation ID to avoid conflicts
    usedOperationIds.add(newOperationId);

    // Add @sharedRoute decorator
    const newDecorators = [{ name: "sharedRoute", args: [] }, ...decorators];

    operations.push({
      ...getScopeAndName(newOperationId),
      decorators: newDecorators,
      parameters,
      doc,
      operationId: newOperationId,
      requestBodies: bodyGroup,
      responses,
      tags,
      fixmes,
    });
  }

  return operations;
}

function transformRequestBodies(
  requestBodies: Refable<OpenAPI3RequestBody> | undefined,
  context: Context,
): TypeSpecRequestBody[] {
  if (!requestBodies) {
    return [];
  }

  const description = requestBodies.description;

  if ("$ref" in requestBodies) {
    requestBodies = context.getByRef<OpenAPI3RequestBody>(requestBodies.$ref);
  }

  if (!requestBodies) {
    return [];
  }

  const typespecBodies: TypeSpecRequestBody[] = [];
  for (const contentType of Object.keys(requestBodies.content)) {
    const contentBody = requestBodies.content[contentType];
    typespecBodies.push({
      contentType,
      isOptional: !requestBodies.required,
      doc: description ?? requestBodies.description,
      encoding: contentBody.encoding,
      schema: contentBody.schema,
    });
  }

  return typespecBodies;
}
