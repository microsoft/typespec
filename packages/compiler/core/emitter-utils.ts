import { Program } from "./program.js";

export type NewLine = "lf" | "crlf";
export interface EmitFileOptions {
  path: string;
  content: string;
  newLine?: NewLine;
}

/**
 * Helper to emit a file.
 * @param program Cadl Program
 * @param options File Emitter options
 */
export async function emitFile(program: Program, options: EmitFileOptions): Promise<void> {
  const content =
    options.newLine && options.newLine === "crlf"
      ? options.content.replace(/(\r\n|\n|\r)/gm, "\r\n")
      : options.content;
  return await program.host.writeFile(options.path, content);
}
