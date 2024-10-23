import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { DocumentHighlight } from "vscode-languageserver/node.js";
import { createTestServerHost, extractCursor } from "../../src/testing/test-server-host.js";

describe("compiler: server: documentHighlight", () => {
  it("includes model in highlighting", async () => {
    const ranges = await findDocumentHighlight(`model MyToy extends Toy {}
    model Toy┆ {
      id: int64;
      petId: int64;
      name: string;
    }`);
    deepStrictEqual(ranges, [
      {
        kind: 2,
        range: {
          end: {
            character: 23,
            line: 0,
          },
          start: {
            character: 20,
            line: 0,
          },
        },
      },
      {
        kind: 2,
        range: {
          end: {
            character: 13,
            line: 1,
          },
          start: {
            character: 10,
            line: 1,
          },
        },
      },
    ]);
  });

  it("does not include comments in highlighting model", async () => {
    const ranges = await findDocumentHighlight(`//Toy
    model MyToy extends Toy {}
    model Toy┆ {
      id: int64;
      petId: int64;
      name: string;
    }`);
    deepStrictEqual(ranges, [
      {
        kind: 2,
        range: {
          end: {
            character: 27,
            line: 1,
          },
          start: {
            character: 24,
            line: 1,
          },
        },
      },
      {
        kind: 2,
        range: {
          end: {
            character: 13,
            line: 2,
          },
          start: {
            character: 10,
            line: 2,
          },
        },
      },
    ]);
  });

  it("does not include decorators in highlighting model", async () => {
    const ranges = await findDocumentHighlight(`@doc("Not modified")
    model NotModified┆<T> {
      @statusCode _: 304;
      @body body: T;
    }`);
    deepStrictEqual(ranges, [
      {
        kind: 2,
        range: {
          end: {
            character: 21,
            line: 1,
          },
          start: {
            character: 10,
            line: 1,
          },
        },
      },
    ]);
  });

  it("includes namespace in highlighting", async () => {
    const ranges = await findDocumentHighlight(`namespace Pets┆ {
    }`);
    deepStrictEqual(ranges, [
      {
        kind: 2,
        range: {
          end: {
            character: 14,
            line: 0,
          },
          start: {
            character: 10,
            line: 0,
          },
        },
      },
    ]);
  });

  it("includes decorators in highlighting", async () => {
    const ranges = await findDocumentHighlight(`
    @doc("Manage your pets")
    @doc("List pets")
    @doc┆("Delete a pet") {
    }`);
    deepStrictEqual(ranges, [
      {
        kind: 2,
        range: {
          end: {
            character: 8,
            line: 1,
          },
          start: {
            character: 5,
            line: 1,
          },
        },
      },
      {
        kind: 2,
        range: {
          end: {
            character: 8,
            line: 2,
          },
          start: {
            character: 5,
            line: 2,
          },
        },
      },
      {
        kind: 2,
        range: {
          end: {
            character: 8,
            line: 3,
          },
          start: {
            character: 5,
            line: 3,
          },
        },
      },
    ]);
  });

  async function findDocumentHighlight(sourceWithCursor: string): Promise<DocumentHighlight[]> {
    const { source, pos } = extractCursor(sourceWithCursor);
    const testHost = await createTestServerHost();
    const textDocument = testHost.addOrUpdateDocument("test.tsp", source);
    return await testHost.server.findDocumentHighlight({
      textDocument,
      position: textDocument.positionAt(pos),
    });
  }
});
