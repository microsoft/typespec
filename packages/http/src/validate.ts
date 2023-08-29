import { Operation, Program, navigateProgram } from "@typespec/compiler";
import { reportDiagnostic } from "./lib.js";
import { getAllHttpServices } from "./operations.js";
import { getRoutePath, isSharedRoute } from "./route.js";
import { OperationContainer } from "./types.js";

function checkOperationReferenceContainerRoutes(program: Program) {
  // This algorithm traces operation references for each operation encountered
  // in the program.  It will locate the first referenced operation which has a
  // `@route` prefix on a parent namespace or interface.
  const checkedOps = new Map<Operation, string | undefined>();

  function getContainerRoutePrefix(
    container: OperationContainer | Operation | undefined
  ): string | undefined {
    if (container === undefined) {
      return undefined;
    }

    if (container.kind === "Operation") {
      return (
        getContainerRoutePrefix(container.interface) ?? getContainerRoutePrefix(container.namespace)
      );
    }

    const route = getRoutePath(program, container);
    return route ? route.path : getContainerRoutePrefix(container.namespace);
  }

  function checkOperationReferences(op: Operation | undefined, originalOp: Operation) {
    if (op !== undefined) {
      // Skip this reference if the original operation shares the same
      // container with the referenced operation
      const container = op.interface ?? op.namespace;
      const originalContainer = originalOp.interface ?? originalOp.namespace;
      if (container !== originalContainer) {
        let route = checkedOps.get(op);
        if (route === undefined) {
          route = getContainerRoutePrefix(op);
          checkedOps.set(op, route);
        }

        if (route) {
          reportDiagnostic(program, {
            code: "operation-reference-container-route",
            target: originalOp,
            format: { opName: originalOp.name, routePrefix: route },
          });
          return;
        }
      }

      // Continue checking if the referenced operation didn't have a route prefix
      checkOperationReferences(op.sourceOperation, originalOp);
    }
  }

  navigateProgram(program, {
    operation: (op: Operation) => {
      checkOperationReferences(op.sourceOperation, op);
    },
  });
}

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

  // Check for referenced (`op is`) operations which have a @route on one of
  // their containers
  checkOperationReferenceContainerRoutes(program);
}
