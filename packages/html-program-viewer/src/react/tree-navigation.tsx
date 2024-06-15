import {
  Tree,
  TreeItem,
  TreeItemLayout,
  type TreeOpenChangeData,
} from "@fluentui/react-components";
import { useCallback } from "react";
import style from "./tree-navigation.module.css";
import { type TreeNavigator, type TypeGraphNode } from "./use-tree-navigation.js";

export interface TreeNavigationProps {
  readonly nav: TreeNavigator;
}

export const TreeNavigation = ({ nav }: TreeNavigationProps) => {
  const onOpenChange = useCallback(
    (evt: any, data: TreeOpenChangeData) => {
      nav.selectPath(data.value.toString());
    },
    [nav.selectPath]
  );

  return (
    <Tree
      size="small"
      aria-label="Type graph navigation"
      className={style["tree-navigation"]}
      onOpenChange={onOpenChange}
    >
      <TreeNodeItemsUI nodes={nav.tree.children} />
    </Tree>
  );
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
  return (
    <TreeItem itemType={node.children.length === 0 ? "leaf" : "branch"} value={node.id}>
      <TreeItemLayout>{node.name}</TreeItemLayout>
      {node.children.length > 0 && (
        <Tree>
          <TreeNodeItemsUI nodes={node.children} />
        </Tree>
      )}
    </TreeItem>
  );
};
