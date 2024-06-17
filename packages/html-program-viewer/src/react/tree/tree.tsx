import { useControllableValue } from "@typespec/react-components";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type FC,
  type KeyboardEvent,
} from "react";
import { useTreeControls } from "./tree-control.js";
import { TreeViewRow } from "./tree-row.js";
import type { TreeNode, TreeRow } from "./types.js";

import style from "./tree.module.css";

export interface TreeViewProps<T extends TreeNode> {
  readonly tree: T;
  readonly nodeIcon?: FC<{ node: T }>;
  readonly selected?: string;
  readonly onSelect?: (id: string) => void;
  readonly expandNodes?: string[];
}

export function Tree<T extends TreeNode>({
  tree,
  selected,
  onSelect,
  expandNodes,
  nodeIcon,
}: TreeViewProps<T>) {
  const id = useId();
  const { expanded, toggleExpand, expand, collapse, renderSignal } = useTreeControls({
    expandNodes,
  });
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useControllableValue(selected, undefined, onSelect);

  const rows = useMemo(
    () => getTreeRowsForNode(expanded, toggleExpand, tree),
    [renderSignal, toggleExpand, tree]
  );
  const parentMap = useMemo(() => computeParent(tree), [tree]);

  useEffect(() => {
    expand(selectedKey);
    let current = parentMap.get(selectedKey);
    while (current) {
      expand(current);
      current = parentMap.get(current);
    }
  }, [expand, selectedKey]);
  const activateRow = useCallback(
    (row: TreeRow<TreeNode>) => {
      setFocusedIndex(row.index);
      toggleExpand(row.id);
      setSelectedKey(row.id);
    },
    [selectedKey, toggleExpand]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const curTreeRow = rows[focusedIndex];
      switch (event.code) {
        case "ArrowDown": // Move focus down
          setFocusedIndex((focusedIndex + 1) % rows.length);
          event.preventDefault();
          break;
        case "ArrowUp": // Move focus up
          setFocusedIndex((focusedIndex - 1) % rows.length);
          event.preventDefault();
          break;
        case "ArrowRight": // Expand current row if applicable
          expand(curTreeRow.id);
          event.preventDefault();
          break;
        case "ArrowLeft": // Expand current row if applicable
          collapse(curTreeRow.id);
          event.preventDefault();
          break;
        case "Space":
        case "Enter":
          activateRow(curTreeRow);
          event.preventDefault();
          return;
        default:
      }
    },
    [setFocusedIndex, focusedIndex, rows, activateRow, expand, collapse]
  );

  return (
    <div
      id={id}
      className={style["tree"]}
      tabIndex={0}
      role="tree"
      onKeyDown={handleKeyDown}
      aria-activedescendant={`${id}-${focusedIndex}`}
    >
      {rows.map((row) => {
        return (
          <TreeViewRow
            id={`${id}-${row.index}`}
            icon={nodeIcon as any}
            focussed={focusedIndex === row.index}
            key={row.id}
            row={row}
            active={row.id === selectedKey}
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
  for (const [index, child] of node.children.entries()) {
    const hasChildren = Boolean(child.children && child.children.length > 0);
    const id = child.id;

    const expanded = expandedItems.has(id);
    rows.push({
      id,
      index: -1,
      item: child as any,
      expanded,
      depth,
      hasChildren,
      localIndex: index,
      toggleExpand: () => {
        toggleExpand(id);
      },
    });
    if (hasChildren && expanded) {
      for (const row of getTreeRowsForNode(expandedItems, toggleExpand, child, depth + 1)) {
        rows.push(row as any);
      }
    }

    for (let i = 0; i < rows.length; i++) {
      (rows[i] as any).index = i;
    }
  }
  return rows;
}

function computeParent(node: TreeNode) {
  const map = new Map<string, string>();
  const queue: TreeNode[] = [node];
  let current;
  while ((current = queue.pop())) {
    if (current.children) {
      for (const child of current.children) {
        map.set(child.id, current.id);
        queue.push(child);
      }
    }
  }
  return map;
}
