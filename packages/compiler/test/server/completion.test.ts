import { deepStrictEqual, ok, strictEqual } from "assert";
import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemTag,
  CompletionList,
  MarkupKind,
} from "vscode-languageserver/node.js";
import {
  createTestServerHost,
  extractCursor,
  extractSquiggles,
} from "../../testing/test-server-host.js";

// cspell:ignore 𐌰𐌲𐌰𐌲𐌰𐌲

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
        kind: CompletionItemKind.Unit,
        documentation: {
          kind: MarkupKind.Markdown,
          value: "```typespec\nscalar TypeSpec.int32\n```",
        },
      },
      {
        label: "Record",
        insertText: "Record",
        kind: CompletionItemKind.Class,
        documentation: { kind: MarkupKind.Markdown, value: "```typespec\nmodel Record<T>\n```" },
      },
    ]);
  });

  describe("library imports", () => {
    async function testCompleteLibrary(code: string) {
      const { source, pos, end } = extractSquiggles(code);
      const completions = await complete(source, undefined, {
        "test/package.json": JSON.stringify({
          dependencies: {
            "@typespec/library1": "~0.1.0",
            "non-typespec-library": "~0.1.0",
          },
          peerDependencies: {
            "@typespec/library2": "~0.1.0",
          },
        }),
        "test/node_modules/@typespec/library1/package.json": JSON.stringify({
          typespecMain: "./foo.js",
        }),
        "test/node_modules/non-typespec-library/package.json": JSON.stringify({}),
        "test/node_modules/@typespec/library2/package.json": JSON.stringify({
          typespecMain: "./foo.js",
        }),
      });

      const expectedRange = {
        start: { character: pos, line: 0 },
        end: {
          character: end - 1 /** End is offset by one because there is the cursor charchater */,
          line: 0,
        },
      };
      check(
        completions,
        [
          {
            label: "@typespec/library1",
            textEdit: {
              newText: "@typespec/library1",
              range: expectedRange,
            },
            kind: CompletionItemKind.Module,
          },
          {
            label: "@typespec/library2",
            kind: CompletionItemKind.Module,
            textEdit: {
              newText: "@typespec/library2",
              range: expectedRange,
            },
          },
        ],
        {
          allowAdditionalCompletions: false,
        }
      );
    }
    it(`complete at start of "`, () => testCompleteLibrary(` import "~~~┆~~~"`));
    it("complete after some text in import", () =>
      testCompleteLibrary(` import "~~~@typespec┆~~~"`));
    it("complete in middle of import", () => testCompleteLibrary(` import "~~~@typespec┆libr~~~"`));

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
  });

  describe("relative path import", () => {
    it("complete import for relative path", async () => {
      const completions = await complete(` import "./┆ `, undefined, {
        "test/bar.tsp": "",
        "test/foo.tsp": "",
        "test/foo/test.tsp": "",
      });
      check(
        completions,
        [
          {
            label: "bar.tsp",
            commitCharacters: [],
            kind: CompletionItemKind.File,
          },
          {
            label: "foo.tsp",
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
        "test/node_modules/test.tsp": "",
        "test/main/test.tsp": "",
        "test/node_modules/foo/test.tsp": "",
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
        "test/node_modules/foo.tsp": "",
      });
      check(
        completions,
        [
          {
            commitCharacters: [],
            kind: 17,
            label: "foo.tsp",
          },
        ],
        {
          allowAdditionalCompletions: false,
        }
      );
    });

    it("import './folder/|' --> don't complete 'folder' complete what's in folder", async () => {
      const completions = await complete(` import "./bar/┆ `, undefined, {
        "test/bar/foo.tsp": "",
      });
      check(
        completions,
        [
          {
            commitCharacters: [],
            kind: 17,
            label: "foo.tsp",
          },
        ],
        {
          allowAdditionalCompletions: false,
        }
      );
    });

    it("complete import for relative path excludes the file evaluated", async () => {
      const completions = await complete(` import "./┆ `, undefined, {
        "test/test.tsp": "",
      });
      check(completions, [], {
        allowAdditionalCompletions: false,
      });
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
        documentation: {
          kind: MarkupKind.Markdown,
          value:
            "```typespec\ndec TypeSpec.doc(target: unknown, doc: TypeSpec.string, formatArgs?: TypeSpec.object)\n```",
        },
      },
    ]);
  });

  it("completes augment decorators", async () => {
    const completions = await complete(
      `
      @@┆
      `
    );
    check(completions, [
      {
        label: "doc",
        insertText: "doc",
        kind: CompletionItemKind.Function,
        documentation: {
          kind: MarkupKind.Markdown,
          value:
            "```typespec\ndec TypeSpec.doc(target: unknown, doc: TypeSpec.string, formatArgs?: TypeSpec.object)\n```",
        },
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
        documentation: {
          kind: MarkupKind.Markdown,
          value:
            "```typespec\ndec TypeSpec.doc(target: unknown, doc: TypeSpec.string, formatArgs?: TypeSpec.object)\n```",
        },
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
        kind: CompletionItemKind.Unit,
        documentation: {
          kind: MarkupKind.Markdown,
          value: "```typespec\nscalar TypeSpec.string\n```",
        },
      },
    ]);
  });

  it("completes partial backticked identifiers", async () => {
    const completions = await complete(
      `
      enum \`enum\` {
        \`foo-bar\`
      }
      model M {
        s: \`enum\`.f┆
      }
      `
    );
    check(completions, [
      {
        label: "foo-bar",
        insertText: "`foo-bar`",
        kind: CompletionItemKind.EnumMember,
        documentation: { kind: MarkupKind.Markdown, value: "```cadl\nenum.foo-bar\n```" },
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
        documentation: { kind: MarkupKind.Markdown, value: "```typespec\nmodel 𐌰𐌲𐌰𐌲𐌰𐌲\n```" },
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
          documentation: { kind: MarkupKind.Markdown, value: "```typespec\nmodel N.A\n```" },
        },
        {
          label: "B",
          insertText: "B",
          kind: CompletionItemKind.Class,
          documentation: { kind: MarkupKind.Markdown, value: "```typespec\nmodel N.B\n```" },
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
          label: "Orange",
          insertText: "Orange",
          kind: CompletionItemKind.EnumMember,
          documentation: {
            kind: MarkupKind.Markdown,
            value: "(enum member)\n```typespec\nFruit.Orange\n```",
          },
        },
        {
          label: "Banana",
          insertText: "Banana",
          kind: CompletionItemKind.EnumMember,
          documentation: {
            kind: MarkupKind.Markdown,
            value: "(enum member)\n```typespec\nFruit.Banana\n```",
          },
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
          label: "orange",
          insertText: "orange",
          kind: CompletionItemKind.EnumMember,
          documentation: {
            kind: MarkupKind.Markdown,
            value: "(union variant)\n```typespec\nFruit.orange: Orange\n```",
          },
        },
        {
          label: "banana",
          insertText: "banana",
          kind: CompletionItemKind.EnumMember,
          documentation: {
            kind: MarkupKind.Markdown,
            value: "(union variant)\n```typespec\nFruit.banana: Banana\n```",
          },
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
       @myDec(N.┆)
      `
    );

    check(
      completions,
      [
        {
          label: "test",
          insertText: "test",
          kind: CompletionItemKind.Method,
          documentation: {
            kind: MarkupKind.Markdown,
            value: "```typespec\nop N.test(): void\n```",
          },
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
        test(param: string): void;
       }
      
       @myDec(I.┆
      `
    );

    check(
      completions,
      [
        {
          label: "test",
          insertText: "test",
          kind: CompletionItemKind.Method,
          documentation: {
            kind: MarkupKind.Markdown,
            value: "```typespec\nop I.test(param: TypeSpec.string): void\n```",
          },
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
       @myDec(M.┆
      `
    );

    check(
      completions,
      [
        {
          label: "test",
          insertText: "test",
          kind: CompletionItemKind.Field,
          documentation: {
            kind: MarkupKind.Markdown,
            value: "(model property)\n```typespec\nM.test: TypeSpec.string\n```",
          },
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
        documentation: {
          kind: MarkupKind.Markdown,
          value: "(template parameter)\n```typespec\nParam\n```",
        },
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
        documentation: { kind: MarkupKind.Markdown, value: "```typespec\nmodel N.A\n```" },
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
          label: "B",
          insertText: "B",
          kind: CompletionItemKind.Module,
          documentation: { kind: MarkupKind.Markdown, value: "```typespec\nnamespace A.B\n```" },
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
          label: "A",
          insertText: "A",
          kind: CompletionItemKind.Class,
          documentation: { kind: MarkupKind.Markdown, value: "```typespec\nmodel N.A\n```" },
        },
        {
          label: "B",
          insertText: "B",
          kind: CompletionItemKind.Class,
          documentation: { kind: MarkupKind.Markdown, value: "```typespec\nmodel N.B\n```" },
        },
      ],
      {
        allowAdditionalCompletions: false,
      }
    );
  });

  it("shows doc comment documentation", async () => {
    const completions = await complete(
      `
      namespace N {
        /**
         * Just an example.
         *
         * @param value The value.
         *
         * @example
         * \`\`\`typespec
         * @hello
         * model M {}
         * \`\`\`
         */
        extern dec hello(value: string);
      }
      @N.┆
      `
    );

    check(
      completions,
      [
        {
          label: "hello",
          insertText: "hello",
          kind: CompletionItemKind.Function,
          documentation: {
            kind: MarkupKind.Markdown,
            value:
              "```typespec\ndec N.hello(value: TypeSpec.string)\n```\n\nJust an example.\n\n_@param_ `value` —\nThe value.\n\n_@example_ —\n```typespec\n@hello\nmodel M {}\n```",
          },
        },
      ],
      { fullDocs: true }
    );
  });

  it("completes aliased interface operations", async () => {
    const completions = await complete(
      `
      interface Foo {
        op Bar(): string;
      }

      alias FooAlias= Foo;
      alias A = FooAlias.┆`
    );
    check(completions, [
      {
        label: "Bar",
        insertText: "Bar",
        kind: CompletionItemKind.Method,
        documentation: {
          kind: "markdown",
          value: "```typespec\nop Foo.Bar(): TypeSpec.string\n```",
        },
      },
    ]);
  });

  it("completes aliased model properties", async () => {
    const completions = await complete(
      `
      model Foo {
        bar: string;
      }

      alias FooAlias = Foo;
      alias A = FooAlias.┆`
    );
    check(completions, [
      {
        label: "bar",
        insertText: "bar",
        kind: CompletionItemKind.Field,
        documentation: {
          kind: "markdown",
          value: "(model property)\n```typespec\nFoo.bar: TypeSpec.string\n```",
        },
      },
    ]);
  });

  it("completes aliased instantiated interface operations", async () => {
    const completions = await complete(
      `
      interface Foo<T> {
        op Bar(): T;
      }

      alias FooOfString = Foo<string>;
      alias A = FooOfString.┆`
    );
    check(completions, [
      {
        label: "Bar",
        insertText: "Bar",
        kind: CompletionItemKind.Method,
        documentation: {
          kind: "markdown",
          value: "```typespec\nop Foo<TypeSpec.string>.Bar(): TypeSpec.string\n```",
        },
      },
    ]);
  });

  it("completes aliased instantiated model properties", async () => {
    const completions = await complete(
      `
      model Foo<T> {
        bar: T;
      }

      alias FooOfString = Foo<string>;
      alias A = FooOfString.┆`
    );
    check(completions, [
      {
        label: "bar",
        insertText: "bar",
        kind: CompletionItemKind.Field,
        documentation: {
          kind: "markdown",
          value: "(model property)\n```typespec\nFoo<TypeSpec.string>.bar: TypeSpec.string\n```",
        },
      },
    ]);
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
        label: "Foo",
        insertText: "Foo",
        kind: CompletionItemKind.Class,
        documentation: { kind: MarkupKind.Markdown, value: "```typespec\nmodel Foo\n```" },
        tags: [CompletionItemTag.Deprecated],
      },
    ]);
  });

  function check(
    list: CompletionList,
    expectedItems: CompletionItem[],
    options?: {
      allowAdditionalCompletions?: boolean;
      fullDocs?: boolean;
    }
  ) {
    options = {
      allowAdditionalCompletions: true,
      fullDocs: false,
      ...options,
    };

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

      // Unless given the fullDocs option, tests only give their expectation for the first
      // markdown paragraph.
      if (
        !options.fullDocs &&
        typeof actual?.documentation === "object" &&
        actual.documentation.value.indexOf("\n\n") > 0
      ) {
        actual.documentation = {
          kind: MarkupKind.Markdown,
          value: actual.documentation.value.substring(
            0,
            actual.documentation.value.indexOf("\n\n")
          ),
        };
      }

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
        testHost.addTypeSpecFile(key, value);
      }
    }
    testHost.addTypeSpecFile("main.tsp", 'import "./test/test.tsp";');
    const textDocument = testHost.addOrUpdateDocument("test/test.tsp", source);
    return await testHost.server.complete({
      textDocument,
      position: textDocument.positionAt(pos),
    });
  }
});
