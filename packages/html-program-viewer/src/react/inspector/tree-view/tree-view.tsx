import { memo, useCallback, useContext, useLayoutEffect, useState } from "react";
import { ExpandedPathsContext } from "./expanded-paths-context.js";
import { DEFAULT_ROOT_PATH, getExpandedPaths, hasChildNodes } from "./path-utils.js";
import { TreeNode } from "./tree-node.js";

import { useStyles } from "../styles/index.js";

interface ConnectedTreeViewProps {
  name: string;
  data: any;
  path: string;
  dataIterator: (...args: any[]) => any;
  depth: number;
  expanded?: boolean;
  nodeRenderer: (...args: any[]) => any;
}
const ConnectedTreeNode = memo((props: ConnectedTreeViewProps) => {
  const { data, dataIterator, path, depth, nodeRenderer } = props;
  const [expandedPaths, setExpandedPaths] = useContext(ExpandedPathsContext);
  const nodeHasChildNodes = hasChildNodes(data, dataIterator);
  const expanded = !!expandedPaths[path];

  const handleClick = useCallback(
    () =>
      nodeHasChildNodes &&
      setExpandedPaths((prevExpandedPaths: any) => ({
        ...prevExpandedPaths,
        [path]: !expanded,
      })),
    [nodeHasChildNodes, setExpandedPaths, path, expanded]
  );

  return (
    <TreeNode
      expanded={expanded}
      onClick={handleClick}
      // show arrow anyway even if not expanded and not rendering children
      shouldShowArrow={nodeHasChildNodes}
      // show placeholder only for non root nodes
      shouldShowPlaceholder={depth > 0}
      // Render a node from name and data (or possibly other props like isNonenumerable)
      {...props}
    >
      {
        // only render if the node is expanded
        expanded
          ? [...dataIterator(data)].map(({ name, data, ...renderNodeProps }) => {
              return (
                <ConnectedTreeNode
                  name={name}
                  data={data}
                  depth={depth + 1}
                  path={`${path}.${name}`}
                  key={name}
                  dataIterator={dataIterator}
                  nodeRenderer={nodeRenderer}
                  {...renderNodeProps}
                />
              );
            })
          : null
      }
    </TreeNode>
  );
});

interface TreeViewProps {
  name: string;
  data: any;
  dataIterator: (...args: any[]) => any;
  nodeRenderer: (...args: any[]) => any;
  expandPaths: string[];
  expandLevel: number;
}
export const TreeView = memo(
  ({ name, data, dataIterator, nodeRenderer, expandPaths, expandLevel }: TreeViewProps) => {
    const styles = useStyles("TreeView");
    const stateAndSetter = useState({});
    const [, setExpandedPaths] = stateAndSetter;

    useLayoutEffect(
      () =>
        setExpandedPaths((prevExpandedPaths) =>
          getExpandedPaths(data, dataIterator, expandPaths, expandLevel, prevExpandedPaths)
        ),
      [data, dataIterator, expandPaths, expandLevel]
    );

    return (
      <ExpandedPathsContext.Provider value={stateAndSetter}>
        <ol role="tree" style={styles.treeViewOutline}>
          <ConnectedTreeNode
            name={name}
            data={data}
            dataIterator={dataIterator}
            depth={0}
            path={DEFAULT_ROOT_PATH}
            nodeRenderer={nodeRenderer}
          />
        </ol>
      </ExpandedPathsContext.Provider>
    );
  }
);
