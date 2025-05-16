import { createDiagnosticCollector } from "../diagnostics.js";
import { createDiagnostic } from "../messages.js";
import type { Diagnostic, StringTemplate } from "../types.js";

export function isStringTemplateSerializable(
  stringTemplate: StringTemplate,
): [boolean, readonly Diagnostic[]] {
  if (stringTemplate.stringValue !== undefined) {
    return [true, []];
  } else {
    return [false, explainStringTemplateNotSerializable(stringTemplate)];
  }
}

/**
 * get a list of diagnostic explaining why this string template cannot be converted to a string.
 */
export function explainStringTemplateNotSerializable(
  stringTemplate: StringTemplate,
): readonly Diagnostic[] {
  const diagnostics = createDiagnosticCollector();
  for (const span of stringTemplate.spans) {
    if (span.isInterpolated) {
      switch (span.type.kind) {
        case "String":
        case "Number":
        case "Boolean":
          break;
        case "StringTemplate":
          diagnostics.pipe(isStringTemplateSerializable(span.type));
          break;
        case "TemplateParameter":
          if (span.type.constraint && span.type.constraint.valueType !== undefined) {
            break; // Value types will be serializable in the template instance.
          }
        // eslint-disable-next-line no-fallthrough
        default:
          diagnostics.add(
            createDiagnostic({
              code: "non-literal-string-template",
              target: span,
            }),
          );
      }
    }
  }
  return diagnostics.diagnostics;
}
