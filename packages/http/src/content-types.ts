import { createDiagnosticCollector, Diagnostic, ModelProperty, Program } from "@typespec/compiler";
import { getHeaderFieldName } from "./decorators.js";
import { createDiagnostic } from "./lib.js";

/**
 * @deprecated Use `OperationProperty.kind === 'contentType'` instead.
 * Check if the given model property is the content type header.
 * @param program Program
 * @param property Model property.
 * @returns True if the model property is marked as a header and has the name `content-type`(case insensitive.)
 */
export function isContentTypeHeader(program: Program, property: ModelProperty): boolean {
  const headerName = getHeaderFieldName(program, property);
  return Boolean(headerName && headerName.toLowerCase() === "content-type");
}

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
