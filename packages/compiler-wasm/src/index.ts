import { compile, CompilerOptions, Diagnostic } from "@typespec/compiler";
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
 * Compile TypeSpec from in-memory source files
 */
export async function compileVirtual(
  files: SourceFile[],
  entry: string,
  options: CompileOptions,
): Promise<CompileResult> {
  try {
    // Convert to virtual files
    const virtualFiles: VirtualFile[] = files.map((f) => ({
      path: f.path,
      contents: f.contents,
    }));

    // Create virtual filesystem host
    // Note: In real implementation, we'd need to include stdlib files
    const host = createVirtualFsHost(virtualFiles, []);

    // Prepare compiler options
    const compilerOptions: CompilerOptions = {
      outputDir: options.outputDir,
      emit: options.emitters,
      options: {},
    };

    // Parse emitter-specific options from arguments
    for (const [key, value] of options.arguments) {
      if (key.startsWith("emitter-option-")) {
        const parts = key.substring("emitter-option-".length).split(".");
        const emitterName = parts[0];
        if (!compilerOptions.options![emitterName]) {
          compilerOptions.options![emitterName] = {};
        }
        // Simple key=value parsing - in real impl would need more sophistication
        if (parts.length > 1) {
          compilerOptions.options![emitterName][parts[1]] = value;
        }
      } else {
        // Set global compiler option
        (compilerOptions as any)[key] = value;
      }
    }

    // Run compilation
    const program = await compile(host, entry, compilerOptions);

    // Collect diagnostics
    const diagnostics = convertDiagnostics(program.diagnostics);

    // Collect emitted files from the virtual filesystem
    // In a real implementation, we'd track writes to the host
    const emittedFiles: EmittedFile[] = [];

    const success = !program.hasError();

    return {
      success,
      diagnostics,
      emitted: emittedFiles,
    };
  } catch (error) {
    // Internal errors should be reported as diagnostics, not thrown
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
 * Compile TypeSpec from a filesystem root
 * This would use WASI filesystem access
 */
export async function compileRoot(
  rootPath: string,
  entry: string,
  options: CompileOptions,
): Promise<CompileResult> {
  // This would require a WASI-backed host implementation
  // For now, return an error
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

/**
 * Convert TypeSpec diagnostics to WIT diagnostic format
 */
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
