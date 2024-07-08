import { TypeSpecModel, TypeSpecModelProperty } from "../interfaces.js";
import { getDecoratorsForSchema } from "../utils/decorators.js";
import { generateDocs } from "../utils/docs.js";
import { generateDecorators } from "./generate-decorators.js";
import { generateTypeFromSchema } from "./generate-types.js";

export function generateModel(model: TypeSpecModel): string {
  const definitions: string[] = [];
  const modelDeclaration = generateModelDeclaration(model);

  if (model.doc) {
    definitions.push(generateDocs(model.doc));
  }

  definitions.push(...generateDecorators(model.decorators));
  definitions.push(modelDeclaration.open);

  definitions.push(...model.properties.map(generateModelProperty));

  if (model.additionalProperties) {
    definitions.push(`...${generateTypeFromSchema(model.additionalProperties)};`);
  }

  if (modelDeclaration.close) definitions.push(modelDeclaration.close);

  return definitions.join("\n");
}

type ModelDeclarationOutput = { open: string; close?: string };

function generateModelDeclaration(model: TypeSpecModel): ModelDeclarationOutput {
  const modelName = model.name;
  const modelType = model.type ?? "object";

  if (model.is) {
    return { open: `model ${modelName} is ${model.is};` };
  }

  if (!model.extends) {
    return { open: `model ${modelName} {`, close: "}" };
  }

  if (modelType === "object") {
    return { open: `model ${modelName} extends ${model.extends} {`, close: "}" };
  }

  switch (modelType) {
    case "boolean":
    case "integer":
    case "number":
    case "string":
      return { open: `scalar ${modelName} extends ${model.extends};` };
  }

  return { open: `model ${modelName} {`, close: "}" };
}

function generateModelProperty(property: TypeSpecModelProperty): string {
  // Decorators will be a combination of top-level (parameters) and
  // schema-level decorators.
  const decorators = generateDecorators([
    ...property.decorators,
    ...getDecoratorsForSchema(property.schema),
  ]).join(" ");

  const doc = property.doc ? generateDocs(property.doc) : "";

  return `${doc}${decorators} ${property.name}${property.isOptional ? "?" : ""}: ${generateTypeFromSchema(property.schema)};`;
}
