import { processDocsForLlmsTxt } from "@typespec/astro-utils/llmstxt";
import { getCollection } from "astro:content";
import { getLibraryName } from "./get-library-name-from-slug";

export async function processDocsForTypeSpecLlmsTxt(site?: URL) {
  const libraryNames = new Set<string>();
  const docs = await getCollection("docs", (entry) => {
    if (!entry.data.llmstxt) return false;

    const libraryName = getLibraryName(entry.id);
    if (libraryName) {
      libraryNames.add(libraryName);
    }

    return true;
  });

  const llmsSections = [
    { name: "Language Basics", pattern: "docs/language-basics/**" },
    { name: "Standard Library", pattern: "docs/standard-library/**" },
  ];

  for (const libraryName of libraryNames) {
    llmsSections.push({
      name: `@typespec/${libraryName}`,
      pattern: `docs/libraries/${libraryName}/**`,
    });
  }

  llmsSections.push({
    name: "Optional",
    pattern: "docs/**",
  });

  const result = await processDocsForLlmsTxt({
    title: "TypeSpec Documentation",
    description:
      "TypeSpec is an open-source language for designing APIs in a clear, extensible, and reusable way. It enables developers to define APIs as a single source of truth and generate client/server code, documentation, and OpenAPI specifications using emitters.",
    docs,
    llmsSections,
    site,
  });
  return result;
}
