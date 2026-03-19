import { getDirectoryPath } from "./path-utils.js";
import type { Program } from "./program.js";

export type NewLine = "lf" | "crlf";
export interface EmitFileOptions {
  path: string;
  content: string;
  newLine?: NewLine;
}

const emittedFilesPerProgramKey = Symbol.for("TYPESPEC_EMITTED_FILES_PATHS");
if ((globalThis as any)[emittedFilesPerProgramKey] === undefined) {
  (globalThis as any)[emittedFilesPerProgramKey] = new WeakMap<Program, string[]>();
}

export function getEmittedFilesForProgram(program: Program): string[] {
  const existing = (globalThis as any)[emittedFilesPerProgramKey].get(program);
  if (existing) return existing;
  const val: string[] = [];
  (globalThis as any)[emittedFilesPerProgramKey].set(program, val);
  return val;
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
  getEmittedFilesForProgram(program).push(options.path);

  return await program.host.writeFile(options.path, content);
}
