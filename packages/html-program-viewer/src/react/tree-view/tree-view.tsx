import { useSelection, type OnSelectionChangeData } from "@fluentui/react-components";
import { useCallback, useMemo, useRef, useState } from "react";
import { TreeViewRow } from "./tree-view-row.js";
import style from "./tree-view.module.css";
import type { TreeNode, TreeRow } from "./types.js";

export interface TreeViewProps<T extends TreeNode> {
  readonly tree: TreeNode;
  readonly onSelect?: (id: string) => void;
}

export function TreeView<T extends TreeNode>(props: TreeViewProps<T>) {
  const onSelectionChange = useCallback(
    (_: any, data: OnSelectionChangeData) => {
      if (data.selectedItems.size > 0 && props.onSelect) {
        props.onSelect(data.selectedItems.keys().next().value);
      }
    },
    [props.onSelect]
  );
  const [selected, methods] = useSelection({
    selectionMode: "single",
    onSelectionChange,
  });
  const [rerender, setRerender] = useState(false);

  const expanded = useRef(new Set<string>());

  const toggleExpand = useCallback(
    (key: string) => {
      console.log("Expand", key, expanded.current.has(key));
      if (expanded.current.has(key)) {
        expanded.current.delete(key);
      } else {
        expanded.current.add(key);
      }
      setRerender(!rerender);
    },
    [expanded, rerender]
  );

  const rows = useMemo(
    () => getTreeRowsForNode(expanded.current, toggleExpand, props.tree),
    [rerender, toggleExpand, props.tree]
  );

  const activateRow = useCallback(
    (row: TreeRow<T>) => {
      toggleExpand(row.id);
      methods.selectItem(null as any, row.id);
    },
    [methods.selectItem, toggleExpand]
  );
  return (
    <div className={style["tree-view"]} role="tree">
      {rows.map((row) => {
        return (
          <TreeViewRow
            key={row.id}
            row={row}
            active={selected.has(row.id)}
            activate={activateRow}
          />
        );
      })}
    </div>
  );
}

function getTreeRowsForNode<T extends TreeNode>(
  expandedItems: Set<string>,
  toggleExpand: (key: string) => void,
  node: TreeNode,
  depth = 0
) {
  const rows: TreeRow<T>[] = [];
  if (!node.children) {
    return [];
  }
  for (const child of node.children) {
    const hasChildren = Boolean(child.children && child.children.length > 0);
    const id = child.id;

    const expanded = expandedItems.has(id);
    rows.push({
      id,
      item: child as any,
      expanded,
      depth,
      hasChildren,
      index: -1,
      toggleExpand: () => {
        toggleExpand(id);
      },
    });
    if (hasChildren && expanded) {
      for (const row of getTreeRowsForNode(expandedItems, toggleExpand, child, depth + 1)) {
        rows.push(row as any);
      }
    }
  }
  return rows;
}
