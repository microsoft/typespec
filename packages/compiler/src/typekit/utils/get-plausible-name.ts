import { isTemplateInstance } from "../../core/type-utils.js";
import { Enum, Interface, Model, Scalar, Union } from "../../core/types.js";

/**
 * Get a plausible name for the given type.
 * @experimental
 */
export function getPlausibleName(type: Model | Union | Enum | Scalar | Interface): string {
  let name = type.name ?? "TypeExpression";

  if (isTemplateInstance(type)) {
    const namePrefix = type.templateMapper.args
      .map((a) => {
        if (a.entityKind === "Type") {
          switch (a.kind) {
            case "Scalar":
              // Box<scalar> is not a scalar so capital case naming convention applies
              const name = getPlausibleName(a);
              return name.charAt(0).toUpperCase() + name.slice(1);
            case "Model":
            case "Interface":
            case "Enum":
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
