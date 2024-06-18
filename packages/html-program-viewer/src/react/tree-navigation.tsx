import { AppsListRegular } from "@fluentui/react-icons";
import { useState } from "react";
import style from "./tree-navigation.module.css";
import { Tree } from "./tree/tree.js";
import { useTreeNavigator, type TypeGraphNode } from "./use-tree-navigation.js";

export interface TreeNavigationProps {}

function filterTree(
  tree: TypeGraphNode,
  search: string
): { tree: TypeGraphNode | undefined; expandPaths: string[] } {
  const expandPaths: string[] = [];
  if (search === "") {
    return { tree, expandPaths };
  }

  const result = filterNode(tree, search, expandPaths);

  return { tree: result, expandPaths };
}

function filterNode(
  node: TypeGraphNode,
  search: string,
  expandPaths: string[]
): TypeGraphNode | undefined {
  if (typeof node.name === "string" && node.name.toLowerCase().includes(search.toLowerCase())) {
    return node;
  }
  const children = node.children
    .map((x) => filterNode(x, search, expandPaths))
    .filter((x): x is TypeGraphNode => x !== undefined);

  if (children.length === 0) {
    return undefined;
  }

  expandPaths.push(node.id);
  return {
    ...node,
    children,
  };
}

export const TreeNavigation = (_: TreeNavigationProps) => {
  const [search, updateSearch] = useState<string>("");
  const nav = useTreeNavigator();

  const filter = filterTree(nav.tree, search);
  return (
    <div>
      <input
        className={style["search"]}
        placeholder="Search..."
        value={search}
        onChange={(x) => updateSearch(x.target.value)}
      />
      {filter.tree === undefined ? (
        "No results"
      ) : (
        <Tree<TypeGraphNode>
          tree={filter.tree}
          expandNodes={filter.expandPaths}
          nodeIcon={NodeIcon}
          selected={nav.selectedPath}
          onSelect={nav.selectPath}
        />
      )}
    </div>
  );
};

export const NodeIcon = ({ node }: { node: TypeGraphNode }) => {
  switch (node.kind) {
    case "type":
      return <span className={style["type-kind-icon"]}>{node.type.kind[0]}</span>;
    case "list":
      return <AppsListRegular />;
  }
};
