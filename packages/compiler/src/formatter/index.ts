import type { Parser, SupportLanguage } from "prettier";
import { Node } from "../core/types.js";
import { parse } from "./parser.js";
import { typespecPrinter } from "./print/index.js";

export const defaultOptions = {};

export const languages: SupportLanguage[] = [
  {
    name: "TypeSpec",
    parsers: ["typespec"],
    extensions: [".tsp", ".cadl"],
    vscodeLanguageIds: ["typespec"],
  },
];

const TypeSpecParser: Parser = {
  parse,
  astFormat: "typespec-format",
  locStart(node: Node) {
    return node.pos;
  },
  locEnd(node: Node) {
    return node.end;
  },
};
export const parsers = {
  typespec: TypeSpecParser,
};

export const printers = {
  "typespec-format": typespecPrinter,
};
