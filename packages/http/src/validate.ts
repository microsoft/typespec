import type { Program } from "@typespec/compiler";
import { isSharedRoute } from "./decorators/shared-route.js";
import { reportDiagnostic } from "./lib.js";
import { getAllHttpServices } from "./operations.js";
import { HttpOperation, HttpService } from "./types.js";

export function $onValidate(program: Program) {
  // Pass along any diagnostics that might be returned from the HTTP library
  const [services, diagnostics] = getAllHttpServices(program);
  if (diagnostics.length > 0) {
    program.reportDiagnostics(diagnostics);
  }
  validateSharedRouteConsistency(program, services);
}

function groupHttpOperations(
  operations: HttpOperation[],
): Map<string, Map<string, HttpOperation[]>> {
  const paths = new Map<string, Map<string, HttpOperation[]>>();

  for (const operation of operations) {
    const { verb, path } = operation;
    let pathOps = paths.get(path);
    if (pathOps === undefined) {
      pathOps = new Map<string, HttpOperation[]>();
      paths.set(path, pathOps);
    }
    const ops = pathOps.get(verb);
    if (ops === undefined) {
      pathOps.set(verb, [operation]);
    } else {
      ops.push(operation);
    }
  }
  return paths;
}

function validateSharedRouteConsistency(program: Program, services: HttpService[]) {
  for (const service of services) {
    const paths = groupHttpOperations(service.operations);
    for (const pathOps of paths.values()) {
      for (const ops of pathOps.values()) {
        let hasShared = false;
        let hasNonShared = false;
        for (const op of ops) {
          if (isSharedRoute(program, op.operation)) {
            hasShared = true;
          } else {
            hasNonShared = true;
          }
        }
        if (hasShared && hasNonShared) {
          for (const op of ops) {
            reportDiagnostic(program, {
              code: "shared-inconsistency",
              target: op.operation,
              format: { verb: op.verb, path: op.path },
            });
          }
        }
      }
    }
  }
}
