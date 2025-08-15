import { OpenAPI3Tag } from "../../../../types.js";
import { TypeSpecTagMetadata } from "../interfaces.js";

export function transformTags(tags: OpenAPI3Tag[]): TypeSpecTagMetadata[] {
  return tags.map((tag) => ({
    name: tag.name,
    description: tag.description,
    externalDocs:
      tag.externalDocs?.url || tag.externalDocs?.description
        ? {
            url: tag.externalDocs.url,
            description: tag.externalDocs.description,
          }
        : undefined,
  }));
}
