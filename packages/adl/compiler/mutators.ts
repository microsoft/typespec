import { createBinder } from "./binder.js";
import { parse } from "./parser.js";
import { Program } from "./program.js";
import {
  ModelExpressionNode,
  ModelPropertyNode,
  ModelStatementNode,
  ModelType,
  ModelTypeProperty,
  Node,
  OperationStatementNode,
  OperationType,
  SyntaxKind,
  UnionExpressionNode,
} from "./types.js";

function addProperty(
  program: Program,
  model: ModelType,
  modelNode: ModelStatementNode | ModelExpressionNode,
  parentNode: Node,
  propertyName: string,
  propertyTypeName: string,
  insertIndex?: number
): ModelTypeProperty | undefined {
  // Parse a temporary model type to extract its property
  const fakeNode = parse(`model Fake { ${propertyName}: ${propertyTypeName}}`);
  if (fakeNode.parseDiagnostics.length > 0) {
    program.reportDiagnostic(
      `Could not add property/parameter "${propertyName}" of type "${propertyTypeName}"`,
      model
    );
    program.reportDiagnostics(fakeNode.parseDiagnostics);

    return undefined;
  }

  const firstStatement = fakeNode.statements[0] as ModelStatementNode;
  const graftProperty = firstStatement.properties![0] as ModelPropertyNode;

  // Fix up the source location of the nodes to match the model node that
  // contains the new property since we can't update the entire file's node
  // positions.
  graftProperty.pos = modelNode.pos;
  graftProperty.end = modelNode.end;

  // Create a binder to wire up the grafted property
  const binder = createBinder(program, {
    initialParentNode: parentNode,
  });
  binder.bindNode(graftProperty);

  // Evaluate the new property with the checker
  const newProperty = program.checker!.checkModelProperty(graftProperty);

  // Put the property back into the node
  modelNode.properties.splice(insertIndex || modelNode.properties.length, 0, graftProperty);
  if (insertIndex !== undefined) {
    // Insert the property by adding it in the right order to a new Map
    let i = 0;
    const newProperties = new Map<string, ModelTypeProperty>();
    for (let [name, prop] of model.properties.entries()) {
      if (i === insertIndex) {
        newProperties.set(newProperty.name, newProperty);
      }
      newProperties.set(name, prop);
      model.properties = newProperties;
      i++;
    }
  } else {
    model.properties.set(newProperty.name, newProperty);
  }

  return newProperty;
}

export function addModelProperty(
  program: Program,
  model: ModelType,
  propertyName: string,
  propertyTypeName: string
): ModelTypeProperty | undefined {
  if (model.node.kind !== SyntaxKind.ModelStatement) {
    program.reportDiagnostic(
      "Cannot add a model property to anything except a model statement.",
      model
    );

    return;
  }

  // Create the property and add it to the type
  const newProperty = addProperty(
    program,
    model,
    model.node,
    model.node,
    propertyName,
    propertyTypeName
  );

  if (newProperty) {
    model.properties.set(propertyName, newProperty);
    return newProperty;
  }

  return undefined;
}

export interface NewParameterOptions {
  // Insert the parameter at the specified index.  If `undefined`, add the
  // parameter to the end of the parameter list.
  insertIndex?: number;
}

export function addOperationParameter(
  program: Program,
  operation: OperationType,
  parameterName: string,
  parameterTypeName: string,
  options?: NewParameterOptions
): ModelTypeProperty | undefined {
  if (operation.node.kind !== SyntaxKind.OperationStatement) {
    program.reportDiagnostic(
      "Cannot add a parameter to anything except an operation statement.",
      operation
    );

    return;
  }

  // Create the property and add it to the type
  return addProperty(
    program,
    operation.parameters,
    operation.node.parameters,
    operation.node,
    parameterName,
    parameterTypeName,
    options?.insertIndex
  );
}

export function addOperationResponseType(
  program: Program,
  operation: OperationType,
  responseTypeName: string
): any {
  if (operation.node.kind !== SyntaxKind.OperationStatement) {
    program.reportDiagnostic(
      "Cannot add a response to anything except an operation statement.",
      operation
    );

    return;
  }

  // Parse a temporary operation to extract its response type
  const opNode = parse(`op Fake(): string | ${responseTypeName};`);
  if (opNode.parseDiagnostics.length > 0) {
    program.reportDiagnostic(
      `Could not add response type "${responseTypeName}" to operation ${operation.name}"`,
      operation
    );
    program.reportDiagnostics(opNode.parseDiagnostics);

    return undefined;
  }

  const graftUnion = (opNode.statements[0] as OperationStatementNode)
    .returnType as UnionExpressionNode;

  // Graft the union into the operation
  const originalResponse = operation.node.returnType;
  graftUnion.options[0] = originalResponse;
  operation.node.returnType = graftUnion;

  // Create a binder to wire up the grafted property
  const binder = createBinder(program, {
    initialParentNode: operation.node,
  });
  binder.bindNode(graftUnion);

  // Evaluate the new response type with the checker
  operation.returnType = program.checker!.checkUnionExpression(graftUnion);
}
