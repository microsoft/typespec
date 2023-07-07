import { Parser, SupportLanguage } from "prettier";
import { DecoratorFunction, Node } from "../core/types.js";
import { $deprecated } from "../index.js";
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

type Decorators = DecoratorFunction | [DecoratorFunction, ...any[]];

type Options = {};
type Args = [...Decorators[], string, Options];

const F = {
  scalar: (...args: Args): any => null,
};

F.scalar($deprecated, "foo", {});
F.scalar([$deprecated, "arg1"], "foo", {});
F.scalar([$deprecated, "arg1"], [$deprecated, "arg1"], "foo", {});
