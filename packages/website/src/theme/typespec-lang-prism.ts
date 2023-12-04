const lang = {
  comment: [
    {
      // multiline comments eg /* ASDF */
      pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
      lookbehind: true,
      greedy: true,
    },
    {
      // singleline comments eg // ASDF
      pattern: /(^|[^\\:])\/\/.*/,
      lookbehind: true,
      greedy: true,
    },
  ],

  directives: { pattern: /#.*/g, greedy: true, alias: "comment" },

  decorator: {
    pattern: /@@?[$\w\xA0-\uFFFF]+/,
    inside: {
      at: {
        pattern: /^@/,
        alias: "operator",
      },
      function: /^[\s\S]+/,
    },
  },

  property: {
    pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
    lookbehind: true,
    alias: "property",
  },

  string: [
    // https://docs.swift.org/swift-book/LanguageGuide/StringsAndCharacters.html
    {
      pattern: new RegExp(
        /(^|[^"#])/.source +
          "(?:" +
          // multi-line string
          /"""(?:\\(?:\$\{(?:[^{}]|\$\{[^{}]*\})*\}|[^(])|[^\\"]|"(?!""))*"""/.source +
          "|" +
          // single-line string
          /"(?:\\(?:\$\{(?:[^{}]|\$\{[^{}]*\})*\}|\r\n|[^(])|[^\\\r\n"])*"/.source +
          ")"
      ),
      lookbehind: true,
      greedy: true,
      inside: {
        interpolation: {
          pattern: /(\$\{)(?:[^{}]|\$\{[^{}]*\})*(?=\})/,
          lookbehind: true,
          inside: null, // see below
        },
        "interpolation-punctuation": {
          pattern: /^\}|\$\{$/,
          alias: "punctuation",
        },
        punctuation: /\\(?=[\r\n])/,
        string: /[\s\S]+/,
      },
    },
  ],

  boolean: /\b(?:false|true)\b/,
  keyword:
    /\b(?:import|model|scalar|namespace|op|interface|union|using|is|extends|enum|alias|return|void|never|if|else|projection|dec|extern|fn)\b/,

  function: /\b[a-z_]\w*(?=[ \t]*\()/i,
  variable: /\b(?:[A-Z_\d]*[a-z]\w*)?\b/,

  number: /(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:E[+-]?\d+)?/i,
  operator:
    /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/,
  punctuation: /[{}[\];(),.:]/,
};

lang.string[0].inside.interpolation.inside = lang;
export default lang;

// TODO REMOVE FOR TESTING
const test = /"(?:\\(?:\$\{(?:[^{}]|\$\{[^{}]*\})*\}|\r\n|[^(])|[^\\\r\n"])*"/;

console.log("Test", test);
