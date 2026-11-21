import type { CompilationState, CompileResult } from "../types.js";

/**
 * Character budget for a multi-file output snapshot.
 * A single emitted file is always retained so the one-file fallback stays intact.
 * Further files are kept, in output order, while they fit entirely in the budget.
 */
export const MULTI_FILE_OUTPUT_SNAPSHOT_CHAR_BUDGET = 32 * 1024 * 1024;

/** File list and text from the latest compilation whose output was fully readable. */
export interface RetainedOutput {
  readonly outputFiles: readonly string[];
  readonly outputFileContents: ReadonlyMap<string, string>;
}

export interface OutputSnapshotHost {
  readFile(path: string): Promise<{ readonly text: string }>;
}

export function emptyRetainedOutput(): RetainedOutput {
  return { outputFiles: [], outputFileContents: new Map() };
}

/**
 * Keep one consistent snapshot. Multi-file output that would exceed `maxChars`
 * drops the files that do not fit instead of growing without a bound.
 */
export function boundOutputSnapshot(
  outputFiles: readonly string[],
  contents: ReadonlyMap<string, string>,
  maxChars = MULTI_FILE_OUTPUT_SNAPSHOT_CHAR_BUDGET,
): Map<string, string> {
  if (outputFiles.length <= 1) {
    const only = outputFiles[0];
    const text = only === undefined ? undefined : contents.get(only);
    return text === undefined ? new Map() : new Map([[only, text]]);
  }

  const bounded = new Map<string, string>();
  let used = 0;
  for (const path of outputFiles) {
    const text = contents.get(path);
    if (text === undefined) continue;
    if (text.length > maxChars || used + text.length > maxChars) continue;
    bounded.set(path, text);
    used += text.length;
  }
  return bounded;
}

/**
 * Read every emitted file. Returns undefined if any file is missing so the caller
 * keeps the previous snapshot instead of mixing two compilations.
 */
export async function readOutputSnapshot(
  host: OutputSnapshotHost,
  outputFiles: readonly string[],
  maxChars = MULTI_FILE_OUTPUT_SNAPSHOT_CHAR_BUDGET,
): Promise<Map<string, string> | undefined> {
  const contents = new Map<string, string>();
  for (const path of outputFiles) {
    try {
      const file = await host.readFile("./tsp-output/" + path);
      contents.set(path, file.text);
    } catch {
      return undefined;
    }
  }
  return boundOutputSnapshot(outputFiles, contents, maxChars);
}

export interface DisplayedOutput {
  readonly displayed: CompilationState;
  readonly retained: RetainedOutput;
  readonly isOutputStale: boolean;
}

/**
 * Choose the output shown in the playground.
 * A failed compilation that emitted nothing keeps the previous file list and the
 * snapshot taken when those files were actually written.
 */
export function resolveDisplayedOutput(
  state: CompilationState,
  retained: RetainedOutput,
  snapshot: ReadonlyMap<string, string> | undefined,
): DisplayedOutput {
  if (!("program" in state)) {
    return { displayed: state, retained, isOutputStale: false };
  }

  if (
    state.program.hasError() &&
    state.outputFiles.length === 0 &&
    retained.outputFiles.length > 0
  ) {
    const displayed: CompileResult = {
      ...state,
      outputFiles: [...retained.outputFiles],
      outputFileContents: retained.outputFileContents,
    };
    return { displayed, retained, isOutputStale: true };
  }

  const nextRetained: RetainedOutput =
    state.outputFiles.length > 0
      ? {
          outputFiles: [...state.outputFiles],
          outputFileContents: snapshot ?? retained.outputFileContents,
        }
      : retained;

  const displayed: CompileResult =
    state.outputFiles.length > 0 && snapshot ? { ...state, outputFileContents: snapshot } : state;

  return { displayed, retained: nextRetained, isOutputStale: false };
}
