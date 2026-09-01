import type { Doc, ParserOptions } from "prettier";
import type { DecoratorExpressionNode } from "../../core/types.js";

export interface TypeSpecPrettierOptions extends ParserOptions {}

export type PrettierChildPrint = (path: any) => Doc;

export interface DecorableNode {
  decorators: readonly DecoratorExpressionNode[];
}
