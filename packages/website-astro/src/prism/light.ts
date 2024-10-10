import type { PrismTheme } from "prism-react-renderer";

/**
 * Fork from atom one light theme that is accessible AA compliant.
 */
export const LightTheme: PrismTheme = {
  plain: {
    backgroundColor: "hsl(230, 1%, 98%)",
    color: "hsl(230, 8%, 24%)",
  },
  styles: [
    {
      types: ["comment", "prolog", "cdata"],
      style: {
        color: "#737378",
      },
    },
    {
      types: ["doctype", "punctuation", "entity"],
      style: {
        color: "hsl(230, 8%, 24%)",
      },
    },
    {
      types: ["attr-name", "class-name", "boolean", "constant", "number", "atrule"],
      style: {
        color: "#c2483d",
      },
    },
    {
      types: ["keyword"],
      style: {
        color: "hsl(301, 63%, 40%)",
      },
    },

    {
      types: ["property", "tag", "symbol", "deleted", "important"],
      style: {
        color: "#c2483d",
      },
    },
    {
      types: [
        "selector",
        "string",
        "char",
        "builtin",
        "inserted",
        "regex",
        "attr-value",
        "punctuation",
      ],
      style: {
        color: "#40813f",
      },
    },
    {
      types: ["variable", "operator", "function"],
      style: {
        color: "#3e6ed7",
      },
    },
    {
      types: ["url"],
      style: {
        color: "hsl(198, 99%, 37%)",
      },
    },
    {
      types: ["deleted"],
      style: {},
    },
    {
      types: ["inserted"],
      style: {},
    },
    {
      types: ["italic"],
      style: {
        fontStyle: "italic",
      },
    },
    {
      types: ["important", "bold"],
      style: {
        fontWeight: "bold",
      },
    },
    {
      types: ["important"],
      style: {
        color: "hsl(230, 8%, 24%)",
      },
    },
    {
      types: ["punctuation"],
      style: {
        color: "#383A42",
      },
    },
  ],
};
