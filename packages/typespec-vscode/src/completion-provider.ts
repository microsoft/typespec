import * as fs from "fs";
import * as path from "path";
import vscode from "vscode";

export function createExtendsCompletionItemProvider() {
  return vscode.languages.registerCompletionItemProvider(
    "yaml",
    {
      provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
        // get all text until the `position` and check if it reads `extends:.`
        // and if so then complete if `log`, `warn`, and `error`
        const linePrefix = document.lineAt(position).text.slice(0, position.character);
        const result: vscode.CompletionItem[] = [];

        if (linePrefix.includes("extends:")) {
          const curActiveFile = vscode.window.activeTextEditor?.document.fileName;
          if (!curActiveFile) {
            return result;
          }

          if (vscode.workspace.workspaceFolders) {
            const pos = curActiveFile.lastIndexOf("\\");
            const fileName = curActiveFile.slice(pos + 1, curActiveFile.length);
            const yamlFiles = findFilesWithSameExtension(
              vscode.workspace.workspaceFolders[0].uri.fsPath,
              fileName,
            );

            yamlFiles.forEach((file) => {
              result.push({
                label: file,
                kind: vscode.CompletionItemKind.Value,
              });
            });
          }
        }
        return result;
      },
    },
    ":",
  );
}

function findFilesWithSameExtension(rootPath: string, fileName: string): string[] {
  const fileExtension = path.extname(fileName);
  const result: string[] = [];
  const exclude = [".vs", ".vscode", "tsp-output", "node_modules", ".gitignore", "main.tsp"];

  function searchDirectory(currentDir: string) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      if (exclude.includes(file)) {
        continue;
      }

      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        searchDirectory(fullPath);
      } else if (file !== fileName && path.extname(file) === fileExtension) {
        const newRelativePath = path.relative(rootPath, fullPath);
        result.push(" ./" + newRelativePath.replace("\\", "/"));
      }
    }
  }

  searchDirectory(rootPath);
  return result;
}
