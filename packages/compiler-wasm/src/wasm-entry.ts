import type { CompilerOptions, Diagnostic } from "@typespec/compiler";
import { compile } from "../../compiler/dist/src/core/program.js";
import { createVirtualFsHost, VirtualFile } from "./virtual-fs-host.js";

// WIT types mapping
export interface SourceFile {
  path: string;
  contents: string;
}

export interface CompileOptions {
  emitters: string[];
  outputDir: string;
  arguments: Array<[string, string]>;
}

export enum Severity {
  Error = "error",
  Warning = "warning",
  Info = "info",
}

export interface DiagnosticOutput {
  code: string;
  message: string;
  severity: Severity;
  file: string;
  start: number;
  end: number;
}

export interface EmittedFile {
  path: string;
  contents: string;
}

export interface CompileResult {
  success: boolean;
  diagnostics: DiagnosticOutput[];
  emitted: EmittedFile[];
}

/**
 * Compile TypeSpec from in-memory source files.
 */
export async function compileVirtual(
  files: SourceFile[],
  entry: string,
  options: CompileOptions,
): Promise<CompileResult> {
  try {
    const virtualFiles: VirtualFile[] = files.map((f) => ({
      path: f.path,
      contents: f.contents,
    }));

    const host = createVirtualFsHost(virtualFiles, []);

    const compilerOptions: CompilerOptions = {
      outputDir: options.outputDir,
      emit: options.emitters,
      options: {},
    };

    for (const [key, value] of options.arguments) {
      if (key.startsWith("emitter-option-")) {
        const parts = key.substring("emitter-option-".length).split(".");
        const emitterName = parts[0];
        compilerOptions.options ??= {};
        compilerOptions.options[emitterName] ??= {};
        if (parts.length > 1) {
          compilerOptions.options[emitterName][parts[1]] = value;
        }
      } else {
        (compilerOptions as any)[key] = value;
      }
    }

    const program = await compile(host as any, entry, compilerOptions as any);

    return {
      success: !program.hasError(),
      diagnostics: convertDiagnostics(program.diagnostics),
      emitted: [],
    };
  } catch (error) {
    return {
      success: false,
      diagnostics: [
        {
          code: "internal-compiler-error",
          message: error instanceof Error ? error.message : String(error),
          severity: Severity.Error,
          file: entry,
          start: 0,
          end: 0,
        },
      ],
      emitted: [],
    };
  }
}

/**
 * Compile TypeSpec from a filesystem root.
 */
export async function compileRoot(
  rootPath: string,
  entry: string,
  options: CompileOptions,
): Promise<CompileResult> {
  void rootPath;
  void options;

  return {
    success: false,
    diagnostics: [
      {
        code: "not-implemented",
        message: "compile-root not yet implemented - requires WASI host",
        severity: Severity.Error,
        file: entry,
        start: 0,
        end: 0,
      },
    ],
    emitted: [],
  };
}

function convertDiagnostics(diagnostics: readonly Diagnostic[]): DiagnosticOutput[] {
  return diagnostics.map((d) => {
    let file = "";
    let start = 0;
    let end = 0;

    if (d.target && typeof d.target === "object" && "file" in d.target) {
      const target = d.target as any;
      file = target.file?.path ?? "";
      start = target.pos ?? 0;
      end = target.end ?? 0;
    }

    return {
      code: String(d.code),
      message: d.message,
      severity: d.severity === "error" ? Severity.Error : Severity.Warning,
      file,
      start,
      end,
    };
  });
}

// Export for WIT component - these will be the exported functions
export const exports = {
  compileVirtual,
  compileRoot,
};
