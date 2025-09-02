import type { DocEntry, LLMsJson } from "@typespec/astro-utils/llmstxt";

export function generateLlmstxt(llmsData: LLMsJson): string {
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
  return contents.join("\n\n");
}

export function generateLlmstxtFull(title: string, docs: DocEntry[]): string {
  const contents: string[] = [];
  contents.push(`# ${title}`);

  for (const doc of docs) {
    if (!doc.body) continue;

    const docTitle = doc.data.llmstxt?.title ?? doc.data.title;
    const docDescription = doc.data.llmstxt?.description ?? "";
    contents.push(`# ${docTitle}`);
    if (docDescription) contents.push(docDescription);
    contents.push(doc.body);
  }

  return contents.join("\n\n");
}
