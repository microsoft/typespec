import { AppsListRegular } from "@fluentui/react-icons";
import { Tree } from "@typespec/react-components";
import style from "./tree-navigation.module.css";
import { useTreeNavigator, type TypeGraphNode } from "./use-tree-navigation.js";

export interface TreeNavigationProps {}

export const TreeNavigation = (_: TreeNavigationProps) => {
  const nav = useTreeNavigator();

  return (
    <Tree<TypeGraphNode>
      selectionMode="single"
      tree={nav.tree}
      nodeIcon={NodeIcon}
      selected={nav.selectedPath}
      onSelect={nav.selectPath}
    />
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
