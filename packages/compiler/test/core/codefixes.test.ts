import { ok } from "assert";
import { describe, expect, it } from "vitest";
import {
  applyCodeFix,
  applyCodeFixEditsOnText,
  createCodeFixContext,
} from "../../src/core/code-fixes.js";
import {
  CodeFixContext,
  CodeFixEdit,
  SourceFile,
  createSourceFile,
  defineCodeFix,
} from "../../src/index.js";
import { createTestHost } from "../../src/testing/test-host.js";

describe("Codefixes", () => {
  describe("applyCodeFix", () => {
    async function applyTestCodeFix(
      text: string,
      fix: (context: CodeFixContext, file: SourceFile) => CodeFixEdit | CodeFixEdit[],
    ): Promise<string> {
      const fakeFile = createSourceFile(text, "test.ts");
      const host = await createTestHost();
      let result: string | undefined;
      await applyCodeFix(
        {
          ...host.compilerHost,
          writeFile: (name, content) => {
            result = content;
            return Promise.resolve();
          },
        },
        defineCodeFix({
          id: "test-fix",
          label: "Test fix",
          fix: (context) => fix(context, fakeFile),
        }),
      );
      ok(result);
      return result;
    }

    it("apply prepend fix at pos", async () => {
      const result = await applyTestCodeFix("abcdef", (context, file) =>
        context.prependText({ pos: 3, file }, "123"),
      );

      expect(result).toBe("abc123def");
    });

    it("apply prepend fix at range", async () => {
      const result = await applyTestCodeFix("abcdef", (context, file) =>
        context.prependText({ pos: 3, end: 5, file }, "123"),
      );

      expect(result).toBe("abc123def");
    });

    it("apply append fix at pos", async () => {
      const result = await applyTestCodeFix("abcdef", (context, file) =>
        context.appendText({ pos: 3, end: 5, file }, "123"),
      );

      expect(result).toBe("abcde123f");
    });

    it("apply replace fix at pos", async () => {
      const result = await applyTestCodeFix("abcdef", (context, file) =>
        context.replaceText({ pos: 3, end: 5, file }, "123"),
      );

      expect(result).toBe("abc123f");
    });
  });
});

describe("applyCodeFixEditsOnText()", () => {
  const context = createCodeFixContext();
  const file = createSourceFile("", "test.ts");

  it("prepend multiple items", () => {
    const result = applyCodeFixEditsOnText("abc", [
      context.prependText({ pos: 1, file }, "123"),
      context.prependText({ pos: 2, file }, "456"),
    ]);

    expect(result).toBe("a123b456c");
  });

  it("prepend multiple items out of order", () => {
    const result = applyCodeFixEditsOnText("abc", [
      context.prependText({ pos: 2, file }, "456"),
      context.prependText({ pos: 1, file }, "123"),
    ]);

    expect(result).toBe("a123b456c");
  });

  it("append multiple items", () => {
    const result = applyCodeFixEditsOnText("abc", [
      context.appendText({ pos: 1, file }, "123"),
      context.appendText({ pos: 2, file }, "456"),
    ]);

    expect(result).toBe("a123b456c");
  });

  it("append multiple items out of order", () => {
    const result = applyCodeFixEditsOnText("abc", [
      context.appendText({ pos: 2, file }, "456"),
      context.appendText({ pos: 1, file }, "123"),
    ]);

    expect(result).toBe("a123b456c");
  });

  it("replace multiple items", () => {
    const result = applyCodeFixEditsOnText("abc", [
      context.replaceText({ pos: 1, end: 2, file }, "123"),
      context.replaceText({ pos: 2, end: 3, file }, "456"),
    ]);

    expect(result).toBe("a123456");
  });

  it("replace multiple items out of order", () => {
    const result = applyCodeFixEditsOnText("abc", [
      context.replaceText({ pos: 2, end: 3, file }, "456"),
      context.replaceText({ pos: 1, end: 2, file }, "123"),
    ]);

    expect(result).toBe("a123456");
  });
});
