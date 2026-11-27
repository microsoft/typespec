import type { Doc, ParserOptions } from "prettier";
import type { DecoratorExpressionNode } from "../../core/types.js";

export interface TypeSpecPrettierOptions extends ParserOptions {}

export type PrettierChildPrint = (path: any, args?: unknown) => Doc;

export interface DecorableNode {
  decorators: readonly DecoratorExpressionNode[];
}

/**
 * Layout of the inline decorators of a member in a block, set by `joinMembersInBlock`.
 * - `may-break`: the decorator group gets the id `groupId` and starts with `leading`.
 * - `keep-inline`: the decorators stay on the member line.
 */
export type InlineDecoratorsLayout =
  | { readonly kind: "may-break"; readonly groupId: symbol; readonly leading: Doc }
  | { readonly kind: "keep-inline" };
