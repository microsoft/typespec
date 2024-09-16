import {
  TypeSpecDataTypes,
  TypeSpecNamespace,
  TypeSpecOperation,
  TypeSpecProgram,
} from "../interfaces.js";

type TypeSpecProgramDeclarations = Pick<TypeSpecProgram, "types" | "operations" | "namespaces">;
export function transformNamespaces(
  types: TypeSpecDataTypes[],
  operations: TypeSpecOperation[],
): TypeSpecProgramDeclarations {
  // There can only be 1 file namespace - so if scopes is empty then entity belongs at root level
  const programDecs: TypeSpecProgramDeclarations = {
    types: [],
    operations: [],
    namespaces: {},
  };

  expandModels(programDecs, types);
  expandOperations(programDecs, operations);

  return programDecs;
}

function expandModels(programDecs: TypeSpecProgramDeclarations, types: TypeSpecDataTypes[]): void {
  for (const type of types) {
    const { scope } = type;
    const namespace = getNamespace(programDecs, scope) ?? createNamespace(programDecs, scope);
    namespace.types.push(type);
  }
}

function expandOperations(
  programDecs: TypeSpecProgramDeclarations,
  operations: TypeSpecOperation[],
): void {
  for (const operation of operations) {
    const { scope } = operation;
    const namespace = getNamespace(programDecs, scope) ?? createNamespace(programDecs, scope);
    namespace.operations.push(operation);
  }
}

function getNamespace(
  programDecs: TypeSpecProgramDeclarations,
  scope: string[],
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
  scope: string[],
): TypeSpecNamespace {
  let namespace: TypeSpecNamespace = programDecs;
  for (const fragment of scope) {
    if (!namespace.namespaces[fragment]) {
      namespace.namespaces[fragment] = {
        namespaces: {},
        types: [],
        operations: [],
      };
    }
    namespace = namespace.namespaces[fragment];
  }

  return namespace;
}
