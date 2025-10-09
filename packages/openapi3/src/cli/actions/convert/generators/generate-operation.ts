import { Refable } from "../../../../types.js";
import {
  TypeSpecOperation,
  TypeSpecOperationParameter,
  TypeSpecRequestBody,
} from "../interfaces.js";
import { Context } from "../utils/context.js";
import { generateDocs } from "../utils/docs.js";
import { generateDecorators } from "./generate-decorators.js";
import { generateOperationReturnType } from "./generate-response-expressions.js";

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

  const responses = generateOperationReturnType(operation, context);

  if (operation.fixmes?.length) {
    definitions.push("\n", ...operation.fixmes.map((f) => `// FIXME: ${f}\n`));
  }

  definitions.push(`op ${operation.name}(${parameters.join(", ")}): ${responses};`);

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

  // Check if any content type is multipart
  const hasMultipart = requestBodies.some((r) => r.contentType.startsWith("multipart/"));

  // Filter request bodies: if multipart is present, only keep multipart types
  const filteredBodies = hasMultipart
    ? requestBodies.filter((r) => r.contentType.startsWith("multipart/"))
    : requestBodies;

  // Generate the content-type header if defined content-types is not just 'application/json'
  const contentTypes = filteredBodies.map((r) => r.contentType);
  if (!supportsOnlyJson(contentTypes)) {
    definitions.push(`@header contentType: ${contentTypes.map((c) => `"${c}"`).join(" | ")}`);
  }

  const isMultipart = hasMultipart;
  // Get the set of referenced types
  const body = Array.from(
    new Set(
      filteredBodies
        .filter((r) => !!r.schema)
        .map((r) => context.generateTypeFromRefableSchema(r.schema!, [], isMultipart, r.encoding)),
    ),
  ).join(" | ");

  if (body) {
    let doc = "";
    if (filteredBodies[0].doc) {
      doc = generateDocs(filteredBodies[0].doc);
    }
    if (isMultipart) {
      definitions.push(`${doc}@multipartBody body: ${body}`);
    } else {
      definitions.push(`${doc}@body body: ${body}`);
    }
  }

  return definitions;
}

function supportsOnlyJson(contentTypes: string[]) {
  return contentTypes.length === 1 && contentTypes[0] === "application/json";
}
