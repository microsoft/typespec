import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { Hover, MarkupKind } from "vscode-languageserver/node.js";
import { createTestServerHost, extractCursor } from "../../src/testing/test-server-host.js";

describe("compiler: server: on hover", () => {
  describe("scalar", () => {
    it("scalar declaration", async () => {
      const hover = await getHoverAtCursor(
        `
          scalar myStr┆ing;
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "scalar myString\n" + "```",
        },
      });
    });

    it("scalar reference", async () => {
      const hover = await getHoverAtCursor(
        `
          scalar myString;
          scalar myStringEx extends myStr┆ing;
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "scalar myString\n" + "```",
        },
      });
    });
  });

  describe("enum", () => {
    it("normal enum", async () => {
      const hover = await getHoverAtCursor(
        `
        enum Direc┆tion {
          North,
          East,
          South,
          West,
        }
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "enum Direction\n" + "```",
        },
      });
    });

    it("normal enum member in namespace", async () => {
      const hover = await getHoverAtCursor(
        `
        namespace TestNS;
        enum Direction {
          Nor┆th,
          East,
          South,
          West,
        }
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "(enum member)\n" + "```typespec\n" + "TestNS.Direction.North\n" + "```",
        },
      });
    });
  });

  describe("alias", () => {
    it("test alias declaration", async () => {
      const hover = await getHoverAtCursor(
        `
          namespace TestNS;
          alias Mix┆ed<T> = string | int16 | Array<T>;
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "alias TestNS.Mixed<T>\n" + "```",
        },
      });
    });

    it("test alias reference", async () => {
      const hover = await getHoverAtCursor(
        `
          namespace TestNS;
          alias myString = string;
          alias myStringEx = myStr┆ing;
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "alias TestNS.myString\n" + "```",
        },
      });
    });
  });

  describe("decorator", () => {
    it("test decorator", async () => {
      const hover = await getHoverAtCursor(
        `
          import "./dec-types.js";

          /**
           * description of single decorator
           */
          extern dec single(context);

          @si┆ngle
          namespace TestNS;
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value:
            "```typespec\n" +
            "dec single(context: unknown)\n" +
            "```\n\n" +
            "description of single decorator",
        },
      });
    });
  });

  describe("namespace", () => {
    it("normal namespace", async () => {
      const hover = await getHoverAtCursor(
        `
          namespace Test┆NS;
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "namespace TestNS\n" + "```",
        },
      });
    });

    it("nested namespace", async () => {
      const hover = await getHoverAtCursor(
        `
        namespace Foo {
          namespace Bar {
            namespace B┆az {
              model SampleModel {}
            }
          }
        }
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "namespace Foo.Bar.Baz\n" + "```",
        },
      });
    });
  });

  describe("model", () => {
    it("model declaration", async () => {
      const hover = await getHoverAtCursor(
        `
          model Ani┆mal{
              name: string;
              age: int16;
          }
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "model Animal\n" + "```",
        },
      });
    });

    it("model reference", async () => {
      const hover = await getHoverAtCursor(
        `
          model Animal{
            name: string;
            age: int16;
          }
          model Cat is Ani┆mal{
          }
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "model Animal\n" + "```",
        },
      });
    });

    it("model in namespace", async () => {
      const hover = await getHoverAtCursor(
        `
          @service({title: "RT"})
          namespace TestNs;
          
          model Ani┆mal{
              name: string;
              age: int16;
          }
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "model TestNs.Animal\n" + "```",
        },
      });
    });

    it("model with one template arg", async () => {
      const hover = await getHoverAtCursor(
        `
          @service({title: "RT"})
          namespace TestNs;
          
          model Ani┆mal<T>{
              name: string;
              age: int16;
              tTag: T;
          }
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "model TestNs.Animal<T>\n" + "```",
        },
      });
    });

    it("model with two template args", async () => {
      const hover = await getHoverAtCursor(
        `
          @service({title: "RT"})
          namespace TestNs;
          
          model Ani┆mal<T, P>{
              name: string;
              age: int16;
              tTag: T;
          }
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "model TestNs.Animal<T, P>\n" + "```",
        },
      });
    });
  });

  describe("interface", () => {
    it("interface declaration", async () => {
      const hover = await getHoverAtCursor(
        `
          interface IAct┆ions{
              fly(): void;
          }
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "interface IActions\n" + "```",
        },
      });
    });

    it("interface reference", async () => {
      const hover = await getHoverAtCursor(
        `
          interface IActions{
              fly(): void;
          }
          interface IActionsEx extends IAct┆ions{
          }
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "interface IActions\n" + "```",
        },
      });
    });

    it("interface in namespace", async () => {
      const hover = await getHoverAtCursor(
        `
          @service({title: "RT"})
          namespace TestNs;
          
          interface IAct┆ions{
            fly(): void;
        }
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "interface TestNs.IActions\n" + "```",
        },
      });
    });
  });

  describe("operation", () => {
    it("operation declaration", async () => {
      const hover = await getHoverAtCursor(
        `
          op Ea┆t(food: string): void;
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "op Eat(food: string): void\n" + "```",
        },
      });
    });

    it("operation reference", async () => {
      const hover = await getHoverAtCursor(
        `
          op Eat(food: string): void;
          op Swallow is Ea┆t;
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "op Eat(food: string): void\n" + "```",
        },
      });
    });

    it("operation in namespace", async () => {
      const hover = await getHoverAtCursor(
        `
          @service({title: "RT"})
          namespace TestNs;
          
          op Ea┆t(food: string): void;
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "op TestNs.Eat(food: string): void\n" + "```",
        },
      });
    });

    it("operation with one template arg", async () => {
      const hover = await getHoverAtCursor(
        `
          @service({title: "RT"})
          namespace TestNs;
          
          op Ea┆t<T>(food: string): void;
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "op TestNs.Eat<T>(food: string): void\n" + "```",
        },
      });
    });

    it("operation with two template args", async () => {
      const hover = await getHoverAtCursor(
        `
          @service({title: "RT"})
          namespace TestNs;
          
          op Ea┆t<T, P>(food: string): void;
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "op TestNs.Eat<T, P>(food: string): void\n" + "```",
        },
      });
    });

    it("operation in interface", async () => {
      const hover = await getHoverAtCursor(
        `
          @service({title: "RT"})
          namespace TestNs;
          
          interface IActions {
            op Ea┆t<T, P>(food: string): string;
          }
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "op TestNs.IActions.Eat<T, P>(food: string): string\n" + "```",
        },
      });
    });

    it("operation in interface with template", async () => {
      const hover = await getHoverAtCursor(
        `
          @service({title: "RT"})
          namespace TestNs;
          
          interface IActions<Q> {
            op Ea┆t<T, P>(food: string): string;
          }
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "op TestNs.IActions.Eat<T, P>(food: string): string\n" + "```",
        },
      });
    });
  });

  describe("const", () => {
    it("declaration", async () => {
      const hover = await getHoverAtCursor(
        `
          const a┆bc = #{ a: 123 };
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "const abc: { a: 123 }\n" + "```",
        },
      });
    });

    it("reference", async () => {
      const hover = await getHoverAtCursor(
        `
          const abc = #{ a: 123 };
          const def = a┆bc;
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "const abc: { a: 123 }\n" + "```",
        },
      });
    });
  });

  async function getHoverAtCursor(sourceWithCursor: string): Promise<Hover | undefined> {
    const { source, pos } = extractCursor(sourceWithCursor);
    const testHost = await createTestServerHost();
    testHost.addJsFile("dec-types.js", {
      $single: () => {},
    });
    const textDocument = testHost.addOrUpdateDocument("test.tsp", source);
    return await testHost.server.getHover({
      textDocument,
      position: textDocument.positionAt(pos),
    });
  }
});
