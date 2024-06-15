import { getNamespaceFullName, type Namespace, type Program, type Type } from "@typespec/compiler";
import { useMemo } from "react";
import { useProgram } from "./program-context.js";
import { TypeConfig } from "./type-config.js";

export interface TypeGraphNode {
  readonly id: string;
  readonly name: string;
  readonly children: TypeGraphNode[];
}
export interface TreeNavigation {
  readonly tree: TypeGraphNode;
  // select(path: string | Type);
}

function expandNamespaces(namespace: Namespace): Namespace[] {
  return [namespace, ...[...namespace.namespaces.values()].flatMap(expandNamespaces)];
}

export function useTreeNavigation(): TreeNavigation {
  const program = useProgram();

  const tree = useMemo(() => computeTree(program), [program]);

  return { tree };
}

function computeTree(program: Program): TypeGraphNode {
  const root = program.checker!.getGlobalNamespaceType();

  const namespaces = expandNamespaces(root);

  return {
    id: "$",
    name: "",
    children: namespaces.map((ns) => {
      return computeNode("$", ns, getNamespaceFullName(ns) || "(global)");
    }),
  };
}

type NamedType = Type & { name: string };

function computeNode(parentPath: string, type: NamedType, name?: string) {
  const path = parentPath + "." + type.name;

  const typeRendering = (TypeConfig as any)[type.kind];
  const children: TypeGraphNode[] = Object.entries(type)
    .filter(([key]) => typeRendering?.[key] === "nested")
    .map(([key, value]): TypeGraphNode => {
      return computeItemList(path + "." + key, key, value);
    });

  return {
    id: path,
    name: name ?? type.name,
    children,
  };
}

function computeItemList(path: string, name: string, items: Map<string, NamedType>) {
  return {
    id: path,
    name,
    children: Array.from(items.entries()).map(([key, value]) => {
      return computeNode(path, value, key);
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
