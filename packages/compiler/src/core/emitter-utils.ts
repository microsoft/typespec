import { getDirectoryPath } from "./path-utils.js";
import type { Program } from "./program.js";

/** Requested line-ending style for emitted text; `"crlf"` enables line-break conversion. */
export type NewLine = "lf" | "crlf";
/** Destination and text passed to {@link emitFile}. */
export interface EmitFileOptions {
  /** Output file path; the parent directory is created before writing. */
  path: string;
  /** Text to write through the program's compiler host. */
  content: string;
  /** Convert line breaks to CRLF for `"crlf"`; omitted or `"lf"` leaves the content unchanged. */
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
