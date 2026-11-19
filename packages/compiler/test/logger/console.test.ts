import { stripVTControlCharacters } from "node:util";
import { expect, it } from "vitest";
import { formatDiagnostic } from "../../src/core/logger/console-sink.js";
import type { Diagnostic } from "../../src/index.js";
import { createSourceFile } from "../../src/index.js";

it("handles synthetic sources", async () => {
  const diagnostic: Diagnostic = {
    code: "test.code",
    message: "This is a test diagnostic",
    severity: "warning",
    target: {
      file: createSourceFile("", "<unknown location>"),
      pos: 0,
      end: 0,
      isSynthetic: true,
    },
  };

  const formatted = formatDiagnostic(diagnostic, { pathRelativeTo: "/" });
  expect(formatted).toBe("<unknown location>:1:1 - warning test.code: This is a test diagnostic");
});

function formatPretty(pos: number, end: number): string {
  const diagnostic: Diagnostic = {
    code: "test.code",
    message: "This is a test diagnostic",
    severity: "error",
    target: {
      file: createSourceFile("model Foo {\n  bar: UnknownType;\n}\n", "/main.tsp"),
      pos,
      end,
    },
  };
  return stripVTControlCharacters(
    formatDiagnostic(diagnostic, { pretty: true, pathRelativeTo: "/" }),
  );
}

it("underlines the target in the source preview", () => {
  expect(formatPretty(19, 30)).toBe(
    [
      "main.tsp:2:8 - error test.code: This is a test diagnostic",
      "> 2 |   bar: UnknownType;",
      "    |        ^^^^^^^^^^^",
    ].join("\n"),
  );
});

it("underlines every line of a multi-line target in the source preview", () => {
  expect(formatPretty(0, 33)).toBe(
    [
      "main.tsp:1:1 - error test.code: This is a test diagnostic",
      "> 1 | model Foo {",
      "    | ^^^^^^^^^^^",
      "> 2 |   bar: UnknownType;",
      "    | ^^^^^^^^^^^^^^^^^^^",
      "> 3 | }",
      "    | ^",
    ].join("\n"),
  );
});
