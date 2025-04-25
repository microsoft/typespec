import { Position, Range, TextEdit } from "vscode-languageserver";
import { getSourceLocation } from "../core/diagnostics.js";
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
