import { Node, isCollection, isMap, isScalar } from "yaml";
import { findPair } from "yaml/util";
import { SourceLocation } from "../core/types.js";
import { YamlScript, YamlTarget, YamlTargetType } from "./types.js";

export function createYamlTarget(
  file: YamlScript,
  path: string[],
  kind: YamlTargetType = "key"
): YamlTarget {
  return {
    file,
    path,
    kind,
  };
}

export function getLocationOfYamlTarget(target: YamlTarget): SourceLocation {
  const node: Node | undefined = findYamlNode(target);
  return {
    file: target.file.file,
    pos: node?.range?.[0] ?? 0,
    end: node?.range?.[1] ?? 0,
  };
}

function findYamlNode(target: YamlTarget): Node | undefined {
  let current: Node | null = target.file.doc.contents;

  for (let i = 0; i < target.path.length; i++) {
    const key = target.path[i];
    const isLast = i === target.path.length - 1;
    if (isScalar(current)) {
      return current;
    } else if (isCollection(current)) {
      if (isLast) {
        if (target.kind === "value" || !isMap(current)) {
          return current.get(key, true);
        } else {
          const pair = findPair(current.items, key);
          if (target.kind === "key") {
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
