import { TextDocument } from "vscode-languageserver-textdocument";
import { CompletionItem, CompletionItemKind, Position } from "vscode-languageserver/node.js";
import { emitterOptionsSchema, TypeSpecConfigJsonSchema } from "../../config/config-schema.js";
import { JSONSchemaType, ServerLog } from "../../index.js";
import { distinctArray } from "../../utils/misc.js";
import { EmitterProvider } from "../emitter-provider.js";
import { FileService } from "../file-service.js";
import { resolveYamlScalarTarget, YamlScalarTarget } from "../yaml-resolver.js";

type ObjectJSONSchemaType = JSONSchemaType<object>;

export async function provideTspconfigCompletionItems(
  tspConfigDoc: TextDocument,
  tspConfigPosition: Position,
  context: {
    fileService: FileService;
    emitterProvider: EmitterProvider;
    log: (log: ServerLog) => void;
  },
): Promise<CompletionItem[]> {
  const { fileService, emitterProvider, log } = context;
  const target = resolveYamlScalarTarget(tspConfigDoc, tspConfigPosition, log);
  if (target === undefined) {
    return [];
  }
  const items = resolveTspConfigCompleteItems(await fileService.getPath(tspConfigDoc), target);
  return items;

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
        targetType === "arr-item")
    ) {
      const emitters = await emitterProvider.listEmitters(tspConfigFile);
      const items: CompletionItem[] = [];
      for (const [name, pkg] of Object.entries(emitters)) {
        if (!siblings.includes(name)) {
          const item: CompletionItem = {
            label: name,
            kind: CompletionItemKind.Field,
            documentation: (await pkg.getPackageJsonData())?.description ?? `Emitter from ${name}`,
            insertText: `"${name}"`,
          };
          items.push(item);
        }
      }
      return items;
    } else if (nodePath.length > CONFIG_PATH_LENGTH_FOR_EMITTER_LIST && nodePath[0] === "options") {
      const emitterName = nodePath[CONFIG_PATH_LENGTH_FOR_EMITTER_LIST - 1];
      const emitter = await emitterProvider.getEmitter(tspConfigFile, emitterName);
      if (!emitter) {
        return [];
      }
      const exports = await emitter.getModuleExports();

      const builtInEmitterSchema = emitterOptionsSchema;

      const itemsFromBuiltIn = builtInEmitterSchema
        ? resolveCompleteItems(builtInEmitterSchema, {
            ...target,
            path: nodePath.slice(CONFIG_PATH_LENGTH_FOR_EMITTER_LIST),
          })
        : [];

      const itemsFromEmitter = [];
      if (exports?.$lib?.emitter?.options !== undefined) {
        const more = resolveCompleteItems(exports.$lib.emitter.options, {
          ...target,
          path: nodePath.slice(CONFIG_PATH_LENGTH_FOR_EMITTER_LIST),
        });
        itemsFromEmitter.push(...more);
      }
      return [...itemsFromBuiltIn, ...itemsFromEmitter];
    } else {
      const schema = TypeSpecConfigJsonSchema;
      return schema ? resolveCompleteItems(schema, target) : [];
    }
  }

  /**
   *
   * @param schema
   * @param path
   * @param curIndex
   * @param track track the schema we have processed so that we won't have problem for circle reference
   * @returns
   */
  function findSchemaByPath(
    schema: ObjectJSONSchemaType,
    path: readonly string[],
    curIndex: number,
    track: Set<ObjectJSONSchemaType> = new Set<ObjectJSONSchemaType>(),
  ): ObjectJSONSchemaType[] {
    if (curIndex >= path.length) {
      return [schema];
    }
    if (track.has(schema)) {
      return [];
    }
    const key = path[curIndex];
    const result = [];
    if (schema.type === "array") {
      return findSchemaByPath(schema.items, path, curIndex + 1);
    } else {
      if (schema.type === "object") {
        if (schema.properties && schema.properties[key]) {
          if (schema.properties[key].deprecated !== true) {
            const found = findSchemaByPath(schema.properties[key], path, curIndex + 1);
            result.push(...found);
          }
        } else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
          const found = findSchemaByPath(schema.additionalProperties, path, curIndex + 1);
          result.push(...found);
        }
      }
      if (schema.oneOf || schema.anyOf || schema.allOf) {
        const choices = [...(schema.anyOf ?? []), ...(schema.oneOf ?? []), ...(schema.allOf ?? [])];
        const founds = choices.flatMap((choice) => findSchemaByPath(choice, path, curIndex), track);
        result.push(...founds);
      }
      return result;
    }
  }

  /**
   *
   * @param schema
   * @param track a set to track all the processed schema so that we won't have problem for circle reference
   * @returns
   */
  function expandPossibleSchema(
    schema: ObjectJSONSchemaType,
    track: Set<ObjectJSONSchemaType> = new Set<ObjectJSONSchemaType>(),
  ): ObjectJSONSchemaType[] {
    if (track.has(schema)) return [];
    const result = [schema];
    const choices = [...(schema.anyOf ?? []), ...(schema.oneOf ?? []), ...(schema.allOf ?? [])];
    for (const choice of choices) {
      result.push(...expandPossibleSchema(choice, track));
    }
    result.forEach((s) => track.add(s));
    return result;
  }

  function resolveCompleteItems(
    schema: ObjectJSONSchemaType,
    target: YamlScalarTarget,
  ): CompletionItem[] {
    const { path: nodePath, type: targetType } = target;
    // if the target is a key which means it's pointing to an object property, we should remove the last element of the path to get it's parent object for its schema
    const path = targetType === "key" ? nodePath.slice(0, -1) : nodePath;
    const foundSchemas = findSchemaByPath(schema, path, 0);

    const result: CompletionItem[] = [];
    foundSchemas
      .flatMap((s) => expandPossibleSchema(s))
      .forEach((cur) => {
        if (targetType === "key" || targetType === "arr-item") {
          if (cur.type === "object") {
            const props = Object.keys(cur.properties ?? {})
              .filter(
                (key) => !target.siblings.includes(key) && cur.properties[key].deprecated !== true,
              )
              .map((key) => {
                const item: CompletionItem = {
                  label: key,
                  kind: CompletionItemKind.Field,
                  documentation: cur.properties[key].description,
                };
                return item;
              });
            result.push(...props);
          }
        }
        if (targetType === "value" || targetType === "arr-item") {
          if (cur.type === "boolean") {
            result.push(
              ...["true", "false"].map((value) => {
                const item: CompletionItem = {
                  label: value,
                  kind: CompletionItemKind.Value,
                  documentation: cur.description,
                };
                return item;
              }),
            );
          } else if (cur.type === "string" && cur.enum) {
            const enums = cur.enum.map((value: string) => {
              const item: CompletionItem = {
                label: value,
                kind: CompletionItemKind.Value,
                documentation: cur.description,
                insertText: `"${value}"`,
              };
              return item;
            });
            result.push(...enums);
          }
        }
      });

    return distinctArray(result, (t) => t.label);
  }
}
