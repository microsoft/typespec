import { getDirectoryPath } from "./path-utils.js";
import type { Program } from "./program.js";

export type NewLine = "lf" | "crlf";
export interface EmitFileOptions {
  path: string;
  content: string;
  newLine?: NewLine;
}

const emittedFilesPaths: string[] = [];
export function flushEmittedFilesPaths(): string[] {
  return emittedFilesPaths.splice(0, emittedFilesPaths.length);
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

  emittedFilesPaths.push(options.path);

  return await program.host.writeFile(options.path, content);
}
