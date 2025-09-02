import { generateLlmstxt } from "@site/src/utils/generate-llms-txt";
import { processDocsForLlmsTxt, type DocEntry } from "@typespec/astro-utils/llmstxt";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute<{ docs: DocEntry[] }> = async ({ site }) => {
  const docs = await getCollection("docs", (entry) => {
    if (!entry.data.llmstxt) return false;

    if (!entry.id.startsWith("docs/language-basics/")) return false;
    return true;
  });

  const llmsData = await processDocsForLlmsTxt({
    title: `TypeSpec Language Basics`,
    description: `Documentation for the TypeSpec language`,
    docs,
    site,
    llmsSections: [{ name: "Docs", pattern: `docs/language-basics/**` }],
  });

  const llmstxt = generateLlmstxt(llmsData);

  return new Response(llmstxt, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
};
