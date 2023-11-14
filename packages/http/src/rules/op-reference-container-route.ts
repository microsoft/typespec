import { Operation, createRule, paramMessage } from "@typespec/compiler";
import { getRoutePath } from "../route.js";
import { OperationContainer } from "../types.js";

export const opReferenceContainerRouteRule = createRule({
  name: "op-reference-container-route",
  severity: "warning",
  description:
    "Check for referenced (`op is`) operations which have a @route on one of their containers.",
  url: "https://microsoft.github.io/typespec/standard-library/http/rules/op-reference-container-route",
  messages: {
    default: paramMessage`Operation ${"opName"} references an operation which has a @route prefix on its namespace or interface: "${"routePrefix"}".  This operation will not carry forward the route prefix so the final route may be different than the referenced operation.`,
  },
  create(context) {
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
          getContainerRoutePrefix(container.interface) ??
          getContainerRoutePrefix(container.namespace)
        );
      }

      const route = getRoutePath(context.program, container);
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
            context.reportDiagnostic({
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

    return {
      operation: (op: Operation) => {
        checkOperationReferences(op.sourceOperation, op);
      },
    };
  },
});
