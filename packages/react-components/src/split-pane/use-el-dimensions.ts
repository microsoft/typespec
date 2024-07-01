import { useEffect, useState, type RefObject } from "react";

export interface ElDimensions {
  readonly width: number;
  readonly height: number;
}

const defaultDimensions: ElDimensions = { width: 0, height: 0 };

export function useElDimensions(ref: RefObject<HTMLDivElement>) {
  const [dimensions, setDimensions] = useState<ElDimensions>(defaultDimensions);
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      setDimensions(ref.current?.getBoundingClientRect() ?? defaultDimensions);
    });
    resizeObserver.observe(ref.current!);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return dimensions;
}
