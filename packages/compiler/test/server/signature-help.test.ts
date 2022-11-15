import { deepStrictEqual } from "assert";
import { SignatureHelp } from "vscode-languageserver/node.js";
import { createTestServerHost, extractCursor } from "../../testing/test-server-host.js";

describe("compiler: server: signature help", () => {
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
          label: "@single(arg: Cadl.string)",
          parameters: [
            {
              label: "arg: Cadl.string",
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
            label: "@multiple(foo: Cadl.string, bar?: Cadl.string)",
            parameters: [
              {
                label: "foo: Cadl.string",
              },
              {
                label: "bar?: Cadl.string",
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
            activeParameter,
            label: "@rest(foo: Cadl.string, ...others: Cadl.string[])",
            parameters: [
              {
                label: "foo: Cadl.string",
              },
              {
                label: "...others: Cadl.string[]",
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
      
      extern dec single(target: unknown, arg: string);
      extern dec multiple(target: unknown, foo: string, bar?: string);
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
