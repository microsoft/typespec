import { Tree, type TreeNode } from "@typespec/react-components";
import { useMemo, type FC, type FunctionComponent } from "react";
import style from "./file-tree.module.css";

import { DocumentRegular, FolderRegular } from "@fluentui/react-icons";

export interface FileTreeExplorerProps {
  readonly files: string[];
  readonly selected: string;
  readonly onSelect: (file: string) => void;
  readonly changedFiles?: Set<string>;
}

interface FileTreeNode extends TreeNode {
  readonly isDirectory: boolean;
  readonly changed?: boolean;
}

const FileNodeIcon: FC<{ node: FileTreeNode }> = ({ node }) => {
  if (node.isDirectory) {
    return <FolderRegular />;
  }
  return <DocumentRegular />;
};

const FileNodeLabel: FC<{ node: FileTreeNode }> = ({ node }) => {
  return (
    <span
      style={
        node.changed ? { fontWeight: 600, color: "var(--colorPaletteGreenForeground1)" } : undefined
      }
    >
      {node.name}
    </span>
  );
};

/**
 * Builds a tree structure from a flat list of file paths.
 */
function buildTree(files: string[], changedFiles?: Set<string>): FileTreeNode {
  const root: FileTreeNode = { id: "__root__", name: "root", isDirectory: true, children: [] };
  const dirMap = new Map<string, FileTreeNode>();
  dirMap.set("", root);

  function ensureDir(dirPath: string): FileTreeNode {
    if (dirMap.has(dirPath)) {
      return dirMap.get(dirPath)!;
    }
    const parts = dirPath.split("/");
    const parentPath = parts.slice(0, -1).join("/");
    const parent = ensureDir(parentPath);
    const node: FileTreeNode = {
      id: dirPath,
      name: parts[parts.length - 1],
      isDirectory: true,
      children: [],
    };
    dirMap.set(dirPath, node);
    (parent.children as FileTreeNode[]).push(node);
    return node;
  }

  for (const file of [...files].sort()) {
    const lastSlash = file.lastIndexOf("/");
    if (lastSlash === -1) {
      (root.children as FileTreeNode[]).push({
        id: file,
        name: file,
        isDirectory: false,
        changed: changedFiles?.has(file),
      });
    } else {
      const dirPath = file.substring(0, lastSlash);
      const fileName = file.substring(lastSlash + 1);
      const parent = ensureDir(dirPath);
      (parent.children as FileTreeNode[]).push({
        id: file,
        name: fileName,
        isDirectory: false,
        changed: changedFiles?.has(file),
      });
    }
  }

  // Sort children: directories first, then files, alphabetically within each group
  function sortChildren(node: FileTreeNode) {
    if (node.children) {
      (node.children as FileTreeNode[]).sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return String(a.name).localeCompare(String(b.name));
      });
      for (const child of node.children as FileTreeNode[]) {
        sortChildren(child);
      }
    }
  }
  sortChildren(root);

  return root;
}

export const FileTreeExplorer: FunctionComponent<FileTreeExplorerProps> = ({
  files,
  selected,
  onSelect,
  changedFiles,
}) => {
  const tree = useMemo(() => buildTree(files, changedFiles), [files, changedFiles]);

  return (
    <div className={style["file-tree"]}>
      <Tree<FileTreeNode>
        tree={tree}
        selectionMode="single"
        selected={selected}
        onSelect={onSelect}
        nodeIcon={FileNodeIcon}
        nodeLabel={FileNodeLabel}
      />
    </div>
  );
};
