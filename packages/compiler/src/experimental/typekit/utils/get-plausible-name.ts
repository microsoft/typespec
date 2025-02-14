import { isTemplateInstance } from "../../../core/type-utils.js";
import { Enum, Interface, Model, Scalar, Union } from "../../../core/types.js";

/**
 * Get a plausible name for the given type.
 * @experimental
 */
export function getPlausibleName(type: Model | Union | Enum | Scalar | Interface) {
  let name = type.name;

  if (!name) {
    name = "TypeExpression"; // TODO: Implement automatic name generation based on the type context
  }

  if (isTemplateInstance(type)) {
    const namePrefix = type.templateMapper.args.map((a) => ("name" in a && a.name) || "").join("_");
    name = `${namePrefix}${name}`;
  }

  return name;
}
