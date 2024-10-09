import { Position, TextDocument } from "vscode-languageserver-textdocument";
import emitterProvider from "../typespec/emitter-provider.js";
import schemaProvider, { ObjectJSONSchemaType } from "../typespec/schema-provider.js";
import { resolveYamlScalarTarget, YamlScalarTarget } from "../yaml-resolver.js";

interface CompletionItem {
  label: string;
  kind: "field" | "value";
  documentation?: string;
  insertText?: string;
}

export async function provideTspconfigCompletionItems(
  tspConfigDoc: TextDocument,
  tspConfigPosition: Position,
  packageJsonFolder?: string,
): Promise<CompletionItem[]> {
  const target = resolveYamlScalarTarget(tspConfigDoc, tspConfigPosition);
  if (target === undefined) {
    return [];
  }
  // TODO: filter items based on last
  const items = resolveTspConfigCompleteItems(packageJsonFolder ?? tspConfigDoc.uri, target);
  return items;
}

async function resolveTspConfigCompleteItems(
  tspConfigFile: string,
  target: YamlScalarTarget,
): Promise<CompletionItem[]> {
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
    const emitters = await emitterProvider.listEmitters(tspConfigFile);

    const items: CompletionItem[] = [];
    for (const [name, pkg] of Object.entries(emitters)) {
      if (!siblings.includes(name)) {
        const item: CompletionItem = {
          label: name,
          kind: "field",
          documentation: (await pkg.getPackageJsonData())?.description ?? `emitter from ${name}`,
          insertText: `"${name}"`,
        };
        items.push(item);
      }
    }
    return items;
  } else if (nodePath.length > 1 && nodePath[0] === "options") {
    const EMITTER_CONFIG_SCHEMA_START_INDEX = 2;
    const emitterName = nodePath[1];
    const emitter = await emitterProvider.getEmitter(tspConfigFile, emitterName);
    if (!emitter) {
      return [];
    }
    const exports = await emitter.getModuleExports();
    if (exports?.$lib?.emitter?.options === undefined) {
      return [];
    }

    const builtInEmitterSchema = await schemaProvider.getTypeSpecEmitterConfigJsonSchema();

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
    const schema = await schemaProvider.getTypeSpecConfigJsonSchema();
    return schema ? resolveCompleteItems(schema, target) : [];
  }
}

function resolveCompleteItems(
  schema: ObjectJSONSchemaType,
  target: YamlScalarTarget,
): CompletionItem[] {
  let cur = schema;
  const { path: nodePath, type: targetType } = target;
  const path = targetType === "key" ? nodePath.slice(0, -1) : nodePath;
  for (const key of path) {
    // DOUBLE CHECK THE PATH
    if (cur.type === "array") {
      cur = cur.items;
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

  // when user is just add the first key of an object, it will be treated as value (PLAIN text) instead of key by yaml.parse
  if (targetType === "key") {
    if (cur.type === "object") {
      return Object.keys(cur.properties ?? {})
        .filter((key) => !target.siblings.includes(key) && cur.properties[key].deprecated !== true)
        .map((key) => {
          const item: CompletionItem = {
            label: key,
            kind: "field",
            documentation: cur.properties[key].description,
          };
          return item;
        });
    }
  } else if (targetType === "value") {
    if (cur.type === "boolean") {
      return ["true", "false"].map((value) => {
        const item: CompletionItem = {
          label: value,
          kind: "value",
          documentation: cur.description,
        };
        return item;
      });
    } else if (cur.type === "string" && cur.enum) {
      return cur.enum.map((value: string) => {
        const item: CompletionItem = {
          label: value,
          kind: "value",
          documentation: cur.description,
          insertText: `"${value}"`,
        };
        return item;
      });
    }
  }

  return [];
}
