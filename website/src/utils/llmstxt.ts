import { populateTopicDocs, type DocEntry, type TopicProps } from "@typespec/astro-utils/llmstxt";
import { getCollection } from "astro:content";

export type LlmsDocsDetails = {
  docs: DocEntry[];
  libraryNames: Set<string>;
};

export async function collectLlmsDocs() {
  const libraryNames = new Set<string>();
  const docs = await getCollection("docs", (entry) => {
    if (!entry.data.llmstxt) return false;

    const libraryName = getLibraryName(entry.id);
    if (libraryName) {
      libraryNames.add(libraryName);
    }

    return true;
  });

  return {
    docs,
    libraryNames,
  };
}

export type GenerateLlmsTopicsProps = {
  libraryNames: Set<string>;
} & (
  | {
      docs: DocEntry[];
      skipPopulateDocs?: boolean;
    }
  | {
      docs?: never;
      skipPopulateDocs: true;
    }
);

export function generateLlmsTopics(
  props: {
    libraryNames: Set<string>;
  } & {
    docs: DocEntry[];
    skipPopulateDocs?: boolean;
  },
): TopicProps[];
export function generateLlmsTopics(
  props: {
    libraryNames: Set<string>;
  } & {
    docs?: never;
    skipPopulateDocs: true;
  },
): Omit<TopicProps, "docs">[];
export function generateLlmsTopics({
  libraryNames,
  docs,
  skipPopulateDocs,
}: GenerateLlmsTopicsProps): TopicProps[] | Omit<TopicProps, "docs">[] {
  const topics = [
    {
      title: "TypeSpec Language Basics",
      id: "typespec-language-basics",
      description: "Documentation for the TypeSpec language",
      pathPrefix: "docs/language-basics/",
    },
    {
      title: "TypeSpec Standard Library",
      id: "typespec-standard-library",
      description: "Documentation for the TypeSpec standard library",
      pathPrefix: "docs/standard-library/",
    },
    {
      title: "TypeSpec Getting Started",
      id: "typespec-getting-started",
      description: "Overview of getting started with TypeSpec",
      pathPrefix: "docs/getting-started/",
    },
  ];

  for (const libraryName of libraryNames) {
    topics.push({
      title: `@typespec/${libraryName}`,
      id: `typespec-${libraryName}`,
      description: `Documentation for the @typespec/${libraryName} library.`,
      pathPrefix: `docs/libraries/${libraryName}/`,
    });
  }

  if (skipPopulateDocs) {
    return topics;
  }

  return populateTopicDocs(topics, docs);
}

function getLibraryName(id: string): string | undefined {
  const match = id.match(/docs\/libraries\/([^/]+)\//);
  return match ? match[1] : undefined;
}
