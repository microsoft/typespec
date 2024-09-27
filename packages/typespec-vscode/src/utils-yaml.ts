import { inspect } from "util";
import vscode from "vscode";
import {
  Document,
  isMap,
  isPair,
  isScalar,
  isSeq,
  Node,
  Pair,
  parseDocument,
  Scalar,
  visit,
} from "yaml";
import logger from "./extension-logger.js";

type YamlNodePathSegment = Document<Node, true> | Node | Pair;
export interface YamlScalarTarget {
  /**
   * The path of the yaml node at the position, it consists of object's property, array's index, empty string for potential object property (empty line)
   */
  path: string[];
  /**
   * The final target of the path, either the key or value of the node pointed by the path property
   *   - "key" or "value" if the node is pointing to an object property
   *   - "value" if the node is pointing to an array item
   */
  type: "key" | "value";
  /**
   * actual value of target in the doc
   */
  source: string;
  /**
   * The siblings of the target node
   */
  siblings: string[];
}

interface YamlVisitScalarNode {
  key: number | "key" | "value" | null;
  n: Scalar<unknown>;
  path: readonly YamlNodePathSegment[];
}

function createYamlPathFromVisitScalarNode(
  info: YamlVisitScalarNode,
): YamlScalarTarget | undefined {
  const { key, n, path: nodePath } = info;
  if (nodePath.length === 0) {
    logger.debug(
      `Unexpected path structure, nodePath is empty while we always expect at least a root doc node`,
    );
    return undefined;
  }
  const path: string[] = [];

  for (let i = 0; i < nodePath.length; i++) {
    const seg = nodePath[i];
    if (isPair<unknown, unknown>(seg)) {
      path.push((<any>seg.key).source ?? "");
    } else if (isSeq(seg)) {
      const next = nodePath.length > i + 1 ? nodePath[i + 1] : n;
      const index = seg.items.findIndex((item) => item === next);
      if (index >= 0) {
        path.push(index.toString());
      } else {
        logger.debug(
          `Unexpected path structure. the next element isn't found in the sequence: ${inspect(next)}`,
        );
        return undefined;
      }
    }
  }

  const last = nodePath[nodePath.length - 1];
  if (isPair(last)) {
    if (nodePath.length < 2) {
      logger.debug(
        `Unexpected path structure, the pair node should have a parent node: ${last.toString()}`,
      );
      return undefined;
    }
    const parent = nodePath[nodePath.length - 2];
    const targetSiblings = isMap(parent)
      ? parent.items.filter((item) => item !== last).map((item) => (item.key as any).source ?? "")
      : [];
    return {
      path: path,
      type: key === "key" ? "key" : "value",
      source: n.source ?? "",
      siblings: targetSiblings,
    };
  } else if (isSeq(last)) {
    return {
      path: path,
      type: "value",
      source: n.source ?? "",
      siblings: last.items.map((item) => (isScalar(item) ? (item.source ?? "") : "")),
    };
  } else {
    logger.debug(
      `Unexpected path structure, last element is not pair or seq for scalar node: ${last.toString()}`,
    );
    return undefined;
  }
}

function isCommentLine(line: vscode.TextLine): boolean {
  return line.text.trimStart().startsWith("#");
}

function isArrayItemLine(line: vscode.TextLine): boolean {
  return line.text.trimStart().startsWith("-");
}

export function resolveYamlPath(
  document: vscode.TextDocument,
  position: vscode.Position,
): YamlScalarTarget | undefined {
  const pos = document.offsetAt(position);
  const line = document.lineAt(position);
  const content = document.getText();
  const yamlDoc = parseDocument(content, {
    keepSourceTokens: true,
  });

  if (!yamlDoc) {
    return undefined;
  }

  // TODO: double check the comment scenario
  if (isCommentLine(line)) {
    return undefined;
  }

  if (line.isEmptyOrWhitespace) {
    const indent = position.character;
    const root = isMap(yamlDoc.contents) ? yamlDoc.contents : undefined;
    const rootProperties = root ? root.items.map((item) => (item.key as any).source ?? "") : [];
    if (indent === 0) {
      return {
        path: [""],
        type: "key",
        source: "",
        siblings: rootProperties,
      };
    }
    for (let i = line.lineNumber - 1; i >= 0; i--) {
      const preLine = document.lineAt(i);
      if (preLine.isEmptyOrWhitespace || isCommentLine(preLine)) {
        continue;
      }
      if (preLine.firstNonWhitespaceCharacterIndex === indent) {
        // we found the previous line which should be the sibling of the current line
        if (isArrayItemLine(preLine)) {
          // no worry about the array which should be handled after user input "-"
          return undefined;
        }
        const found = findScalarNode(
          yamlDoc,
          document.offsetAt(
            new vscode.Position(preLine.lineNumber, preLine.firstNonWhitespaceCharacterIndex),
          ),
        );
        if (!found) {
          logger.debug(
            `Failed to find the scalar node in the found previous sibling line of empty line. curLine: ${line.text}, preLine: ${preLine.text}`,
          );
          return undefined;
        }
        const yp = createYamlPathFromVisitScalarNode(found);
        if (!yp || yp.path.length === 0) {
          logger.debug(
            `Unexpected found path which should at least contains one segment for the found previous non-empty line item`,
          );
          return undefined;
        }
        return {
          path: [...yp.path.slice(0, yp.path.length - 1), ""],
          type: "key",
          source: "",
          siblings: [...yp.siblings, yp.source],
        };
        break;
      } else if (preLine.firstNonWhitespaceCharacterIndex < indent) {
        // we found the previous line which should be the parent of the current line
        const found = findScalarNode(
          yamlDoc,
          document.offsetAt(
            new vscode.Position(preLine.lineNumber, preLine.firstNonWhitespaceCharacterIndex),
          ),
        );
        if (!found) {
          logger.debug(
            `Failed to find the scalar node in the found previous parent line of empty line. curLine: ${line.text}, preLine: ${preLine.text}`,
          );
          return undefined;
        }
        // the parent should be a map or null
        const last = found.path[found.path.length - 1];
        if (isPair(last) && (last.value === null || isMap(last.value))) {
          const yp = createYamlPathFromVisitScalarNode(found);
          if (!yp || yp.path.length === 0) {
            logger.debug(
              `Unexpected found path which should at least contains one segment for the found previous non-empty line item`,
            );
            return undefined;
          }
          return {
            path: [...yp.path, ""],
            type: "key",
            source: "",
            siblings:
              last.value?.items
                .filter((item) => item !== last)
                .map((item) => (item.key as any).source ?? "") ?? [],
          };
        }
        break;
      }
    }
    return undefined;
  } else {
    const found = findScalarNode(yamlDoc, pos);
    if (!found) {
      logger.debug(`Failed to find the scalar node at the position: ${pos}`);
      return undefined;
    }
    const yp = createYamlPathFromVisitScalarNode(found);
    return yp;
  }
}

function findScalarNode(
  document: Document<Node, true>,
  pos: number,
): YamlVisitScalarNode | undefined {
  let found = undefined;
  visit(document, {
    Node: (key, n, path) => {
      if (isScalar(n)) {
        const [start, endValue, endNode] = n.range ?? [];
        if (start === undefined || endValue === undefined || endNode === undefined)
          return undefined;
        if (start <= pos && pos <= endNode) {
          found = { key, n, path };
          return visit.BREAK;
        }
      }
      return undefined;
    },
  });
  return found;
}
