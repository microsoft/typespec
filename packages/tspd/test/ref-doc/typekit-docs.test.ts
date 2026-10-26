import { TSDocParser } from "@microsoft/tsdoc";
import { expect, it } from "vitest";
import { createTypekitDocs } from "../../src/ref-doc/components/typekits-file.js";

it("renders wrapped typekit documentation as paragraphs", async () => {
  const { docComment } = new TSDocParser().parseString(`/**
   * First line
   * continues here.
   *
   * Second paragraph
   * continues too.
   */`);

  const files = await createTypekitDocs({
    namespaces: {
      test: {
        name: "test",
        typeName: "TestKit",
        doc: docComment.summarySection,
        entries: {},
      },
    },
  });

  expect(files["typekits.mdx"]).toContain(
    "First line continues here.\n\nSecond paragraph continues too.",
  );
});
