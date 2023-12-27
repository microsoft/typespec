// Simple smoke test verifying the plugin is able to be loaded via prettier.
const prettier = require("prettier");
const prettier_2 = require("prettier_2");
const { strictEqual } = require("assert");
const { resolve } = require("path");
import { describe, it } from "vitest";

describe("prettier-plugin: smoke test", () => {
  it("loads and formats", async () => {
    const result = await prettier.format("alias   Foo   =   string;", {
      parser: "typespec",
      plugins: [resolve(__dirname, "../dist/index.js")],
    });
    strictEqual(result, "alias Foo = string;\n");
  });

  it("loads and formats (Prettier 2.0)", async () => {
    const result = prettier_2.format("alias   Foo   =   string;", {
      parser: "typespec",
      plugins: [resolve(__dirname, "..")],
    });
    strictEqual(result, "alias Foo = string;\n");
  });
});
