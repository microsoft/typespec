/**
 * TypeSpec Language configuration. Format: https://code.visualstudio.com/api/language-extensions/language-configuration-guide
 * @hidden Typedoc causing issue with this
 */
export const TypeSpecLanguageConfiguration = {
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
    // NOTE: autoclose for double quotes may interfere with typing """
    { open: '"', close: '"' },
    { open: "/**", close: " */", notIn: ["string"] },
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
  ],
  // From https://github.com/Microsoft/vscode/blob/main/extensions/javascript/javascript-language-configuration.json
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

/**
 * @deprecated Use TypeSpecLanguageConfiguration
 * @hidden
 */
export const CadlLanguageConfiguration = TypeSpecLanguageConfiguration;
