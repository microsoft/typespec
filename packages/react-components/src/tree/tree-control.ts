import { useCallback, useMemo, useRef, useState } from "react";

export interface TreeControls {
  readonly expanded: Set<string>;
  expand(key: string): void;
  collapse(key: string): void;
  toggleExpand(key: string): void;
}
export interface TreeControlsOptions {
  readonly onSetExpanded?: (expanded: Set<string>) => void;
}

export function useTreeControls({ onSetExpanded }: TreeControlsOptions): TreeControls {
  const expanded = useRef(new Set<string>()).current;
  const [rerender, setRerender] = useState(0);

  const toggleExpand = useCallback(
    (key: string) => {
      if (expanded.has(key)) {
        expanded.delete(key);
      } else {
        expanded.add(key);
      }
      onSetExpanded?.(expanded);
      setRerender((x) => x + 1);
    },
    [expanded],
  );

  const expand = useCallback(
    (key: string) => {
      expanded.add(key);
      onSetExpanded?.(expanded);
      setRerender((x) => x + 1);
    },
    [expanded],
  );
  const collapse = useCallback(
    (key: string) => {
      expanded.delete(key);
      onSetExpanded?.(expanded);
      setRerender((x) => x + 1);
    },
    [expanded],
  );

  return useMemo(
    () => ({ expanded: new Set(expanded), toggleExpand, expand, collapse }),
    [expanded, toggleExpand, expand, collapse, expanded, rerender],
  );
}
