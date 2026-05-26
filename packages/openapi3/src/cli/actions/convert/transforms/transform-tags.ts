import { OpenAPI3Tag, OpenAPITag3_2 } from "../../../../types.js";
import { TypeSpecTagMetadata } from "../interfaces.js";

export function transformTags(tags: OpenAPI3Tag[]): TypeSpecTagMetadata[] {
  return tags.map((tag) => {
    const tag32 = tag as OpenAPITag3_2;
    // Support both native 3.2 fields and x-oai- prefixed extensions for 3.0/3.1
    const summary: string | undefined =
      tag32.summary ?? (tag["x-oai-summary"] as string | undefined);
    const kind: string | undefined = tag32.kind ?? (tag["x-oai-kind"] as string | undefined);
    // parent is only supported natively in OpenAPI 3.2
    const parent: string | undefined = tag32.parent;

    return {
      name: tag.name,
      description: tag.description,
      externalDocs:
        tag.externalDocs?.url || tag.externalDocs?.description
          ? {
              url: tag.externalDocs.url,
              description: tag.externalDocs.description,
            }
          : undefined,
      parent,
      summary,
      kind,
    };
  });
}
