import { getNamespaceFullName, type Namespace, type Program, type Type } from "@typespec/compiler";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { isMapLike, type NamedType } from "../utils.js";
import { TypeConfig } from "./type-config.js";

export interface TypeGraphNodeBase {
  readonly id: string;
  readonly name: string;
  readonly children: TypeGraphNode[];
}

export interface TypeGraphTypeNode extends TypeGraphNodeBase {
  readonly kind: "type";
  readonly type: Type;
}

export interface TypeGraphListNode extends TypeGraphNodeBase {
  readonly kind: "list";
}

export type TypeGraphNode = TypeGraphTypeNode | TypeGraphListNode;

export interface TreeNavigator {
  readonly selectedNode?: TypeGraphNode;
  readonly selectedPath: string;
  readonly selectPath: (path: string) => void;
  readonly navToType: (type: Type) => void;
  readonly tree: TypeGraphListNode;
}

function expandNamespaces(namespace: Namespace): Namespace[] {
  return [namespace, ...[...namespace.namespaces.values()].flatMap(expandNamespaces)];
}

const TreeNavigatorContext = createContext<TreeNavigator | undefined>(undefined);

export function useTreeNavigatorOptional(): TreeNavigator | undefined {
  return useContext(TreeNavigatorContext);
}

export function useTreeNavigator(): TreeNavigator {
  const nav = useContext(TreeNavigatorContext);
  if (nav === undefined) {
    throw new Error(`Expect to be used inside a TypeGraphNavigatorProvider`);
  }
  return nav;
}

export interface TypeGraphNavigatorProvider {
  program: Program;
  children: ReactNode;
}
export const TypeGraphNavigatorProvider = ({ program, children }: TypeGraphNavigatorProvider) => {
  const treeNavigator = useTreeNavigatorInternal(program);
  return (
    <TreeNavigatorContext.Provider value={treeNavigator}>{children}</TreeNavigatorContext.Provider>
  );
};

function useTreeNavigatorInternal(program: Program): TreeNavigator {
  const [selectedPath, selectPath] = useState<string>("");

  const tree = useMemo(() => computeTree(program), [program]);
  const { pathToNode, typeToPath } = useMemo(() => computeReferences(tree), [tree]);
  const selectedNode = useMemo(() => pathToNode.get(selectedPath), [pathToNode, selectedPath]);
  const navToType = useCallback(
    (type: Type) => {
      const path = typeToPath.get(type);
      if (path) {
        selectPath(path);
      }
    },
    [selectPath, typeToPath],
  );
  return { tree, selectedPath, selectedNode, selectPath, navToType };
}

function computeReferences(node: TypeGraphNode): {
  pathToNode: Map<string, TypeGraphNode>;
  typeToPath: Map<Type, string>;
} {
  const pathToNode = new Map<string, TypeGraphNode>();
  const typeToPath = new Map<Type, string>();
  const stack = [node];
  while (stack.length > 0) {
    const current = stack.pop()!;
    pathToNode.set(current.id, current);
    if (current.kind === "type") {
      typeToPath.set(current.type, current.id);
    }
    stack.push(...current.children);
  }
  return { pathToNode, typeToPath };
}

function computeTree(program: Program): TypeGraphListNode {
  const root = program.checker!.getGlobalNamespaceType();

  const namespaces = expandNamespaces(root);

  return {
    kind: "list",
    id: "$",
    name: "Type Graph",
    children: namespaces.map((ns) => {
      return computeTypeNode("$", ns, getNamespaceFullName(ns) || "(global)");
    }),
  };
}

function computeTypeNode(parentPath: string, type: NamedType, name?: string): TypeGraphTypeNode {
  const pathSeg = name ?? type.name.toString();
  const path = parentPath + "." + pathSeg;
  return computeTypeNodeProps(path, type, name);
}

function computeTypeNodeProps(path: string, type: NamedType, name?: string): TypeGraphTypeNode {
  const typeRendering = (TypeConfig as any)[type.kind];
  const children: TypeGraphNode[] = Object.entries(type)
    .filter(([key]) => typeRendering?.[key] === "nested")
    .map(([key, value]): TypeGraphNode => {
      const propPath = path + "." + key;
      if (isMapLike(value)) {
        return computeItemList(propPath, key, value);
      } else {
        return computeTypeNodeProps(propPath, value, key);
      }
    });

  return {
    kind: "type",
    id: path,
    type,
    name: name ?? type.name,
    children,
  };
}

function computeItemList(path: string, name: string, items: Map<string, NamedType>): TypeGraphNode {
  let index = 0;
  return {
    kind: "list",
    id: path,
    name,
    children: Array.from(items.entries()).map(([key, value]) => {
      const name = typeof key === "symbol" ? `sym(${index++})` : key;
      return computeTypeNode(path, value, name);
    }),
  };
}
