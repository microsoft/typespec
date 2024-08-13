import { printIdentifier } from "@typespec/compiler";
import { OpenAPI3Components, OpenAPI3Parameter } from "../../../../types.js";
import { TypeSpecModel, TypeSpecModelProperty } from "../interfaces.js";
import { getParameterDecorators } from "../utils/decorators.js";
import { getScopeAndName, scopesMatch } from "../utils/get-scope-and-name.js";

/**
 * Transforms #/components/parameters into TypeSpec models.
 * Overwrites properties of existing models if an existing model already exists.
 * Populates the provided `models` array in-place.
 * @param models
 * @param parameters
 * @returns
 */
export function transformComponentParameters(
  models: TypeSpecModel[],
  parameters?: OpenAPI3Components["parameters"]
): void {
  if (!parameters) return;

  for (const name of Object.keys(parameters)) {
    const parameter = parameters[name];
    transformComponentParameter(models, name, parameter);
  }
}

function transformComponentParameter(
  models: TypeSpecModel[],
  key: string,
  parameter: OpenAPI3Parameter
): void {
  const { name, scope } = getScopeAndName(key);
  // Get the model name this parameter belongs to
  const modelName = scope.length > 0 ? scope.pop()! : name;

  // find a matching model, or create one if it doesn't exist
  let model = models.find((m) => m.name === modelName && scopesMatch(m.scope, scope));
  if (!model) {
    model = {
      kind: "model",
      scope,
      name: modelName,
      decorators: [],
      properties: [],
    };
    models.push(model);
  }

  const modelProperty = getModelPropertyFromParameter(parameter);

  // Check if the model already has a property of the matching name
  const propIndex = model.properties.findIndex((p) => p.name === modelProperty.name);
  if (propIndex >= 0) {
    model.properties[propIndex] = modelProperty;
  } else {
    model.properties.push(modelProperty);
  }
}

function getModelPropertyFromParameter(parameter: OpenAPI3Parameter): TypeSpecModelProperty {
  return {
    name: printIdentifier(parameter.name),
    isOptional: !parameter.required,
    doc: parameter.description ?? parameter.schema.description,
    decorators: getParameterDecorators(parameter),
    schema: parameter.schema,
  };
}
