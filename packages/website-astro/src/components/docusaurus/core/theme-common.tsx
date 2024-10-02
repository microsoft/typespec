import { useEffect, useState } from "react";

const ColorModes = {
  light: "light",
  dark: "dark",
} as const;

export type ColorMode = (typeof ColorModes)[keyof typeof ColorModes];

type ContextValue = {
  /** Current color mode. */
  readonly colorMode: ColorMode;
  /** Set new color mode. */
  readonly setColorMode: (colorMode: ColorMode) => void;
};

const coerceToColorMode = (colorMode?: string | null): ColorMode =>
  colorMode === ColorModes.dark ? ColorModes.dark : ColorModes.light;

let colorMode: ColorMode = (() => {
  if (typeof localStorage !== "undefined" && localStorage.getItem("theme")) {
    return coerceToColorMode(localStorage.getItem("theme"));
  }
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
})();

update();

function update() {
  document.documentElement.setAttribute("data-theme", colorMode);
  if (colorMode === "light") {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
  }
}

export function getColorMode(): ColorMode {
  return colorMode;
}

export function setColorMode(newColorMode: ColorMode) {
  colorMode = newColorMode;
  localStorage.setItem("theme", newColorMode);
  update();
}

export function useColorMode(): ContextValue {
  const [current, setCurrent] = useState<ColorMode>(colorMode);
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

  return { colorMode: current, setColorMode };
}
