import type { ReactNode } from "react";

export interface TreeItem {
  readonly name: string;
  readonly id: string;
}

export interface TreeNode extends TreeItem {
  readonly children?: Array<TreeNode>;
}

export interface TreeRow<T extends TreeNode> {
  readonly id: string;
  readonly index: number;
  readonly item: T;
  readonly depth: number;
  readonly expanded: boolean;
  readonly hasChildren: boolean;
  readonly toggleExpand: () => void;
}

export interface TreeRowColumn<T extends TreeItem> {
  render: (row: TreeRow<T>) => ReactNode;
}
