import { createDiagnosticCollector } from "../index.js";
import { createDiagnostic } from "../messages.js";
import { Diagnostic, StringTemplate } from "../types.js";
import { getTypeName } from "./type-name-utils.js";

/**
 * Convert a string template to a string value.
 * Only literal interpolated can be converted to string.
 * Otherwise diagnostics will be reported.
 *
 * @param stringTemplate String template to convert.
 */
export function stringTemplateToString(
  stringTemplate: StringTemplate
): [string, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const result = stringTemplate.spans
    .map((x) => {
      if (x.isInterpolated) {
        switch (x.type.kind) {
          case "String":
          case "Number":
          case "Boolean":
            return String(x.type.value);
          case "StringTemplate":
            return diagnostics.pipe(stringTemplateToString(x.type));
          default:
            diagnostics.add(
              createDiagnostic({
                code: "non-literal-string-template",
                target: x.node,
              })
            );
            return getTypeName(x.type);
        }
      } else {
        return x.type.value;
      }
    })
    .join("");
  return diagnostics.wrap(result);
}
