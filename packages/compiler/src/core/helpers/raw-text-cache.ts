import { Node, SyntaxKind, TypeSpecScriptNode } from "../types.js";

const nodeRawTextCache = new WeakMap<Node, string>();

export function cacheRawText(node: Node, rawText: string): void {
  nodeRawTextCache.set(node, rawText);
}

export function getCachedRawText(node: Node): string | undefined {
  return nodeRawTextCache.get(node);
}

export function getRawTextWithCache(node: Node): string {
  const cached = getCachedRawText(node);
  if (cached !== undefined) {
    return cached;
  }

  let rawText = "";
  if ("rawText" in node) {
    rawText = (node as any).rawText as string;
  } else {
    const scriptNode = getTypeSpecScript(node);
    if (scriptNode) {
      rawText = scriptNode.file.text.slice(node.pos, node.end);
    }
  }

  cacheRawText(node, rawText);
  return rawText;
}

function getTypeSpecScript(node: Node): TypeSpecScriptNode | undefined {
  let current: Node = node;
  while (current.parent) {
    current = current.parent;
  }
  return current.kind === SyntaxKind.TypeSpecScript ? current : undefined;
}
