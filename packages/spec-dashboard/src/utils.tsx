import { DependencyList, useEffect } from "react";

export function useEffectAsync(callback: () => Promise<void>, deps: DependencyList) {
  return useEffect(() => {
    void callback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
