import debounce from "debounce";
import { editor } from "monaco-editor";
import { useEffect } from "react";

export interface UseDebouncedCompileOptions {
  typespecModel: editor.ITextModel;
  doCompile: () => Promise<void>;
  debounceDelay?: number;
}

/**
 * Subscribes to Monaco model content changes and triggers compilation
 * after a debounce delay.
 */
export function useDebouncedCompile({
  typespecModel,
  doCompile,
  debounceDelay = 200,
}: UseDebouncedCompileOptions): void {
  useEffect(() => {
    const debouncer = debounce(() => doCompile(), debounceDelay);
    const disposable = typespecModel.onDidChangeContent(debouncer);
    return () => {
      debouncer.clear();
      disposable.dispose();
    };
  }, [typespecModel, doCompile, debounceDelay]);
}
