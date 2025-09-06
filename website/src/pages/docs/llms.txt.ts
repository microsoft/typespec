import { generateLlmstxt, processDocsForLlmsTxt } from "@typespec/astro-utils/llmstxt";
import type { APIRoute } from "astro";
import { collectLlmsDocs, generateLlmsTopics } from "../../utils/llmstxt";

export const GET: APIRoute = async ({ site }) => {
  const { docs, libraryNames } = await collectLlmsDocs();

  const topics = generateLlmsTopics({ libraryNames, docs });
  const llmsData = await processDocsForLlmsTxt({
    title: "TypeSpec Documentation",
    description:
      "TypeSpec is an open-source language for designing APIs in a clear, extensible, and reusable way. It enables developers to define APIs as a single source of truth and generate client/server code, documentation, and OpenAPI specifications using emitters.",
    docs,
    llmsSections: topics.map((topic) => ({
      name: topic.title,
      pathPrefix: topic.pathPrefix,
    })),
    site,
  });

  const llmstxt = generateLlmstxt(llmsData);

  return new Response(llmstxt, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
};
