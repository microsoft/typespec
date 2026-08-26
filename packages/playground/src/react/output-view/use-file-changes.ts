import { useEffect, useMemo, useRef, useState } from "react";
import { getChangedLineNumbers } from "../diff-utils.js";
import type { CompileResult } from "../types.js";

export interface FileChanges {
  changedFiles: Set<string>;
  changedLines: Map<string, number[]>;
}

/**
 * Tracks which output files have changed between compilations.
 * Returns the set of changed file paths and a map of changed line numbers per file.
 */
export function useFileChanges(
  program: CompileResult["program"],
  outputFiles: string[],
): FileChanges {
  const [changedFiles, setChangedFiles] = useState<Set<string>>(new Set());
  const [changedLines, setChangedLines] = useState<Map<string, number[]>>(new Map());
  const prevContentsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;
    async function diffFiles() {
      const changed = new Set<string>();
      const lines = new Map<string, number[]>();
      const newContents = new Map<string, string>();

      // If no files from the new output exist in the cache, this is an emitter
      // switch or initial load — populate the cache without highlighting.
      const isEmitterSwitch =
        prevContentsRef.current.size > 0 &&
        !outputFiles.some((f) => prevContentsRef.current.has(f));

      let hasAnyChange = false;
      for (const file of outputFiles) {
        try {
          const contents = await program.host.readFile("./tsp-output/" + file);
          newContents.set(file, contents.text);
          if (!isEmitterSwitch) {
            const prev = prevContentsRef.current.get(file);
            if (prev === undefined && prevContentsRef.current.size > 0) {
              changed.add(file);
              const lineCount = contents.text.split("\n").length;
              lines.set(
                file,
                Array.from({ length: lineCount }, (_, i) => i + 1),
              );
              hasAnyChange = true;
            } else if (prev !== undefined && prev !== contents.text) {
              changed.add(file);
              lines.set(file, getChangedLineNumbers(prev, contents.text));
              hasAnyChange = true;
            } else if (prev === undefined) {
              hasAnyChange = true;
            }
          } else {
            hasAnyChange = true;
          }
        } catch {
          // file may not be readable
        }
      }
      if (cancelled) return;
      if (hasAnyChange || prevContentsRef.current.size === 0) {
        prevContentsRef.current = newContents;
        setChangedFiles(changed);
        setChangedLines(lines);
      }
    }
    void diffFiles();
    return () => {
      cancelled = true;
    };
  }, [program, outputFiles]);

  return useMemo(() => ({ changedFiles, changedLines }), [changedFiles, changedLines]);
}
