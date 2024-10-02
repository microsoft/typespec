import { getTheme, setTheme, type Theme } from "@site/src/utils";
import { useEffect, useState } from "react";

type ContextValue = {
  /** Current color mode. */
  readonly colorMode: Theme;
  /** Set new color mode. */
  readonly setColorMode: (colorMode: Theme) => void;
};

export function useColorMode(): ContextValue {
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

  return { colorMode: current, setColorMode: setTheme };
}
