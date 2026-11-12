import {
  walkPropertiesInherited,
  type DecoratorContext,
  type Interface,
  type Model,
  type Operation,
  type Program,
} from "@typespec/compiler";
import { useStateMap } from "@typespec/compiler/utils";
import type { OperationFieldsDecorator } from "../../generated-defs/TypeSpec.GraphQL.js";
import { GraphQLKeys, reportDiagnostic } from "../lib.js";
import { operationsEqual } from "./utils.js";

const [getOperationFieldsInternal, setOperationFields, _getOperationFieldsMap] = useStateMap<
  Model,
  Set<Operation>
>(GraphQLKeys.operationFields);

/**
 * Get the operation fields for a given model
 * @param program Program
 * @param model Model
 * @returns Set of operations defined for the model
 */
export function getOperationFields(program: Program, model: Model): Set<Operation> {
  return getOperationFieldsInternal(program, model) || new Set<Operation>();
}

function validateDuplicateProperties(
  context: DecoratorContext,
  model: Model,
  operation: Operation,
) {
  const operationFields = getOperationFields(context.program, model);
  if (operationFields.has(operation)) {
    reportDiagnostic(context.program, {
      code: "operation-field-duplicate",
      format: { operation: operation.name, model: model.name },
      target: context.getArgumentTarget(0)!,
    });
    return false;
  }
  return true;
}

function validateNoConflictWithProperties(
  context: DecoratorContext,
  model: Model,
  operation: Operation,
) {
  const conflictTypes = [];
  if ([...walkPropertiesInherited(model)].some((prop) => prop.name === operation.name)) {
    conflictTypes.push("property"); // an operation and a property is always a conflict
  }
  const existingOperation = [...getOperationFields(context.program, model)].find(
    (op) => op.name === operation.name,
  );

  if (existingOperation && !operationsEqual(existingOperation, operation)) {
    conflictTypes.push("operation");
  }
  for (const conflictType of conflictTypes) {
    reportDiagnostic(context.program, {
      code: "operation-field-conflict",
      format: { operation: operation.name, model: model.name, conflictType },
      target: context.getArgumentTarget(0)!,
    });
  }
  return conflictTypes.length === 0;
}

/**
 * Add this operation to the model's operation fields.
 * @param context DecoratorContext
 * @param model Model
 * @param operation Operation
 */
export function addOperationField(
  context: DecoratorContext,
  model: Model,
  operation: Operation,
): void {
  const operationFields = getOperationFields(context.program, model);
  if (!validateDuplicateProperties(context, model, operation)) {
    return;
  }
  if (!validateNoConflictWithProperties(context, model, operation)) {
    return;
  }
  operationFields.add(operation);
  setOperationFields(context.program, model, operationFields);
}

export const $operationFields: OperationFieldsDecorator = (
  context,
  target,
  ...operationOrInterfaces
): void => {
  for (const operationOrInterface of operationOrInterfaces as (Operation | Interface)[]) {
    if (operationOrInterface.kind === "Operation") {
      addOperationField(context, target, operationOrInterface);
    } else {
      for (const [_, operation] of operationOrInterface.operations) {
        addOperationField(context, target, operation);
      }
    }
  }
};
