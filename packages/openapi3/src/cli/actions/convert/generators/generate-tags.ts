import type { TypeSpecExternalDocs, TypeSpecTagMetadata } from "../interfaces.js";
import { stringLiteral } from "./common.js";

function generateExternalDocs(externalDocs?: TypeSpecExternalDocs): string {
  if (!externalDocs) {
    return "";
  }

  const externalDocsUrl = externalDocs.url ? `url: ${stringLiteral(externalDocs.url)}` : "";
  const externalDocsDescription = externalDocs.description
    ? `description: ${stringLiteral(externalDocs.description)}`
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
    const fields: string[] = [`name: ${stringLiteral(tag.name)}`];
    if (tag.description) {
      fields.push(`description: ${stringLiteral(tag.description)}`);
    }
    const externalDocs = generateExternalDocs(tag.externalDocs);
    if (externalDocs) {
      fields.push(externalDocs);
    }
    if (tag.summary) {
      fields.push(`summary: ${stringLiteral(tag.summary)}`);
    }
    if (tag.kind) {
      fields.push(`kind: ${stringLiteral(tag.kind)}`);
    }
    if (tag.parent) {
      fields.push(`parent: ${stringLiteral(tag.parent)}`);
    }
    return `#{${fields.join(", ")}}`;
  });

  return `@tagMetadata(#[\n${tagItems.map((item) => `  ${item}`).join(",\n")}\n])`;
}
