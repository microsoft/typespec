import { Tree } from "./tree/tree.js";
import { useTreeNavigator } from "./use-tree-navigation.js";

export interface TreeNavigationProps {}

export const TreeNavigation = (_: TreeNavigationProps) => {
  const nav = useTreeNavigator();

  return <Tree tree={nav.tree} selected={nav.selectedPath} onSelect={nav.selectPath} />;
};
