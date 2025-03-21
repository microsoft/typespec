import { useTSNamePolicy } from "@alloy-js/typescript";
import { PropertyAccessPolicy } from "@typespec/http-client";

export const TypeScriptPropertyAccessPolicy: PropertyAccessPolicy = {
  getTopLevelAccess(name, optional) {
    const id = formatAccess(name);
    return optional ? `options?.${id}` : id;
  },

  getNestedAccess(root, path, rootOptional) {
    let result = rootOptional
      ? `options?.${formatAccess(root)}`
      : formatAccess(root);

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
