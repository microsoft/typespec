import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CompletionItem,
  CompletionItemKind,
  Position,
  Range,
  TextEdit,
} from "vscode-languageserver/node.js";
import { Document, isMap, isPair, Node } from "yaml";
import { emitterOptionsSchema, TypeSpecConfigJsonSchema } from "../../config/config-schema.js";
import {
  getDirectoryPath,
  getNormalizedAbsolutePath,
  joinPaths,
  normalizeSlashes,
} from "../../core/path-utils.js";
import {
  CompilerHost,
  DiagnosticMessages,
  JSONSchemaType,
  LinterRuleDefinition,
  ServerLog,
} from "../../index.js";
import { distinctArray } from "../../utils/misc.js";
import { FileService } from "../file-service.js";
import { LibraryProvider } from "../lib-provider.js";
import { resolveYamlPositionDetail, YamlPositionDetail } from "../yaml-resolver.js";

type ObjectJSONSchemaType = JSONSchemaType<object>;

export async function provideTspconfigCompletionItems(
  tspConfigDoc: TextDocument,
  tspConfigPosition: Position,
  context: {
    fileService: FileService;
    compilerHost: CompilerHost;
    emitterProvider: LibraryProvider;
    linterProvider: LibraryProvider;
    log: (log: ServerLog) => void;
  },
): Promise<CompletionItem[]> {
  const { fileService, compilerHost, emitterProvider, linterProvider, log } = context;
  const target = resolveYamlPositionDetail(tspConfigDoc, tspConfigPosition, log);
  if (target === undefined) {
    return [];
  }

  // Variable interpolation
  if (target.sourceRange) {
    const variableInterpolationItems = resolveVariableInterpolationCompleteItems(
      target.yamlDoc,
      target.path,
      tspConfigDoc.getText().slice(target.sourceRange.pos, target.cursorPosition),
    );
    if (variableInterpolationItems.length > 0) {
      return variableInterpolationItems;
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
    target: YamlPositionDetail,
    tspConfigPosition: Position,
    log: (log: ServerLog) => void,
  ): Promise<CompletionItem[]> {
    const { path: nodePath, type: targetType, siblings, source } = target;
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
          const item = createCompletionItemWithQuote(
            name,
            (await pkg.getPackageJsonData())?.description ?? `Emitter from ${name}`,
            tspConfigPosition,
            target,
          );
          items.push(item);
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
              if (!siblings.includes(labelName)) {
                const item = createCompletionItemWithQuote(
                  labelName,
                  (await pkg.getPackageJsonData())?.description ?? `Linters from ${labelName}`,
                  tspConfigPosition,
                  target,
                );
                items.push(item);
              }
            }
          }

          // Add the library name directly.
          if (!siblings.includes(name)) {
            const item = createCompletionItemWithQuote(
              name,
              (await pkg.getPackageJsonData())?.description ?? `Linters from ${name}`,
              tspConfigPosition,
              target,
            );
            items.push(item);
          }
        }
      } else if (extendKeyWord === "enable" || extendKeyWord === "disable") {
        // enable/disable rules
        for (const [name, pkg] of Object.entries(linters)) {
          const exports = await pkg.getModuleExports();

          if (exports?.$linter?.rules !== undefined) {
            for (const [, rule] of Object.entries<LinterRuleDefinition<string, DiagnosticMessages>>(
              exports?.$linter?.rules,
            )) {
              const labelName = `${name}/${rule.name}`;
              const item = createCompletionItemWithQuote(
                labelName,
                rule.description,
                tspConfigPosition,
                target,
              );
              items.push(item);
            }
          }
        }
      } else {
        log({
          level: "warning",
          message: "Unknown linter keyword, it should be 'extends', 'enable' or 'disable'",
        });
      }
      return items;
    } else if (nodePath.length === CONFIG_PATH_LENGTH_FOR_EXTENDS && nodePath[0] === "extends") {
      const currentFolder = getDirectoryPath(tspConfigFile);
      const newFolderPath = joinPaths(currentFolder, source);

      // Exclude the current yaml configuration file
      const relativeFiles = await findFilesOrDirsWithSameExtension(
        compilerHost,
        newFolderPath,
        ".yaml",
        [normalizeSlashes(tspConfigFile)],
      );
      return getFilePathCompletionItems(relativeFiles, siblings, source);
    } else if (nodePath.length >= CONFIG_PATH_LENGTH_FOR_IMPORTS && nodePath[0] === "imports") {
      const currentFolder = getDirectoryPath(tspConfigFile);
      const newFolderPath = joinPaths(currentFolder, source);

      // Exclude main.tsp files that are the same as the current yaml configuration directory
      const relativeFiles = await findFilesOrDirsWithSameExtension(
        compilerHost,
        newFolderPath,
        ".tsp",
        [joinPaths(currentFolder, "main.tsp")],
      );
      return getFilePathCompletionItems(relativeFiles, siblings, source);
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
    target: YamlPositionDetail,
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
 * Create the common CompletionItem object, which value is included in quotes
 * @param labelName The value of the label attribute of the CompletionItem object
 * @param description The value of the documentation attribute of the CompletionItem object
 * @param tspConfigPosition Input current line location object, see {@link Position}
 * @param target The target object of the current configuration file, see {@link YamlPositionDetail}
 * @returns CompletionItem object
 */
function createCompletionItemWithQuote(
  labelName: string,
  description: string,
  tspConfigPosition: Position,
  target: YamlPositionDetail,
): CompletionItem {
  if (
    target.sourceRange &&
    target.cursorPosition >= target.sourceRange.pos &&
    target.cursorPosition <= target.sourceRange.end
  ) {
    // If it is a quoted string, the relative position needs to be reduced by 1
    const lenRelativeToStartPos =
      target.sourceType === "QUOTE_SINGLE" || target.sourceType === "QUOTE_DOUBLE"
        ? target.cursorPosition - target.sourceRange.pos - 1
        : target.cursorPosition - target.sourceRange.pos;
    return {
      label: labelName,
      kind: CompletionItemKind.Field,
      documentation: description,
      textEdit: TextEdit.replace(
        Range.create(
          Position.create(
            tspConfigPosition.line,
            tspConfigPosition.character - lenRelativeToStartPos,
          ),
          Position.create(tspConfigPosition.line, tspConfigPosition.character),
        ),
        target.sourceType === "QUOTE_SINGLE" || target.sourceType === "QUOTE_DOUBLE"
          ? labelName
          : `"${labelName}"`,
      ),
    };
  }

  return {
    label: labelName,
    kind: CompletionItemKind.Field,
    documentation: description,
    insertText: `"${labelName}"`,
  };
}

/**
 * Find a set of dirs/files with the same suffix
 * @param compilerHost CompilerHost object for file operations, see {@link CompilerHost}
 * @param rootPath The absolute input path or relative path of the current configuration file
 * @param fileExtension  File extension
 * @param excludeFiles exclude files array, default is []
 * @returns dirs/files array
 */
async function findFilesOrDirsWithSameExtension(
  compilerHost: CompilerHost,
  rootPath: string,
  fileExtension: ".yaml" | ".tsp",
  excludeFiles: string[] = [],
): Promise<string[]> {
  const exclude = ["node_modules", "tsp-output", ".vs", ".vscode"];

  const files: string[] = [];
  try {
    // When reading the content under the path, an error may be reported if the path is incorrect.
    const dirs = await compilerHost.readDir(rootPath);
    for (const d of dirs) {
      if (!exclude.includes(d) && !excludeFiles.includes(getNormalizedAbsolutePath(d, rootPath))) {
        try {
          const stat = await compilerHost.stat(joinPaths(rootPath, d));
          if (stat.isDirectory() || (stat.isFile() && d.endsWith(fileExtension))) {
            files.push(d);
          }
        } catch {
          // If the path is incorrect, the error is ignored
          continue;
        }
      }
    }
  } catch {
    return files;
  }
  return files;
}

/**
 * Get the CompletionItem object array of the relative path of the file
 * @param relativeFiles File relative path array
 * @param siblings Sibling node array
 * @param source The input source of the current node
 * @returns CompletionItem object array
 */
function getFilePathCompletionItems(
  relativeFiles: string[],
  siblings: string[],
  source: string,
): CompletionItem[] {
  return relativeFiles
    .filter((file) => !siblings.includes(joinPaths(source, file)))
    .map((file) => {
      return {
        label: file,
        kind: CompletionItemKind.File,
      };
    });
}

/**
 * resolve variable interpolation completion items
 * @param yamlDocNodes tsp config yaml document nodes , see {@link Document<Node, true>}
 * @param path current path of the target node, such as ["linter", "extends","- ┆"]
 * @param curText current editing text, from startPos to curPos
 * @returns variable interpolation completion items
 */
function resolveVariableInterpolationCompleteItems(
  yamlDocNodes: Document<Node, true>,
  path: string[],
  curText: string,
): CompletionItem[] {
  if (/{\s*env\.[^}]*$/.test(curText)) {
    // environment-variables
    return getVariableCompletionItem(
      yamlDocNodes,
      "environment-variables",
      "Custom environment variables",
    );
  } else if (/{[^}]*$/.test(curText)) {
    // parameters and built-in variables
    const result = [
      ...getVariableCompletionItem(yamlDocNodes, "parameters", "Custom paramters variables"),
      ...["cwd", "project-root"].map((value) => {
        const item: CompletionItem = {
          label: value,
          kind: CompletionItemKind.Value,
          documentation: "Built-in variables",
        };
        return item;
      }),
    ];

    // if the current path is options, add output-dir and emitter-name
    const CONFIG_PATH_LENGTH_FOR_OPTIONS = 2;
    if (path.length > CONFIG_PATH_LENGTH_FOR_OPTIONS && path[0] === "options") {
      result.push(
        ...["output-dir", "emitter-name"].map((value) => {
          const item: CompletionItem = {
            label: value,
            kind: CompletionItemKind.Value,
            documentation: "Built-in variables",
          };
          return item;
        }),
      );
    }
    return result;
  }

  return [];
}

/**
 * Get the corresponding CompletionItem array based on the filter name
 * @param yamlDoc The contents of the YAML configuration file
 * @param filterName The filter name
 * @param description The description of the CompletionItem object
 * @returns  CompletionItem object array
 */
function getVariableCompletionItem(
  yamlDoc: Document<Node, true>,
  filterName: "parameters" | "environment-variables",
  description: string,
): CompletionItem[] {
  const result: CompletionItem[] = [];
  if (isMap(yamlDoc.contents)) {
    const yamlMap = yamlDoc.contents.items.find((item) => (<any>item.key).source === filterName);
    if (yamlMap && yamlMap.value !== null && isMap(yamlMap.value)) {
      yamlMap.value.items.forEach((i) => {
        if (isPair(i)) {
          result.push({
            label: (i.key as any).source ?? "",
            kind: CompletionItemKind.Value,
            documentation: description,
          });
        }
      });
    }
  }

  return result;
}
