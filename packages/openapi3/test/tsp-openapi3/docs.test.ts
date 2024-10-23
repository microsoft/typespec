import { strictEqual } from "assert";
import { it } from "vitest";
import { generateDocs } from "../../src/cli/actions/convert/utils/docs.js";

it("returns empty string for empty docs", () => {
  strictEqual(generateDocs(""), "");
  strictEqual(generateDocs([]), "");
});

it("returns single line doc", () => {
  strictEqual(
    generateDocs("Hello, World!"),
    `
/**
* Hello, World!
*/
`.trim(),
  );
});

it("returns multi-line doc", () => {
  strictEqual(
    generateDocs(["Hello,", "World!"]),
    `
/**
* Hello,
* World!
*/`.trim(),
  );
});

it("returns multi-line docs when they contain newline characters", () => {
  strictEqual(
    generateDocs("Hello,\nWorld!"),
    `
/**
* Hello,
* World!
*/`.trim(),
  );
});

it("does not automatically apply line-wrapping for very long lines", () => {
  const longLine = "This is a long line".repeat(20); // 380 characters
  strictEqual(
    generateDocs(longLine),
    `
/**
* ${longLine}
*/`.trim(),
  );
});

it("handles different newline breaks", () => {
  const scenarios = ["Hello,\nWorld!", "Hello,\rWorld!", "Hello,\r\nWorld!"];

  for (const scenario of scenarios) {
    strictEqual(
      generateDocs(scenario),
      `
/**
* Hello,
* World!
*/`.trim(),
    );
  }
});

it("uses doc generator for @ and */", () => {
  strictEqual(generateDocs("Hello, @World!"), `@doc("Hello, @World!")`);

  strictEqual(generateDocs("Hello, */World!"), `@doc("Hello, */World!")`);
});

it("supports multi-line with decorator", () => {
  strictEqual(
    generateDocs(["Hello,", "@World!"]),
    `
@doc("""
Hello,
@World!
""")`.trim(),
  );
});
