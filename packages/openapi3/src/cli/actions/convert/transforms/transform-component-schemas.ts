import { OpenAPI3Components, OpenAPI3Schema } from "../../../../types.js";
import {
  getArrayType,
  getIntegerType,
  getNumberType,
  getRefName,
  getStringType,
} from "../generators/generate-types.js";
import { TypeSpecModel, TypeSpecModelProperty } from "../interfaces.js";
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
  models: TypeSpecModel[],
  name: string,
  schema: OpenAPI3Schema
): void {
  const extendsParent = getModelExtends(schema);
  const isParent = getModelIs(schema);
  models.push({
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
      name,
      doc: property.description,
      schema: property,
      isOptional: !required.includes(name),
      decorators: [...getDecoratorsForSchema(property)],
    });
  }

  return modelProperties;
}
