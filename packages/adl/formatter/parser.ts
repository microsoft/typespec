import { Parser, ParserOptions } from "prettier";
import { parse as adlParse } from "../compiler/parser.js";
import { ADLScriptNode } from "../compiler/types.js";

export function parse(
  text: string,
  parsers: { [parserName: string]: Parser },
  opts: ParserOptions & { parentParser?: string }
): ADLScriptNode {
  return adlParse(text, { comments: true });
}
