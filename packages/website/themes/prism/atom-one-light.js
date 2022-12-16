// @ts-check

// Converted from https://github.com/PrismJS/prism-themes/blob/master/themes/prism-one-light.css

/** @type {import("prism-react-renderer").PrismTheme} */
const theme = {
  plain: {
    color: "#383A42",
    backgroundColor: "#FAFAFA",
  },
  styles: [
    {
      types: ["comment"],
      style: {
        color: "hsl(230, 4%, 64%)",
      },
    },
    {
      types: ["doctype", "punctuation", "entity"],
      style: {
        color: "hsl(230, 8%, 24%)",
      },
    },
    {
      types: ["attr-name", "class-name", "boolean", "constant", "number"],
      style: {
        color: "hsl(35, 99%, 36%)",
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
        color: "hsl(5, 74%, 59%)",
      },
    },
    {
      types: ["selector", "string", "char", "builtin", "inserted", "regex", "attr-value"],
      style: {
        color: "hsl(119, 34%, 47%)",
      },
    },
    {
      types: ["variable", "operator", "function"],
      style: {
        color: "hsl(221, 87%, 60%)",
      },
    },
  ],
};

module.exports = theme;
