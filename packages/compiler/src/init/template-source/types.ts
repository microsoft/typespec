import type { SourceFile } from "../../core/types.js";
import type { InitTemplate } from "../init-template.js";

/** Result of loading a template index (the set of templates offered by a {@link TemplateSource}). */
export interface LoadedTemplateIndex {
  /** Templates keyed by their id. */
  readonly templates: Record<string, InitTemplate>;
  /** Source file the index was parsed from. Used to position validation diagnostics. */
  readonly indexFile: SourceFile;
  /** Location the index was loaded from (a directory path or URL). Informational only. */
  readonly baseUri: string;
}

/**
 * A source of `tsp init` templates. Decouples template loading from `host.getExecutionRoot()`: each
 * context supplies its own implementation (filesystem, remote URL, or in-memory bundle).
 */
export interface TemplateSource {
  loadIndex(): Promise<LoadedTemplateIndex>;
  readFile(relativePath: string): Promise<SourceFile>;
}
