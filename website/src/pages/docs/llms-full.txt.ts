// This page creates .md endpoints for use by llmstxt files
import { getCollection } from "astro:content";

import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const docs = await getCollection("docs", (entry) => !!entry.data.llmstxt);

  // Need to sort the docs
  docs.sort((a, b) => (a.id > b.id ? 1 : -1));

  const contents: string[] = [];
  contents.push(`# TypeSpec Documentation`);
  contents.push(
    `TypeSpec is an open-source language for designing APIs in a clear, extensible, and reusable way. It enables developers to define APIs as a single source of truth and generate client/server code, documentation, and OpenAPI specifications using emitters.`,
  );

  // Add the contents of each doc to the file
  for (const doc of docs) {
    if (!doc.body) continue;

    const title = doc.data.llmstxt?.title ?? doc.data.title;
    // description should always exist since we filtered out
    const desc = doc.data.llmstxt?.description ?? "";
    contents.push(`# ${title}`);
    if (desc) contents.push(desc);
    contents.push(doc.body);
  }

  return new Response(contents.join("\n\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
};
