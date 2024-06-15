import { Tree, TreeItem, TreeItemLayout } from "@fluentui/react-components";
import type { Type } from "@typespec/compiler";
import style from "./tree-navigation.module.css";
import { useTreeNavigation, type TypeGraphNode } from "./use-tree-navigation.js";

export interface TreeNavigationProps {
  onSelectionChange?: (path: string, type: Type) => void;
}

export const TreeNavigation = (props: TreeNavigationProps) => {
  const program = useTreeNavigation();

  return (
    <Tree size="small" aria-label="Type graph navigation" className={style["tree-navigation"]}>
      <TreeNodeItemsUI nodes={program.tree.children} />
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
