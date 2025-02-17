import { addChildLog } from "./helpers/progress-logger.js";
import { getDirectoryPath, getRelativePathFromDirectory } from "./path-utils.js";
import type { Program } from "./program.js";

export type NewLine = "lf" | "crlf";
export interface EmitFileOptions {
  path: string;
  content: string;
  newLine?: NewLine;
}

/**
 * Helper to emit a file.
 * @param program TypeSpec Program
 * @param options File Emitter options
 */
export async function emitFile(program: Program, options: EmitFileOptions): Promise<void> {
  // ensure path exists
  const outputFolder = getDirectoryPath(options.path);
  await program.host.mkdirp(outputFolder);
  const content =
    options.newLine && options.newLine === "crlf"
      ? options.content.replace(/(\r\n|\n|\r)/gm, "\r\n")
      : options.content;

  if (program.compilerOptions.listOutputs) {
    addChildLog(getRelativePathFromDirectory(outputFolder, options.path, true));
  }
  return await program.host.writeFile(options.path, content);
}
