import type { DocEntry } from ".";

export interface TopicProps {
  title: string;
  description: string;
  pathPrefix: string;
  docs: DocEntry[];
  id: string;
}

/**
 *
 */
export function populateTopicDocs(
  topics: Omit<TopicProps, "docs">[],
  docs: DocEntry[],
): TopicProps[] {
  docs.sort((a, b) => (a.id > b.id ? 1 : -1));
  const seenDocs = new Set<DocEntry>();

  return topics.map((topic) => {
    return {
      ...topic,
      docs: docs.filter((doc) => {
        if (seenDocs.has(doc)) return false;
        if (doc.id.startsWith(topic.pathPrefix)) {
          seenDocs.add(doc);
          return true;
        }
        return false;
      }),
    };
  });
}
