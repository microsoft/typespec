import { useSelection, type OnSelectionChangeData } from "@fluentui/react-components";
import { useCallback, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { TreeViewRow } from "./tree-row.js";
import style from "./tree.module.css";
import type { TreeNode, TreeRow } from "./types.js";

export interface TreeViewProps {
  readonly tree: TreeNode;
  readonly onSelect?: (id: string) => void;
}

export function Tree(props: TreeViewProps) {
  const id = useId();
  const [focusedIndex, setFocusedIndex] = useState(0);
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
    (row: TreeRow<TreeNode>) => {
      setFocusedIndex(row.index);
      toggleExpand(row.id);
      methods.selectItem(null as any, row.id);
    },
    [methods.selectItem, toggleExpand]
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
          curTreeRow.toggleExpand();
          event.preventDefault();
          break;
        case "ArrowLeft": // Expand current row if applicable
          curTreeRow.toggleExpand();
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
    [setFocusedIndex, focusedIndex, rows, activateRow]
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
            focussed={focusedIndex === row.index}
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
