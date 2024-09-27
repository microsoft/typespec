import { Node, isCollection, isMap, isScalar } from "yaml";
import { findPair } from "yaml/util";
import { SourceLocation } from "../core/types.js";
import { YamlDiagnosticTargetType, YamlScript } from "./types.js";

export function getLocationInYamlScript(
  file: YamlScript,
  path: string[],
  kind: YamlDiagnosticTargetType = "value",
): SourceLocation {
  const node: Node | undefined = findYamlNode(file, path, kind);
  return {
    file: file.file,
    pos: node?.range?.[0] ?? 0,
    end: node?.range?.[1] ?? 0,
  };
}

function findYamlNode(
  file: YamlScript,
  path: string[],
  kind: YamlDiagnosticTargetType = "value",
): Node | undefined {
  let current: Node | null = file.doc.contents;

  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    const isLast = i === path.length - 1;
    if (isScalar(current)) {
      return current;
    } else if (isCollection(current)) {
      if (isLast) {
        if (kind === "value" || !isMap(current)) {
          return current.get(key, true);
        } else {
          const pair = findPair(current.items, key);
          if (kind === "key") {
            return pair?.key as any;
          } else {
            return pair as any;
          }
        }
      } else {
        current = current.get(key, true) as any;
      }
    } else {
      continue;
    }
  }
  return current ?? undefined;
}
