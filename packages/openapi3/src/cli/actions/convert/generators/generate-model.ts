import {
  TypeSpecAlias,
  TypeSpecDataTypes,
  TypeSpecEnum,
  TypeSpecModel,
  TypeSpecScalar,
  TypeSpecUnion,
} from "../interfaces.js";
import { Context } from "../utils/context.js";
import { getDecoratorsForSchema } from "../utils/decorators.js";
import { generateDocs } from "../utils/docs.js";
import { generateDecorators } from "./generate-decorators.js";
import { getTypeSpecPrimitiveFromSchema } from "./generate-types.js";

export function generateDataType(type: TypeSpecDataTypes, context: Context): string {
  switch (type.kind) {
    case "alias":
      return generateAlias(type, context);
    case "enum":
      return generateEnum(type);
    case "model":
      return generateModel(type, context);
    case "scalar":
      return generateScalar(type, context);
    case "union":
      return generateUnion(type, context);
  }
}

function generateAlias(alias: TypeSpecAlias, context: Context): string {
  // Since aliases are not represented in the TypeGraph,
  // generate a model so that the model name is present in emitted OpenAPI3.
  // May revisit to allow emitting actual alias.
  const sourceModel = context.getRefName(alias.ref, alias.scope);
  return `model ${alias.name} is ${sourceModel};`;
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

function generateScalar(scalar: TypeSpecScalar, context: Context): string {
  const definitions: string[] = [];

  if (scalar.doc) {
    definitions.push(generateDocs(scalar.doc));
  }

  definitions.push(...generateDecorators(scalar.decorators));
  const type = context.generateTypeFromRefableSchema(scalar.schema, scalar.scope);

  definitions.push(`scalar ${scalar.name} extends ${type};`);

  return definitions.join("\n");
}

function generateUnion(union: TypeSpecUnion, context: Context): string {
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
    definitions.push(
      ...schema.oneOf.map((member) => context.generateTypeFromRefableSchema(member, union.scope)),
    );
  } else if (schema.anyOf) {
    definitions.push(
      ...schema.anyOf.map((member) => context.generateTypeFromRefableSchema(member, union.scope)),
    );
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

function generateModel(model: TypeSpecModel, context: Context): string {
  const definitions: string[] = [];
  const modelDeclaration = generateModelDeclaration(model);

  if (model.doc) {
    definitions.push(generateDocs(model.doc));
  }

  definitions.push(...generateDecorators(model.decorators));
  definitions.push(modelDeclaration.open);

  if (model.spread?.length) {
    definitions.push(...model.spread.map((spread) => `...${spread};`));
  }

  definitions.push(
    ...model.properties.map((prop) => {
      // Decorators will be a combination of top-level (parameters) and
      // schema-level decorators.
      const decorators = generateDecorators([
        ...prop.decorators,
        ...getDecoratorsForSchema(prop.schema),
      ]).join(" ");

      const doc = prop.doc ? generateDocs(prop.doc) : "";

      return `${doc}${decorators} ${prop.name}${prop.isOptional ? "?" : ""}: ${context.generateTypeFromRefableSchema(prop.schema, model.scope)};`;
    }),
  );

  if (model.additionalProperties) {
    definitions.push(
      `...Record<${context.generateTypeFromRefableSchema(model.additionalProperties, model.scope)}>;`,
    );
  }

  if (modelDeclaration.close) definitions.push(modelDeclaration.close);

  return definitions.join("\n");
}

type ModelDeclarationOutput = { open: string; close?: string };

function generateModelDeclaration(model: TypeSpecModel): ModelDeclarationOutput {
  const modelName = model.name;

  if (model.is) {
    return { open: `model ${modelName} is ${model.is};` };
  }

  if (model.extends) {
    return { open: `model ${modelName} extends ${model.extends} {`, close: "}" };
  }

  return { open: `model ${modelName} {`, close: "}" };
}
