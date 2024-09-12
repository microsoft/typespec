import { Enum, Interface, isTemplateInstance, Model, Scalar, Union } from "../../../index.js";

export function getPlausibleName(type: Model | Union | Enum | Scalar | Interface) {
  if (!("name" in type)) {
    return "";
  }

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
