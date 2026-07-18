import type { SystemHost } from "../../core/types.js";
import { baseUriOf, HostTemplateSource } from "./host-template-source.js";

/**
 * {@link TemplateSource} for a template index hosted at a URL (`tsp init <templatesUrl>`), read
 * through the given {@link SystemHost}. Template files are resolved relative to the index URL.
 *
 * Loading an untrusted template can execute arbitrary code during scaffolding; callers are
 * responsible for confirming the source with the user before using this.
 */
export class RemoteTemplateSource extends HostTemplateSource {
  constructor(host: SystemHost, url: string) {
    super(host, url, baseUriOf(url));
  }
}
