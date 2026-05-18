import * as py from "@alloy-js/python";
import { TypeExpression } from "@typespec/emitter-framework/python";
import type * as cl from "@typespec/http-client";
import type { OperationHandler } from "./types.js";

/**
 * Renders a plain (non-LRO, non-paging) Python method that mirrors a single
 * TypeSpec operation. Body is intentionally stubbed — real HTTP wiring lands
 * in a follow-up phase.
 */
export const BasicOperationHandler: OperationHandler = {
  name: "basic",
  canHandle() {
    return true;
  },
  render(clientOperation: cl.ClientOperation) {
    const operation = clientOperation.httpOperation.operation;
    const namePolicy = py.usePythonNamePolicy();
    const methodName = namePolicy.getName(operation.name, "function");
    const returnTypeNode = <TypeExpression type={operation.returnType} />;
    const parameters = Array.from(operation.parameters.properties.values()).map((p) => ({
      name: namePolicy.getName(p.name, "parameter"),
      type: (<TypeExpression type={p.type} />) as any,
      optional: p.optional,
    }));
    return (
      <py.MethodDeclaration name={methodName} parameters={parameters} returnType={returnTypeNode}>
        {`raise NotImplementedError("Operation '${operation.name}' is not implemented yet")`}
      </py.MethodDeclaration>
    );
  },
};
