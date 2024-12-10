import * as fs from "fs";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CompletionItem,
  CompletionItemKind,
  Position,
  Range,
  TextEdit,
} from "vscode-languageserver/node.js";
import { isMap, isPair } from "yaml";
import { emitterOptionsSchema, TypeSpecConfigJsonSchema } from "../../config/config-schema.js";
import {
  getAnyExtensionFromPath,
  getBaseFileName,
  getDirectoryPath,
  getRelativePathFromDirectory,
  joinPaths,
} from "../../core/path-utils.js";
import {
  DiagnosticMessages,
  JSONSchemaType,
  LinterRuleDefinition,
  ServerLog,
} from "../../index.js";
import { distinctArray } from "../../utils/misc.js";
import { FileService } from "../file-service.js";
import { LibraryProvider } from "../lib-provider.js";
import {
  getYamlDocScalarNode,
  resolveYamlScalarTarget,
  YamlScalarTarget,
  YamlVisitScalarNode,
} from "../yaml-resolver.js";

type ObjectJSONSchemaType = JSONSchemaType<object>;

export async function provideTspconfigCompletionItems(
  tspConfigDoc: TextDocument,
  tspConfigPosition: Position,
  context: {
    fileService: FileService;
    emitterProvider: LibraryProvider;
    linterProvider: LibraryProvider;
    log: (log: ServerLog) => void;
  },
): Promise<CompletionItem[]> {
  const { fileService, emitterProvider, linterProvider, log } = context;
  const target = resolveYamlScalarTarget(tspConfigDoc, tspConfigPosition, log);
  if (target === undefined) {
    return [];
  }

  // Variable interpolation
  const yamlDocNodes = getYamlDocScalarNode(tspConfigDoc);
  if (yamlDocNodes === undefined) {
    return [];
  }

  if (target.sourceType === "QUOTE_DOUBLE" && /{(env\.)?}|{[^{}]*}/g.test(target.source)) {
    // environment-variables
    if (/{env\.}(?!\S)|{env\.}/g.test(target.source)) {
      // environment-variables
      return getEnvsCompletionItem(yamlDocNodes);
    } else {
      // parameters and built-in variables
      return [
        ...getParametersCompletionItems(yamlDocNodes),
        ...["cwd", "project-root"].map((value) => {
          const item: CompletionItem = {
            label: value,
            kind: CompletionItemKind.Value,
            documentation: "Built-in variables",
          };
          return item;
        }),
      ];
    }
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
    const { path: nodePath, type: targetType, siblings, sourceType, source } = target;
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
      const emitters = await emitterProvider.listLibraries(tspConfigFile);
      const items: CompletionItem[] = [];
      for (const [name, pkg] of Object.entries(emitters)) {
        if (!siblings.includes(name)) {
          items.push(
            getCommonCompetionItem(
              name,
              sourceType,
              source,
              (await pkg.getPackageJsonData())?.description ?? `Emitter from ${name}`,
              tspConfigPosition,
            ),
          );
        }
      }
      return items;
    } else if (nodePath.length > CONFIG_PATH_LENGTH_FOR_EMITTER_LIST && nodePath[0] === "options") {
      const emitterName = nodePath[CONFIG_PATH_LENGTH_FOR_EMITTER_LIST - 1];
      const emitter = await emitterProvider.getLibrary(tspConfigFile, emitterName);
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
      const extendKeyWord = nodePath[CONFIG_PATH_LENGTH_FOR_LINTER_LIST - 1];
      const items: CompletionItem[] = [];
      const linters = await linterProvider.listLibraries(tspConfigFile);

      if (extendKeyWord === "extends") {
        for (const [name, pkg] of Object.entries(linters)) {
          // If a ruleSet exists for the linter, add it to the end of the library name.
          const exports = await pkg.getModuleExports();
          if (exports?.$linter?.ruleSets !== undefined) {
            // Below ruleSets are objects rather than arrays
            for (const [ruleSet] of Object.entries(exports?.$linter?.ruleSets)) {
              const labelName = `${name}/${ruleSet}`;
              if (siblings.includes(labelName)) {
                continue;
              }

              items.push(
                getCommonCompetionItem(
                  labelName,
                  sourceType,
                  source,
                  (await pkg.getPackageJsonData())?.description ?? `Linters from ${labelName}`,
                  tspConfigPosition,
                ),
              );
            }
            continue;
          }

          // If there is no corresponding ruleSet in the library, add the library name directly.
          if (siblings.includes(name)) {
            continue;
          }

          items.push(
            getCommonCompetionItem(
              name,
              sourceType,
              source,
              (await pkg.getPackageJsonData())?.description ?? `Linters from ${name}`,
              tspConfigPosition,
            ),
          );
        }
      } else {
        // enable/disable rules
        for (const [name, pkg] of Object.entries(linters)) {
          const exports = await pkg.getModuleExports();

          if (exports?.$linter?.rules !== undefined) {
            for (const [, rule] of Object.entries<LinterRuleDefinition<string, DiagnosticMessages>>(
              exports?.$linter?.rules,
            )) {
              const labelName = `${name}/${rule.name}`;
              items.push(
                getCommonCompetionItem(
                  labelName,
                  sourceType,
                  source,
                  rule.description,
                  tspConfigPosition,
                ),
              );
            }
          }
        }
      }
      return items;
    } else if (nodePath.length === CONFIG_PATH_LENGTH_FOR_EXTENDS && nodePath[0] === "extends") {
      const currentFolder = getDirectoryPath(tspConfigFile);
      const extName = getAnyExtensionFromPath(tspConfigFile);
      const newFolderPath = joinPaths(currentFolder, source);
      const configFile = getBaseFileName(tspConfigFile);

      const relativeFiles = findFilesWithSameExtension(newFolderPath, extName, log, configFile);
      return getFilePathCompletionItems(relativeFiles, siblings);
    } else if (nodePath.length >= CONFIG_PATH_LENGTH_FOR_IMPORTS && nodePath[0] === "imports") {
      const currentFolder = getDirectoryPath(tspConfigFile);
      const newFolderPath = joinPaths(currentFolder, source);

      const relativeFiles = findFilesWithSameExtension(newFolderPath, ".tsp", log);
      return getFilePathCompletionItems(relativeFiles, siblings);
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
                  documentation: cur.required?.includes(key)
                    ? "[required]\n" + (cur.properties[key].description ?? "")
                    : "[optional]\n" + (cur.properties[key].description ?? ""),
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

/**
 * Get the new text value
 * @param sourceQuoteType input quote type(single, double, none)
 * @param formatText format text value
 * @returns new text value
 */
function getCompletionItemInsertedValue(sourceQuoteType: string, formatText: string): string {
  let newText: string = "";
  if (sourceQuoteType === "QUOTE_SINGLE") {
    newText = `${formatText}'`;
  } else if (sourceQuoteType === "QUOTE_DOUBLE") {
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
 * @param tspConfigPosition original position, see {@link Position}
 * @returns TextEdit object
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
 * @returns Relative path array
 */
function findFilesWithSameExtension(
  rootPath: string,
  fileExtension: string,
  log: (log: ServerLog) => void,
  configFile: string = "",
): string[] {
  const exclude = ["node_modules", "tsp-output", ".vs", ".vscode"];
  if (fileExtension === ".tsp") {
    exclude.push("main.tsp");
  }

  const files: string[] = [];
  try {
    // When reading the content under the path, an error may be reported if the path is incorrect.
    fs.readdirSync(rootPath, { withFileTypes: true })
      .filter(
        (d) =>
          (d.isDirectory() || (d.isFile() && d.name.endsWith(fileExtension))) &&
          !exclude.includes(d.name) &&
          getBaseFileName(d.name) !== configFile,
      )
      .map((d) => {
        const filePath = joinPaths(rootPath, d.name);
        const relativePath = getRelativePathFromDirectory(rootPath, filePath, false);
        files.push(relativePath);
      });
  } catch (error) {
    log({
      level: "error",
      message: `input path error: ${(error as Error).message}`,
    });
  }
  return files;
}

/**
 * Get the CompletionItem object array of the relative path of the file
 * @param relativeFiles File relative path array
 * @param siblings Sibling node array
 * @returns CompletionItem object array
 */
function getFilePathCompletionItems(relativeFiles: string[], siblings: string[]): CompletionItem[] {
  const items: CompletionItem[] = [];
  if (relativeFiles.length > 0) {
    for (const file of relativeFiles) {
      if (siblings.includes(file)) {
        continue;
      }

      const item: CompletionItem = {
        label: file,
        kind: CompletionItemKind.File,
      };
      items.push(item);
    }
  }
  return items;
}

/**
 * Get the common CompletionItem object
 * @param labelName The value of the label attribute of the CompletionItem object
 * @param sourceType Input quote type
 * @param source Entered text
 * @param description The value of the documentation attribute of the CompletionItem object
 * @param tspConfigPosition Input location object, see {@link Position}
 * @returns CompletionItem object
 */
function getCommonCompetionItem(
  labelName: string,
  sourceType: string,
  source: string,
  description: string,
  tspConfigPosition: Position,
): CompletionItem {
  // Generate new text
  const newText = getCompletionItemInsertedValue(sourceType, labelName);

  return {
    label: labelName,
    kind: CompletionItemKind.Field,
    documentation: description,
    textEdit: getNewTextAndPosition(newText, source, tspConfigPosition),
  };
}

/**
 * Get the CompletionItem array of custom variables
 * @param yamlDocNodes The contents of the YAML configuration file
 * @returns  CompletionItem array of custom variables
 */
function getParametersCompletionItems(yamlDocNodes: YamlVisitScalarNode): CompletionItem[] {
  const { path: yamlNode } = yamlDocNodes;
  const configParams: string[] = [];
  for (let i = 0; i < yamlNode.length; i++) {
    const seg = yamlNode[i];
    if (isMap(seg)) {
      seg.items
        .filter((item) => (<any>item.key).source === "parameters")
        .map((item) => {
          if (item.value !== null && isMap(item.value)) {
            item.value.items.forEach((i) => {
              if (isPair(i) && (item.key as any).source === "parameters") {
                configParams.push((i.key as any).source ?? "");
              }
            });
          }
        });
      break;
    }
  }
  const result: CompletionItem[] = [];
  configParams.map((param) => {
    result.push({
      label: param,
      kind: CompletionItemKind.Value,
      documentation: "Custom paramters variables",
    });
  });
  return result;
}

/**
 * Get the CompletionItem array of custom environment variables
 * @param yamlDocNodes The contents of the YAML configuration file
 * @returns  CompletionItem array of custom environment variables
 */
function getEnvsCompletionItem(yamlDocNodes: YamlVisitScalarNode): CompletionItem[] {
  const { path: yamlNode } = yamlDocNodes;
  const configEnvs: string[] = [];
  for (let i = 0; i < yamlNode.length; i++) {
    const seg = yamlNode[i];
    if (isMap(seg)) {
      seg.items
        .filter((item) => (<any>item.key).source === "environment-variables")
        .map((item) => {
          if (item.value !== null && isMap(item.value)) {
            item.value.items.forEach((i) => {
              if (isPair(i) && (item.key as any).source === "environment-variables") {
                configEnvs.push((i.key as any).source ?? "");
              }
            });
          }
        });
      break;
    }
  }

  const result: CompletionItem[] = [];
  configEnvs.map((envLabel) => {
    result.push({
      label: envLabel,
      kind: CompletionItemKind.Value,
      documentation: "Custom environment variables",
    });
  });
  return result;
}
