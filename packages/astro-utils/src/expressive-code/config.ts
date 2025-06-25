// @ts-check
import { addClassName } from "@expressive-code/core/hast";
import { defineEcConfig } from "astro-expressive-code";
import tspTryitCode from "./plugins/tsp-tryit-code.js";

export function defineTypeSpecEcConfig(base: string) {
  return defineEcConfig({
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
      // Starlight theme overrides
      borderRadius: "0px",
      borderWidth: "1px",
      codePaddingBlock: "0.75rem",
      codePaddingInline: "1rem",
      codeFontFamily: "var(--__sl-font-mono)",
      codeFontSize: "var(--sl-text-code)",
      codeLineHeight: "var(--sl-line-height)",
      uiFontFamily: "var(--__sl-font)",
      textMarkers: {
        lineDiffIndicatorMarginLeft: "0.25rem",
        defaultChroma: "45",
        backgroundOpacity: "60%",
      },
      frames: {
        frameBoxShadowCssValue: "none",
      },
    },
    plugins: [
      {
        name: "Starlight Plugin",
        hooks: {
          postprocessRenderedBlock: ({ renderData }) => {
            addClassName(renderData.blockAst, "not-content");
          },
        },
      },
      tspTryitCode(base + "playground/"),
    ],
  });
}
