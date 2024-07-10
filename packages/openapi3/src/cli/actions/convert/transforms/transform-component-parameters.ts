import { printIdentifier } from "@typespec/compiler";
import { OpenAPI3Components, OpenAPI3Parameter } from "../../../../types.js";
import { TypeSpecModel, TypeSpecModelProperty } from "../interfaces.js";
import { getParameterDecorators } from "../utils/decorators.js";

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
    // Determine what the name of the parameter's model is since name may point at
    // a nested property.
    const modelName = printIdentifier(name.indexOf(".") < 0 ? name : name.split(".").shift()!);

    // Check if model already exists; if not, create it
    let model = models.find((m) => m.name === modelName);
    if (!model) {
      model = {
        name: modelName,
        decorators: [],
        properties: [],
      };
      models.push(model);
    }

    const parameter = parameters[name];
    const modelParameter = getModelPropertyFromParameter(parameter);

    // Check if the model already has a property of the matching name
    const propIndex = model.properties.findIndex((p) => p.name === modelParameter.name);
    if (propIndex >= 0) {
      model.properties[propIndex] = modelParameter;
    } else {
      model.properties.push(modelParameter);
    }
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
