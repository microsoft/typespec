import { getSourceLocation } from "../../diagnostics.js";
import type { Program } from "../../program.js";
import type { Diagnostic, DiagnosticSeverity, DiagnosticTarget } from "../../types.js";
import { NoTarget } from "../../types.js";

/**
 * A {@link Diagnostic} flattened into a structured-clone-safe shape so it can be
 * transferred from a sandboxed emitter child back to the parent process.
 *
 * Live `Type`/`Node` targets cannot cross the process boundary, so the source
 * location is reduced to `{ file, pos, end }`. The parent re-targets it against
 * its own (identical) source files via {@link deserializeDiagnostic}, preserving
 * full-fidelity location reporting without serializing the type graph.
 */
export interface SerializedDiagnostic {
  readonly code: string;
  readonly severity: DiagnosticSeverity;
  readonly message: string;
  readonly url?: string;
  readonly location?: {
    readonly file: string;
    readonly pos: number;
    readonly end: number;
  };
}

/** The value a sandboxed emit job resolves with. */
export interface SandboxEmitResult {
  readonly diagnostics: readonly SerializedDiagnostic[];
  readonly emittedFiles: readonly string[];
}

/** Flatten a diagnostic into a transferable shape, resolving its source location. */
export function serializeDiagnostic(diagnostic: Diagnostic): SerializedDiagnostic {
  const location = getSourceLocation(diagnostic.target, { locateId: true });
  return {
    code: diagnostic.code,
    severity: diagnostic.severity,
    message: diagnostic.message,
    url: diagnostic.url,
    location:
      location && !location.isSynthetic
        ? { file: location.file.path, pos: location.pos, end: location.end }
        : undefined,
  };
}

/**
 * Reconstruct a {@link Diagnostic} from its serialized form, re-targeting the
 * source location against `program`'s source files so the parent can report it
 * with the correct file/line/column. Falls back to {@link NoTarget} when the
 * file is not part of the parent program.
 */
export function deserializeDiagnostic(
  serialized: SerializedDiagnostic,
  program: Program,
): Diagnostic {
  let target: DiagnosticTarget | typeof NoTarget = NoTarget;
  if (serialized.location) {
    const file =
      program.sourceFiles.get(serialized.location.file)?.file ??
      program.jsSourceFiles.get(serialized.location.file)?.file;
    if (file) {
      target = { file, pos: serialized.location.pos, end: serialized.location.end };
    }
  }
  return {
    code: serialized.code,
    severity: serialized.severity,
    message: serialized.message,
    url: serialized.url,
    target,
  };
}
