import { OpenAPI3Tag, OpenAPITag3_2 } from "../../../../types.js";
import { TypeSpecTagMetadata } from "../interfaces.js";

export function transformTags(tags: OpenAPI3Tag[]): TypeSpecTagMetadata[] {
  return tags.map((tag) => {
    // `parent` and `kind` are OpenAPI 3.2-specific fields. For 3.0/3.1 documents they will
    // be undefined and are safely ignored in the output.
    const { parent, kind } = tag as OpenAPITag3_2;
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
      kind,
    };
  });
}
