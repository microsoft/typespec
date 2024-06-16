import {
  Tree,
  TreeItem,
  TreeItemLayout,
  type TreeOpenChangeData,
} from "@fluentui/react-components";
import { useCallback, useMemo, useState } from "react";
import style from "./tree-navigation.module.css";
import { useTreeNavigator, type TypeGraphNode } from "./use-tree-navigation.js";

export interface TreeNavigationProps {}

export const TreeNavigation = (_: TreeNavigationProps) => {
  const nav = useTreeNavigator();
  const [openItems, setOpenItems] = useState<Set<string | number>>(new Set());

  const onOpenChange = useCallback(
    (evt: any, data: TreeOpenChangeData) => {
      setOpenItems(data.openItems);
    },
    [setOpenItems]
  );

  const resolvedOpenItems = useMemo(() => {
    const path = nav.selectedPath.split(".");
    return new Set([...openItems, ...path.map((_, i) => path.slice(0, i + 1).join("."))]);
  }, [openItems, nav.selectedPath]);

  return <Tree tree={nav.tree} onSelect={nav.selectPath} />;
};

const TreeNodeItemsUI = ({ nodes }: { nodes: TypeGraphNode[] }) => {
  return (
    <>
      {nodes.map((node) => {
        return <TreeNodeUI key={node.id} node={node} />;
      })}
    </>
  );
};

const TreeNodeUI = ({ node }: { node: TypeGraphNode }) => {
  const nav = useTreeNavigator();
  const selected = nav.selectedPath === node.id;
  return (
    <TreeItem itemType={node.children.length === 0 ? "leaf" : "branch"} value={node.id}>
      <TreeItemLayout className={selected ? style["selected"] : undefined} aria-selected={selected}>
        {node.name}
      </TreeItemLayout>
      {node.children.length > 0 && (
        <Tree>
          <TreeNodeItemsUI nodes={node.children} />
        </Tree>
      )}
    </TreeItem>
  );
};
