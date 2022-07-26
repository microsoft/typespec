/**
 * Cadl Language configuration. Format: https://code.visualstudio.com/api/language-extensions/language-configuration-guide
 */
export const CadlLanguageConfiguration = {
  comments: {
    lineComment: "//",
    blockComment: ["/*", "*/"],
  },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: "/**", close: " */", notIn: ["string"] },
    // NOTE: quotes omitted here intentionally for now as they interfere with typing """
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
  ],
  indentationRules: {
    decreaseIndentPattern: {
      pattern: "^((?!.*?/\\*).*\\*/)?\\s*[\\}\\]].*$",
    },
    increaseIndentPattern: {
      pattern: "^((?!//).)*(\\{([^}\"'`/]*|(\\t|[ ])*//.*)|\\([^)\"'`/]*|\\[[^\\]\"'`/]*)$",
    },
    // e.g.  * ...| or */| or *-----*/|
    unIndentedLinePattern: {
      pattern:
        "^(\\t|[ ])*[ ]\\*[^/]*\\*/\\s*$|^(\\t|[ ])*[ ]\\*/\\s*$|^(\\t|[ ])*[ ]\\*([ ]([^\\*]|\\*(?!/))*)?$",
    },
  },
  onEnterRules: [
    {
      // e.g. /** | */
      beforeText: {
        pattern: "^\\s*/\\*\\*(?!/)([^\\*]|\\*(?!/))*$",
      },
      afterText: {
        pattern: "^\\s*\\*/$",
      },
      action: {
        indent: "indentOutdent",
        appendText: " * ",
      },
    },
    {
      // e.g. /** ...|
      beforeText: {
        pattern: "^\\s*/\\*\\*(?!/)([^\\*]|\\*(?!/))*$",
      },
      action: {
        indent: "none",
        appendText: " * ",
      },
    },
    {
      // e.g.  * ...|
      beforeText: {
        pattern: "^(\\t|[ ])*[ ]\\*([ ]([^\\*]|\\*(?!/))*)?$",
      },
      previousLineText: {
        pattern: "(?=^(\\s*(/\\*\\*|\\*)).*)(?=(?!(\\s*\\*/)))",
      },
      action: {
        indent: "none",
        appendText: "* ",
      },
    },
    {
      // e.g.  */|
      beforeText: {
        pattern: "^(\\t|[ ])*[ ]\\*/\\s*$",
      },
      action: {
        indent: "none",
        removeText: 1,
      },
    },
    {
      // e.g.  *-----*/|
      beforeText: {
        pattern: "^(\\t|[ ])*[ ]\\*[^/]*\\*/\\s*$",
      },
      action: {
        indent: "none",
        removeText: 1,
      },
    },
  ],
} as const;
