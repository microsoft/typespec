import { DependencyList, useEffect } from "react";

export function useEffectAsync(callback: () => Promise<void>, deps: DependencyList) {
  return useEffect(() => {
    void callback();
  }, deps);
}
