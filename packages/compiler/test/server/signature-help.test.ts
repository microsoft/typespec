import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { MarkupKind, SignatureHelp } from "vscode-languageserver/node.js";
import { createTestServerHost, extractCursor } from "../../src/testing/test-server-host.js";

describe("compiler: server: signature help", () => {
  describe("standard decorator", () => {
    it("get signature for a decorator with a single parameter", async () => {
      const help = await getSignatureHelpAtCursor(
        `
      @single(┆)
      `,
      );
      deepStrictEqual(help, {
        activeParameter: 0,
        activeSignature: 0,
        signatures: [
          {
            activeParameter: 0,
            documentation: {
              kind: MarkupKind.Markdown,
              value: "Decorator with a single param",
            },
            label: "@single(arg: string)",
            parameters: [
              {
                label: "arg: string",
                documentation: {
                  kind: MarkupKind.Markdown,
                  value: "The arg",
                },
              },
            ],
          },
        ],
      });
    });

    describe("decorator with multiple parameters", () => {
      function assertHelp(help: SignatureHelp | undefined, activeParameter: number) {
        deepStrictEqual(help, {
          activeParameter: 0,
          activeSignature: 0,
          signatures: [
            {
              activeParameter,
              documentation: {
                kind: MarkupKind.Markdown,
                value: "Decorator with multiple params",
              },
              label: "@multiple(foo: string, bar?: string)",
              parameters: [
                {
                  label: "foo: string",
                  documentation: {
                    kind: MarkupKind.Markdown,
                    value: "The first arg",
                  },
                },
                {
                  label: "bar?: string",
                  documentation: {
                    kind: MarkupKind.Markdown,
                    value: "The second arg",
                  },
                },
              ],
            },
          ],
        });
      }
      it("highlight first parameter when no args are present", async () => {
        const help = await getSignatureHelpAtCursor(
          `
        @multiple(┆)
        `,
        );
        assertHelp(help, 0);
      });

      it("highlight 2nd parameter when first arg is present", async () => {
        const help = await getSignatureHelpAtCursor(
          `
        @multiple("abc", ┆)
        `,
        );
        assertHelp(help, 1);
      });

      it("highlight 1st parameter when cursor points back to 1st argument", async () => {
        const help = await getSignatureHelpAtCursor(
          `
        @multiple("abc"┆, "def")
        `,
        );
        assertHelp(help, 0);
      });

      it("trailing space and no close paren", async () => {
        const help = await getSignatureHelpAtCursor(
          `
          @multiple("abc", ┆
          `,
        );
        assertHelp(help, 1);
      });

      it("trailing comment and no close paren", async () => {
        const help = await getSignatureHelpAtCursor(
          `
          @multiple("abc", /*Test*/┆
          `,
        );
        assertHelp(help, 1);
      });

      it("leading trivia", async () => {
        const help = await getSignatureHelpAtCursor(
          `
          @multiple( ┆ /* first arg */ "hello", "world")
          `,
        );
        assertHelp(help, 0);
      });

      it("trailing trivia", async () => {
        const help = await getSignatureHelpAtCursor(
          `
          @multiple("hello" /* ┆ test */, "world")
          `,
        );
        assertHelp(help, 0);
      });
    });

    describe("decorator with rest parameter", () => {
      function assertHelp(help: SignatureHelp | undefined, activeParameter: number) {
        deepStrictEqual(help, {
          activeParameter: 0,
          activeSignature: 0,
          signatures: [
            {
              documentation: {
                kind: MarkupKind.Markdown,
                value: "Decorator with rest param",
              },
              activeParameter,
              label: "@rest(foo: string, ...others: string[])",
              parameters: [
                {
                  label: "foo: string",
                  documentation: {
                    kind: MarkupKind.Markdown,
                    value: "The first arg",
                  },
                },
                {
                  label: "...others: string[]",
                  documentation: {
                    kind: MarkupKind.Markdown,
                    value: "The rest of the args",
                  },
                },
              ],
            },
          ],
        });
      }
      it("highlight first parameter when no args are present", async () => {
        const help = await getSignatureHelpAtCursor(
          `
        @rest(┆)
        `,
        );
        assertHelp(help, 0);
      });

      it("highlight 2nd parameter(rest) when first arg is present", async () => {
        const help = await getSignatureHelpAtCursor(
          `
        @rest("abc", ┆)
        `,
        );
        assertHelp(help, 1);
      });

      it("highlight 2nd parameter(rest) when when there is already 2 args present", async () => {
        const help = await getSignatureHelpAtCursor(
          `
        @rest("abc", "def", ┆)
        `,
        );
        assertHelp(help, 1);
      });
    });

    async function getSignatureHelpAtCursor(
      sourceWithCursor: string,
    ): Promise<SignatureHelp | undefined> {
      const wholeFile = `
      import "./dec-types.js";
      
      /** 
       * Decorator with a single param
       * @param arg The arg
       */
      extern dec single(target: unknown, arg: string);
      
      /**
       * Decorator with multiple params
       * @param foo The first arg
       * @param bar The second arg
       */
      extern dec multiple(target: unknown, foo: string, bar?: string);
      
      /**
       * Decorator with rest param
       * @param foo The first arg
       * @param others The rest of the args
       */
      extern dec rest(target: unknown, foo: string, ...others: string[]);

    ${sourceWithCursor}`;
      const { source, pos } = extractCursor(wholeFile);
      const testHost = await createTestServerHost();
      testHost.addJsFile("dec-types.js", {
        $single: () => {},
        $multiple: () => {},
        $rest: () => {},
      });
      const textDocument = testHost.addOrUpdateDocument("test/test.tsp", source);
      return await testHost.server.getSignatureHelp({
        textDocument,
        position: textDocument.positionAt(pos),
      });
    }
  });

  describe("augment decorator", () => {
    it("get signature for a decorator with a single parameter", async () => {
      const help = await getSignatureHelpAtCursor(
        `
        @@single(┆)
        `,
      );
      deepStrictEqual(help, {
        activeParameter: 0,
        activeSignature: 0,
        signatures: [
          {
            activeParameter: 0,
            documentation: {
              kind: MarkupKind.Markdown,
              value: "Decorator with a single param",
            },
            label: "@@single(target: unknown, arg: string)",
            parameters: [
              {
                label: "target: unknown",
              },
              {
                label: "arg: string",
                documentation: {
                  kind: MarkupKind.Markdown,
                  value: "The arg",
                },
              },
            ],
          },
        ],
      });
    });

    describe("decorator with multiple parameters", () => {
      function assertHelp(help: SignatureHelp | undefined, activeParameter: number) {
        deepStrictEqual(help, {
          activeParameter: 0,
          activeSignature: 0,
          signatures: [
            {
              activeParameter,
              documentation: {
                kind: MarkupKind.Markdown,
                value: "Decorator with multiple params",
              },
              label: "@@multiple(target: unknown, foo: string, bar?: string)",
              parameters: [
                {
                  label: "target: unknown",
                },
                {
                  label: "foo: string",
                  documentation: {
                    kind: MarkupKind.Markdown,
                    value: "The first arg",
                  },
                },
                {
                  label: "bar?: string",
                  documentation: {
                    kind: MarkupKind.Markdown,
                    value: "The second arg",
                  },
                },
              ],
            },
          ],
        });
      }
      it("highlight target parameter when no args are present", async () => {
        const help = await getSignatureHelpAtCursor(
          `
          @@multiple(┆)
          `,
        );
        assertHelp(help, 0);
      });

      it("highlight first parameter when no non-target args are present", async () => {
        const help = await getSignatureHelpAtCursor(
          `
          @@multiple(target, ┆)
          `,
        );
        assertHelp(help, 1);
      });

      it("highlight 2nd parameter when first arg is present", async () => {
        const help = await getSignatureHelpAtCursor(
          `
          @@multiple(target, "abc", ┆)
          `,
        );
        assertHelp(help, 2);
      });

      it("highlight 1st parameter when cursor points back to 1st argument", async () => {
        const help = await getSignatureHelpAtCursor(
          `
          @@multiple(target, "abc"┆, "def")
          `,
        );
        assertHelp(help, 1);
      });

      it("trailing space and no close paren", async () => {
        const help = await getSignatureHelpAtCursor(
          `
          @@multiple(target, "abc", ┆
          `,
        );
        assertHelp(help, 2);
      });

      it("trailing comment and no close paren", async () => {
        const help = await getSignatureHelpAtCursor(
          `
          @@multiple(target, "abc", /* Test */ ┆
          `,
        );
        assertHelp(help, 2);
      });

      it("leading trivia", async () => {
        const help = await getSignatureHelpAtCursor(
          `
          @@multiple(target, ┆ /* first arg */ "hello", "world")
          `,
        );
        assertHelp(help, 1);
      });

      it("trailing trivia", async () => {
        const help = await getSignatureHelpAtCursor(
          `
          @@multiple(target, "hello" /* ┆ test */, "world" )
          `,
        );
        assertHelp(help, 1);
      });
    });

    describe("decorator with rest parameter", () => {
      function assertHelp(help: SignatureHelp | undefined, activeParameter: number) {
        deepStrictEqual(help, {
          activeParameter: 0,
          activeSignature: 0,
          signatures: [
            {
              documentation: {
                kind: MarkupKind.Markdown,
                value: "Decorator with rest param",
              },
              activeParameter,
              label: "@@rest(target: unknown, foo: string, ...others: string[])",
              parameters: [
                {
                  label: "target: unknown",
                },
                {
                  label: "foo: string",
                  documentation: {
                    kind: MarkupKind.Markdown,
                    value: "The first arg",
                  },
                },
                {
                  label: "...others: string[]",
                  documentation: {
                    kind: MarkupKind.Markdown,
                    value: "The rest of the args",
                  },
                },
              ],
            },
          ],
        });
      }
      it("highlight first parameter when no args are present", async () => {
        const help = await getSignatureHelpAtCursor(
          `
        @@rest(target, ┆)
        `,
        );
        assertHelp(help, 1);
      });

      it("highlight 2nd parameter(rest) when first arg is present", async () => {
        const help = await getSignatureHelpAtCursor(
          `
          @@rest(target, "abc", ┆)
          `,
        );
        assertHelp(help, 2);
      });

      it("highlight 2nd parameter(rest) when when there is already 2 args present", async () => {
        const help = await getSignatureHelpAtCursor(
          `
          @@rest(target, "abc", "def", ┆)
          `,
        );
        assertHelp(help, 2);
      });
    });

    async function getSignatureHelpAtCursor(
      sourceWithCursor: string,
    ): Promise<SignatureHelp | undefined> {
      const wholeFile = `
      import "./dec-types.js";
      
      /** 
       * Decorator with a single param
       * @param arg The arg
       */
      extern dec single(target: unknown, arg: string);
      
      /**
       * Decorator with multiple params
       * @param foo The first arg
       * @param bar The second arg
       */
      extern dec multiple(target: unknown, foo: string, bar?: string);
      
      /**
       * Decorator with rest param
       * @param foo The first arg
       * @param others The rest of the args
       */
      extern dec rest(target: unknown, foo: string, ...others: string[]);

    ${sourceWithCursor}`;
      const { source, pos } = extractCursor(wholeFile);
      const testHost = await createTestServerHost();
      testHost.addJsFile("dec-types.js", {
        $single: () => {},
        $multiple: () => {},
        $rest: () => {},
      });
      const textDocument = testHost.addOrUpdateDocument("test/test.tsp", source);
      return await testHost.server.getSignatureHelp({
        textDocument,
        position: textDocument.positionAt(pos),
      });
    }
  });

  describe("template", () => {
    for (const type of ["Model", "Alias"]) {
      describe(type.toLowerCase(), () => {
        it("get signature for a template with a single parameter", async () => {
          const help = await getSignatureHelpAtCursor(
            `
            alias A = ${type}1<┆
            `,
          );
          deepStrictEqual(help, {
            activeParameter: 0,
            activeSignature: 0,
            signatures: [
              {
                activeParameter: 0,
                documentation: {
                  kind: MarkupKind.Markdown,
                  value: `${type} with a single template param`,
                },
                label: `${type}1<T>`,
                parameters: [
                  {
                    label: "T",
                    documentation: {
                      kind: MarkupKind.Markdown,
                      value: "The template arg",
                    },
                  },
                ],
              },
            ],
          });
        });

        describe("template with multiple parameters", () => {
          function assertHelp(help: SignatureHelp | undefined, activeParameter: number) {
            deepStrictEqual(help, {
              activeParameter: 0,
              activeSignature: 0,
              signatures: [
                {
                  activeParameter,
                  documentation: {
                    kind: MarkupKind.Markdown,
                    value: `${type} with two template params`,
                  },
                  label: `${type}2<TFirst, TSecond>`,
                  parameters: [
                    {
                      label: "TFirst",
                      documentation: {
                        kind: MarkupKind.Markdown,
                        value: "The first template arg",
                      },
                    },
                    {
                      label: "TSecond",
                      documentation: {
                        kind: MarkupKind.Markdown,
                        value: "The second template arg",
                      },
                    },
                  ],
                },
              ],
            });
          }

          it("highlight 2nd parameter when first arg is present", async () => {
            const help = await getSignatureHelpAtCursor(
              `
              alias A = ${type}2<string, ┆>
              `,
            );
            assertHelp(help, 1);
          });

          it("highlight 1st parameter when cursor points back to 1st argument", async () => {
            const help = await getSignatureHelpAtCursor(
              `
              alias A = ${type}2<string┆, int32>
              `,
            );
            assertHelp(help, 0);
          });

          it("trailing space and no closing angle bracket", async () => {
            const help = await getSignatureHelpAtCursor(
              `
              alias A = ${type}2<"abc", ┆
              `,
            );
            assertHelp(help, 1);
          });

          it("trailing comment and no closing angle bracket", async () => {
            const help = await getSignatureHelpAtCursor(
              `
              alias A = ${type}2<"abc", /*Test*/┆
              `,
            );
            assertHelp(help, 1);
          });

          it("leading trivia", async () => {
            const help = await getSignatureHelpAtCursor(
              `
              alias A = ${type}2< ┆ /* first arg */ "hello", "world">
              `,
            );
            assertHelp(help, 0);
          });

          it("trailing trivia", async () => {
            const help = await getSignatureHelpAtCursor(
              `
              alias A = ${type}2<"hello" /* ┆ test */, "world" >
              `,
            );
            assertHelp(help, 0);
          });
        });
      });
    }
    async function getSignatureHelpAtCursor(
      sourceWithCursor: string,
    ): Promise<SignatureHelp | undefined> {
      const wholeFile = `
      /** 
       * Model with a single template param
       * @template T The template arg
       */
      model Model1<T> {}
      
      /** 
       * Model with two template params
       * @template TFirst The first template arg
       * @template TSecond The second template arg
       */
      model Model2<TFirst, TSecond> {}

      /**
       * Alias with a single template param
       * @template T The template arg
       */
      alias Alias1<T> = {}
      

      /**
       * Alias with two template params
       * @template TFirst The first template arg
       * @template TSecond The second template arg
       */
      alias Alias2<TFirst, TSecond> = {}
      ${sourceWithCursor}
      `;

      const { source, pos } = extractCursor(wholeFile);
      const testHost = await createTestServerHost();
      const textDocument = testHost.addOrUpdateDocument("test/test.tsp", source);
      return await testHost.server.getSignatureHelp({
        textDocument,
        position: textDocument.positionAt(pos),
      });
    }
  });
});
