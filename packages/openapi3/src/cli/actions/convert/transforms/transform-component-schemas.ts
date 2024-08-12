import { printIdentifier } from "@typespec/compiler";
import { OpenAPI3Components, OpenAPI3Schema, Refable } from "../../../../types.js";
import {
  getArrayType,
  getIntegerType,
  getNumberType,
  getRefName,
  getStringType,
} from "../generators/generate-types.js";
import {
  TypeSpecDataTypes,
  TypeSpecEnum,
  TypeSpecModel,
  TypeSpecModelProperty,
  TypeSpecUnion,
} from "../interfaces.js";
import { getDecoratorsForSchema } from "../utils/decorators.js";
import { getScopeAndName } from "../utils/get-scope-and-name.js";

/**
 * Transforms #/components/schemas into TypeSpec models.
 * Populates the provided `models` array in-place.
 * @param models
 * @param schemas
 * @returns
 */
export function transformComponentSchemas(
  models: TypeSpecModel[],
  schemas?: OpenAPI3Components["schemas"]
): void {
  if (!schemas) return;

  for (const name of Object.keys(schemas)) {
    const schema = schemas[name];
    transformComponentSchema(models, name, schema);
  }
}

function transformComponentSchema(
  types: TypeSpecDataTypes[],
  name: string,
  schema: OpenAPI3Schema
): void {
  const kind = getTypeSpecKind(schema);
  switch (kind) {
    case "alias":
      return populateAlias(types, name, schema);
    case "enum":
      return populateEnum(types, name, schema);
    case "model":
      return populateModel(types, name, schema);
    case "union":
      return populateUnion(types, name, schema);
    case "scalar":
      return populateScalar(types, name, schema);
  }
}

function populateAlias(
  types: TypeSpecDataTypes[],
  name: string,
  schema: Refable<OpenAPI3Schema>
): void {
  if (!("$ref" in schema)) {
    return;
  }

  types.push({
    kind: "alias",
    ...getScopeAndName(name),
    doc: schema.description,
    ref: getRefName(schema.$ref),
  });
}

function populateEnum(types: TypeSpecDataTypes[], name: string, schema: OpenAPI3Schema): void {
  const tsEnum: TypeSpecEnum = {
    kind: "enum",
    ...getScopeAndName(name),
    decorators: getDecoratorsForSchema(schema),
    doc: schema.description,
    schema,
  };

  types.push(tsEnum);
}

function populateScalar(types: TypeSpecDataTypes[], name: string, schema: OpenAPI3Schema): void {
  types.push({
    kind: "scalar",
    ...getScopeAndName(name),
    decorators: getDecoratorsForSchema(schema),
    doc: schema.description,
    schema,
  });
}

function populateUnion(types: TypeSpecDataTypes[], name: string, schema: OpenAPI3Schema): void {
  const union: TypeSpecUnion = {
    kind: "union",
    ...getScopeAndName(name),
    decorators: getDecoratorsForSchema(schema),
    doc: schema.description,
    schema,
  };

  types.push(union);
}

function populateModel(types: TypeSpecDataTypes[], name: string, schema: OpenAPI3Schema): void {
  const extendsParent = getModelExtends(schema);
  const isParent = getModelIs(schema);
  types.push({
    kind: "model",
    ...getScopeAndName(name),
    decorators: [...getDecoratorsForSchema(schema)],
    doc: schema.description,
    properties: getModelPropertiesFromObjectSchema(schema),
    additionalProperties:
      typeof schema.additionalProperties === "object" ? schema.additionalProperties : undefined,
    extends: extendsParent,
    is: isParent,
    type: schema.type,
  });
}

function getModelExtends(schema: OpenAPI3Schema): string | undefined {
  switch (schema.type) {
    case "boolean":
      return "boolean";
    case "integer":
      return getIntegerType(schema);
    case "number":
      return getNumberType(schema);
    case "string":
      return getStringType(schema);
  }

  if (schema.type !== "object" || !schema.allOf) {
    return;
  }

  if (schema.allOf.length !== 1) {
    // TODO: Emit warning - can't extend more than 1 model
    return;
  }

  const parent = schema.allOf[0];
  if (!parent || !("$ref" in parent)) {
    // TODO: Error getting parent - must be a reference, not expression
    return;
  }

  return getRefName(parent.$ref);
}

function getModelIs(schema: OpenAPI3Schema): string | undefined {
  if (schema.type !== "array") {
    return;
  }
  return getArrayType(schema);
}

function getModelPropertiesFromObjectSchema({
  properties,
  required = [],
}: OpenAPI3Schema): TypeSpecModelProperty[] {
  if (!properties) return [];

  const modelProperties: TypeSpecModelProperty[] = [];
  for (const name of Object.keys(properties)) {
    const property = properties[name];

    modelProperties.push({
      name: printIdentifier(name),
      doc: property.description,
      schema: property,
      isOptional: !required.includes(name),
      decorators: [...getDecoratorsForSchema(property)],
    });
  }

  return modelProperties;
}

function getTypeSpecKind(schema: OpenAPI3Schema): TypeSpecDataTypes["kind"] {
  if ("$ref" in schema) {
    return "alias";
  }

  if (schema.enum && schema.type === "string" && !schema.nullable) {
    return "enum";
  } else if (schema.anyOf || schema.oneOf || schema.enum || schema.nullable) {
    return "union";
  } else if (schema.type === "object" || schema.type === "array" || schema.allOf) {
    return "model";
  }

  return "scalar";
}
