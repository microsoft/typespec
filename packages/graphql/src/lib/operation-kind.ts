import { type DecoratorContext, type Operation } from "@typespec/compiler";
import { useStateMap } from "@typespec/compiler/utils";
import { GraphQLKeys, NAMESPACE, reportDiagnostic } from "../lib.js";

// This will set the namespace for decorators implemented in this file
export const namespace = NAMESPACE;

export type GraphQLOperationKind = "Mutation" | "Query" | "Subscription";

const [getOperationKind, setOperationKindInternal, _getOperationKindMap] = useStateMap<
  Operation,
  GraphQLOperationKind
>(GraphQLKeys.operationKind);

function validateOperationKindUniqueOnNode(context: DecoratorContext, operation: Operation) {
  if (!getOperationKind(context.program, operation)) {
    return true;
  }
  reportDiagnostic(context.program, {
    code: "graphql-operation-kind-duplicate",
    format: { entityName: operation.name },
    target: context.decoratorTarget,
  });
  return false;
}

function setOperationKind(
  context: DecoratorContext,
  entity: Operation,
  operationKind: GraphQLOperationKind,
): void {
  if (validateOperationKindUniqueOnNode(context, entity)) {
    setOperationKindInternal(context.program, entity, operationKind);
  }
}

function createOperationKindDecorator(operationKind: GraphQLOperationKind) {
  return (context: DecoratorContext, entity: Operation) => {
    setOperationKind(context, entity, operationKind);
  };
}

export const $mutation = createOperationKindDecorator("Mutation");
export const $query = createOperationKindDecorator("Query");
export const $subscription = createOperationKindDecorator("Subscription");

export const OPERATION_KIND_DECORATORS = [$mutation, $query, $subscription];

export {
  /**
   * Get the operation kind for the given operation.
   * @param program Program
   * @param operation Operation
   * @returns Operation kind or undefined if operation is not decorated with an operation kind.
   */
  getOperationKind,
};
