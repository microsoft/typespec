import { processDocsForLlmsTxt } from "@typespec/astro-utils/llmstxt";
import { getCollection } from "astro:content";

export async function processDocsForTypeSpecLlmsTxt(site?: URL) {
  const docs = await getCollection("docs", (entry) => !!entry.data.llmstxt);
  const result = await processDocsForLlmsTxt({
    title: "TypeSpec Documentation",
    description:
      "TypeSpec is an open-source language for designing APIs in a clear, extensible, and reusable way. It enables developers to define APIs as a single source of truth and generate client/server code, documentation, and OpenAPI specifications using emitters.",
    docs,
    llmsSections,
    site,
  });
  return result;
}

const llmsSections = [
  { name: "Language Basics", pattern: "docs/language-basics/**" },
  { name: "Standard Library", pattern: "docs/standard-library/**" },
  { name: "HTTP Library", pattern: "docs/libraries/http/**" },
  { name: "OpenAPI Library", pattern: "docs/libraries/openapi/**" },
  { name: "Other Libraries", pattern: "docs/libraries/**" },
  { name: "JSON Schema Emitter", pattern: "docs/emitters/json-schema/**" },
  { name: "OpenAPI Emitter", pattern: "docs/emitters/openapi3/**" },
  { name: "Protobuf Emitter", pattern: "docs/emitters/protobuf/**" },
  { name: "Client Emitters", pattern: "docs/emitters/clients/**" },
  { name: "Server Emitters", pattern: "docs/emitters/servers/**" },
  { name: "Optional", pattern: "docs/**" },
];
