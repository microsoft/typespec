import { getDirectoryPath } from "../../core/path-utils.js";
import type { SourceFile, SystemHost } from "../../core/types.js";
import { readUrlOrPath, resolveRelativeUrlOrPath } from "../../utils/misc.js";
import type { LoadedTemplateIndex, TemplateSource } from "./types.js";

/** File name of the template index within a template source directory. */
export const SCAFFOLDING_FILENAME = "scaffolding.json";

/**
 * A {@link TemplateSource} backed by a location: a filesystem path or a URL. The index and every
 * template file are read through a {@link SystemHost} via {@link readUrlOrPath}, so this handles both
 * a local directory and a remote `tsp init <url>` uniformly. Built-in templates are served through
 * {@link defaultInternalTemplateSource} (or an injected provider) instead.
 *
 * Loading an untrusted remote template can execute arbitrary code during scaffolding; callers are
 * responsible for confirming the source with the user before using it.
 */
export class UriTemplateSource implements TemplateSource {
  #host: SystemHost;
  #indexLocation: string;
  /** Directory (path or URL) that template file paths are resolved against. */
  #baseUri: string;

  /**
   * @param host Host used to read the index and template files.
   * @param indexLocation Location of the index file (a path or URL). Template files are resolved
   * relative to its containing directory.
   */
  constructor(host: SystemHost, indexLocation: string) {
    this.#host = host;
    this.#indexLocation = indexLocation;
    this.#baseUri = getDirectoryPath(indexLocation);
  }

  /**
   * Create a source for a template root directory (path or URL) whose index is a
   * `scaffolding.json` at its root.
   */
  static fromDirectory(host: SystemHost, directory: string): UriTemplateSource {
    return new UriTemplateSource(
      host,
      resolveRelativeUrlOrPath(directory + "/", SCAFFOLDING_FILENAME),
    );
  }

  async loadIndex(): Promise<LoadedTemplateIndex> {
    const indexFile = await readUrlOrPath(this.#host, this.#indexLocation);
    const templates = JSON.parse(indexFile.text);
    return { templates, indexFile, baseUri: this.#baseUri };
  }

  async readFile(relativePath: string): Promise<SourceFile> {
    return readUrlOrPath(this.#host, resolveRelativeUrlOrPath(this.#baseUri + "/", relativePath));
  }
}
