import { OpenAPI3Schema, Refable } from "../../../../types.js";
import {
  TypeSpecAlias,
  TypeSpecDataTypes,
  TypeSpecEnum,
  TypeSpecModel,
  TypeSpecModelProperty,
  TypeSpecScalar,
  TypeSpecUnion,
} from "../interfaces.js";
import { getDecoratorsForSchema } from "../utils/decorators.js";
import { generateDocs } from "../utils/docs.js";
import { generateDecorators } from "./generate-decorators.js";
import {
  generateTypeFromSchema,
  getRefScopeAndName,
  getTypeSpecPrimitiveFromSchema,
} from "./generate-types.js";

export function generateDataType(type: TypeSpecDataTypes): string {
  switch (type.kind) {
    case "alias":
      return generateAlias(type);
    case "enum":
      return generateEnum(type);
    case "model":
      return generateModel(type);
    case "scalar":
      return generateScalar(type);
    case "union":
      return generateUnion(type);
  }
}

function generateAlias(alias: TypeSpecAlias): string {
  // Since aliases are not represented in the TypeGraph,
  // generate a model so that the model name is present in emitted OpenAPI3.
  // May revisit to allow emitting actual alias.
  const { scope, name } = getRefScopeAndName(alias.ref);
  return `model ${alias.name} is ${[...scope, name].join(".")};`;
}

function generateEnum(tsEnum: TypeSpecEnum): string {
  const definitions: string[] = [];

  if (tsEnum.doc) {
    definitions.push(generateDocs(tsEnum.doc));
  }

  definitions.push(...generateDecorators(tsEnum.decorators));
  definitions.push(`enum ${tsEnum.name} {`);

  const schema = tsEnum.schema;

  if (schema.enum) {
    definitions.push(...schema.enum.map((e) => `${JSON.stringify(e)},`));
  }

  definitions.push("}");

  return definitions.join("\n");
}

function generateScalar(scalar: TypeSpecScalar): string {
  const definitions: string[] = [];

  if (scalar.doc) {
    definitions.push(generateDocs(scalar.doc));
  }

  definitions.push(...generateDecorators(scalar.decorators));
  const type = generateTypeFromSchema(scalar.schema);

  definitions.push(`scalar ${scalar.name} extends ${type};`);

  return definitions.join("\n");
}

function generateUnion(union: TypeSpecUnion): string {
  const definitions: string[] = [];

  if (union.doc) {
    definitions.push(generateDocs(union.doc));
  }

  definitions.push(...generateDecorators(union.decorators));

  definitions.push(`union ${union.name} {`);

  const schema = union.schema;

  if (schema.enum) {
    definitions.push(...schema.enum.map((e) => `${JSON.stringify(e)},`));
  } else if (schema.oneOf) {
    definitions.push(...schema.oneOf.map(generateUnionMember));
  } else if (schema.anyOf) {
    definitions.push(...schema.anyOf.map(generateUnionMember));
  } else {
    // check if it's a primitive type
    const primitiveType = getTypeSpecPrimitiveFromSchema(schema);
    if (primitiveType) {
      definitions.push(`${primitiveType},`);
    }
  }

  if (schema.nullable) {
    definitions.push("null,");
  }

  definitions.push("}");

  return definitions.join("\n");
}

function generateUnionMember(member: Refable<OpenAPI3Schema>): string {
  return `${generateTypeFromSchema(member)},`;
}

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
    definitions.push(`...Record<${generateTypeFromSchema(model.additionalProperties)}>;`);
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
