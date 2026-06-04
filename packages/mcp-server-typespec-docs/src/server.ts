#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getDocByPath, getTypeSignature, searchDocs } from "./indexer.js";

const server = new McpServer({
  name: "typespec-docs",
  version: "0.1.0",
});

server.registerTool(
  "search_docs",
  {
    description:
      "Search TypeSpec documentation by query. Returns full content of matching doc pages. Use this to find information about TypeSpec language features, libraries, emitters, decorators, and how to extend TypeSpec.",
    inputSchema: {
      query: z
        .string()
        .describe(
          "Search query (e.g., 'Realm', 'union composition', 'create decorator', 'emitter framework')",
        ),
      topic: z
        .optional(
          z.enum([
            "language-basics",
            "extending-typespec",
            "libraries",
            "emitters",
            "getting-started",
            "standard-library",
            "handbook",
          ]),
        )
        .describe("Optional: filter results to a specific documentation section"),
    },
  },
  async ({ query, topic }) => {
    const results = await searchDocs(query, topic);
    if (results.length === 0) {
      return {
        content: [{ type: "text", text: `No documentation found for: "${query}"` }],
      };
    }
    const text = results
      .map((doc) => `# ${doc.title}\n<!-- path: ${doc.path} -->\n\n${doc.content}`)
      .join("\n\n---\n\n");
    return { content: [{ type: "text", text }] };
  },
);

server.registerTool(
  "get_doc",
  {
    description:
      "Fetch a specific TypeSpec documentation page by its path. Use this when you already know which doc page you need.",
    inputSchema: {
      path: z
        .string()
        .describe(
          "Relative path within the docs directory (e.g., 'extending-typespec/create-decorators.md', 'libraries/http/operations.md')",
        ),
    },
  },
  async ({ path }) => {
    const doc = await getDocByPath(path);
    if (!doc) {
      return {
        content: [{ type: "text", text: `Document not found: "${path}"` }],
      };
    }
    return {
      content: [{ type: "text", text: `# ${doc.title}\n\n${doc.content}` }],
    };
  },
);

server.registerTool(
  "get_type_signature",
  {
    description:
      "Get the TypeScript type definition and JSDoc for a TypeSpec compiler API symbol. Use this to find exact signatures of compiler APIs, typekit methods, and experimental features like Realm and mutators.",
    inputSchema: {
      symbol: z
        .string()
        .describe(
          "Name of the compiler API symbol (e.g., 'Model', 'mutateSubgraph', 'defineKit', 'Realm')",
        ),
    },
  },
  async ({ symbol }) => {
    const result = await getTypeSignature(symbol);
    if (!result) {
      return {
        content: [{ type: "text", text: `Symbol not found: "${symbol}"` }],
      };
    }
    return { content: [{ type: "text", text: result }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
