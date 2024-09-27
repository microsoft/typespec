import type { JSONSchemaType } from "@typespec/compiler";
import vscode from "vscode";
import { LanguageClient } from "vscode-languageclient/node.js";
import npmPackageProvider from "../npm-package-provider.js";
import { getEmitter, listEmitters } from "../typespec/emitter.js";
import {
  getTypeSpecConfigJsonSchema,
  getTypeSpecEmitterConfigJsonSchema,
} from "../typespec/schema.js";
import { resolveYamlPath, YamlScalarTarget } from "../yaml-resolver.js";

export async function provideTspconfigCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position,
  client: LanguageClient | undefined,
) {
  if (!client) {
    return [];
  }
  const path = resolveYamlPath(document, position);
  if (path === undefined) {
    return [];
  }
  // TODO: filter items based on last
  const items = resolveTspConfigCompleteItems(document.uri.fsPath, path, client);
  return items;
}

async function resolveTspConfigCompleteItems(
  tspConfigFile: string,
  target: YamlScalarTarget,
  client: LanguageClient,
) {
  const { path: nodePath, type: targetType, siblings } = target;
  const CONFIG_PATH_LENGTH_FOR_EMITTER_LIST = 2;
  if (
    (nodePath.length === CONFIG_PATH_LENGTH_FOR_EMITTER_LIST &&
      nodePath[0] === "options" &&
      targetType === "key") ||
    (nodePath.length === CONFIG_PATH_LENGTH_FOR_EMITTER_LIST &&
      nodePath[0] === "emit" &&
      targetType === "value")
  ) {
    const emitters = await listEmitters(tspConfigFile, npmPackageProvider);

    const items = [];
    for (const [name, pkg] of Object.entries(emitters)) {
      if (!siblings.includes(name)) {
        const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Field);
        item.documentation =
          (await pkg.getPackageJsonData())?.description ?? `emitter from ${name}`;
        item.insertText = `"${name}"`;
        items.push(item);
      }
    }
    return items;
  } else if (nodePath.length > 1 && nodePath[0] === "options") {
    const EMITTER_CONFIG_SCHEMA_START_INDEX = 2;
    const emitterName = nodePath[1];
    const emitter = await getEmitter(tspConfigFile, npmPackageProvider, emitterName);
    if (!emitter) {
      return [];
    }
    const exports = await emitter.getModuleExports();
    if (exports?.$lib?.emitter?.options === undefined) {
      return [];
    }

    const builtInEmitterSchema = await getTypeSpecEmitterConfigJsonSchema(client);

    const items1 = builtInEmitterSchema
      ? resolveCompleteItems(builtInEmitterSchema, {
          ...target,
          path: nodePath.slice(EMITTER_CONFIG_SCHEMA_START_INDEX),
        })
      : [];

    const items2 = resolveCompleteItems(exports.$lib.emitter.options, {
      ...target,
      path: nodePath.slice(EMITTER_CONFIG_SCHEMA_START_INDEX),
    });
    return [...items1, ...items2];
  } else {
    const schema = await getTypeSpecConfigJsonSchema(client);
    return schema ? resolveCompleteItems(schema, target) : [];
  }
}

function resolveCompleteItems(schema: JSONSchemaType<unknown>, target: YamlScalarTarget) {
  let cur = schema;
  const { path: nodePath, type: targetType } = target;
  const path = targetType === "key" ? nodePath.slice(0, -1) : nodePath;
  for (const key of path) {
    // DOUBLE CHECK THE PATH
    if (cur.type === "array") {
      cur = cur.items as JSONSchemaType<unknown>;
      //TODO: double check the key should be an array index? seems not necessary
      continue;
    } else if (cur.type === "object") {
      if (!cur.properties || !cur.properties[key]) {
        return [];
      } else {
        cur = cur.properties[key];
      }
    } else {
      return [];
    }
  }

  if (targetType === "value") {
    if (cur.type === "boolean") {
      return ["true", "false"].map((value) => {
        const item = new vscode.CompletionItem(value, vscode.CompletionItemKind.Value);
        item.documentation = cur.description;
        return item;
      });
    } else if (cur.type === "string" && cur.enum) {
      return cur.enum.map((value: string) => {
        const item = new vscode.CompletionItem(value, vscode.CompletionItemKind.Value);
        item.documentation = cur.description;
        item.insertText = `"${value}"`;
        return item;
      });
    }
  } else if (targetType === "key") {
    if (cur.type === "object") {
      return Object.keys(cur.properties ?? {})
        .filter((key) => !target.siblings.includes(key) && cur.properties[key].deprecated !== true)
        .map((key) => {
          const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Field);
          item.documentation = cur.properties[key].description;
          return item;
        });
    }
  }
  return [];
}
