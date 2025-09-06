import { mergeSiteWithPath, type DocEntry, type LlmsTxtAsJson } from "./index";

/**
 * Generates the Markdown path following the llms.tst specification.
 * @param docId The document ID from Astro content collections.
 */
export function generateMarkdownPath(docId: string): string {
  // If the final path fragment does not include a file extension, use `index.html.md`
  if (docId.endsWith("/")) {
    return `${docId}index.html.md`;
  }

  const finalPathFragment = docId.split("/").pop() ?? "";
  if (!finalPathFragment.includes(".")) {
    return `${docId}/index.html.md`;
  }

  return `${docId}.md`;
}

/**
 * Generates the LLMs text following the llms.tst specification.
 * @param llmsData The pre-processed LLMs JSON data.
 * @see `processDocsForLlmsTxt`
 */
export function generateLlmstxt(llmsData: LlmsTxtAsJson): string {
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

/**
 * Generates the full LLMs text - the combined markdown documentation referenced from an llms.txt.
 * @param title The title for the LLMs text file.
 * @param docs The collection of documentation entries to include.
 */
export function generateLlmstxtFull(title: string, docs: DocEntry[]): string {
  const contents: string[] = [];
  contents.push(`# ${title}`);

  for (const doc of docs) {
    if (!doc.body) continue;

    const docTitle = doc.data.title;
    const docDescription = doc.data.llmstxt?.description ?? "";
    contents.push(`# ${docTitle}`);
    if (docDescription) contents.push(docDescription);
    contents.push(doc.body);
  }

  return contents.join("\n\n");
}

export type GenerateLlmsJsonTopicDetails = {
  id: string;
  description: string;
  pathPrefix: string;
};

export type LlmsJson = {
  topic: string;
  description: string;
  contentUrl: string;
}[];

/**
 * Generates the `llms.json` version of `llms.txt`.
 * This is meant for easier consumption by our tools.
 */
export function generateLlmsJson(
  topicDetails: GenerateLlmsJsonTopicDetails[],
  siteHref: string,
): LlmsJson {
  return topicDetails.map(({ id, description, pathPrefix }) => ({
    topic: id,
    description,
    contentUrl: mergeSiteWithPath(siteHref, pathPrefix, "llms-full.txt"),
  }));
}
