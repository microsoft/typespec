import { deepStrictEqual } from "assert";
import { SymbolInformation } from "vscode-languageserver/node.js";
import { resolveVirtualPath } from "../../testing/test-host.js";
import { createTestServerHost } from "../../testing/test-server-host.js";
describe.only("compiler: server: SymbolInformation", () => {
  it("includes namespace for symbolInformation", async () => {
    const ranges = await getDocumentSymbols(`namespace Foo;`);
    deepStrictEqual(ranges, [
      {
        kind: 3,
        location: {
          range: {
            end: {
              character: 14,
              line: 0,
            },
            start: {
              character: 0,
              line: 0,
            },
          },
          uri: "file:///Z:/test/test/test.cadl",
        },
        name: "Foo",
      },
    ]);
  });

  it("includes model for symbolInformation", async () => {
    const ranges = await getDocumentSymbols(`model Pet {}`);
    deepStrictEqual(ranges, [
      {
        kind: 23,
        location: {
          range: {
            end: {
              character: 12,
              line: 0,
            },
            start: {
              character: 0,
              line: 0,
            },
          },
          uri: "file:///Z:/test/test/test.cadl",
        },
        name: "Pet",
      },
    ]);
  });

  it("includes model and operation for symbolInformation", async () => {
    const ranges = await getDocumentSymbols(`model Pet {op read(...PetId)}`);
    deepStrictEqual(ranges, [
      {
        kind: 23,
        location: {
          range: {
            end: {
              character: 11,
              line: 0,
            },
            start: {
              character: 0,
              line: 0,
            },
          },
          uri: "file:///Z:/test/test/test.cadl",
        },
        name: "Pet",
      },
      {
        kind: 25,
        location: {
          range: {
            end: {
              character: 28,
              line: 0,
            },
            start: {
              character: 11,
              line: 0,
            },
          },
          uri: "file:///Z:/test/test/test.cadl",
        },
        name: "read",
      },
    ]);
  });

  async function getDocumentSymbols(source: string): Promise<SymbolInformation[]> {
    const testHost = await createTestServerHost();
    const textDocument = testHost.addOrUpdateDocument(resolveVirtualPath("test/test.cadl"), source);
    return await testHost.server.getDocumentSymbols({
      textDocument,
    });
  }
});
