import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { DocumentSymbol, SymbolKind } from "vscode-languageserver/node.js";
import { createTestServerHost } from "../../src/testing/test-server-host.js";

type SimplifiedSymbol = {
  kind: SymbolKind;
  name: string;
  children?: SimplifiedSymbol[];
};

describe("compiler: server: SymbolInformation", () => {
  function mapSymbols(symbols: DocumentSymbol[]): SimplifiedSymbol[] {
    return symbols.map((x) => {
      return x.children && x.children.length > 0
        ? { kind: x.kind, name: x.name, children: mapSymbols(x.children) }
        : { kind: x.kind, name: x.name };
    });
  }

  async function getSymbols(source: string): Promise<SimplifiedSymbol[]> {
    const testHost = await createTestServerHost();
    const textDocument = testHost.addOrUpdateDocument("test.tsp", source);
    const symbols = await testHost.server.getDocumentSymbols({
      textDocument,
    });
    return mapSymbols(symbols);
  }

  (
    [
      ["namespaces", "namespace Foo {}", "namespace Bar {}", "Namespace"],
      ["models", "model Foo {}", "model Bar {}", "Struct"],
      ["enums", "enum Foo {}", "enum Bar {}", "Enum"],
      ["union", "union Foo {}", "union Bar {}", "Enum"],
      ["interface", "interface Foo {}", "interface Bar {}", "Interface"],
      ["operation", "op Foo(): void", "op Bar(): void", "Function"],
      ["alias", "alias Foo = {}", "alias Bar = {}", "Variable"],
    ] as const
  ).forEach(([name, code1, code2, kind]) => {
    it(`resolve ${name} as ${kind} symbols`, async () => {
      const symbols = await getSymbols(`
        ${code1}
        ${code2}
      `);
      deepStrictEqual(symbols, [
        { kind: SymbolKind[kind], name: "Foo" },
        { kind: SymbolKind[kind], name: "Bar" },
      ]);
    });
  });

  it("models properties are children of model symbols", async () => {
    const symbols = await getSymbols(`
      model Pet {
        name: string;
        age: number
      }
    `);
    deepStrictEqual(symbols, [
      {
        kind: SymbolKind.Struct,
        name: "Pet",
        children: [
          { kind: SymbolKind.Property, name: "name" },
          { kind: SymbolKind.Property, name: "age" },
        ],
      },
    ]);
  });

  it("model spread show as property of model", async () => {
    const symbols = await getSymbols(`
      model Cat {
        ...Pet
        meow: boolean;
      }
    `);
    deepStrictEqual(symbols, [
      {
        kind: SymbolKind.Struct,
        name: "Cat",
        children: [
          { kind: SymbolKind.Property, name: "Pet" },
          { kind: SymbolKind.Property, name: "meow" },
        ],
      },
    ]);
  });

  it("enum members are children of enum symbol", async () => {
    const symbols = await getSymbols(`
      enum Direction {
        Up,
        Down
      }
    `);
    deepStrictEqual(symbols, [
      {
        kind: SymbolKind.Enum,
        name: "Direction",
        children: [
          { kind: SymbolKind.EnumMember, name: "Up" },
          { kind: SymbolKind.EnumMember, name: "Down" },
        ],
      },
    ]);
  });

  it("enum spread show as property of enum", async () => {
    const symbols = await getSymbols(`
      enum Direction2D {
        ...Direction
        Left,
        Right
      }
    `);
    deepStrictEqual(symbols, [
      {
        kind: SymbolKind.Enum,
        name: "Direction2D",
        children: [
          { kind: SymbolKind.EnumMember, name: "Direction" },
          { kind: SymbolKind.EnumMember, name: "Left" },
          { kind: SymbolKind.EnumMember, name: "Right" },
        ],
      },
    ]);
  });

  it("union variants are children of union symbol", async () => {
    const symbols = await getSymbols(`
      union Pet {
        cat: Cat,
        dog: Dog,
      }
    `);
    deepStrictEqual(symbols, [
      {
        kind: SymbolKind.Enum,
        name: "Pet",
        children: [
          { kind: SymbolKind.EnumMember, name: "cat" },
          { kind: SymbolKind.EnumMember, name: "dog" },
        ],
      },
    ]);
  });

  it("interface operations are children of the interface symbol", async () => {
    const symbols = await getSymbols(`
      interface Store {
        list(): void;
        get(): void;
      }
    `);
    deepStrictEqual(symbols, [
      {
        kind: SymbolKind.Interface,
        name: "Store",
        children: [
          { kind: SymbolKind.Function, name: "list" },
          { kind: SymbolKind.Function, name: "get" },
        ],
      },
    ]);
  });

  describe("namespaces", () => {
    it("resolve elements under the namespace symbol", async () => {
      const symbols = await getSymbols(`
      namespace MyService {
        model Foo {}
        enum Bar {}
      }
    `);
      deepStrictEqual(symbols, [
        {
          kind: SymbolKind.Namespace,
          name: "MyService",
          children: [
            { kind: SymbolKind.Struct, name: "Foo" },
            { kind: SymbolKind.Enum, name: "Bar" },
          ],
        },
      ]);
    });

    it("keeps collapsed namespaces as a single symbol", async () => {
      const symbols = await getSymbols(`
      namespace MyService.Models {
      }
    `);
      deepStrictEqual(symbols, [
        {
          kind: SymbolKind.Namespace,
          name: "MyService.Models",
        },
      ]);
    });

    it("nested namespaces keep hierarchy", async () => {
      const symbols = await getSymbols(`
      namespace MyService {
        namespace Models {}
      }
    `);
      deepStrictEqual(symbols, [
        {
          kind: SymbolKind.Namespace,
          name: "MyService",
          children: [{ kind: SymbolKind.Namespace, name: "Models" }],
        },
      ]);
    });

    it("file namespace symbol englobe every other types", async () => {
      const symbols = await getSymbols(`
      namespace MyOrg.MyService;

      op list();
      
      namespace Models {
        model Pet {}
      }
    `);
      deepStrictEqual(symbols, [
        {
          kind: SymbolKind.Namespace,
          name: "MyOrg.MyService",
          children: [
            { kind: SymbolKind.Function, name: "list" },
            {
              kind: SymbolKind.Namespace,
              name: "Models",
              children: [{ kind: SymbolKind.Struct, name: "Pet" }],
            },
          ],
        },
      ]);
    });
  });
});
