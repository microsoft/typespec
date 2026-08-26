import { normalizePath } from "../../core/path-utils.js";
import { createSourceFile } from "../../core/source-file.js";
import type { SourceFile } from "../../core/types.js";
import type { LoadedTemplateIndex, TemplateSource } from "./types.js";
import { SCAFFOLDING_FILENAME } from "./uri-template-source.js";

/** Prefix used to label the virtual files this source serves in diagnostics. */
const INTERNAL_URI_PREFIX = "internal:";

/**
 * A {@link TemplateSource} serving an index and its template files from an in-memory map keyed by
 * relative path. Used for built-in templates that are bundled rather than on disk — e.g. the
 * standalone single-executable injects one built from its embedded assets. Keys and lookups are
 * normalized so callers can use `./`-relative or backslash paths interchangeably.
 */
export class InMemoryTemplateSource implements TemplateSource {
  #files: ReadonlyMap<string, string>;
  #indexPath: string;

  /**
   * @param files Template files keyed by their relative path (including the index).
   * @param indexPath Relative path of the index within {@link files}.
   */
  constructor(files: ReadonlyMap<string, string>, indexPath: string = SCAFFOLDING_FILENAME) {
    this.#indexPath = indexPath;
    this.#files = new Map([...files].map(([key, value]) => [normalizeKey(key), value]));
  }

  async loadIndex(): Promise<LoadedTemplateIndex> {
    const indexFile = this.#read(this.#indexPath);
    const templates = JSON.parse(indexFile.text);
    return { templates, indexFile, baseUri: INTERNAL_URI_PREFIX };
  }

  async readFile(relativePath: string): Promise<SourceFile> {
    return this.#read(relativePath);
  }

  #read(relativePath: string): SourceFile {
    const key = normalizeKey(relativePath);
    const content = this.#files.get(key);
    if (content === undefined) {
      const error: NodeJS.ErrnoException = new Error(
        `ENOENT: bundled template file not found, '${relativePath}'`,
      );
      error.code = "ENOENT";
      throw error;
    }
    return createSourceFile(content, `${INTERNAL_URI_PREFIX}${key}`);
  }
}

function normalizeKey(path: string): string {
  return normalizePath(path).replace(/^\/+/, "");
}
