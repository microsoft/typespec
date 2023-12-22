import { Program } from "@typespec/compiler";
import { reportDiagnostic } from "./internal-lib.js";
import { getAllHttpServices } from "./operations.js";
import { isSharedRoute } from "./route.js";

export function $onValidate(program: Program) {
  // Pass along any diagnostics that might be returned from the HTTP library
  const [services, diagnostics] = getAllHttpServices(program);
  if (diagnostics.length > 0) {
    program.reportDiagnostics(diagnostics);
  }
  for (const service of services) {
    const paths = new Map<string, boolean>();
    for (const operation of service.operations) {
      const path = operation.path;
      const shared = isSharedRoute(program, operation.operation);
      const val = paths.get(path);
      if (shared && val === undefined) {
        paths.set(path, shared);
      } else if (val && val !== shared) {
        reportDiagnostic(program, {
          code: "shared-inconsistency",
          target: operation.operation,
        });
      }
    }
  }
}
