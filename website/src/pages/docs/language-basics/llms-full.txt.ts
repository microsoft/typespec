import { generateLlmstxtFull } from "@site/src/utils/generate-llms-txt";
import { type DocEntry } from "@typespec/astro-utils/llmstxt";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute<{ docs: DocEntry[] }> = async () => {
  const docs = await getCollection("docs", (entry) => {
    if (!entry.data.llmstxt) return false;

    if (!entry.id.startsWith("docs/language-basics/")) return false;
    return true;
  });

  const llmstxt = generateLlmstxtFull(`TypeSpec language docs`, docs);

  return new Response(llmstxt, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
};
