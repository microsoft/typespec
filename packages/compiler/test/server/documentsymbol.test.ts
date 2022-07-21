import { deepStrictEqual } from "assert";
import { SymbolInformation } from "vscode-languageserver/node.js";
import { createTestServerHost } from "../../testing/test-server-host.js";
describe("compiler: server: SymbolInformation", () => {
  it("includes namespace for symbolInformation", async () => {
    const ranges = await getDocumentSymbols(`namespace Foo;`);
    deepStrictEqual(ranges, [
      {
        kind: 23,
        location: {
          range: {
            end: {
              character: 0,
              line: 0,
            },
            start: {
              character: 0,
              line: 0,
            },
          },
          uri: "file:///Z:/test/test.cadl",
        },
        name: "Z:/test/test.cadl",
      },
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
          uri: "file:///Z:/test/test.cadl",
        },
        name: "Foo",
      },
      {
        kind: 23,
        location: {
          range: {
            end: {
              character: 13,
              line: 0,
            },
            start: {
              character: 10,
              line: 0,
            },
          },
          uri: "file:///Z:/test/test.cadl",
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
              character: 0,
              line: 0,
            },
            start: {
              character: 0,
              line: 0,
            },
          },
          uri: "file:///Z:/test/test.cadl",
        },
        name: "Z:/test/test.cadl",
      },
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
          uri: "file:///Z:/test/test.cadl",
        },
        name: "Pet",
      },
      {
        kind: 23,
        location: {
          range: {
            end: {
              character: 9,
              line: 0,
            },
            start: {
              character: 6,
              line: 0,
            },
          },
          uri: "file:///Z:/test/test.cadl",
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
              character: 0,
              line: 0,
            },
            start: {
              character: 0,
              line: 0,
            },
          },
          uri: "file:///Z:/test/test.cadl",
        },
        name: "Z:/test/test.cadl",
      },
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
          uri: "file:///Z:/test/test.cadl",
        },
        name: "Pet",
      },
      {
        kind: 23,
        location: {
          range: {
            end: {
              character: 9,
              line: 0,
            },
            start: {
              character: 6,
              line: 0,
            },
          },
          uri: "file:///Z:/test/test.cadl",
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
          uri: "file:///Z:/test/test.cadl",
        },
        name: "read",
      },
      {
        kind: 23,
        location: {
          range: {
            end: {
              character: 18,
              line: 0,
            },
            start: {
              character: 14,
              line: 0,
            },
          },
          uri: "file:///Z:/test/test.cadl",
        },
        name: "read",
      },
      {
        kind: 23,
        location: {
          range: {
            end: {
              character: 27,
              line: 0,
            },
            start: {
              character: 22,
              line: 0,
            },
          },
          uri: "file:///Z:/test/test.cadl",
        },
        name: "PetId",
      },
      {
        kind: 23,
        location: {
          range: {
            end: {
              character: 40,
              line: 0,
            },
            start: {
              character: 30,
              line: 0,
            },
          },
          uri: "file:///Z:/test/test.cadl",
        },
        name: "OkResponse",
      },
      {
        kind: 23,
        location: {
          range: {
            end: {
              character: 44,
              line: 0,
            },
            start: {
              character: 41,
              line: 0,
            },
          },
          uri: "file:///Z:/test/test.cadl",
        },
        name: "Pet",
      },
      {
        kind: 23,
        location: {
          range: {
            end: {
              character: 59,
              line: 0,
            },
            start: {
              character: 48,
              line: 0,
            },
          },
          uri: "file:///Z:/test/test.cadl",
        },
        name: "NotModified",
      },
      {
        kind: 23,
        location: {
          range: {
            end: {
              character: 63,
              line: 0,
            },
            start: {
              character: 60,
              line: 0,
            },
          },
          uri: "file:///Z:/test/test.cadl",
        },
        name: "Pet",
      },
      {
        kind: 23,
        location: {
          range: {
            end: {
              character: 72,
              line: 0,
            },
            start: {
              character: 67,
              line: 0,
            },
          },
          uri: "file:///Z:/test/test.cadl",
        },
        name: "Error",
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
