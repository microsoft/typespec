import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type FC,
  type KeyboardEvent,
} from "react";
import { useControllableValue } from "../hooks.js";
import { useTreeControls } from "./tree-control.js";
import { TreeViewRow } from "./tree-row.js";
import style from "./tree.module.css";
import type { TreeNode, TreeRow } from "./types.js";

export interface TreeProps<T extends TreeNode> {
  /**
   * If tree allows keeping a current selection.
   * @default no selection.
   */
  readonly selectionMode?: "none" | "single";
  readonly tree: T;
  readonly nodeIcon?: FC<{ node: T }>;
  readonly selected?: string;
  readonly onSelect?: (id: string) => void;
  readonly expanded?: Set<string>;
  readonly onSetExpanded?: (id: Set<string>) => void;
}

export function Tree<T extends TreeNode>({
  tree,
  selected,
  onSelect,
  onSetExpanded,
  nodeIcon,
  selectionMode = "none",
}: TreeProps<T>) {
  const id = useId();
  const { expanded, toggleExpand, expand, collapse } = useTreeControls({
    onSetExpanded,
  });
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [selectedKey, setSelectedKey] = useControllableValue(selected, undefined, onSelect);

  const rows = useMemo(
    () => getTreeRowsForNode(expanded, toggleExpand, tree),
    [expanded, toggleExpand, tree],
  );
  const parentMap = useMemo(() => computeParent(tree), [tree]);

  useEffect(() => {
    expand(selectedKey);
    let current = parentMap.get(selectedKey);
    while (current) {
      expand(current);
      current = parentMap.get(current);
    }
  }, [expand, selectedKey, parentMap]);
  const activateRow = useCallback(
    (row: TreeRow<TreeNode>) => {
      setFocusedIndex(row.index);
      if (selectionMode === "none" || selectedKey === row.id) {
        toggleExpand(row.id);
      } else {
        expand(row.id);
        if (selectionMode === "single") {
          setSelectedKey(row.id);
        }
      }
    },
    [selectionMode, selectedKey, toggleExpand, expand, setSelectedKey],
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
    [setFocusedIndex, focusedIndex, rows, activateRow, expand, collapse],
  );

  return (
    <div
      id={id}
      className={style["tree"]}
      tabIndex={0}
      role="tree"
      onKeyDown={handleKeyDown}
      onFocus={() => {
        const row = rows.findIndex((row) => row.id === selectedKey);
        setFocusedIndex(row === -1 ? 0 : row);
      }}
      onBlur={() => setFocusedIndex(-1)}
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
            active={selectionMode === "single" && row.id === selectedKey}
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
  depth = 0,
) {
  const rows: TreeRow<T>[] = [];
  if (!node.children) {
    return [];
  }
  for (const [index, child] of node.children.entries()) {
    const hasChildren = child.hasMore || Boolean(child.children && child.children.length > 0);
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
