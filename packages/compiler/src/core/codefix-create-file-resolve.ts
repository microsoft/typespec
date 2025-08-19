import { NodeSystemHost } from "./node-system-host.js";
import { joinPaths } from "./path-utils.js";
import { createSourceFile } from "./source-file.js";
import { CodeFixEdit, CodeFixFileCreationOptions } from "./types.js";

export async function resolveCodeFixCreateFile(
  fileOptions: CodeFixFileCreationOptions,
  newText: string,
): Promise<CodeFixEdit> {
  const { targetFilePath, templateContent, projectRoot } = fileOptions;

  const fullFilePath = joinPaths(projectRoot, targetFilePath);
  const existingFile = await NodeSystemHost.readFile(fullFilePath);

  if (existingFile) {
    const insertPosition = existingFile.text.length;
    return {
      kind: "insert-text",
      text: newText,
      pos: insertPosition,
      file: existingFile,
    };
  } else {
    const newFileContent = templateContent ?? "";
    const sourceFile = createSourceFile(newFileContent, fullFilePath);

    return {
      kind: "insert-text",
      text: newFileContent,
      pos: 0,
      file: sourceFile,
    };
  }
}
