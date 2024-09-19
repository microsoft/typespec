import { pathToFileURL } from "url";
import { describe, expect, it } from "vitest";
import { Location } from "vscode-languageserver";
import {
  createTestServerHost,
  extractCursor,
  resolveVirtualPath,
} from "../../src/testing/index.js";

function resolveVirtualPathUri(path: string): string {
  return pathToFileURL(resolveVirtualPath(path)).href;
}

async function goToDefinitionAtCursor(
  sourceWithCursor: string,
  otherFiles: Record<string, string> = {},
): Promise<Location[]> {
  const { source, pos } = extractCursor(sourceWithCursor);

  const testHost = await createTestServerHost();
  for (const [filename, content] of Object.entries(otherFiles)) {
    testHost.addOrUpdateDocument(filename, content);
  }
  const textDocument = testHost.addOrUpdateDocument("main.tsp", source);
  return await testHost.server.gotoDefinition({
    textDocument,
    position: textDocument.positionAt(pos),
  });
}

describe("go to imports", () => {
  it("go to local import", async () => {
    const locations = await goToDefinitionAtCursor(
      `
    import "./othe┆r.tsp";
  `,
      { "other.tsp": "model Other {}" },
    );
    expect(locations).toEqual([
      {
        range: {
          end: { character: 0, line: 0 },
          start: { character: 0, line: 0 },
        },
        uri: resolveVirtualPathUri("other.tsp"),
      },
    ]);
  });

  it("go to library import", async () => {
    const locations = await goToDefinitionAtCursor(
      `
    import "┆test-lib";
  `,
      {
        "node_modules/test-lib/package.json": JSON.stringify({
          name: "test-lib",
          tspMain: "./main.tsp",
        }),
        "node_modules/test-lib/main.tsp": "model Other {}",
      },
    );
    expect(locations).toEqual([
      {
        range: {
          end: { character: 0, line: 0 },
          start: { character: 0, line: 0 },
        },
        uri: resolveVirtualPathUri("node_modules/test-lib/main.tsp"),
      },
    ]);
  });
});
