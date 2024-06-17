import { AppsListRegular } from "@fluentui/react-icons";
import { Tree } from "./tree/tree.js";
import { useTreeNavigator, type TypeGraphNode } from "./use-tree-navigation.js";

import style from "./tree-navigation.module.css";

export interface TreeNavigationProps {}

export const TreeNavigation = (_: TreeNavigationProps) => {
  const nav = useTreeNavigator();

  return (
    <Tree<TypeGraphNode>
      tree={nav.tree}
      nodeIcon={NodeIcon}
      selected={nav.selectedPath}
      onSelect={nav.selectPath}
    />
  );
};

const NodeIcon = ({ node }: { node: TypeGraphNode }) => {
  console.log("NOde", node);
  switch (node.kind) {
    case "type":
      return <span className={style["type-kind-icon"]}>{node.type.kind[0]}</span>;
    case "list":
      return <AppsListRegular />;
  }
};
