import type { z } from "astro:content";
import { generateMarkdownPath } from "./generators";
import type { llmstxtSchema } from "./schema";

export * from "./generators";
export * from "./routes";
export * from "./topics";
export interface DocEntry {
  id: string;
  data: {
    title: string;
    description?: string;
    llmstxt?: z.infer<typeof llmstxtSchema>;
  };
  body?: string;
}

export interface LlmsTxtAsJson {
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
   * Name of the llmstxt section and the pathPrefix to match against doc IDs.
   * If a doc matches multiple pathPrefixes, it will be assigned to the first matching section.
   */
  llmsSections: { name: string; pathPrefix: string }[];
}

/**
 * Processes astro content collection docs and metadata for easy `llms.txt` generation.
 */
export async function processDocsForLlmsTxt({
  title,
  description,
  site,
  docs,
  llmsSections,
}: ProcessDocsProps) {
  const sections = organizeDocsIntoSections(docs, llmsSections);
  const result: LlmsTxtAsJson = { title, description, topics: {} };

  const siteHref = site?.href ?? "";
  for (const [sectionName, sectionDocs] of Object.entries(sections)) {
    if (sectionDocs.length === 0) continue;

    const topic = sectionName;
    const topics = sectionDocs.map((doc) => {
      const title = doc.data.title;
      const desc = doc.data.description ?? "";
      const path = generateMarkdownPath(doc.id);
      const url = mergeSiteWithPath(siteHref, path);
      return { title, description: desc, url };
    });

    result.topics[topic] = topics;
  }

  return result;
}

function organizeDocsIntoSections(
  docs: DocEntry[],
  llmsSections: ProcessDocsProps["llmsSections"],
) {
  docs.sort((a, b) => (a.id > b.id ? 1 : -1));
  const seenDocs = new Set<DocEntry>();
  const sections: Record<string, DocEntry[]> = {};

  for (const { name, pathPrefix } of llmsSections) {
    sections[name] = docs.filter((doc) => {
      if (seenDocs.has(doc)) return false;
      if (doc.id.startsWith(pathPrefix)) {
        seenDocs.add(doc);
        return true;
      }
      return false;
    });
  }

  return sections;
}

/**
 * Merges a site URL with path parts.
 * Used when needing to create full URLs when working with astro content collections.
 * @param siteHref The base URL of the site.
 * @param pathParts The path parts to merge with the site URL.
 * @returns The merged URL.
 */
export function mergeSiteWithPath(siteHref: string, ...pathParts: string[]): string {
  let result = siteHref;

  for (const part of pathParts) {
    if (!part) continue; // Skip empty parts

    const resultTrailingSlash = result.endsWith("/");
    const partLeadingSlash = part.startsWith("/");

    if (resultTrailingSlash && partLeadingSlash) {
      result = `${result}${part.slice(1)}`;
    } else if (!resultTrailingSlash && !partLeadingSlash) {
      result = `${result}/${part}`;
    } else {
      result = `${result}${part}`;
    }
  }

  return result;
}
