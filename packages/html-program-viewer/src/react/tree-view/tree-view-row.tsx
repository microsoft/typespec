import { ChevronDownRegular, ChevronRightRegular } from "@fluentui/react-icons";
import type { TreeRow, TreeRowColumn } from "./types.js";

import { mergeClasses } from "@fluentui/react-components";
import { useCallback, type SyntheticEvent } from "react";
import style from "./tree-view.module.css";

const INDENT_SIZE = 8;

export interface TreeViewRowProps {
  readonly row: TreeRow<any>;
  readonly active: boolean;
  readonly columns?: Array<TreeRowColumn<any>>;
  readonly activate: (row: TreeRow<any>) => void;
}

export function TreeViewRow(props: TreeViewRowProps) {
  const { row, active } = props;

  const paddingLeft = row.depth * INDENT_SIZE;

  const activate = useCallback(() => props.activate(props.row), [props.activate, props.row]);
  return (
    <div
      role="treeitem"
      style={{ paddingLeft }}
      className={mergeClasses(style["tree-view-row"], active && style["active"])}
      onClick={activate}
    >
      <span className={style["caret"]}>
        <Caret row={row} />
      </span>
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
    [row.toggleExpand]
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
