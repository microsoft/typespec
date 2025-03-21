import { useTSNamePolicy } from "@alloy-js/typescript";
import { PropertyAccessPolicy } from "@typespec/http-client";
import { getDefaultValue } from "./parameters.jsx";

export const TypeScriptPropertyAccessPolicy: PropertyAccessPolicy = {
  getTopLevelAccess(httpProperty) {
    const id = formatAccess(httpProperty.property.name);
    const isOptional =
      httpProperty.property.optional || getDefaultValue(httpProperty.property) !== undefined;
    return isOptional ? `options?.${id}` : id;
  },

  getNestedAccess(root, path) {
    const name = root.name;
    let result =
      root.property.optional || getDefaultValue(root.property) !== undefined
        ? `options?.${formatAccess(name)}`
        : formatAccess(name);

    for (const segment of path) {
      const isParentOptional = segment.parent?.optional ?? false;
      const access = formatAccess(segment.name);
      if (typeof segment.name === "number") {
        result += `[${segment.name}]`; // Always bracket for numbers
      } else {
        result += isParentOptional ? `?.${access}` : `.${access}`;
      }
    }

    return result;
  },
};

function formatAccess(name: string | number): string {
  const namePolicy = useTSNamePolicy();
  const propertyName = namePolicy.getName(name as string, "object-member-data");
  return typeof name === "number" ? `[${name}]` : propertyName;
}
