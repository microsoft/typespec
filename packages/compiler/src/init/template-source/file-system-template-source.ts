import { CompilerPackageRoot } from "../../core/node-host.js";
import { resolvePath } from "../../core/path-utils.js";
import type { SystemHost } from "../../core/types.js";
import { UriTemplateSource } from "./host-template-source.js";

/** Default location of the compiler's built-in `tsp init` templates. */
export const CompilerCoreTemplatesRoot = resolvePath(CompilerPackageRoot, "templates");

/**
 * {@link TemplateSource} backed by a `templates/` directory on disk, read through the given
 * {@link SystemHost}. This is the source used by a normally-installed compiler.
 */
export class FileSystemTemplateSource extends UriTemplateSource {
  constructor(host: SystemHost, rootDir: string = CompilerCoreTemplatesRoot) {
    super(host, rootDir);
  }
}
