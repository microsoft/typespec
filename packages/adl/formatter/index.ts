import { Parser, SupportLanguage } from "prettier";
import { Node } from "../compiler/types.js";
import { parse } from "./parser.js";
import { ADLPrinter } from "./print/index.js";

export const defaultOptions = {};

export const languages: SupportLanguage[] = [
  {
    name: "ADL",
    parsers: ["adl"],
    extensions: [".adl"],
    vscodeLanguageIds: ["adl"],
  },
];

const ADLParser: Parser = {
  parse,
  astFormat: "adl-format",
  locStart(node: Node) {
    return node.pos;
  },
  locEnd(node: Node) {
    return node.end;
  },
};
export const parsers = {
  adl: ADLParser,
};

export const printers = {
  "adl-format": ADLPrinter,
};
