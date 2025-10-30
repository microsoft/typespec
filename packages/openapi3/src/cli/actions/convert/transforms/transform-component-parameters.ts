import { printIdentifier } from "@typespec/compiler";
import { OpenAPI3Parameter, OpenAPIParameter3_2 } from "../../../../types.js";
import { TypeSpecDataTypes, TypeSpecModelProperty } from "../interfaces.js";
import { Context } from "../utils/context.js";
import { getParameterDecorators } from "../utils/decorators.js";
import { getScopeAndName } from "../utils/get-scope-and-name.js";

/**
 * Transforms #/components/parameters into TypeSpec models.
 * Overwrites properties of existing models if an existing model already exists.
 * Populates the provided `models` array in-place.
 * @param models
 * @param parameters
 * @returns
 */
export function transformComponentParameters(
  context: Context,
  dataTypes: TypeSpecDataTypes[],
): void {
  const parameters = context.openApi3Doc.components?.parameters;
  if (!parameters) return;

  for (const name of Object.keys(parameters)) {
    const parameter = parameters[name];
    if ("$ref" in parameter) continue;
    transformComponentParameter(dataTypes, name, parameter);
  }
}

function transformComponentParameter(
  dataTypes: TypeSpecDataTypes[],
  key: string,
  parameter: OpenAPI3Parameter | OpenAPIParameter3_2,
): void {
  const { name, scope } = getScopeAndName(key);
  // Parameters should live in the root Parameters namespace
  scope.unshift("Parameters");

  dataTypes.push({
    kind: "model",
    scope,
    name,
    decorators: [],
    properties: [getModelPropertyFromParameter(parameter)],
  });
}

function getModelPropertyFromParameter(
  parameter: OpenAPI3Parameter | OpenAPIParameter3_2,
): TypeSpecModelProperty {
  const parameterSchema = "schema" in parameter ? (parameter.schema ?? {}) : {};
  return {
    name: printIdentifier(parameter.name),
    isOptional: !parameter.required,
    doc: parameter.description ?? parameterSchema.description,
    decorators: getParameterDecorators(parameter),
    schema: parameterSchema,
  };
}
