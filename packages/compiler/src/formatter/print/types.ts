import { Doc, ParserOptions } from "prettier";
import { DecoratorExpressionNode } from "../../core/types.js";

export interface TypeSpecPrettierOptions extends ParserOptions {}

// export type PrettierChildPrint = (path: AstPath<Node>, index?: number) => Doc;
export type PrettierChildPrint = (...args: any) => Doc;

export interface DecorableNode {
  decorators: readonly DecoratorExpressionNode[];
}
