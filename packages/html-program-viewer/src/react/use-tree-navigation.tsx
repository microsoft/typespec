import { getNamespaceFullName, type Namespace, type Program, type Type } from "@typespec/compiler";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isMapLike, type NamedType } from "../utils.js";
import { TypeConfig } from "./type-config.js";
import { createIsProjectTypePredicate } from "./type-filter.js";

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
  /** If the tree is currently only showing the types declared in the user project. */
  readonly onlyProjectCode: boolean;
  readonly setOnlyProjectCode: (value: boolean) => void;
  /** If the selected node is hidden from the tree by the {@link onlyProjectCode} filter. */
  readonly selectionHiddenByFilter: boolean;
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
  onNavigationChange?: (path: string) => void;
  currentPath?: string;
  /** If the tree should only show the types declared in the user project by default. @default true */
  defaultOnlyProjectCode?: boolean;
}
export const TypeGraphNavigatorProvider = ({
  program,
  children,
  onNavigationChange,
  currentPath,
  defaultOnlyProjectCode,
}: TypeGraphNavigatorProvider) => {
  const treeNavigator = useTreeNavigatorInternal(
    program,
    onNavigationChange,
    currentPath,
    defaultOnlyProjectCode,
  );
  return (
    <TreeNavigatorContext.Provider value={treeNavigator}>{children}</TreeNavigatorContext.Provider>
  );
};

function useTreeNavigatorInternal(
  program: Program,
  onNavigationChange?: (path: string) => void,
  currentPath?: string,
  defaultOnlyProjectCode: boolean = true,
): TreeNavigator {
  const [selectedPath, setSelectedPath] = useState<string>(currentPath || "");
  const [onlyProjectCode, setOnlyProjectCode] = useState<boolean>(defaultOnlyProjectCode);

  // Update internal state when currentPath prop changes
  const selectPath = useCallback(
    (path: string) => {
      setSelectedPath(path);
      onNavigationChange?.(path);
    },
    [onNavigationChange],
  );

  // Sync with external currentPath changes
  useEffect(() => {
    if (currentPath !== undefined && currentPath !== selectedPath) {
      setSelectedPath(currentPath);
    }
  }, [currentPath, selectedPath]);

  const fullTree = useMemo(() => computeTree(program), [program]);
  const projectTree = useMemo(() => filterProjectCode(program, fullTree), [program, fullTree]);
  const fullReferences = useMemo(() => computeReferences(fullTree), [fullTree]);
  const projectReferences = useMemo(() => computeReferences(projectTree), [projectTree]);
  const tree = onlyProjectCode ? projectTree : fullTree;
  const { pathToNode, typeToPath } = onlyProjectCode ? projectReferences : fullReferences;
  // A node hidden from the tree by the filter is still shown when selected, so a link or a shared path to a library type keeps working.
  const selectedNode = useMemo(
    () => pathToNode.get(selectedPath) ?? fullReferences.pathToNode.get(selectedPath),
    [pathToNode, fullReferences, selectedPath],
  );
  const selectionHiddenByFilter = selectedNode !== undefined && !pathToNode.has(selectedPath);
  const navToType = useCallback(
    (type: Type) => {
      const path = typeToPath.get(type) ?? fullReferences.typeToPath.get(type);
      if (path) {
        selectPath(path);
      }
    },
    [selectPath, typeToPath, fullReferences],
  );
  return {
    tree,
    selectedPath,
    selectedNode,
    selectPath,
    navToType,
    onlyProjectCode,
    setOnlyProjectCode,
    selectionHiddenByFilter,
  };
}

/**
 * Keep only the nodes that were declared in the user project. A node is kept if it is itself declared in the project or if any of its descendants is.
 */
export function filterProjectCode(program: Program, tree: TypeGraphListNode): TypeGraphListNode {
  const isProjectType = createIsProjectTypePredicate(program);

  function filterNode(node: TypeGraphNode): TypeGraphNode | undefined {
    const children = node.children.map(filterNode).filter((x) => x !== undefined);
    if (node.kind === "type") {
      if (children.length === 0 && !isProjectType(node.type)) {
        return undefined;
      }
    } else if (children.length === 0) {
      return undefined;
    }
    return { ...node, children };
  }

  return { ...tree, children: tree.children.map(filterNode).filter((x) => x !== undefined) };
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

export function computeTree(program: Program): TypeGraphListNode {
  const root = program.getGlobalNamespaceType();

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
    .filter(([key]) => typeRendering?.[key]?.kind === "nested-items")
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
