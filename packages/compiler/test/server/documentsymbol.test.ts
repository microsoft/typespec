import { deepStrictEqual } from "assert";
import { pathToFileURL } from "url";
import { SymbolInformation } from "vscode-languageserver/node.js";
import { resolveVirtualPath } from "../../testing/test-host.js";
import { createTestServerHost } from "../../testing/test-server-host.js";
describe("compiler: server: SymbolInformation", () => {
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
          uri: pathToFileURL(resolveVirtualPath("test.cadl")).href,
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
          uri: pathToFileURL(resolveVirtualPath("test.cadl")).href,
        },
        name: "Pet",
      },
    ]);
  });

  it("includes model and operation for symbolInformation", async () => {
    const ranges = await getDocumentSymbols(
      `model Pet {op read(...PetId): OkResponse<Pet> | NotModified<Pet> | Error;}`
    );
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
          uri: pathToFileURL(resolveVirtualPath("test.cadl")).href,
        },
        name: "Pet",
      },
      {
        kind: 12,
        location: {
          range: {
            end: {
              character: 73,
              line: 0,
            },
            start: {
              character: 11,
              line: 0,
            },
          },
          uri: pathToFileURL(resolveVirtualPath("test.cadl")).href,
        },
        name: "read",
      },
    ]);
  });

  async function getDocumentSymbols(source: string): Promise<SymbolInformation[]> {
    const testHost = await createTestServerHost();
    const textDocument = testHost.addOrUpdateDocument("test.cadl", source);
    return await testHost.server.getDocumentSymbols({
      textDocument,
    });
  }
});
