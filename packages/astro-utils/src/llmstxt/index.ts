import type { z } from "astro:content";
import type { llmstxtSchema } from "./schema";

export interface DocEntry {
  id: string;
  data: {
    title: string;
    llmstxt?: z.infer<typeof llmstxtSchema>;
  };
  body?: string;
}

export interface ProcessDocsProps {
  /**
   * Title for the LLMs text file.
   */
  title: string;
  /**
   * Description for the LLMs text file.
   */
  description: string;
  /**
   * The site URL, used to generate full URLs for documentation entries.
   */
  site?: URL;
  /**
   * The collection of documentation entries to process.
   * Each entry must include a valid LLMs text schema.
   * See `import("astro:content").getCollection`
   */
  docs: DocEntry[];
  /**
   * Name of the llmstxt section and the pattern to match against doc IDs.
   * If a doc matches multiple patterns, it will be assigned to the first matching section.
   */
  llmsSections: { name: string; pattern: string }[];
}

export interface LLMsJson {
  title: string;
  description: string;
  topics: Record<
    string,
    {
      title: string;
      description?: string;
      url: string;
    }[]
  >;
}

/**
 * Process documentation entries for LLMs text generation.
 * @param docs - The collection of documentation entries.
 * @returns An array of LLMsJson objects representing the processed documentation.
 */
export async function processDocsForLlmsTxt({
  title,
  description,
  site,
  docs,
  llmsSections,
}: ProcessDocsProps): Promise<LLMsJson> {
  docs.sort((a, b) => (a.id > b.id ? 1 : -1));
  const sections = organizeDocsIntoSections(docs, llmsSections);
  const result: LLMsJson = { title, description, topics: {} };

  const siteHref = site?.href ?? "";

  for (const [sectionName, sectionDocs] of Object.entries(sections)) {
    if (sectionDocs.length === 0) continue;

    const topic = sectionName;
    const topics = sectionDocs.map((doc) => {
      const title = doc.data.llmstxt?.title ?? doc.data.title;
      const desc = doc.data.llmstxt?.description ?? "";
      const path = generateMarkdownPath(doc.id);
      const url = mergeSiteWithPath(siteHref, path);
      return { title, description: desc, url };
    });

    result.topics[topic] = topics;
  }

  return result;
}

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

function organizeDocsIntoSections(
  docs: DocEntry[],
  llmsSections: ProcessDocsProps["llmsSections"],
) {
  const seenDocs = new Set<DocEntry>();
  const sections: Record<string, DocEntry[]> = {};

  for (const { name, pattern } of llmsSections) {
    sections[name] = docs.filter((doc) => {
      if (seenDocs.has(doc)) return false;
      const regex = new RegExp(`^${pattern.replace(/\*\*/g, ".*")}$`);
      if (regex.test(doc.id)) {
        seenDocs.add(doc);
        return true;
      }
      return false;
    });
  }

  return sections;
}

/**
 * Merges a site URL with a relative path.
 * Used when needing to create full URLs when working with astro content collections.
 * @param siteHref The base URL of the site.
 * @param path The relative path to merge with the site URL.
 * @returns The merged URL.
 */
export function mergeSiteWithPath(siteHref: string, path: string): string {
  const siteTrailingSlash = siteHref.endsWith("/");
  const pathLeadingSlash = path.startsWith("/");
  if (siteTrailingSlash && pathLeadingSlash) {
    return `${siteHref}${path.slice(1)}`;
  }
  if (!siteTrailingSlash && !pathLeadingSlash) {
    return `${siteHref}/${path}`;
  }
  return `${siteHref}${path}`;
}
