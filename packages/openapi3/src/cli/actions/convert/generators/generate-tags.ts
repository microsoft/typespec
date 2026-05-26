import { TypeSpecExternalDocs, TypeSpecTagMetadata } from "../interfaces.js";

function generateExternalDocs(externalDocs?: TypeSpecExternalDocs): string {
  if (!externalDocs) {
    return "";
  }

  const externalDocsUrl = externalDocs.url ? `url: "${externalDocs.url}"` : "";
  const externalDocsDescription = externalDocs.description
    ? `description: "${externalDocs.description}"`
    : "";

  if (!externalDocsUrl && !externalDocsDescription) {
    return "";
  }

  return `externalDocs: #{${[externalDocsUrl, externalDocsDescription].filter((x) => !!x).join(", ")}}`;
}

export function generateTags(tags: TypeSpecTagMetadata[]): string {
  if (tags.length === 0) {
    return "";
  }

  const tagItems = tags.map((tag) => {
    const fields: string[] = [`name: "${tag.name}"`];
    const description = tag.description ? `description: "${tag.description}"` : "";
    if (description) {
      fields.push(description);
    }
    const externalDocs = generateExternalDocs(tag.externalDocs);
    if (externalDocs) {
      fields.push(externalDocs);
    }
    if (tag.parent) {
      fields.push(`parent: "${tag.parent}"`);
    }
    if (tag.kind) {
      fields.push(`\`x-kind\`: "${tag.kind}"`);
    }
    return `#{${fields.join(", ")}}`;
  });

  return `@tagMetadata(#[\n${tagItems.map((item) => `  ${item}`).join(",\n")}\n])`;
}
