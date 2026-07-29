import { generateLlmsJson } from "@typespec/astro-utils/llmstxt";
import type { APIRoute } from "astro";
import { collectLlmsDocs, generateLlmsTopics } from "../../utils/llmstxt";

export const GET: APIRoute = async ({ site }) => {
  const siteHref = site?.href ?? "";
  const { libraryNames } = await collectLlmsDocs();

  const topicsDetails = generateLlmsTopics({ libraryNames, skipPopulateDocs: true });

  const llmsJson = generateLlmsJson(topicsDetails, siteHref);

  return new Response(JSON.stringify(llmsJson, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};
