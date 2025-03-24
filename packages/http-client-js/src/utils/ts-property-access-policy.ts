import { useTSNamePolicy } from "@alloy-js/typescript";
import {PropertyAccessPolicy, AccessPathSegment } from "@typespec/http-client";
import { HttpProperty } from "@typespec/http";
import { getDefaultValue } from "./parameters.jsx";

/**
 * TypeScript-specific property access policy that handles optional chaining
 * and proper formatting of property names
 */
export const TypeScriptPropertyAccessPolicy: PropertyAccessPolicy = {
  fromatPropertyAccessExpression(httpProperty: HttpProperty, metadata: AccessPathSegment[]): string {
    if (metadata.length === 0) return "";
    
    const namePolicy = useTSNamePolicy();
    let result = "";
    
    // Process each segment
    for (let i = 0; i < metadata.length; i++) {
      const {segmentName, property} = metadata[i];
      const isFirst = i === 0;
      const formattedName = typeof segmentName === "number" 
        ? `[${segmentName}]` 
        : namePolicy.getName(segmentName, "object-member-data");
      
      // Handle first segment
      if (isFirst) {
        const hasDefault = getDefaultValue(httpProperty.property) !== undefined;
        result = property.optional || hasDefault
          ? `options?.${formattedName}`
          : formattedName;
        continue;
      }
      
      // Handle subsequent segments
      const prevSegment = metadata[i - 1];
      if (prevSegment.property.optional) {
        result += typeof segmentName === "number" 
          ? `?.[${segmentName}]` 
          : `?.${formattedName}`;
      } else {
        result += typeof segmentName === "number" 
          ? `[${segmentName}]` 
          : `.${formattedName}`;
      }
    }
    
    return result;
  }
};
