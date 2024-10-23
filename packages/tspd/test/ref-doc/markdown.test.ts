import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { table } from "../../src/ref-doc/utils/markdown.js";

describe("ref-doc: markdown", () => {
  it("escapes table content", () => {
    const t = table([
      [
        "Header 1\n\nThe first header",
        "Header 2\n\nThe second header",
        "Header 3\n\nThe third header",
      ],
      [
        "First row\nFirst column\nhas\nlots of newlines\n!!!",
        "First row\nSecond column\nhas\nlots of newlines\n!!!",
        "First row\nThird column\nhas\nlots of newlines\n!!!",
      ],
    ]);

    strictEqual(
      t,
      `
| Header 1<br /><br />The first header | Header 2<br /><br />The second header | Header 3<br /><br />The third header |
|----------------------------|-----------------------------|----------------------------|
| First row<br />First column<br />has<br />lots of newlines<br />!!! | First row<br />Second column<br />has<br />lots of newlines<br />!!! | First row<br />Third column<br />has<br />lots of newlines<br />!!! |
      `.trim(),
    );
  });
});
