import { deepStrictEqual, ok, strictEqual } from "assert";
import { CompletionItem, CompletionItemKind, CompletionList } from "vscode-languageserver/node.js";
import { parse } from "../../core/parser.js";
import { dumpAST } from "../test-parser.js";
import { createTestServerHost } from "./test-server-host.js";

describe("compiler: server: completion", () => {
  it("completes globals", async () => {
    const completions = await complete(
      `
      model M {
        s: ┆
      }
      `
    );

    check(completions, [
      {
        label: "int32",
        insertText: "int32",
        kind: CompletionItemKind.Keyword,
        documentation: undefined,
      },
      {
        label: "Map",
        insertText: "Map",
        kind: CompletionItemKind.Class,
        documentation: undefined,
      },
    ]);
  });

  it("completes decorators on namespaces", async () => {
    const completions = await complete(
      `
      @┆
      namespace N {}
      `
    );

    check(completions, [
      {
        label: "doc",
        insertText: "doc",
        kind: CompletionItemKind.Function,
        documentation: undefined,
      },
    ]);
  });

  it("completes decorators on models", async () => {
    const completions = await complete(
      `
      @┆
      model M {}
      `
    );

    check(completions, [
      {
        label: "doc",
        insertText: "doc",
        kind: CompletionItemKind.Function,
        documentation: undefined,
      },
    ]);
  });

  it("completes partial identifiers", async () => {
    const completions = await complete(
      `
      model M {
        s: stri┆
      }
      `
    );

    check(completions, [
      {
        label: "string",
        insertText: "string",
        kind: CompletionItemKind.Keyword,
        documentation: undefined,
      },
    ]);
  });

  it("completes partial identifier with astral character", async () => {
    const completions = await complete(
      `
      model 𐌰𐌲𐌰𐌲𐌰𐌲 {}
      model M {
        s: 𐌰𐌲┆
      }
      `
    );

    check(completions, [
      {
        label: "𐌰𐌲𐌰𐌲𐌰𐌲",
        insertText: "𐌰𐌲𐌰𐌲𐌰𐌲",
        kind: CompletionItemKind.Class,
        documentation: undefined,
      },
    ]);
  });

  it("completes namespace members", async () => {
    const completions = await complete(
      `
      namespace N {
        model A {}
        model B {}
      }

      model M extends N.┆
      `
    );

    check(
      completions,
      [
        {
          label: "A",
          insertText: "A",
          kind: CompletionItemKind.Class,
          documentation: undefined,
        },
        {
          label: "B",
          insertText: "B",
          kind: CompletionItemKind.Class,
          documentation: undefined,
        },
      ],
      {
        allowAdditionalCompletions: false,
      }
    );
  });

  it("completes template parameter uses", async () => {
    const completions = await complete(
      `
      model Template<Param> {
        prop: ┆
      }
      `
    );

    check(completions, [
      {
        label: "Param",
        insertText: "Param",
        kind: CompletionItemKind.Struct,
        documentation: undefined,
      },
    ]);
  });

  it("completes sibling in namespace", async () => {
    const completions = await complete(
      `
      namespace N {
        model A {}
        model B extends ┆
      }
        `
    );

    check(completions, [
      {
        label: "A",
        insertText: "A",
        kind: CompletionItemKind.Class,
        documentation: undefined,
      },
    ]);
  });

  it("deals with trivia before missing identifier", async () => {
    const completions = await complete(
      `
      namespace N {
        model A {}
        model B {}
      }

      model M extends N.┆
      // single line comment
      /*
        multi-line comment
      */
      {/*<-- missing identifier immediately before this brace*/}
      `
    );

    check(
      completions,
      [
        {
          label: "A",
          insertText: "A",
          kind: CompletionItemKind.Class,
          documentation: undefined,
        },
        {
          label: "B",
          insertText: "B",
          kind: CompletionItemKind.Class,
          documentation: undefined,
        },
      ],
      {
        allowAdditionalCompletions: false,
      }
    );
  });

  function check(
    list: CompletionList,
    expectedItems: CompletionItem[],
    options = { allowAdditionalCompletions: true }
  ) {
    ok(!list.isIncomplete, "list should not be incomplete.");

    const expectedMap = new Map(expectedItems.map((i) => [i.label, i]));
    strictEqual(
      expectedMap.size,
      expectedItems.length,
      "Duplicate labels in expected completions."
    );

    const actualMap = new Map(list.items.map((i) => [i.label, i]));
    strictEqual(actualMap.size, list.items.length, "Duplicate labels in actual completions.");

    for (const expected of expectedItems) {
      const actual = actualMap.get(expected.label);
      deepStrictEqual(actual, expected);
      actualMap.delete(actual.label);
      expectedMap.delete(expected.label);
    }

    const expectedRemaining = Array.from(expectedMap.values());
    deepStrictEqual(expectedRemaining, [], "Not all expected completions were found.");

    if (!options.allowAdditionalCompletions) {
      const actualRemaining = Array.from(actualMap.values());
      deepStrictEqual(actualRemaining, [], "Extra completions were found.");
    }
  }

  async function complete(sourceWithCursor: string): Promise<CompletionList> {
    const pos = sourceWithCursor.indexOf("┆");
    ok(pos >= 0, "no cursor found");

    const source = sourceWithCursor.replace("┆", "");
    const testHost = await createTestServerHost();
    const textDocument = testHost.addOrUpdateDocument("untitled:test.cadl", source);
    return await testHost.server.complete({
      textDocument,
      position: textDocument.positionAt(pos),
    });
  }
});
