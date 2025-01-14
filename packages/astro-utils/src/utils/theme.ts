const LOCAL_STORAGE_KEY = "theme";
const STARLIGHT_LOCAL_STORAGE_KEY = "starlight-theme";
const ColorModes = {
  light: "light",
  dark: "dark",
} as const;

export type Theme = (typeof ColorModes)[keyof typeof ColorModes];

const coerceToColorMode = (colorMode?: string | null): Theme =>
  colorMode === ColorModes.dark ? ColorModes.dark : ColorModes.light;

let theme: Theme = (() => {
  if (typeof localStorage !== "undefined" && localStorage.getItem(LOCAL_STORAGE_KEY)) {
    return coerceToColorMode(localStorage.getItem(LOCAL_STORAGE_KEY));
  }
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
})();

update();

function update() {
  document.documentElement.setAttribute("data-theme", theme);
  if (theme === "light") {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
  }
  updateStarlight();
}

export function getTheme(): Theme {
  return theme;
}

export function setTheme(newTheme: Theme) {
  theme = newTheme;
  localStorage.setItem(LOCAL_STORAGE_KEY, newTheme);
  update();
}

function updateStarlight() {
  localStorage.setItem(STARLIGHT_LOCAL_STORAGE_KEY, theme);
  if ("StarlightThemeProvider" in window) {
    (window.StarlightThemeProvider as any).updatePickers(theme);
  }
}
