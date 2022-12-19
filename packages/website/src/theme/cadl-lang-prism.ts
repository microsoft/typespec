export default {
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
    {
      pattern: /"""[^"][\s\S]*?"""/,
      greedy: true,
    },
    {
      pattern: /(^|[^\\"])"(?:\\.|\$(?!\{)|[^"\\\r\n$])*"/,
      lookbehind: true,
      greedy: true,
    },
  ],

  boolean: /\b(?:false|true)\b/,
  keyword:
    /\b(?:import|model|scalar|namespace|op|interface|union|using|is|extends|enum|alias|return|void|never|if|else|projection|dec|extern|fn)\b/,

  function: /\b[a-z_]\w*(?=[ \t]*\()/i,

  number: /(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:E[+-]?\d+)?/i,
  operator:
    /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/,
  punctuation: /[{}[\];(),.:]/,
};
