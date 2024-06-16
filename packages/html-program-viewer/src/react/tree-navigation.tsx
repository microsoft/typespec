import { type TreeOpenChangeData } from "@fluentui/react-components";
import { useCallback, useMemo, useState } from "react";
import { Tree } from "./tree/tree.js";
import { useTreeNavigator } from "./use-tree-navigation.js";

export interface TreeNavigationProps {}

export const TreeNavigation = (_: TreeNavigationProps) => {
  const nav = useTreeNavigator();
  const [openItems, setOpenItems] = useState<Set<string | number>>(new Set());

  const onOpenChange = useCallback(
    (evt: any, data: TreeOpenChangeData) => {
      setOpenItems(data.openItems);
    },
    [setOpenItems]
  );

  const resolvedOpenItems = useMemo(() => {
    const path = nav.selectedPath.split(".");
    return new Set([...openItems, ...path.map((_, i) => path.slice(0, i + 1).join("."))]);
  }, [openItems, nav.selectedPath]);

  return <Tree tree={nav.tree} onSelect={nav.selectPath} />;
};
