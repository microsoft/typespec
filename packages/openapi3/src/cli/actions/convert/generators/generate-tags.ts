import { TypeSpecExternalDocs, TypeSpecTagMetadata } from "../interfaces.js";

function generateExternalDocs(externalDocs?: TypeSpecExternalDocs): string {
  if (!externalDocs) {
    return "";
  }

  const externalDocsUrl = externalDocs.url ? `url: "${externalDocs.url}"` : "";
  const externalDocsDescription = externalDocs.description ? `description: "${externalDocs.description}"` : "";
  
  if (!externalDocsUrl && !externalDocsDescription) {
    return "";
  }

  return `externalDocs: #{${[externalDocsUrl, externalDocsDescription].filter(x => !!x).join(", ")}}`;
}

export function generateTags(tags: TypeSpecTagMetadata[]): string {
  const definitions = tags.map((tag) => {
    const description = tag.description ? `description: "${tag.description}"` : "";
    const externalDocs = generateExternalDocs(tag.externalDocs);
    const tagMetadata = description || externalDocs ? `, #{${[description, externalDocs].filter(x => !!x).join(", ")}}` : "";
    return `@tagMetadata("${tag.name}"${tagMetadata})`;
  });

  return definitions.join("\n");
}
