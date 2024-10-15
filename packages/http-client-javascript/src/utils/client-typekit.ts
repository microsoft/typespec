
import { EmitContext, Enum, getNamespaceFullName, Interface, Model, ModelProperty, Namespace, navigateProgram, navigateType, Operation, Scalar, Type, Union } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { getServers } from "@typespec/http";

function getClientParams(
  type: Namespace | Interface,
): ModelProperty[] {
  if (type.kind === "Interface") {
    return [];
  }

  const server = getServers($.program, type)?.[0];
  return [];
}

export function getAllOperations(context: EmitContext) {
  return operationWalker(context).operations;
}

export function getAllTypes(context: EmitContext) {
  return operationWalker(context).dataTypes;
}

function operationWalker(context: EmitContext) {
  const types = new Set<DataType>();
  const operations = new Map<string, Operation[]>();
  navigateProgram(
    context.program,
    {
      operation(o) {
        trackOperation(operations, o);
        navigateType(
          o,
          {
            model(m) {
              trackType(types, m);
            },
            modelProperty(p) {
              trackType(types, p.type);
            },
            scalar(s) {
              if (s.namespace?.name !== "TypeSpec") {
                return;
              }

              trackType(types, s);
            },
            enum(e) {
              trackType(types, e);
            },
            union(u) {
              trackType(types, u);
            },
            unionVariant(v) {
              trackType(types, v.type);
            },
          },
          { includeTemplateDeclaration: false },
        );
      },
    },
    { includeTemplateDeclaration: false },
  );

  const dataTypes = Array.from(types);

  return { dataTypes, operations };
}



function trackOperation(operations: Map<string, Operation[]>, operation: Operation) {
  const key = getOperationContainerKey(operation);
  if (!operations.has(key)) {
    operations.set(key, []);
  }
  operations.get(key)!.push(operation);
}

function getOperationContainerKey(operation: Operation) {
  const interfaceName = operation.interface?.name;
  const namespace = operation.namespace;
  const operationContainer = [];
  if (interfaceName) {
    operationContainer.push(interfaceName);
  }
  if (namespace) {
    const namespaceParts = getNamespaceFullName(namespace, {
      namespaceFilter: (ns) => !getNamespaceFullName(ns).includes("TypeSpec"),
    }).split(".");
    operationContainer.push(...namespaceParts);
  }
  return operationContainer.join("/");
}

type DataType = Model | Union | Enum | Scalar;

function isDataType(type: Type): type is DataType {
  return (
    type.kind === "Model" || type.kind === "Union" || type.kind === "Enum" || type.kind === "Scalar"
  );
}

function isDeclaredType(type: Type): boolean {
  if ("namespace" in type && type.namespace?.name === "TypeSpec") {
    return false;
  }

  if (!isDataType(type)) {
    return false;
  }

  if (type.name === undefined || type.name === "") {
    return false;
  }

  return true;
}

function trackType(types: Set<DataType>, type: Type) {
  if (!isDataType(type)) {
    return;
  }

  if (!isDeclaredType(type)) {
    return;
  }

  types.add(type);
}


export class ClientTypekit {
  getClientParams(type: Namespace | Interface): ModelProperty[] {
    return getClientParams(type);
  }
  getAllOperations(context: EmitContext) {
    return getAllOperations(context);
  }
  getAllTypes(context: EmitContext) {
    return getAllTypes(context);
  }
}
