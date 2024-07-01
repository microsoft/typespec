import type { ReactNode } from "react";

export interface TreeItem {
  readonly name: string | ReactNode;
  readonly id: string;
}

export interface TreeNode extends TreeItem {
  readonly children?: TreeNode[];
  /**
   * If the node has more children that are not currently included.
   * This will render the chevron icon even though children is empty.
   */
  readonly hasMore?: boolean;
}

export interface TreeRow<T extends TreeNode> {
  readonly id: string;
  readonly index: number;
  readonly localIndex: number;
  readonly item: T;
  readonly depth: number;
  readonly expanded: boolean;
  readonly hasChildren: boolean;
  readonly icon?: ReactNode;
  readonly toggleExpand: () => void;
}

export interface TreeRowColumn<T extends TreeItem> {
  render: (row: TreeRow<T>) => ReactNode;
}
