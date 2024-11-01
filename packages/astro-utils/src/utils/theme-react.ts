import { useEffect, useState } from "react";
import { getTheme, type Theme } from "./theme";

export function useTheme(): Theme {
  const [current, setCurrent] = useState<Theme>(getTheme());
  useEffect(() => {
    const handleThemeChange = () => {
      setCurrent(document.documentElement.dataset.theme as any);
    };

    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return current;
}
