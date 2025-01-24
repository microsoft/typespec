import { Position, TextDocument } from "vscode-languageserver-textdocument";
import {
  Document,
  isDocument,
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
import { TextRange } from "../core/index.js";
import { firstNonWhitespaceCharacterIndex, isWhitespaceStringOrUndefined } from "../utils/misc.js";
import { ServerLog } from "./types.js";

type YamlNodePathSegment = Document<Node, true> | Node | Pair;
export interface YamlPositionDetail {
  /**
   * The path of the yaml node at the position, it consists of object's property, array's index, empty string for potential object property (empty line)
   */
  path: string[];
  /**
   * The final target of the path, either the key or value of the node pointed by the path property
   *   - "key" or "value" if the node is pointing to an object property
   *   - "arr-item" if the node is pointing to an array item
   */
  type: "key" | "value" | "arr-item";
  /**
   * actual value of target in the doc
   */
  source: string;
  /**
   *  The input quotes (double quotes or single quotes)
   */
  sourceType: Scalar.Type;
  /**
   * The position range of the text in the document, such as [startPos, endPos], see {@link TextRange}
   */
  sourceRange: TextRange | undefined;
  /**
   * The siblings of the target node
   */
  siblings: string[];
  /**
   * The parsed yaml document
   */
  yamlDoc: Document<Node, true>;
  /**
   * The cursor current position
   */
  cursorPosition: number;
}

interface YamlVisitScalarNode {
  key: number | "key" | "value" | null;
  n: Scalar<unknown>;
  path: readonly YamlNodePathSegment[];
}

export function resolveYamlPositionDetail(
  document: TextDocument,
  position: Position,
  log: (log: ServerLog) => void,
): YamlPositionDetail | undefined {
  const pos = document.offsetAt(position);
  const content = document.getText();
  const lines = content.split("\n");
  const targetLine = lines[position.line];
  const yamlDoc = parseDocument(content, {
    keepSourceTokens: true,
  });

  if (!yamlDoc) {
    return undefined;
  }

  if (
    isCommentLine(targetLine) &&
    position.character > firstNonWhitespaceCharacterIndex(targetLine)
  ) {
    return undefined;
  }

  if (isWhitespaceStringOrUndefined(targetLine) || isCommentLine(targetLine)) {
    const indent = position.character;
    if (indent === 0) {
      const rootProperties: string[] = [];
      if (isMap(yamlDoc.contents)) {
        rootProperties.push(
          ...yamlDoc.contents.items.map((item) => (item.key as any).source ?? ""),
        );
      } else if (
        isScalar(yamlDoc.contents) &&
        !isWhitespaceStringOrUndefined(yamlDoc.contents.source)
      ) {
        rootProperties.push(yamlDoc.contents.source);
      }
      return {
        path: [""],
        type: "key",
        source: "",
        sourceType: "PLAIN",
        siblings: rootProperties,
        yamlDoc,
        sourceRange: undefined,
        cursorPosition: pos,
      };
    }
    for (let i = position.line - 1; i >= 0; i--) {
      const preLine = lines[i];
      if (isWhitespaceStringOrUndefined(preLine) || isCommentLine(preLine)) {
        continue;
      }
      const preIndent = getIndentOfYamlLine(preLine);
      if (preIndent === -1) {
        // we got an empty '-' line
        return undefined;
      }
      if (preIndent === indent) {
        // we found the previous line which should be the sibling of the current line
        const found = findScalarNode(
          yamlDoc,
          document.offsetAt({
            line: i,
            character: preIndent,
          }),
        );
        if (!found) {
          log({
            level: "debug",
            message: `Failed to find the scalar node in the found previous sibling line of empty line. curLine: ${targetLine}, preLine: ${preLine}`,
          });
          return undefined;
        }
        const yp = createYamlPathFromVisitScalarNode(found, pos, log, yamlDoc);
        if (!yp || yp.path.length === 0) {
          log({
            level: "debug",
            message: `Unexpected found path which should at least contains one segment for the found previous non-empty line item`,
          });
          return undefined;
        }
        // adjust path and sibling for the whitespace line
        if (yp.type === "arr-item") {
          // the sibling node is a plain text value of an array (otherwise there should be an map node under the seq node)
          return undefined;
        } else {
          return {
            path: [...yp.path.slice(0, yp.path.length - 1), ""],
            type: "key",
            source: "",
            sourceType: "PLAIN",
            siblings: [...yp.siblings, yp.source],
            yamlDoc,
            sourceRange: yp.sourceRange,
            cursorPosition: pos,
          };
        }
        break;
      } else if (preIndent < indent) {
        // we found the previous line which should be the parent of the current line
        const found = findScalarNode(
          yamlDoc,
          document.offsetAt({
            line: i,
            character: preIndent,
          }),
        );
        if (!found) {
          log({
            level: "debug",
            message: `Failed to find the scalar node in the found previous parent line of empty line. curLine: ${targetLine}, preLine: ${preLine}`,
          });
          return undefined;
        }
        // the parent should be a map or null (potential a map)
        const last = found.path[found.path.length - 1];
        if (
          isPair(last) &&
          (last.value === null ||
            isMap(last.value) ||
            (isScalar(last.value) && isWhitespaceStringOrUndefined(last.value.source)))
        ) {
          const yp = createYamlPathFromVisitScalarNode(found, pos, log, yamlDoc);
          if (!yp || yp.path.length === 0) {
            log({
              level: "debug",
              message: `Unexpected found path which should at least contains one segment for the found previous non-empty line item`,
            });
            return undefined;
          }
          // adjust path and sibling for the whitespace line
          return {
            path: [...yp.path, ""],
            type: "key",
            source: "",
            sourceType: "PLAIN",
            siblings: isMap(last.value)
              ? (last.value?.items.map((item) => (item.key as any).source ?? "") ?? [])
              : [],
            yamlDoc,
            sourceRange: yp.sourceRange,
            cursorPosition: pos,
          };
        }
        break;
      }
    }
    return undefined;
  } else {
    const found = findScalarNode(yamlDoc, pos);
    if (!found) {
      log({
        level: "debug",
        message: `Failed to find the scalar node at the position: ${pos}`,
      });
      return undefined;
    }
    const yp = createYamlPathFromVisitScalarNode(found, pos, log, yamlDoc);
    return yp;
  }
}

function createYamlPathFromVisitScalarNode(
  info: YamlVisitScalarNode,
  offset: number,
  log: (log: ServerLog) => void,
  yamlDoc: Document<Node, true>,
): YamlPositionDetail | undefined {
  const { key, n, path: nodePath } = info;
  if (nodePath.length === 0) {
    log({
      level: "debug",
      message: `Unexpected path structure, nodePath is empty while we always expect at least a root doc node`,
    });
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
        log({
          level: "debug",
          message: `Unexpected path structure. the next element isn't found in the sequence(array): ${next.toJSON()}`,
        });
        return undefined;
      }
    }
  }

  const last = nodePath[nodePath.length - 1];
  let curSourceRange = undefined;
  if (n.range) {
    const [startPos, endPos] = n.range;
    curSourceRange = { pos: startPos, end: endPos };
  }

  if (isDocument(last)) {
    // we are at the root and the content is a pure text (otherwise there should be a Map under document node first)
    return {
      path: [],
      type: key === null ? "key" : "value",
      source: n.source ?? "",
      sourceType: n.type ?? "PLAIN",
      siblings: [],
      yamlDoc,
      sourceRange: curSourceRange,
      cursorPosition: offset,
    };
  } else if (isPair(last)) {
    if (nodePath.length < 2) {
      log({
        level: "debug",
        message: `Unexpected path structure, the pair node should have a parent node: ${last.toString()}`,
      });
      return undefined;
    }
    const newline = last.srcToken?.sep?.find((t) => t.type === "newline");
    if (key === "value" && newline && newline.offset < offset) {
      // if the scalar node is marked as value but separated by newline from the key, it's more likely that the user is inputting the first property of an object
      // so build the target as an object key
      path.push(n.source ?? "");

      return {
        path,
        type: "key",
        source: n.source ?? "",
        sourceType: n.type ?? "PLAIN",
        siblings: [],
        yamlDoc,
        sourceRange: curSourceRange,
        cursorPosition: offset,
      };
    } else {
      const parent = nodePath.length >= 2 ? nodePath[nodePath.length - 2] : undefined;
      const targetSiblings = isMap(parent)
        ? parent.items.filter((item) => item !== last).map((item) => (item.key as any).source ?? "")
        : [];

      return {
        path: path,
        type: key === "key" ? "key" : "value",
        source: n.source ?? "",
        siblings: targetSiblings,
        sourceType: n.type ?? "PLAIN",
        yamlDoc,
        sourceRange: curSourceRange,
        cursorPosition: offset,
      };
    }
  } else if (isSeq(last)) {
    return {
      path: path,
      type: "arr-item",
      source: n.source ?? "",
      sourceType: n.type ?? "PLAIN",
      siblings: last.items
        .filter((i) => i !== n)
        .map((item) => (isScalar(item) ? (item.source ?? "") : "")),
      yamlDoc,
      sourceRange: curSourceRange,
      cursorPosition: offset,
    };
  } else {
    log({
      level: "debug",
      message: `Unexpected path structure, last element is not pair or seq for scalar node: ${last.toString()}`,
    });
    return undefined;
  }
}

function isCommentLine(line: string): boolean {
  return line.trimStart().startsWith("#");
}

/** whitespace and '-' will be considered as indent */
function getIndentOfYamlLine(line: string): number {
  return line.search(/[^\s-]/);
}

function findScalarNode(
  document: Document<Node, true>,
  pos: number,
): YamlVisitScalarNode | undefined {
  let found = undefined;
  visit(document, {
    Node: (key, n, path) => {
      if (isScalar(n)) {
        const [start, endValue, _endNode] = n.range ?? [];
        if (start === undefined || endValue === undefined) return undefined;
        if (start <= pos && pos <= endValue) {
          found = { key, n, path };
          return visit.BREAK;
        }
      }
      return undefined;
    },
  });
  return found;
}
