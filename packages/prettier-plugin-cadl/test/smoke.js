// Simple smoke test verifying the plugin is able to be loaded via prettier.
const prettier = require("prettier");
const { strictEqual } = require("assert");
const { resolve } = require("path");

describe("prettier-plugin: smoke test", () => {
  it("loads and formats", () => {
    const result = prettier.format("alias   Foo   =   string;", {
      parser: "cadl",
      plugins: [resolve(__dirname, "..")],
    });
    strictEqual(result, "alias Foo = string;\n");
  });
});
