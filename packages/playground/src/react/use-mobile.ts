import { useCallback, useEffect, useState } from "react";

const MobileBreakpoint = 768;

/**
 * Hook that detects whether the viewport is at or below the mobile breakpoint.
 * Uses `matchMedia` with a listener for responsive changes.
 */
export function useIsMobile(): boolean {
  const query = `(max-width: ${MobileBreakpoint}px)`;

  const getMatch = useCallback(() => {
    return typeof window !== "undefined" ? window.matchMedia(query).matches : false;
  }, [query]);

  const [isMobile, setIsMobile] = useState(getMatch);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return isMobile;
}
