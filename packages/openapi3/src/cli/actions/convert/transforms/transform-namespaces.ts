import {
  TypeSpecModel,
  TypeSpecNamespace,
  TypeSpecOperation,
  TypeSpecProgram,
} from "../interfaces.js";

type TypeSpecProgramDeclarations = Pick<TypeSpecProgram, "models" | "operations" | "namespaces">;
export function transformNamespaces(
  models: TypeSpecModel[],
  operations: TypeSpecOperation[]
): TypeSpecProgramDeclarations {
  // There can only be 1 file namespace - so if scopes is empty then entity belongs at root level
  const programDecs: TypeSpecProgramDeclarations = {
    models: [],
    operations: [],
    namespaces: {},
  };

  expandModels(programDecs, models);
  expandOperations(programDecs, operations);

  return programDecs;
}

function expandModels(programDecs: TypeSpecProgramDeclarations, models: TypeSpecModel[]): void {
  for (const model of models) {
    const { scope } = model;
    const namespace = getNamespace(programDecs, scope) ?? createNamespace(programDecs, scope);
    namespace.models.push(model);
  }
}

function expandOperations(
  programDecs: TypeSpecProgramDeclarations,
  operations: TypeSpecOperation[]
): void {
  for (const operation of operations) {
    const { scope } = operation;
    const namespace = getNamespace(programDecs, scope) ?? createNamespace(programDecs, scope);
    namespace.operations.push(operation);
  }
}

function getNamespace(
  programDecs: TypeSpecProgramDeclarations,
  scope: string[]
): TypeSpecNamespace | undefined {
  if (!scope.length) return programDecs;

  let namespace: TypeSpecNamespace = programDecs;
  for (const fragment of scope) {
    if (!namespace) return;
    namespace = namespace.namespaces[fragment];
  }

  return namespace;
}

function createNamespace(
  programDecs: TypeSpecProgramDeclarations,
  scope: string[]
): TypeSpecNamespace {
  let namespace: TypeSpecNamespace = programDecs;
  for (const fragment of scope) {
    if (!namespace.namespaces[fragment]) {
      namespace.namespaces[fragment] = {
        namespaces: {},
        models: [],
        operations: [],
      };
    }
    namespace = namespace.namespaces[fragment];
  }

  return namespace;
}
