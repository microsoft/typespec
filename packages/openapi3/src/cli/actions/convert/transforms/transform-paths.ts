import { printIdentifier } from "@typespec/compiler";
import {
  OpenAPI3Parameter,
  OpenAPI3PathItem,
  OpenAPI3RequestBody,
  Refable,
} from "../../../../types.js";
import {
  TypeSpecModel,
  TypeSpecOperation,
  TypeSpecOperationParameter,
  TypeSpecRequestBody,
} from "../interfaces.js";
import { getExtensions, getParameterDecorators } from "../utils/decorators.js";
import { getScopeAndName } from "../utils/get-scope-and-name.js";
import { supportedHttpMethods } from "../utils/supported-http-methods.js";
import { collectOperationResponses } from "./transform-operation-responses.js";

/**
 * Transforms each operation defined under #/paths/{route}/{httpMethod} into a TypeSpec operation.
 * @params models - The array of models to populate with any new models generated from the operation.
 * @param paths
 * @returns
 */
export function transformPaths(
  models: TypeSpecModel[],
  paths: Record<string, OpenAPI3PathItem>,
): TypeSpecOperation[] {
  const operations: TypeSpecOperation[] = [];

  for (const route of Object.keys(paths)) {
    const path = paths[route];
    for (const verb of supportedHttpMethods) {
      const operation = path[verb];
      if (!operation) continue;

      const parameters = operation.parameters?.map(transformOperationParameter) ?? [];
      const tags = operation.tags?.map((t) => t) ?? [];

      const operationResponses = operation.responses ?? {};
      const responseModels = collectOperationResponses(operation.operationId!, operationResponses);
      models.push(...responseModels);

      operations.push({
        ...getScopeAndName(operation.operationId!),
        decorators: [
          ...getExtensions(operation),
          { name: "route", args: [route] },
          { name: verb, args: [] },
        ],
        parameters,
        doc: operation.description,
        operationId: operation.operationId,
        requestBodies: transformRequestBodies(operation.requestBody),
        responseTypes: responseModels.map((m) => m.name),
        tags: tags,
      });
    }
  }

  return operations;
}

function transformOperationParameter(
  parameter: Refable<OpenAPI3Parameter>,
): Refable<TypeSpecOperationParameter> {
  if ("$ref" in parameter) {
    return { $ref: parameter.$ref };
  }

  return {
    name: printIdentifier(parameter.name),
    doc: parameter.description,
    decorators: getParameterDecorators(parameter),
    isOptional: !parameter.required,
    schema: parameter.schema,
  };
}

function transformRequestBodies(requestBodies?: OpenAPI3RequestBody): TypeSpecRequestBody[] {
  if (!requestBodies) {
    return [];
  }

  const typespecBodies: TypeSpecRequestBody[] = [];
  for (const contentType of Object.keys(requestBodies.content)) {
    const contentBody = requestBodies.content[contentType];
    typespecBodies.push({
      contentType,
      isOptional: !requestBodies.required,
      doc: requestBodies.description,
      encoding: contentBody.encoding,
      schema: contentBody.schema,
    });
  }

  return typespecBodies;
}
