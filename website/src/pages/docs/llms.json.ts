import { mergeSiteWithPath } from "@typespec/astro-utils/llmstxt";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getLibraryName } from "../../utils/get-library-name-from-slug";

export const GET: APIRoute = async ({ site }) => {
  const siteHref = site?.href ?? "";
  // I need to get the sections I care about - language-basics, standard-library, libraries
  const libraryNames = new Set<string>();
  await getCollection("docs", (entry) => {
    if (!entry.data.llmstxt) return false;

    // Extract the library name from the entry.id
    // Example: `docs/libraries/events/reference` would extract `events`
    const libraryName = getLibraryName(entry.id);
    if (libraryName) {
      libraryNames.add(libraryName);
    }

    return false;
  });

  const topics: TopicMetadata[] = [
    {
      topic: "typespec-language-basics",
      description: "Learn the basics of the TypeSpec language.",
      contentUrl: mergeSiteWithPath(siteHref, "/docs/language-basics/llms-full.txt"),
    },
    {
      topic: "typespec-standard-library",
      description: "Explore the standard library of TypeSpec.",
      contentUrl: mergeSiteWithPath(siteHref, "/docs/standard-library/llms-full.txt"),
    },
  ];

  // Need an entry for EACH library - typespec-<library-name>
  for (const libraryName of libraryNames) {
    topics.push({
      topic: `typespec-${libraryName}`,
      description: `Documentation for the @typespec/${libraryName} library`,
      contentUrl: mergeSiteWithPath(siteHref, `/docs/libraries/${libraryName}/llms-full.txt`),
    });
  }

  return new Response(JSON.stringify(topics, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};

interface TopicMetadata {
  topic: string;
  description: string;
  contentUrl: string;
}
