import { deepStrictEqual, ok, strictEqual } from "assert";
import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemTag,
  CompletionList,
} from "vscode-languageserver/node.js";
import { createTestServerHost, extractCursor } from "../../testing/test-server-host.js";

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
        label: "Cadl",
        documentation: undefined,
        kind: 9,
        insertText: "Cadl",
      },
      {
        label: "M",
        documentation: undefined,
        kind: 7,
        detail: "model M",
        insertText: "M",
      },
      {
        label: "object",
        documentation: undefined,
        kind: 7,
        detail: "model Cadl.object",
        insertText: "object",
      },
      {
        label: "Array",
        documentation: undefined,
        kind: 7,
        detail: "model Cadl.Array",
        insertText: "Array",
      },
    ]);
  });

  it("completes imports", async () => {
    const completions = await complete(` import "┆ `, undefined, {
      "test/package.json": JSON.stringify({
        dependencies: {
          "@cadl-lang/library1": "~0.1.0",
          noncadllibrary: "~0.1.0",
        },
        peerDependencies: {
          "@cadl-lang/library2": "~0.1.0",
        },
      }),
      "test/node_modules/@cadl-lang/library1/package.json": JSON.stringify({
        cadlMain: "./foo.js",
      }),
      "test/node_modules/noncadllibrary/package.json": JSON.stringify({}),
      "test/node_modules/@cadl-lang/library2/package.json": JSON.stringify({
        cadlMain: "./foo.js",
      }),
    });
    check(
      completions,
      [
        {
          label: "@cadl-lang/library1",
          commitCharacters: [],
          kind: CompletionItemKind.Module,
        },
        {
          label: "@cadl-lang/library2",
          commitCharacters: [],
          kind: CompletionItemKind.Module,
        },
      ],
      {
        allowAdditionalCompletions: false,
      }
    );
  });

  it("complete import for relative path", async () => {
    const completions = await complete(` import "./┆ `, undefined, {
      "test/bar.cadl": "",
      "test/foo.cadl": "",
      "test/foo/test.cadl": "",
    });
    check(
      completions,
      [
        {
          label: "bar.cadl",
          commitCharacters: [],
          kind: CompletionItemKind.File,
        },
        {
          label: "foo.cadl",
          commitCharacters: [],
          kind: CompletionItemKind.File,
        },
        {
          label: "foo",
          commitCharacters: [],
          kind: CompletionItemKind.Folder,
        },
      ],
      {
        allowAdditionalCompletions: false,
      }
    );
  });

  it("complete import for relative path excludes node_modules", async () => {
    const completions = await complete(` import "./┆ `, undefined, {
      "test/node_modules/test.cadl": "",
      "test/main/test.cadl": "",
      "test/node_modules/foo/test.cadl": "",
    });
    check(
      completions,
      [
        {
          commitCharacters: [],
          kind: 19,
          label: "main",
        },
      ],
      {
        allowAdditionalCompletions: false,
      }
    );
  });

  it("complete import for relative path after node_modules folder", async () => {
    const completions = await complete(` import "./node_modules/┆ `, undefined, {
      "test/node_modules/foo.cadl": "",
    });
    check(
      completions,
      [
        {
          commitCharacters: [],
          kind: 17,
          label: "foo.cadl",
        },
      ],
      {
        allowAdditionalCompletions: false,
      }
    );
  });

  it("import './folder/|' --> don't complete 'folder' complete what's in folder", async () => {
    const completions = await complete(` import "./bar/┆ `, undefined, {
      "test/bar/foo.cadl": "",
    });
    check(
      completions,
      [
        {
          commitCharacters: [],
          kind: 17,
          label: "foo.cadl",
        },
      ],
      {
        allowAdditionalCompletions: false,
      }
    );
  });

  it("complete import for relative path excludes the file evaluated", async () => {
    const completions = await complete(` import "./┆ `, undefined, {
      "test/test.cadl": "",
    });
    check(completions, [], {
      allowAdditionalCompletions: false,
    });
  });

  it("doesn't include imports when there is no project package.json", async () => {
    const completions = await complete(` import "┆ `);

    check(completions, [], {
      allowAdditionalCompletions: false,
    });
  });

  it("completes imports without any dependencies", async () => {
    const completions = await complete(` import "┆ `, undefined, {
      "test/package.json": JSON.stringify({}),
    });

    check(completions, [], {
      allowAdditionalCompletions: false,
    });
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

  it("does not complete functions or decorators in type position", async () => {
    const completions = await complete(
      `
      model M {
        s: ┆
      }
      `
    );

    deepStrictEqual(
      [],
      completions.items.filter(
        (c) => c.label === "doc" || c.label === "getDoc" || c.kind === CompletionItemKind.Function
      )
    );
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
        label: "Cadl",
        documentation: undefined,
        kind: 9,
        insertText: "Cadl",
      },
      {
        label: "M",
        documentation: undefined,
        kind: 7,
        detail: "model M",
        insertText: "M",
      },
      {
        label: "object",
        documentation: undefined,
        kind: 7,
        detail: "model Cadl.object",
        insertText: "object",
      },
      {
        label: "Array",
        documentation: undefined,
        kind: 7,
        detail: "model Cadl.Array",
        insertText: "Array",
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
        detail: "model 𐌰𐌲𐌰𐌲𐌰𐌲",
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
          detail: "model N.A",
          label: "A",
          insertText: "A",
          kind: CompletionItemKind.Class,
          documentation: undefined,
        },
        {
          detail: "model N.B",
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

  it("completes enum members", async () => {
    const completions = await complete(
      `
      enum Fruit {
        Orange,
        Banana
      }

      model M {
        f: Fruit.┆
      }
      `
    );

    check(
      completions,
      [
        {
          detail: "enummember Orange",
          label: "Orange",
          insertText: "Orange",
          kind: CompletionItemKind.EnumMember,
          documentation: undefined,
        },
        {
          detail: "enummember Banana",
          label: "Banana",
          insertText: "Banana",
          kind: CompletionItemKind.EnumMember,
          documentation: undefined,
        },
      ],
      {
        allowAdditionalCompletions: false,
      }
    );
  });

  it("completes union variants", async () => {
    const completions = await complete(
      `
      model Orange {}
      model Banana {}
      union Fruit {
        orange: Orange,
        banana: Banana
      }

      model M {
        f: Fruit.┆
      }
      `
    );

    check(
      completions,
      [
        {
          detail: "unionvariant orange",
          label: "orange",
          insertText: "orange",
          kind: CompletionItemKind.EnumMember,
          documentation: undefined,
        },
        {
          detail: "unionvariant banana",
          label: "banana",
          insertText: "banana",
          kind: CompletionItemKind.EnumMember,
          documentation: undefined,
        },
      ],
      {
        allowAdditionalCompletions: false,
      }
    );
  });

  it("completes namespace operations", async () => {
    const completions = await complete(
      `
       namespace N {
        op test(): void;
       }
       @dec(N.┆)
      `
    );

    check(
      completions,
      [
        {
          detail: "operation N.test",
          label: "test",
          insertText: "test",
          kind: CompletionItemKind.Method,
          documentation: undefined,
        },
      ],
      {
        allowAdditionalCompletions: false,
      }
    );
  });

  it("completes interface operations", async () => {
    const completions = await complete(
      `
       interface I {
        test(): void;
       }
      
       @dec(I.┆
      `
    );

    check(
      completions,
      [
        {
          detail: "operation test",
          label: "test",
          insertText: "test",
          kind: CompletionItemKind.Method,
          documentation: undefined,
        },
      ],
      {
        allowAdditionalCompletions: false,
      }
    );
  });

  it("completes model properties", async () => {
    const completions = await complete(
      `
       model M {
        test: string;
       }
       @dec(M.┆
      `
    );

    check(
      completions,
      [
        {
          detail: "modelproperty test",
          label: "test",
          insertText: "test",
          kind: CompletionItemKind.Field,
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
        detail: "templateparameter Template.Param",
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
        detail: "model N.A",
        label: "A",
        insertText: "A",
        kind: CompletionItemKind.Class,
        documentation: undefined,
      },
    ]);
  });

  it("completes using statements", async () => {
    const completions = await complete(
      `
      namespace A {
        namespace B {
          model M  {}
        }
      }

      using A.┆;
      }
      `
    );

    check(
      completions,
      [
        {
          detail: "namespace A.B",
          label: "B",
          insertText: "B",
          kind: CompletionItemKind.Module,
          documentation: undefined,
        },
      ],
      {
        allowAdditionalCompletions: false,
      }
    );
  });

  it("completes qualified decorators", async () => {
    const js = {
      name: "test/decorators.js",
      js: {
        namespace: "Outer",
        $innerDecorator: function () {},
        $outerDecorator: function () {},
      },
    };
    (js.js.$innerDecorator as any).namespace = "Inner";

    const completions = await complete(
      `
      import "./decorators.js";
      namespace A {
        namespace B {
          model M  {}
        }
      }

      @Outer.┆
      model M {}
      `,
      js
    );
    check(
      completions,
      [
        {
          label: "Inner",
          insertText: "Inner",
          kind: CompletionItemKind.Module,
          documentation: undefined,
        },
        {
          label: "outerDecorator",
          insertText: "outerDecorator",
          kind: CompletionItemKind.Function,
          documentation: undefined,
        },
      ],
      {
        allowAdditionalCompletions: false,
      }
    );
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
          detail: "model N.A",
          label: "A",
          insertText: "A",
          kind: CompletionItemKind.Class,
          documentation: undefined,
        },
        {
          detail: "model N.B",
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

  it("completes deprecated type", async () => {
    const completions = await complete(
      `
      @deprecated("Foo is bad")
      model Foo {}

      model Bar {
        prop: ┆
      }
      `
    );

    check(completions, [
      {
        detail: "model Foo",
        label: "Foo",
        insertText: "Foo",
        kind: CompletionItemKind.Class,
        documentation: undefined,
        tags: [CompletionItemTag.Deprecated],
      },
    ]);
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
      ok(actual, `Expected completion item not found: '${expected.label}'.`);
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

  async function complete(
    sourceWithCursor: string,
    jsSourceFile?: { name: string; js: Record<string, any> },
    additionalFiles?: Record<string, string>
  ): Promise<CompletionList> {
    const { source, pos } = extractCursor(sourceWithCursor);
    const testHost = await createTestServerHost();
    if (jsSourceFile) {
      testHost.addJsFile(jsSourceFile.name, jsSourceFile.js);
    }
    if (additionalFiles) {
      for (const [key, value] of Object.entries(additionalFiles)) {
        testHost.addCadlFile(key, value);
      }
    }
    testHost.addCadlFile("main.cadl", 'import "./test/test.cadl";');
    const textDocument = testHost.addOrUpdateDocument("test/test.cadl", source);
    return await testHost.server.complete({
      textDocument,
      position: textDocument.positionAt(pos),
    });
  }
});
