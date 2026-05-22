import { OpenAPI3Tag, OpenAPITag3_2 } from "../../../../types.js";
import { TypeSpecTagMetadata } from "../interfaces.js";

export function transformTags(tags: OpenAPI3Tag[]): TypeSpecTagMetadata[] {
  return tags.map((tag) => {
    const tag32 = tag as OpenAPITag3_2;
    // Support both native 3.2 fields and x-oai- prefixed extensions for 3.0/3.1
    const summary = tag32.summary ?? (tag as any)["x-oai-summary"];
    const kind = tag32.kind ?? (tag as any)["x-oai-kind"];

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
      summary,
      kind,
    };
  });
}
