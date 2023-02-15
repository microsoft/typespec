import { AstPath, Doc, ParserOptions } from "prettier";
import { DecoratorExpressionNode, Node } from "../../core/types.js";

export interface TypeSpecPrettierOptions extends ParserOptions {}

export type PrettierChildPrint = (path: AstPath<Node>, index?: number) => Doc;

export interface DecorableNode {
  decorators: readonly DecoratorExpressionNode[];
}
