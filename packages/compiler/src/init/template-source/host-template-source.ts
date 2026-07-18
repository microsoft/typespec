import { getDirectoryPath } from "../../core/path-utils.js";
import type { SourceFile, SystemHost } from "../../core/types.js";
import { readUrlOrPath, resolveRelativeUrlOrPath } from "../../utils/misc.js";
import type { LoadedTemplateIndex, TemplateSource } from "./types.js";

/** File name of the template index within a template source root. */
export const SCAFFOLDING_FILENAME = "scaffolding.json";

/**
 * A {@link TemplateSource} that reads through a {@link SystemHost}, resolving files relative to a
 * base location (a directory path or a URL).
 */
export abstract class HostTemplateSource implements TemplateSource {
  constructor(
    protected readonly host: SystemHost,
    /** Location of the index file (`scaffolding.json`) — a path or URL. */
    private readonly indexLocation: string,
    /** Base against which template file paths are resolved — a directory path or URL. */
    private readonly baseUri: string,
  ) {}

  async loadIndex(): Promise<LoadedTemplateIndex> {
    const indexFile = await readUrlOrPath(this.host, this.indexLocation);
    const templates = JSON.parse(indexFile.text);
    return { templates, indexFile, baseUri: this.baseUri };
  }

  async readFile(relativePath: string): Promise<SourceFile> {
    return readUrlOrPath(this.host, resolveRelativeUrlOrPath(this.baseUri + "/", relativePath));
  }
}

/** Derive the base directory (path or URL) that a template index at `indexLocation` sits in. */
export function baseUriOf(indexLocation: string): string {
  return getDirectoryPath(indexLocation);
}

/**
 * A {@link TemplateSource} for a template root (a directory path or URL) laid out with a
 * `scaffolding.json` index at its root, for both on-disk and remote directories.
 */
export class UriTemplateSource extends HostTemplateSource {
  constructor(host: SystemHost, baseUri: string) {
    super(host, resolveRelativeUrlOrPath(baseUri + "/", SCAFFOLDING_FILENAME), baseUri);
  }
}
