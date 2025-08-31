import { processDocsForTypeSpecLlmsTxt } from "../../utils/process-docs-llms-txt";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ site }) => {
  const llmsData = await processDocsForTypeSpecLlmsTxt(site);

  return new Response(JSON.stringify(llmsData), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};
