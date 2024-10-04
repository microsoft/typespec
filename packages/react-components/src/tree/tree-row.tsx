import { ChevronDownRegular, ChevronRightRegular } from "@fluentui/react-icons";
import type { TreeNode, TreeRow, TreeRowColumn } from "./types.js";

import { mergeClasses } from "@fluentui/react-components";
import { useCallback, type FC, type SyntheticEvent } from "react";
import style from "./tree.module.css";

const INDENT_SIZE = 8;

export interface TreeViewRowProps {
  readonly id: string;
  readonly focussed: boolean;
  readonly row: TreeRow<any>;
  readonly active: boolean;
  readonly columns?: Array<TreeRowColumn<any>>;
  readonly icon?: FC<{ node: TreeNode }>;
  readonly activate: (row: TreeRow<any>) => void;
}

export function TreeViewRow({ id, row, active, focussed, activate, icon: Icon }: TreeViewRowProps) {
  const paddingLeft = row.depth * INDENT_SIZE;

  const onClick = useCallback(() => activate(row), [activate, row]);
  return (
    <div
      id={id}
      role="treeitem"
      style={{ paddingLeft }}
      className={mergeClasses(
        style["tree-row"],
        active && style["active"],
        focussed && style["focus"],
      )}
      aria-selected={active}
      aria-expanded={row.expanded}
      aria-posinset={row.localIndex}
      aria-level={row.depth}
      onClick={onClick}
    >
      <span className={style["caret"]}>
        <Caret row={row} />
      </span>
      {Icon && (
        <span className={style["icon"]}>
          <Icon node={row.item} />
        </span>
      )}
      <span className="label" title={row.item.name}>
        {row.item.name}
      </span>
    </div>
  );
}

export const Caret = ({ row }: { row: TreeRow<any> }) => {
  const toggleExpand = useCallback(
    (evt: SyntheticEvent) => {
      evt.stopPropagation();
      row.toggleExpand();
    },
    [row],
  );
  if (row.hasChildren) {
    return row.expanded ? (
      <ChevronDownRegular onClick={toggleExpand} />
    ) : (
      <ChevronRightRegular onClick={toggleExpand} />
    );
  } else {
    return null;
  }
};
