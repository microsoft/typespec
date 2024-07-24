import { Refable } from "../../../../types.js";
import {
  TypeSpecOperation,
  TypeSpecOperationParameter,
  TypeSpecRequestBody,
} from "../interfaces.js";
import { generateDocs } from "../utils/docs.js";
import { generateDecorators } from "./generate-decorators.js";
import { generateTypeFromSchema, getRefName } from "./generate-types.js";

export function generateOperation(operation: TypeSpecOperation): string {
  const definitions: string[] = [];

  if (operation.doc) {
    definitions.push(generateDocs(operation.doc));
  }

  definitions.push(...operation.tags.map((t) => `@tag("${t}")`));

  definitions.push(generateDecorators(operation.decorators).join(" "));

  // generate parameters
  const parameters: string[] = [
    ...operation.parameters.map(generateOperationParameter),
    ...generateRequestBodyParameters(operation.requestBodies),
  ];

  const responseTypes = operation.responseTypes.length
    ? operation.responseTypes.join(" | ")
    : "void";

  definitions.push(`op ${operation.name}(${parameters.join(", ")}): ${responseTypes};`);

  return definitions.join(" ");
}

function generateOperationParameter(parameter: Refable<TypeSpecOperationParameter>) {
  if ("$ref" in parameter) {
    // check if referencing a model or a property
    const refName = getRefName(parameter.$ref);
    const paramName = refName.indexOf(".") >= 0 ? refName.split(".").pop() : refName;
    // when refName and paramName match, we're referencing a model and can spread
    // TODO: Handle optionality
    return refName === paramName ? `...${refName}` : `${paramName}: ${refName}`;
  }

  const definitions: string[] = [];

  if (parameter.doc) {
    definitions.push(generateDocs(parameter.doc));
  }

  definitions.push(...generateDecorators(parameter.decorators));

  definitions.push(
    `${parameter.name}${parameter.isOptional ? "?" : ""}: ${generateTypeFromSchema(parameter.schema)}`
  );

  return definitions.join(" ");
}

function generateRequestBodyParameters(requestBodies: TypeSpecRequestBody[]): string[] {
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
    new Set(requestBodies.filter((r) => !!r.schema).map((r) => generateTypeFromSchema(r.schema!)))
  ).join(" | ");

  if (body) {
    definitions.push(`@bodyRoot body: ${body}`);
  }

  return definitions;
}

function supportsOnlyJson(contentTypes: string[]) {
  return contentTypes.length === 1 && contentTypes[0] === "application/json";
}
