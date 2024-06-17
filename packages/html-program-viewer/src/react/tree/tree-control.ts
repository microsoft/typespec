import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface TreeControls {
  readonly renderSignal: number;
  readonly expanded: Set<string>;
  expand(key: string): void;
  collapse(key: string): void;
  toggleExpand(key: string): void;
}

export function useTreeControls({ expandNodes }: { expandNodes?: string[] }): TreeControls {
  const expanded = useRef(new Set<string>()).current;
  const [rerender, setRerender] = useState(0);

  useEffect(() => {
    if (expandNodes) {
      for (const key of expandNodes) {
        expanded.add(key);
      }
      setRerender((x) => x + 1);
    }
  }, [expandNodes]);
  const toggleExpand = useCallback(
    (key: string) => {
      if (expanded.has(key)) {
        expanded.delete(key);
      } else {
        expanded.add(key);
      }
      setRerender((x) => x + 1);
    },
    [expanded]
  );

  const expand = useCallback(
    (key: string) => {
      expanded.add(key);
      setRerender((x) => x + 1);
    },
    [expanded]
  );
  const collapse = useCallback(
    (key: string) => {
      expanded.delete(key);
      setRerender((x) => x + 1);
    },
    [expanded]
  );

  return useMemo(
    () => ({ expanded, toggleExpand, expand, collapse, renderSignal: rerender }),
    [expanded, toggleExpand, expand, collapse, expanded, rerender]
  );
}
