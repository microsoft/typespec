// Simple smoke test verifying the plugin is able to be loaded via prettier.
import { strictEqual } from "assert";
import { resolve } from "path";
import prettier from "prettier";
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
