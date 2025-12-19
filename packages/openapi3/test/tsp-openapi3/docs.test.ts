import { strictEqual } from "assert";
import { it } from "vitest";
import { generateDocs } from "../../src/cli/actions/convert/utils/docs.js";

it("returns empty string for empty docs", () => {
  strictEqual(generateDocs(""), "");
});

it("returns single line doc", () => {
  strictEqual(generateDocs("Hello, World!"), `/** Hello, World! */`.trim());
});

it("returns multi-line doc", () => {
  strictEqual(
    generateDocs(["Hello,", "World!"].join("\n")),
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
  strictEqual(generateDocs(longLine), `/** ${longLine} */`.trim());
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

it("escape @ with \\@", () => {
  strictEqual(generateDocs("Hello, @World!"), `/** Hello, \\@World! */`);
});

it("escape ${...} in doc comments", () => {
  strictEqual(generateDocs("Value is ${foo}"), String.raw`/** Value is \${foo} */`);
});

it("escape multiple ${...} in doc comments", () => {
  strictEqual(
    generateDocs("Value is ${foo} and ${bar}"),
    String.raw`/** Value is \${foo} and \${bar} */`,
  );
});

it("escape ${...} in multi-line doc comments", () => {
  strictEqual(
    generateDocs("Value is ${foo}\nand ${bar}"),
    String.raw`/**
* Value is \${foo}
* and \${bar}
*/`,
  );
});

it("uses doc generator for */", () => {
  strictEqual(generateDocs("Hello, */World!"), `@doc("Hello, */World!")`);
});

it("escape ${...} when using @doc decorator for */", () => {
  strictEqual(generateDocs("Value is ${foo} */"), String.raw`@doc("Value is \${foo} */")`);
});

it("supports multi-line with decorator", () => {
  strictEqual(
    generateDocs(["Hello,", "*/World!"].join("\n")),
    `
@doc("""
Hello,
*/World!
""")`.trim(),
  );
});
