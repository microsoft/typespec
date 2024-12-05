import * as fs from "fs";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CompletionItem,
  CompletionItemKind,
  Position,
  Range,
  TextEdit,
} from "vscode-languageserver/node.js";
import { emitterOptionsSchema, TypeSpecConfigJsonSchema } from "../../config/config-schema.js";
import {
  getAnyExtensionFromPath,
  getBaseFileName,
  getDirectoryPath,
  getRelativePathFromDirectory,
  joinPaths,
} from "../../core/path-utils.js";
import { JSONSchemaType, ServerLog } from "../../index.js";
import { distinctArray } from "../../utils/misc.js";
import { FileService } from "../file-service.js";
import { LibraryProvider } from "../lib-provider.js";
import { resolveYamlScalarTarget, YamlScalarTarget } from "../yaml-resolver.js";

type ObjectJSONSchemaType = JSONSchemaType<object>;

export async function provideTspconfigCompletionItems(
  tspConfigDoc: TextDocument,
  tspConfigPosition: Position,
  context: {
    fileService: FileService;
    libProvider: LibraryProvider;
    log: (log: ServerLog) => void;
  },
): Promise<CompletionItem[]> {
  const { fileService, libProvider, log } = context;
  const target = resolveYamlScalarTarget(tspConfigDoc, tspConfigPosition, log);
  if (target === undefined) {
    return [];
  }
  const items = resolveTspConfigCompleteItems(
    await fileService.getPath(tspConfigDoc),
    target,
    tspConfigPosition,
    log,
  );
  return items;

  async function resolveTspConfigCompleteItems(
    tspConfigFile: string,
    target: YamlScalarTarget,
    tspConfigPosition: Position,
    log: (log: ServerLog) => void,
  ): Promise<CompletionItem[]> {
    const {
      path: nodePath,
      type: targetType,
      siblings,
      sourceType,
      source,
      siblingsChildren,
    } = target;
    const CONFIG_PATH_LENGTH_FOR_EMITTER_LIST = 2;
    const CONFIG_PATH_LENGTH_FOR_LINTER_LIST = 2;
    const CONFIG_PATH_LENGTH_FOR_EXTENDS = 1;
    const CONFIG_PATH_LENGTH_FOR_IMPORTS = 2;
    if (
      (nodePath.length === CONFIG_PATH_LENGTH_FOR_EMITTER_LIST &&
        nodePath[0] === "options" &&
        targetType === "key") ||
      (nodePath.length === CONFIG_PATH_LENGTH_FOR_EMITTER_LIST &&
        nodePath[0] === "emit" &&
        targetType === "arr-item")
    ) {
      libProvider.setIsGetEmitterVal(true);
      const libs = await libProvider.listLibraries(tspConfigFile);
      const items: CompletionItem[] = [];
      for (const [name, pkg] of Object.entries(libs)) {
        if (!siblings.includes(name)) {
          // Generate new text
          const newText = getNewTextValue(sourceType, name);

          const item: CompletionItem = {
            label: name,
            kind: CompletionItemKind.Field,
            documentation: (await pkg.getPackageJsonData())?.description ?? `Emitter from ${name}`,
            textEdit: getNewTextAndPosition(newText, source, tspConfigPosition),
          };
          items.push(item);
        }
      }
      return items;
    } else if (nodePath.length > CONFIG_PATH_LENGTH_FOR_EMITTER_LIST && nodePath[0] === "options") {
      const emitterName = nodePath[CONFIG_PATH_LENGTH_FOR_EMITTER_LIST - 1];
      libProvider.setIsGetEmitterVal(true);
      const emitter = await libProvider.getLibrary(tspConfigFile, emitterName);
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
    } else if (nodePath.length > CONFIG_PATH_LENGTH_FOR_LINTER_LIST && nodePath[0] === "linter") {
      const linterName = nodePath[CONFIG_PATH_LENGTH_FOR_LINTER_LIST - 1];
      libProvider.setIsGetEmitterVal(false);
      if (linterName === "extends") {
        const linters = await libProvider.listLibraries(tspConfigFile);
        const items: CompletionItem[] = [];
        for (const [name, pkg] of Object.entries(linters)) {
          // If a ruleSet exists for the linter, add it to the end of the library name.
          const exports = await pkg.getModuleExports();
          let additionalContent: string = "";
          if (exports?.$linter?.ruleSets !== undefined) {
            additionalContent = Object.keys(exports?.$linter?.ruleSets)[0];
          }

          const labelName = additionalContent.length === 0 ? name : `${name}/${additionalContent}`;
          if (siblings.includes(labelName)) {
            continue;
          }

          const newText = getNewTextValue(sourceType, labelName);
          const item: CompletionItem = {
            label: labelName,
            kind: CompletionItemKind.Field,
            documentation: (await pkg.getPackageJsonData())?.description ?? `Linters from ${name}`,
            textEdit: getNewTextAndPosition(newText, source, tspConfigPosition),
          };
          items.push(item);
        }
        return items;
      } else {
        const itemsFromLintter = [];
        const libNames: string[] = [];
        if (siblingsChildren && siblingsChildren.length > 0) {
          // Filter duplicate library names
          for (const extendsValue of siblingsChildren) {
            const arrLine = extendsValue.split("/");
            let libName: string = "";
            if (arrLine.length >= 2) {
              libName = arrLine[0] + "/" + arrLine[1];
            } else {
              continue;
            }
            if (!libNames.includes(libName)) {
              libNames.push(libName);
            }
          }

          // Get rules in each library
          for (const name of libNames) {
            const linter = await libProvider.getLibrary(tspConfigFile, name);
            if (!linter) {
              return [];
            }

            const exports = await linter.getModuleExports();

            if (exports?.$linter?.rules !== undefined) {
              const more = resolveCompleteItems(
                exports?.$linter?.rules,
                {
                  ...target,
                  path: nodePath.slice(CONFIG_PATH_LENGTH_FOR_EMITTER_LIST),
                },
                name,
              );
              itemsFromLintter.push(...more);
            }
          }
        }

        return [...itemsFromLintter];
      }
    } else if (nodePath.length === CONFIG_PATH_LENGTH_FOR_EXTENDS && nodePath[0] === "extends") {
      const currentFolder = getDirectoryPath(tspConfigFile);
      const extName = getAnyExtensionFromPath(tspConfigFile);
      const newFolderPath = joinPaths(currentFolder, source);
      const configFile = getBaseFileName(tspConfigFile);

      const relativeFiles = findFilesWithSameExtension(newFolderPath, extName, log, configFile);

      const schema = TypeSpecConfigJsonSchema;
      return schema ? resolveCompleteItems(schema, target, "", relativeFiles) : [];
    } else if (nodePath.length >= CONFIG_PATH_LENGTH_FOR_IMPORTS && nodePath[0] === "imports") {
      const currentFolder = getDirectoryPath(tspConfigFile);
      const newFolderPath = joinPaths(currentFolder, source);

      const relativeFiles = findFilesWithSameExtension(newFolderPath, ".tsp", log);

      const schema = TypeSpecConfigJsonSchema;
      return schema ? resolveCompleteItems(schema, target, "", relativeFiles) : [];
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
    libName?: string,
    relativeFiles?: string[],
  ): CompletionItem[] {
    const { path: nodePath, type: targetType, source, sourceType } = target;
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
                  documentation: cur.required?.includes(key)
                    ? "[required]\n" + (cur.properties[key].description ?? "")
                    : "[optional]\n" + (cur.properties[key].description ?? ""),
                };
                return item;
              });
            result.push(...props);
          } else if (cur.type === undefined) {
            // lint rule
            for (const key of Object.keys(cur ?? {})) {
              const labelName = `${libName}/${cur[key].name}`;
              if (target.siblingsChildren.includes(labelName)) {
                continue;
              }

              const newText = getNewTextValue(sourceType, labelName);
              const item: CompletionItem = {
                label: labelName,
                kind: CompletionItemKind.Field,
                documentation: cur[key].description,
                textEdit: getNewTextAndPosition(newText, source, tspConfigPosition),
              };
              result.push(item);
            }
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
          } else if (
            cur.type === "string" &&
            sourceType === "QUOTE_DOUBLE" &&
            /{(env\.)?}|{[^{}]*}/g.test(source)
          ) {
            // Variable interpolation
            // environment-variables
            if (/{env\.}(?!\S)|{env\.}/g.test(source)) {
              for (const env of target.envs) {
                if (!nodePath.includes(env)) {
                  result.push({
                    label: env,
                    kind: CompletionItemKind.Value,
                    documentation: cur.description,
                  });
                }
              }
            } else {
              // built-in variables
              result.push(
                ...["cwd", "project-root"].map((value) => {
                  const item: CompletionItem = {
                    label: value,
                    kind: CompletionItemKind.Value,
                    documentation: cur.description,
                  };
                  return item;
                }),
              );
              // parameters
              for (const param of target.parameters) {
                if (!nodePath.includes(param)) {
                  result.push({
                    label: param,
                    kind: CompletionItemKind.Value,
                    documentation: cur.description,
                  });
                }
              }
            }
          } else if (cur.type === "string") {
            // extends
            if (relativeFiles && relativeFiles.length > 0) {
              for (const file of relativeFiles) {
                if (target.siblings.includes(file)) {
                  continue;
                }

                const item: CompletionItem = {
                  label: file,
                  kind: CompletionItemKind.Field,
                };
                result.push(item);
              }
            }
          }
        }
      });

    return distinctArray(result, (t) => t.label);
  }
}

/**
 * Get the new text value
 * @param sourceType input quote type(single, double, none)
 * @param formatText format text value
 * @returns
 */
function getNewTextValue(sourceType: string, formatText: string): string {
  let newText: string = "";
  if (sourceType === "QUOTE_SINGLE") {
    newText = `${formatText}'`;
  } else if (sourceType === "QUOTE_DOUBLE") {
    newText = `${formatText}"`;
  } else {
    newText = `"${formatText}"`;
  }
  return newText;
}

/**
 * Get the position of the new text
 * @param newText  the new text
 * @param source source text
 * @param tspConfigPosition original position
 * @returns
 */
function getNewTextAndPosition(
  newText: string,
  source: string,
  tspConfigPosition: Position,
): TextEdit {
  return TextEdit.replace(
    Range.create(
      Position.create(tspConfigPosition.line, tspConfigPosition.character - source.length),
      Position.create(tspConfigPosition.line, tspConfigPosition.character + newText.length),
    ),
    newText,
  );
}

/**
 * Find a set of relative paths to files with the same suffix
 * @param rootPath The root path of the current configuration file
 * @param fileExtension  File extension
 * @param log log function
 * @param configFile Configuration file name
 * @returns
 */
function findFilesWithSameExtension(
  rootPath: string,
  fileExtension: string,
  log: (log: ServerLog) => void,
  configFile: string = "",
): string[] {
  const exclude = ["node_modules", "tsp-output"];
  if (fileExtension === ".tsp") {
    exclude.push("main.tsp");
  }

  const files: string[] = [];
  try {
    // When reading the content under the path, an error may be reported if the path is incorrect.
    const filesInDir = fs.readdirSync(rootPath);
    for (const file of filesInDir) {
      const ext = getAnyExtensionFromPath(file);
      if (
        (ext && ext.length > 0 && ext !== fileExtension) ||
        exclude.includes(file) ||
        (configFile !== "" && getBaseFileName(file) === configFile)
      ) {
        continue;
      }

      const filePath = joinPaths(rootPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() || (stat.isFile() && file.endsWith(fileExtension))) {
        const relativePath = getRelativePathFromDirectory(rootPath, filePath, false);
        files.push(relativePath);
      }
    }
  } catch (error) {
    log({
      level: "error",
      message: `input path error: ${(error as Error).message}`,
    });
  }
  return files;
}
