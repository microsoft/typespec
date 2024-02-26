// Simple smoke test verifying the plugin is able to be loaded via prettier.
const prettier = require("prettier");
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
});
