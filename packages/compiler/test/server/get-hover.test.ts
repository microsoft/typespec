import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { Hover, MarkupKind } from "vscode-languageserver/node.js";
import { createTestServerHost, extractCursor } from "../../src/testing/test-server-host.js";

describe("compiler: server: on hover", () => {
  describe("get hover for scalar", () => {
    it("string scalar", async () => {
      const hover = await getHoverAtCursor(
        `
          scalar Str┆ing;
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "scalar String\n" + "```",
        },
      });
    });

    it("int16 scalar", async () => {
      const hover = await getHoverAtCursor(
        `
          scalar Int┆16;
        `
      );
      deepStrictEqual(hover, {
        contents: {
          kind: MarkupKind.Markdown,
          value: "```typespec\n" + "scalar Int16\n" + "```",
        },
      });
    });
  });

  describe("get hover for enum", () => {
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

  describe("get hover for alias", () => {
    it("test alias", async () => {
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
  });

  describe("get hover for decorator", () => {
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

  describe("get hover for namespace", () => {
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
  });

  describe("get hover for model", () => {
    it("normal model", async () => {
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

  describe("get hover for interface", () => {
    it("normal interface", async () => {
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

  describe("get hover for operation", () => {
    it("normal operation", async () => {
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
