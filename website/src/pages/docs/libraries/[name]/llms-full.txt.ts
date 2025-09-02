import { generateLlmstxtFull } from "@site/src/utils/generate-llms-txt";
import { type DocEntry } from "@typespec/astro-utils/llmstxt";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getLibraryName } from "./llms.txt";

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

export const GET: APIRoute<{ docs: DocEntry[] }> = async ({ props, params }) => {
  const { docs } = props;
  const { name } = params;

  const llmstxt = generateLlmstxtFull(`@typespec/${name} docs`, docs);

  return new Response(llmstxt, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
};
