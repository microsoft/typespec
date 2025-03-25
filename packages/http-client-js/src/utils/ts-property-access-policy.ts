import { useTSNamePolicy } from "@alloy-js/typescript";
import { HttpProperty } from "@typespec/http";
import { AccessPathSegment, PropertyAccessPolicy } from "@typespec/http-client";
import { getDefaultValue } from "./parameters.jsx";

/**
 * TypeScript-specific property access policy that handles optional chaining
 * and proper formatting of property names
 */
export const TypeScriptPropertyAccessPolicy: PropertyAccessPolicy = {
  fromatPropertyAccessExpression(
    metadata: AccessPathSegment[],
  ): string {
    if (metadata.length === 0) return "";

    const namePolicy = useTSNamePolicy();
    let result = "";

    // Process each segment
    for (let i = 0; i < metadata.length; i++) {
      const { segmentName, property } = metadata[i];
      const isTopLevel = i === 0;
      // When the segment name is a number, we are handling an array index
      const isArrayIndex = typeof segmentName === "number";
      const formattedName = isArrayIndex
        ? `[${segmentName}]`
        : namePolicy.getName(segmentName, "object-member-data");

      // Handle first segment
      if (isTopLevel) {
        const hasDefault = getDefaultValue(property) !== undefined;
        // Top level optional parameters are put in options bag.
        result = property.optional || hasDefault ? `options?.${formattedName}` : formattedName;
        continue;
      }

      // Handle subsequent segments
      const prevSegment = metadata[i - 1];

      result = prevSegment.property.optional
        ? // Optional chaining for previous segment
          `${result}?.${formattedName}`
        : // Regular property access
          `${result}.${formattedName}`;
    }

    return result;
  },
};
