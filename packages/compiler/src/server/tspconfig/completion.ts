import * as fs from "fs/promises";
import * as sysPath from "path";
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
import { getDirectoryPath, joinPaths } from "../../core/path-utils.js";
import {
  DiagnosticMessages,
  JSONSchemaType,
  LinterRuleDefinition,
  ServerLog,
} from "../../index.js";
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
  const content = tspConfigDoc.getText();
  const lines = content.split("\n");
  const targetLine = lines[tspConfigPosition.line];
  const variableInterpolationItems = resolveVariableInterpolationCompleteItems(
    target,
    tspConfigPosition,
    targetLine,
  );
  if (variableInterpolationItems.length > 0) {
    return variableInterpolationItems;
  }

  const pos = tspConfigDoc.offsetAt(tspConfigPosition);
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
          const item = createContainingQuatedValCompetionItem(
            name,
            sourceType,
            source,
            (await pkg.getPackageJsonData())?.description ?? `Emitter from ${name}`,
            tspConfigPosition,
            target.nodePostionRange,
            pos,
          );
          if (item !== undefined) {
            items.push(item);
          }
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
                const item = createContainingQuatedValCompetionItem(
                  labelName,
                  sourceType,
                  source,
                  (await pkg.getPackageJsonData())?.description ?? `Linters from ${labelName}`,
                  tspConfigPosition,
                  target.nodePostionRange,
                  pos,
                );
                if (item !== undefined) {
                  items.push(item);
                }
              }
            }
            continue;
          }

          // If there is no corresponding ruleSet in the library, add the library name directly.
          if (!siblings.includes(name)) {
            const item = createContainingQuatedValCompetionItem(
              name,
              sourceType,
              source,
              (await pkg.getPackageJsonData())?.description ?? `Linters from ${name}`,
              tspConfigPosition,
              target.nodePostionRange,
              pos,
            );
            if (item !== undefined) {
              items.push(item);
            }
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
              const item = createContainingQuatedValCompetionItem(
                labelName,
                sourceType,
                source,
                rule.description,
                tspConfigPosition,
                target.nodePostionRange,
                pos,
              );
              if (item !== undefined) {
                items.push(item);
              }
            }
          }
        }
      } else {
        log({
          level: "warning",
          message: "Unknown linter keyword",
        });
      }
      return items;
    } else if (nodePath.length === CONFIG_PATH_LENGTH_FOR_EXTENDS && nodePath[0] === "extends") {
      const currentFolder = getDirectoryPath(tspConfigFile);
      const newFolderPath = joinPaths(currentFolder, source);

      const relativeFiles = await findFilesOrDirsWithSameExtension(
        newFolderPath,
        ".yaml",
        sysPath.resolve(tspConfigFile),
      );
      return getFilePathCompletionItems(relativeFiles, siblings);
    } else if (nodePath.length >= CONFIG_PATH_LENGTH_FOR_IMPORTS && nodePath[0] === "imports") {
      const currentFolder = getDirectoryPath(tspConfigFile);
      const newFolderPath = joinPaths(currentFolder, source);

      const relativeFiles = await findFilesOrDirsWithSameExtension(newFolderPath, ".tsp");
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
 * Get the full completion item value and edit position
 * @param newText  the new text
 * @param source source text
 * @param nodePosRange current node position range, [startPos, endPos, nodeEndPos]
 * @param curPos current cursor position
 * @param tspConfigPosition original position, see {@link Position}
 * @returns TextEdit object or undefined
 */
function getFullCompletionItemValAndEditPosition(
  newText: string,
  source: string,
  nodePosRange: number[],
  curPos: number,
  tspConfigPosition: Position,
): TextEdit | undefined {
  const [startPos, endPos] = nodePosRange;

  if (curPos >= startPos && curPos <= endPos) {
    return TextEdit.replace(
      Range.create(
        Position.create(tspConfigPosition.line, tspConfigPosition.character - source.length),
        Position.create(tspConfigPosition.line, tspConfigPosition.character + (endPos - curPos)),
      ),
      newText,
    );
  }
  return undefined;
}

/**
 * Get the common CompletionItem object, which value is included in quotes
 * @param labelName The value of the label attribute of the CompletionItem object
 * @param sourceType Input quote type
 * @param source Entered text
 * @param description The value of the documentation attribute of the CompletionItem object
 * @param tspConfigPosition Input location object, see {@link Position}
 * @param nodePosRange current node position range, [startPos, endPos, nodeEndPos]
 * @param curPos current cursor position
 * @returns CompletionItem object or undefined
 */
function createContainingQuatedValCompetionItem(
  labelName: string,
  sourceType: string,
  source: string,
  description: string,
  tspConfigPosition: Position,
  nodePosRange: number[],
  curPos: number,
): CompletionItem | undefined {
  // Generate new text
  const newText = getCompletionItemInsertedValue(sourceType, labelName);
  const textEdit = getFullCompletionItemValAndEditPosition(
    newText,
    source,
    nodePosRange,
    curPos,
    tspConfigPosition,
  );
  if (textEdit !== undefined) {
    return {
      label: labelName,
      kind: CompletionItemKind.Field,
      documentation: description,
      textEdit: textEdit,
    };
  }
  return undefined;
}

/**
 * Find a set of dirs/files with the same suffix
 * @param rootPath The absolute input path or relative path of the current configuration file
 * @param fileExtension  File extension, such as ".yaml" or ".tsp"
 * @param configFile absolute path of the current configuration file
 * @returns dir/file array
 */
async function findFilesOrDirsWithSameExtension(
  rootPath: string,
  fileExtension: string,
  configFile: string = "",
): Promise<string[]> {
  const exclude = ["node_modules", "tsp-output", ".vs", ".vscode"];

  const files: string[] = [];
  try {
    // When reading the content under the path, an error may be reported if the path is incorrect.
    // Exclude the current configuration file, compare in absolute paths
    (await fs.readdir(rootPath, { withFileTypes: true }))
      .filter(
        (d) =>
          (d.isDirectory() || (d.isFile() && d.name.endsWith(fileExtension))) &&
          !exclude.includes(d.name) &&
          sysPath.resolve(d.name) !== configFile,
      )
      .map((d) => {
        files.push(d.name);
      });
  } catch {
    return files;
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
      if (!siblings.includes(file)) {
        const item: CompletionItem = {
          label: file,
          kind: CompletionItemKind.File,
        };
        items.push(item);
      }
    }
  }
  return items;
}

/**
 * resolve variable interpolation completion items
 * @param target YamlScalarTarget object, contains the information of the target node
 * @param tspConfigPosition current cursor position in the configuration file
 * @param targetLine current line content of the target node
 * @returns variable interpolation completion items
 */
function resolveVariableInterpolationCompleteItems(
  target: YamlScalarTarget,
  tspConfigPosition: Position,
  targetLine: string,
): CompletionItem[] {
  const yamlDocNodes = target.yamlDoc;

  if (target.sourceType === "QUOTE_DOUBLE" || target.sourceType === "QUOTE_SINGLE") {
    const targetPos = targetLine.lastIndexOf("{");
    const curText = targetLine.substring(targetPos, tspConfigPosition.character);

    if (/{[^}]*env\.[^}]*$/.test(curText)) {
      // environment-variables
      return getCompletionItemsByFilter(
        yamlDocNodes,
        "environment-variables",
        "Custom environment variables",
      );
    } else if (/{[^}]*$/.test(curText)) {
      // parameters and built-in variables
      const result = [
        ...getCompletionItemsByFilter(yamlDocNodes, "parameters", "Custom paramters variables"),
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
      if (target.path.length > 2 && target.path[0] === "options") {
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
  }

  return [];
}

/**
 * Get the corresponding CompletionItem array based on the filter name
 * @param yamlDoc The contents of the YAML configuration file
 * @param filterName The filter name，such as "parameters" or "environment-variables"
 * @param description The description of the CompletionItem object
 * @returns  CompletionItem object array
 */
function getCompletionItemsByFilter(
  yamlDoc: Document<Node, true>,
  filterName: string,
  description: string,
): CompletionItem[] {
  const result: CompletionItem[] = [];
  if (isMap(yamlDoc.contents)) {
    yamlDoc.contents.items
      .filter((item) => (<any>item.key).source === filterName)
      .map((item) => {
        if (item.value !== null && isMap(item.value)) {
          item.value.items.forEach((i) => {
            if (isPair(i)) {
              result.push({
                label: (i.key as any).source ?? "",
                kind: CompletionItemKind.Value,
                documentation: description,
              });
            }
          });
        }
      });
  }

  return result;
}
