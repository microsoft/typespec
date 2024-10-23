import { Refable } from "../../../../types.js";
import {
  TypeSpecOperation,
  TypeSpecOperationParameter,
  TypeSpecRequestBody,
} from "../interfaces.js";
import { Context } from "../utils/context.js";
import { generateDocs } from "../utils/docs.js";
import { generateDecorators } from "./generate-decorators.js";

export function generateOperation(operation: TypeSpecOperation, context: Context): string {
  const definitions: string[] = [];

  if (operation.doc) {
    definitions.push(generateDocs(operation.doc));
  }

  definitions.push(...operation.tags.map((t) => `@tag("${t}")`));

  definitions.push(generateDecorators(operation.decorators).join(" "));

  // generate parameters
  const parameters: string[] = [
    ...operation.parameters.map((p) => generateOperationParameter(operation, p, context)),
    ...generateRequestBodyParameters(operation.requestBodies, context),
  ];

  const responseTypes = operation.responseTypes.length
    ? operation.responseTypes.join(" | ")
    : "void";

  definitions.push(`op ${operation.name}(${parameters.join(", ")}): ${responseTypes};`);

  return definitions.join(" ");
}

function generateOperationParameter(
  operation: TypeSpecOperation,
  parameter: Refable<TypeSpecOperationParameter>,
  context: Context,
) {
  if ("$ref" in parameter) {
    return `...${context.getRefName(parameter.$ref, operation.scope)}`;
  }

  const definitions: string[] = [];

  if (parameter.doc) {
    definitions.push(generateDocs(parameter.doc));
  }

  definitions.push(...generateDecorators(parameter.decorators));

  definitions.push(
    `${parameter.name}${parameter.isOptional ? "?" : ""}: ${context.generateTypeFromRefableSchema(parameter.schema, operation.scope)}`,
  );

  return definitions.join(" ");
}

function generateRequestBodyParameters(
  requestBodies: TypeSpecRequestBody[],
  context: Context,
): string[] {
  if (!requestBodies.length) {
    return [];
  }

  const definitions: string[] = [];

  // Generate the content-type header if defined content-types is not just 'application/json'
  const contentTypes = requestBodies.map((r) => r.contentType);
  if (!supportsOnlyJson(contentTypes)) {
    definitions.push(`@header contentType: ${contentTypes.map((c) => `"${c}"`).join(" | ")}`);
  }

  // Get the set of referenced types
  const body = Array.from(
    new Set(
      requestBodies
        .filter((r) => !!r.schema)
        .map((r) => context.generateTypeFromRefableSchema(r.schema!, [])),
    ),
  ).join(" | ");

  if (body) {
    definitions.push(`@bodyRoot body: ${body}`);
  }

  return definitions;
}

function supportsOnlyJson(contentTypes: string[]) {
  return contentTypes.length === 1 && contentTypes[0] === "application/json";
}
