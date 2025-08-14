import { TypeSpecTagMetadata } from "../interfaces.js";

export function generateTags(tags: TypeSpecTagMetadata[]): string {
  const definitions = tags.map((tag) => {
    const description = tag.description ? `description: "${tag.description}"` : "";
    const externalDocsUrl = tag.externalDocs?.url ? `url: "${tag.externalDocs.url}"` : "";
    const externalDocsDescription = tag.externalDocs?.description ? `description: "${tag.externalDocs.description}"` : "";
    const externalDocs = externalDocsUrl || externalDocsDescription ?
      `externalDocs: #{${[externalDocsUrl, externalDocsDescription].filter(x => !!x).join(", ")}}` : "";
    const tagMetadata = description || externalDocs ? `, #{${[description, externalDocs].filter(x => !!x).join(", ")}}` : "";
    return `@tagMetadata("${tag.name}"${tagMetadata})`;
  });

  return definitions.join("\n");
}
