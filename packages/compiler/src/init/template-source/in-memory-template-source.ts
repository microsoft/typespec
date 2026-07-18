import { joinPaths, normalizePath } from "../../core/path-utils.js";
import { createSourceFile } from "../../core/source-file.js";
import type { SourceFile } from "../../core/types.js";
import { SCAFFOLDING_FILENAME } from "./host-template-source.js";
import type { LoadedTemplateIndex, TemplateSource } from "./types.js";

/**
 * {@link TemplateSource} that serves templates from an in-memory map of relative path to file
 * contents. Used by the standalone single-executable, which embeds the `templates/` tree as an asset.
 */
export class InMemoryTemplateSource implements TemplateSource {
  private readonly files: ReadonlyMap<string, string>;

  constructor(
    files: Readonly<Record<string, string>>,
    private readonly baseUri = "/__typespec_templates__",
  ) {
    this.files = new Map(Object.entries(files).map(([key, value]) => [normalizeKey(key), value]));
  }

  async loadIndex(): Promise<LoadedTemplateIndex> {
    const indexFile = this.readFileSync(SCAFFOLDING_FILENAME);
    return { templates: JSON.parse(indexFile.text), indexFile, baseUri: this.baseUri };
  }

  async readFile(relativePath: string): Promise<SourceFile> {
    return this.readFileSync(relativePath);
  }

  private readFileSync(relativePath: string): SourceFile {
    const key = normalizeKey(relativePath);
    const content = this.files.get(key);
    if (content === undefined) {
      const error: NodeJS.ErrnoException = new Error(
        `ENOENT: bundled template file not found, '${relativePath}'`,
      );
      error.code = "ENOENT";
      throw error;
    }
    return createSourceFile(content, joinPaths(this.baseUri, key));
  }
}

function normalizeKey(path: string): string {
  return normalizePath(path).replace(/^\/+/, "");
}
