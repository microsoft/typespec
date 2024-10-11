import { defineEcConfig } from "astro-expressive-code";

export default defineEcConfig({
  themes: ["one-light", "one-dark-pro"],
  themeCssSelector: (theme, { styleVariants }) => {
    // If one dark and one light theme are available, and the user has not disabled it,
    // generate theme CSS selectors compatible with Starlight's dark mode switch
    const baseTheme = styleVariants[0]?.theme;
    const altTheme = styleVariants.find((v) => v.theme.type !== baseTheme?.type)?.theme;
    if (theme === baseTheme || theme === altTheme) return `[data-theme='${theme.type}']`;
    // Return the default selector
    return `[data-theme='${theme.name}']`;
  },
  styleOverrides: {
    borderWidth: "0px",
    borderRadius: "0px",
    frames: {
      frameBoxShadowCssValue: "",
      editorTabBarBorderColor: "transpartent",
    },
  },
});
