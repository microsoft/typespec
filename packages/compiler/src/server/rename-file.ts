import { Position, Range, TextEdit } from "vscode-languageserver";
import { getSourceLocation } from "../core/diagnostics.js";
import { getDirectoryPath, getRelativePathFromDirectory, resolvePath } from "../core/path-utils.js";
import { ImportStatementNode } from "../core/types.js";

/**
 * Get the LSP TextEdit to update an import statment value.
 * @param node Import statement node that should be updated
 * @param newImport New import path
 * @returns Lsp TextEdit
 */
export function getRenameImportEdit(node: ImportStatementNode, newImport: string): TextEdit {
  const location = getSourceLocation(node);
  const lineAndChar = location.file.getLineAndCharacterOfPosition(node.path.pos);
  return TextEdit.replace(
    Range.create(
      Position.create(lineAndChar.line, lineAndChar.character + 1),
      Position.create(lineAndChar.line, lineAndChar.character + node.path.value.length + 1),
    ),
    newImport,
  );
}

export interface RenameFileParams {
  oldPath: string;
  newPath: string;
  isDirRename: boolean;
}

export interface ReplaceImportResult {
  newValue: string;
  filePath: string;
}

/**
 * Get the updated import value for a given rename operation.
 * If the rename operation is not applicable, it returns undefined.
 * @param target Import statement node that should be checked
 * @param params Current rename operation parameters
 * @returns Updated import value or undefined
 */
export function getUpdatedImportValue(
  target: ImportStatementNode,
  params: RenameFileParams,
): ReplaceImportResult | undefined {
  const filePath = getSourceLocation(target).file.path;
  const fileDir = getDirectoryPath(filePath);
  const importTarget = resolvePath(fileDir, target.path.value);
  const oldPath = params.oldPath;
  if (importTarget === oldPath || importTarget.startsWith(oldPath)) {
    let newPath = params.newPath;
    if (params.isDirRename) {
      const relativeToOldPath = getRelativePathFromDirectory(oldPath, importTarget, false);
      newPath = resolvePath(newPath, relativeToOldPath);
    }

    const replaceText = getRelativePathFromDirectory(fileDir, newPath, false);
    return {
      newValue: replaceText.startsWith(".") ? replaceText : `./${replaceText}`,
      filePath,
    };
  }
  return undefined;
}
