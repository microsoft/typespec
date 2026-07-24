import { CompilerPackageRoot } from "../../core/node-host.js";
import { resolvePath } from "../../core/path-utils.js";
import type { SystemHost } from "../../core/types.js";
import type { TemplateSource } from "./types.js";
import { UriTemplateSource } from "./uri-template-source.js";

/**
 * The default source of built-in ("internal") templates: the compiler package's on-disk
 * `templates/` directory, read through the given {@link SystemHost}. The standalone single-executable
 * overrides this by injecting its own {@link InMemoryTemplateSource} bundle.
 */
export function defaultInternalTemplateSource(host: SystemHost): TemplateSource {
  return UriTemplateSource.fromDirectory(host, resolvePath(CompilerPackageRoot, "templates"));
}
