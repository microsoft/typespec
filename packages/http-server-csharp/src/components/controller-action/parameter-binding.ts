import type { AttributeProps } from "@alloy-js/csharp";
import type { Type } from "@typespec/compiler";
import type { CanonicalHttpProperty } from "@typespec/http-canonicalization";
import { AspNetMvc } from "../../utils/csharp-libs.jsx";

/**
 * Maps a canonical HTTP property to an ASP.NET parameter binding attribute.
 * FromRoute is omitted when the parameter name matches the route template variable,
 * since ASP.NET infers route binding by default.
 * Query and header bindings always include the Name to ensure correct wire-name mapping.
 */
export function getBindingAttribute(
  prop: CanonicalHttpProperty,
  paramName?: string,
): AttributeProps | undefined {
  switch (prop.kind) {
    case "path":
      // FromRoute is the default binding for path params in ASP.NET;
      // only emit when the C# parameter name differs from the route variable name
      if (paramName !== undefined && paramName === prop.options.name) {
        return undefined;
      }
      return { name: AspNetMvc.FromRouteAttribute, args: [`Name="${prop.options.name}"`] };
    case "query":
      return { name: AspNetMvc.FromQueryAttribute, args: [`Name="${prop.options.name}"`] };
    case "header":
      return { name: AspNetMvc.FromHeaderAttribute, args: [`Name="${prop.options.name}"`] };
    default:
      return undefined;
  }
}

/**
 * Gets the literal default value string for a parameter type, if applicable.
 * Only returns values for compile-time constant types (string, number, bool).
 * Arrays/tuples are NOT valid C# parameter defaults.
 */
export function getLiteralDefaultValue(type: Type): string | undefined {
  switch (type.kind) {
    case "String":
      return `"${type.value}"`;
    case "StringTemplate": {
      if (type.stringValue !== undefined) {
        return `"${type.stringValue}"`;
      }
      // Try to resolve the template by concatenating span values
      let resolved = "";
      for (const span of type.spans) {
        if (span.isInterpolated) {
          // The interpolated value could be a ModelProperty reference
          let spanType = span.type;
          if (spanType.kind === "ModelProperty") {
            spanType = spanType.type;
          }
          const spanDefault = getLiteralDefaultValue(spanType);
          if (spanDefault === undefined) return undefined;
          // Strip quotes from the resolved value
          resolved += spanDefault.replace(/^"|"$/g, "");
        } else {
          resolved += span.type.value;
        }
      }
      return `"${resolved}"`;
    }
    case "Number":
      return type.valueAsString;
    case "Boolean":
      return type.value ? "true" : "false";
    default:
      return undefined;
  }
}
