import { isTemplateInstance } from "../../core/type-utils.js";
import { Enum, Interface, Model, Scalar, Union } from "../../core/types.js";

/**
 * Get a plausible name for the given type.
 * @experimental
 */
export function getPlausibleName(type: Model | Union | Enum | Scalar | Interface): string {
  let name = type.name;

  if (!name) {
    name = "TypeExpression"; // TODO: Implement automatic name generation based on the type context
  }

  if (type.kind === "Scalar") {
    name = `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  }

  if (isTemplateInstance(type)) {
    const namePrefix = type.templateMapper.args
      .map((a) => {
        if (a.entityKind === "Type") {
          switch (a.kind) {
            case "Model":
            case "Interface":
            case "Enum":
            case "Scalar":
            case "Union":
              return getPlausibleName(a);
          }
        }
        return "name" in a ? a.name : "";
      })
      .join("_");
    name = `${namePrefix}${name}`;
  }

  return name;
}
