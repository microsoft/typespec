import { deepStrictEqual } from "assert";
import { MarkupKind, SignatureHelp } from "vscode-languageserver/node.js";
import { createTestServerHost, extractCursor } from "../../testing/test-server-host.js";

describe("compiler: server: signature help", () => {
  describe("standard decorator", () => {
    it("get signature for a decorator with a single parameter", async () => {
      const help = await getSignatureHelpAtCursor(
        `
      @single(┆)
      `
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
            label: "@single(arg: Cadl.string)",
            parameters: [
              {
                label: "arg: Cadl.string",
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
              label: "@multiple(foo: Cadl.string, bar?: Cadl.string)",
              parameters: [
                {
                  label: "foo: Cadl.string",
                  documentation: {
                    kind: MarkupKind.Markdown,
                    value: "The first arg",
                  },
                },
                {
                  label: "bar?: Cadl.string",
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
        `
        );
        assertHelp(help, 0);
      });

      it("highlight 2nd parameter when first arg is present", async () => {
        const help = await getSignatureHelpAtCursor(
          `
        @multiple("abc", ┆)
        `
        );
        assertHelp(help, 1);
      });

      it("highlight 1st parameter when cursor points back to 1st argument", async () => {
        const help = await getSignatureHelpAtCursor(
          `
        @multiple("abc"┆, "def")
        `
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
              label: "@rest(foo: Cadl.string, ...others: Cadl.string[])",
              parameters: [
                {
                  label: "foo: Cadl.string",
                  documentation: {
                    kind: MarkupKind.Markdown,
                    value: "The first arg",
                  },
                },
                {
                  label: "...others: Cadl.string[]",
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
        `
        );
        assertHelp(help, 0);
      });

      it("highlight 2nd parameter(rest) when first arg is present", async () => {
        const help = await getSignatureHelpAtCursor(
          `
        @rest("abc", ┆)
        `
        );
        assertHelp(help, 1);
      });

      it("highlight 2nd parameter(rest) when when there is already 2 args present", async () => {
        const help = await getSignatureHelpAtCursor(
          `
        @rest("abc", "def", ┆)
        `
        );
        assertHelp(help, 1);
      });
    });

    async function getSignatureHelpAtCursor(
      sourceWithCursor: string
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
      const textDocument = testHost.addOrUpdateDocument("test/test.cadl", source);
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
        `
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
            label: "@@single(target: unknown, arg: Cadl.string)",
            parameters: [
              {
                label: "target: unknown",
              },
              {
                label: "arg: Cadl.string",
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
              label: "@@multiple(target: unknown, foo: Cadl.string, bar?: Cadl.string)",
              parameters: [
                {
                  label: "target: unknown",
                },
                {
                  label: "foo: Cadl.string",
                  documentation: {
                    kind: MarkupKind.Markdown,
                    value: "The first arg",
                  },
                },
                {
                  label: "bar?: Cadl.string",
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
          `
        );
        assertHelp(help, 0);
      });

      it("highlight first parameter when no non-target args are present", async () => {
        const help = await getSignatureHelpAtCursor(
          `
          @@multiple(target, ┆)
          `
        );
        assertHelp(help, 1);
      });

      it("highlight 2nd parameter when first arg is present", async () => {
        const help = await getSignatureHelpAtCursor(
          `
          @@multiple(target, "abc", ┆)
          `
        );
        assertHelp(help, 2);
      });

      it("highlight 1st parameter when cursor points back to 1st argument", async () => {
        const help = await getSignatureHelpAtCursor(
          `
          @@multiple(target, "abc"┆, "def")
          `
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
              label: "@@rest(target: unknown, foo: Cadl.string, ...others: Cadl.string[])",
              parameters: [
                {
                  label: "target: unknown",
                },
                {
                  label: "foo: Cadl.string",
                  documentation: {
                    kind: MarkupKind.Markdown,
                    value: "The first arg",
                  },
                },
                {
                  label: "...others: Cadl.string[]",
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
        `
        );
        assertHelp(help, 1);
      });

      it("highlight 2nd parameter(rest) when first arg is present", async () => {
        const help = await getSignatureHelpAtCursor(
          `
          @@rest(target, "abc", ┆)
          `
        );
        assertHelp(help, 2);
      });

      it("highlight 2nd parameter(rest) when when there is already 2 args present", async () => {
        const help = await getSignatureHelpAtCursor(
          `
          @@rest(target, "abc", "def", ┆)
          `
        );
        assertHelp(help, 2);
      });
    });

    async function getSignatureHelpAtCursor(
      sourceWithCursor: string
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
      const textDocument = testHost.addOrUpdateDocument("test/test.cadl", source);
      return await testHost.server.getSignatureHelp({
        textDocument,
        position: textDocument.positionAt(pos),
      });
    }
  });
});
