import vscode from "vscode";
import { Document, isPair, isScalar, Node, Pair, parseDocument, Scalar, visit } from "yaml";

type YamlNodePath = readonly (Document<Node, true> | Node | Pair)[];

export function getYamlPath(document: vscode.TextDocument, position: vscode.Position) {
  const pos = document.offsetAt(position);
  const line = document.lineAt(position);
  const content = document.getText();
  const yamlDoc = parseDocument(content, {
    keepSourceTokens: true,
  });

  if (line.isEmptyOrWhitespace) {
    // We are in an empty line, try to find the closest Container
    let preNode: Scalar<unknown> | undefined;
    let prePath: YamlNodePath | undefined;
    visit(yamlDoc, {
      Scalar: (_key, n, path) => {
        const [start, valueEnd, nodeEnd] = n.range ?? [];
        if (!start || !valueEnd || !nodeEnd) return undefined; // continue;
        const [preStart, _preEnd, preNodeEnd] = preNode?.range ?? [-1, -1, -1];
        if (
          (preNodeEnd === nodeEnd && preStart < start && nodeEnd <= pos) ||
          (preNodeEnd < nodeEnd && nodeEnd <= pos)
        ) {
          preNode = n;
          prePath = path;
        }
        if (pos < start) return visit.BREAK; //visit is using DFS, so we can break early
        return undefined;
      },
    });
    if (!prePath) return undefined;
    // We found the node before pos, but it may not be the container (i.e. sibling node), so we need to find the closest container by the path
    // TO CONFIRM: shall we include preNode?
    const containerPath = prePath
      .filter(
        (p) =>
          isPair(p) &&
          isScalar(p.key) &&
          (p.key.srcToken as any).indent < line.firstNonWhitespaceCharacterIndex
      )
      .map((p) => (<any>p).key?.source ?? "");
    return [...containerPath, "empty-line"];
  } else {
    let foundPath: string[] | undefined;
    visit(yamlDoc, {
      Scalar: (key, n, path) => {
        const [start, valueEnd, nodeEnd] = n.range ?? [];
        if (!start || !valueEnd || !nodeEnd) return undefined; // continue;
        if (start <= pos && pos <= nodeEnd) {
          foundPath = path
            .filter((p) => isPair(p) && isScalar(p.key))
            .map((p) => (<any>p).key?.source ?? "");
          return visit.BREAK;
        }
        return undefined;
      },
    });
    return foundPath;
  }
}
