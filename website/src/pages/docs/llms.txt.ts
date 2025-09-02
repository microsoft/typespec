import type { APIRoute } from "astro";
import { processDocsForTypeSpecLlmsTxt } from "../../utils/process-docs-llms-txt";

export const GET: APIRoute = async ({ site }) => {
  const llmsData = await processDocsForTypeSpecLlmsTxt(site);

  const contents: string[] = [];
  contents.push(`# ${llmsData.title}`);
  contents.push(`> ${llmsData.description}`);

  for (const [name, topic] of Object.entries(llmsData.topics)) {
    if (!topic.length) continue;
    const section: string[] = [];
    section.push(`## ${name}\n`);
    for (const { title, url, description } of topic) {
      section.push(`- [${title}](${url}): ${description}`);
    }
    contents.push(section.join("\n"));
  }

  return new Response(contents.join("\n\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
};
