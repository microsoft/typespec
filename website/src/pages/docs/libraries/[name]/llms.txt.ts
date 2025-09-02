import { generateLlmstxt } from "@site/src/utils/generate-llms-txt";
import { processDocsForLlmsTxt, type DocEntry } from "@typespec/astro-utils/llmstxt";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export function getLibraryName(id: string): string | undefined {
  const match = id.match(/docs\/libraries\/([^/]+)\//);
  return match ? match[1] : undefined;
}

export async function getStaticPaths() {
  const libraryNamesToDocs = new Map<string, DocEntry[]>();
  await getCollection("docs", (entry) => {
    if (!entry.data.llmstxt) return false;

    // Extract the library name from the doc.id
    // Example: `docs/libraries/events/reference` would extract `events`
    const libraryName = getLibraryName(entry.id);
    if (libraryName) {
      const libraryDocs = libraryNamesToDocs.get(libraryName) ?? [];
      libraryDocs.push(entry);
      libraryNamesToDocs.set(libraryName, libraryDocs);
    }

    return false;
  });

  return Array.from(libraryNamesToDocs.entries()).map(([name, docs]) => ({
    params: { name },
    props: { docs },
  }));
}

export const GET: APIRoute<{ docs: DocEntry[] }> = async ({ props, params, site }) => {
  const { docs } = props;
  const { name } = params;

  const llmsData = await processDocsForLlmsTxt({
    title: `@typespec/${name} docs`,
    description: `Documentation for the @typespec/${name} library`,
    docs,
    site,
    llmsSections: [{ name: "Docs", pattern: `docs/libraries/${name}/**` }],
  });

  const llmstxt = generateLlmstxt(llmsData);

  return new Response(llmstxt, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
};
