import { Children, join } from "@alloy-js/core";
import { joinChildren } from "./util.js";

/**
 * Represents a Python decorator invocation.
 */
export interface DecoratorProps {
  name: string;
  args?: Children;
}

export function Decorator(props: DecoratorProps) {
  let argsExpr = joinChildren(props.args, ", ");
  if (argsExpr && argsExpr !== "") {
    argsExpr = `(${argsExpr})`;
  }
  return `@${props.name}${argsExpr}`;
}