import {
  Diagnostic,
  ModelProperty,
  Program,
  createDiagnosticCollector,
  navigateType,
} from "@typespec/compiler";
import { isHeader, isPathParam, isQueryParam, isStatusCode } from "./decorators.js";
import { createDiagnostic } from "./lib.js";

/** Validate a property marked with `@body` */
export function validateBodyProperty(
  program: Program,
  property: ModelProperty
): [boolean, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  navigateType(
    property.type,
    {
      modelProperty: (prop) => {
        const kind = isHeader(program, prop)
          ? "header"
          : isQueryParam(program, prop)
            ? "query"
            : isPathParam(program, prop)
              ? "path"
              : isStatusCode(program, prop)
                ? "statusCode"
                : undefined;

        if (kind) {
          diagnostics.add(
            createDiagnostic({
              code: "metadata-ignored",
              format: { kind },
              target: prop,
            })
          );
        }
      },
    },
    {}
  );
  return diagnostics.wrap(diagnostics.diagnostics.length === 0);
}
