import { Children, RenderTextTree, renderTree } from "@alloy-js/core";

/**
 * Utility function to join children with a separator.
 * @param children children to join
 * @param separator text to use between children
 * @param terminal optional text to terminate the string
 * @returns joined string
 */
export function joinChildren(
  children: Children | undefined,
  separator: string,
  terminal?: string,
): string {
  let value = "";
  if (!children || (Array.isArray(children) && children.length === 0)) {
    return value;
  }
  if (Array.isArray(children)) {
    value = children.join(separator);
  } else if (typeof children === "string") {
    value = children;
  }
  if (terminal) {
    value += terminal;
  }
  return value;
}

function printTree(tree: RenderTextTree) {
  return (tree as any).flat(Infinity).join("");
}

export function renderToString(element: Children) {
  return printTree(renderTree(element));
}
