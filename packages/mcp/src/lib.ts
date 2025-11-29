import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/mcp",
  diagnostics: {},
  state: {
    tool: { description: "An MCP tool" },
    resource: { description: "An MCP resource" },
    readonly: { description: "Readonly tool" },
    nondestructive: { description: "Non destructive tool" },
    idempotent: { description: "Idempotent tool" },
    closedWorld: { description: "Closed world tool" },
    serializeAsText: {
      description: "Holds the type which is serialized to text",
    },
    mcpServer: {
      description: "Metadata about an MCP Server",
    },
  },
} as const);

// Optional but convenient, these are meant to be used locally in your library.
export const { reportDiagnostic, createDiagnostic, stateKeys } = $lib;
