import type { CompilerOptions } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { MarkerSeverity, MarkerTag, editor } from "monaco-editor";
import { useCallback, useEffect, useRef, useState } from "react";
import { getMonacoRange, updateDiagnosticsForCodeFixes } from "../../services.js";
import type { BrowserHost } from "../../types.js";
import { compile } from "../compilation/compile.js";
import { debugGlobals } from "../debug.js";
import type { CompilationState } from "../types.js";

export interface UseCompilationOptions {
  host: BrowserHost;
  selectedEmitter: string;
  compilerOptions: CompilerOptions;
  typespecModel: editor.ITextModel;
}

export interface UseCompilationResult {
  compilationState: CompilationState | undefined;
  isCompiling: boolean;
  isOutputStale: boolean;
  doCompile: () => Promise<void>;
}

export function useCompilation({
  host,
  selectedEmitter,
  compilerOptions,
  typespecModel,
}: UseCompilationOptions): UseCompilationResult {
  const [compilationState, setCompilationState] = useState<CompilationState | undefined>(undefined);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isOutputStale, setIsOutputStale] = useState(false);
  const lastSuccessfulOutputRef = useRef<string[]>([]);

  // Clear preserved output when switching emitters
  useEffect(() => {
    lastSuccessfulOutputRef.current = [];
    setIsOutputStale(false);
  }, [selectedEmitter]);

  const compileIdRef = useRef(0);
  const isCompilingRef = useRef(false);
  const pendingRecompileRef = useRef(false);
  const doCompileRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const doCompile = useCallback(async () => {
    if (isCompilingRef.current) {
      pendingRecompileRef.current = true;
      return;
    }
    const currentContent = typespecModel.getValue();
    const typespecCompiler = host.compiler;
    const compileId = ++compileIdRef.current;

    isCompilingRef.current = true;
    setIsCompiling(true);
    let state: CompilationState;
    try {
      state = await compile(host, currentContent, selectedEmitter, compilerOptions);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Compilation failed", error);
      isCompilingRef.current = false;
      setIsCompiling(false);
      if (pendingRecompileRef.current) {
        pendingRecompileRef.current = false;
        void doCompileRef.current();
      }
      return;
    }
    isCompilingRef.current = false;
    setIsCompiling(false);

    // Discard stale results from an older compilation
    if (compileId !== compileIdRef.current) return;

    // When compilation has errors and produced no output files, preserve the
    // previous successful output so the user doesn't lose their selected file
    // while typing (transient syntax errors).
    if (
      "program" in state &&
      state.program.hasError() &&
      state.outputFiles.length === 0 &&
      lastSuccessfulOutputRef.current.length > 0
    ) {
      setIsOutputStale(true);
      setCompilationState({
        ...state,
        outputFiles: lastSuccessfulOutputRef.current,
      });
    } else {
      setIsOutputStale(false);
      if ("program" in state && state.outputFiles.length > 0) {
        lastSuccessfulOutputRef.current = state.outputFiles;
      }
      setCompilationState(state);
    }
    if ("program" in state) {
      const markers: editor.IMarkerData[] = state.program.diagnostics.map((diag) => ({
        ...getMonacoRange(typespecCompiler, diag.target),
        message: diag.message,
        severity: diag.severity === "error" ? MarkerSeverity.Error : MarkerSeverity.Warning,
        tags: diag.code === "deprecated" ? [MarkerTag.Deprecated] : undefined,
      }));

      updateDiagnosticsForCodeFixes(typespecCompiler, state.program.diagnostics);

      debugGlobals().program = state.program;
      debugGlobals().$$ = $(state.program);

      editor.setModelMarkers(typespecModel, "owner", markers ?? []);
    } else {
      updateDiagnosticsForCodeFixes(host.compiler, []);
      editor.setModelMarkers(typespecModel, "owner", []);
    }

    // If typing happened while this compile was running, trigger a trailing
    // compile so the output stays in sync with the latest content.
    if (pendingRecompileRef.current) {
      pendingRecompileRef.current = false;
      void doCompileRef.current();
    }
  }, [host, selectedEmitter, compilerOptions, typespecModel]);

  useEffect(() => {
    doCompileRef.current = doCompile;
  }, [doCompile]);

  // Compile on mount and when dependencies change
  useEffect(() => {
    void doCompile();
  }, [doCompile]);

  return { compilationState, isCompiling, isOutputStale, doCompile };
}
