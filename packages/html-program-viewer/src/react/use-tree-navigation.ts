import { getNamespaceFullName, type Namespace, type Program, type Type } from "@typespec/compiler";
import { useMemo, useState } from "react";
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
  readonly tree: TypeGraphListNode;
}

function expandNamespaces(namespace: Namespace): Namespace[] {
  return [namespace, ...[...namespace.namespaces.values()].flatMap(expandNamespaces)];
}

export function useTreeNavigator(program: Program): TreeNavigator {
  const [selectedPath, selectPath] = useState<string>("");

  const tree = useMemo(() => computeTree(program), [program]);
  const nodes = useMemo(() => computeFlatTree(tree), [tree]);
  const selectedNode = useMemo(() => nodes.get(selectedPath), [nodes, selectedPath]);

  return { tree, selectedPath, selectedNode, selectPath };
}

function computeFlatTree(node: TypeGraphNode): Map<string, TypeGraphNode> {
  const nodes = new Map<string, TypeGraphNode>();
  const stack = [node];
  while (stack.length > 0) {
    const current = stack.pop()!;
    nodes.set(current.id, current);
    stack.push(...current.children);
  }
  return nodes;
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

type NamedType = Type & { name: string };

function computeTypeNode(parentPath: string, type: NamedType, name?: string): TypeGraphTypeNode {
  const path = parentPath + "." + type.name;

  const typeRendering = (TypeConfig as any)[type.kind];
  const children: TypeGraphNode[] = Object.entries(type)
    .filter(([key]) => typeRendering?.[key] === "nested")
    .map(([key, value]): TypeGraphNode => {
      return computeItemList(path + "." + key, key, value);
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
  return {
    kind: "list",
    id: path,
    name,
    children: Array.from(items.entries()).map(([key, value]) => {
      return computeTypeNode(path, value, key);
    }),
  };
}

const omittedProps = [
  "entityKind",
  "kind",
  "name",
  "node",
  "symbol",
  "namespace",
  "templateNode",
  "templateArguments",
  "templateMapper",
  "instantiationParameters",
  "decorators",
  "projectionBase",
  "projectionsByName",
  "projectionSource",
  "projector",
  "projections",
  "isFinished",
] as const;
const omittedPropsSet = new Set(omittedProps);

type PropertyAction = "skip" | "ref" | "nested" | "value";
