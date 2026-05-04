/* eslint-disable unicorn/filename-case */
import type { RouteParams, RouteProps } from "@typespec/astro-utils/llmstxt";
import { collectLlmsDocs, generateLlmsTopics } from "../../../utils/llmstxt";

export { spreadLlmsTxtRoute as GET } from "@typespec/astro-utils/llmstxt";

export async function getStaticPaths() {
  const { docs, libraryNames } = await collectLlmsDocs();

  const topics = generateLlmsTopics({ libraryNames, docs });

  const staticPathsResults: { params: RouteParams; props: RouteProps }[] = [];
  for (const topic of topics) {
    if (!topic.docs || !topic.docs.length) continue;
    staticPathsResults.push({
      params: { path: generateFullPath(topic.pathPrefix), llms_type: "llms" },
      props: { title: topic.title, description: topic.description, docs: topic.docs },
    });
    staticPathsResults.push({
      params: { path: generateFullPath(topic.pathPrefix), llms_type: "llms-full" },
      props: { title: topic.title, description: topic.description, docs: topic.docs },
    });
  }

  return staticPathsResults;
}

function generateFullPath(docId: string): string {
  // All of the docs in the collection have `docs` prepended to the path - we need to
  // remove this since it'll be prepended again given this route is in the `docs` folder.
  return docId.startsWith("docs") ? docId.slice(5) : docId;
}
