import { TypeSpecTagMetadata } from "../interfaces.js";

export function generateTags(tags: TypeSpecTagMetadata[]): string {
  const definitions = tags.map((tag) => {
    const description = tag.description ? `description: "${tag.description}"` : "";
    const tagMetadata = description ? `, #{${description}}` : "";
    return `@tagMetadata("${tag.name}"${tagMetadata})`;
  });

  return definitions.join("\n");
}
