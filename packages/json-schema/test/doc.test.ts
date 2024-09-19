import assert from "assert";
import { describe, it } from "vitest";
import { emitSchema } from "./utils.js";

describe("doc", () => {
  it("sets description from doc comments", async () => {
    const schemas = await emitSchema(`
      /**
       * \`\`\`toml
       * deny = [
       *     { name = "simple" },
       *     { name = "simple", version = "*" },
       *     { name = "simple", wrappers = ["example"] }
       * ]
       * \`\`\`
       */
      scalar PackageSpec extends string;
    `);

    assert.deepStrictEqual(
      schemas["PackageSpec.json"].description,
      `\`\`\`toml
deny = [
    { name = "simple" },
    { name = "simple", version = "*" },
    { name = "simple", wrappers = ["example"] }
]
\`\`\``,
    );
  });
});
