import { createDiagnosticCollector, Diagnostic, ModelProperty } from "@typespec/compiler";
import { createDiagnostic } from "./lib.js";

/**
 * Resolve the content types from a model property by looking at the value.
 * @property property Model property
 * @returns List of contnet types and any diagnostics if there was an issue.
 */
export function getContentTypes(property: ModelProperty): [string[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  if (property.type.kind === "String") {
    return [[property.type.value], []];
  } else if (property.type.kind === "Union") {
    const contentTypes = [];
    for (const option of property.type.variants.values()) {
      if (option.type.kind === "String") {
        contentTypes.push(option.type.value);
      } else {
        diagnostics.add(
          createDiagnostic({
            code: "content-type-string",
            target: property,
          }),
        );
        continue;
      }
    }

    return diagnostics.wrap(contentTypes);
  } else if (property.type.kind === "Scalar" && property.type.name === "string") {
    return [["*/*"], []];
  }

  return [[], [createDiagnostic({ code: "content-type-string", target: property })]];
}
