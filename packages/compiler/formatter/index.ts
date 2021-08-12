import { Parser, SupportLanguage } from "prettier";
import { Node } from "../core/types.js";
import { parse } from "./parser.js";
import { cadlPrinter } from "./print/index.js";

export const defaultOptions = {};

export const languages: SupportLanguage[] = [
  {
    name: "Cadl",
    parsers: ["cadl"],
    extensions: [".cadl"],
    vscodeLanguageIds: ["cadl"],
  },
];

const CadlParser: Parser = {
  parse,
  astFormat: "cadl-format",
  locStart(node: Node) {
    return node.pos;
  },
  locEnd(node: Node) {
    return node.end;
  },
};
export const parsers = {
  cadl: CadlParser,
};

export const printers = {
  "cadl-format": cadlPrinter,
};
